import * as THREE from '../modules/three-r165/build/three.module.js';
import {createBoundingBox, expandBox3, isBoxIntersectingCameraFrustum} from './utils.js';

class ChunkManager {
  /**
   * @param {THREE.Scene} scene - The main 3D scene
   * @param {Object} meta - Contains `chunk_size` and `chunk_bounds`
   * @param {function} createBuildingsFromChunk - Function to convert chunk JSON -> 3D object
   * @param {number} [maxConcurrentLoads=5] - Max concurrent fetches
   * @param {number} [marginIn=50] - Smaller margin for loading
   * @param {number} [marginOut=100] - Larger margin for unloading
   * @param {number} [cacheLifetime=10000] - Time in ms to keep unloaded chunks in cache (default 10s)
   */
  constructor(
    scene, 
    meta, 
    createBuildingsFromChunk, 
    maxConcurrentLoads = 5, 
    marginIn = 50, 
    marginOut = 100, 
    cacheLifetime = 10000
  ) {
    // Basic settings
    this.scene = scene;
    this.chunkSize = meta.chunk_size;
    this.chunkBounds = meta.chunk_bounds;
    this.createBuildingsFromChunk = createBuildingsFromChunk;
    this.marginIn = marginIn;   // Smaller margin for loading
    this.marginOut = marginOut; // Larger margin for unloading
    this.cacheLifetime = cacheLifetime;

    // Chunk dictionary:
    // { [chunkKey]: { mesh, bounds, box, loaded, url } }
    this.chunks = {};

    // Cache for recently unloaded chunks:
    // { [chunkKey]: { mesh, timestamp } }
    this.chunkCache = {};

    // Concurrency management
    this.maxConcurrentLoads = maxConcurrentLoads;
    this.currentLoads = 0;
    this.loadQueue = [];

    // For known chunk files
    this.knownChunkFiles = [];

    // Throttle chunk updates
    this.lastUpdateTime = 0;
    this.updateInterval = 20; // ms
  }

  // --------------------------------------
  //   Helper Methods
  // --------------------------------------

  getChunkIndex(x, y) {
    const ix = Math.floor((x - this.chunkBounds.x_start) / this.chunkSize);
    const iy = Math.floor((y - this.chunkBounds.y_start) / this.chunkSize);
    return [ix, iy];
  }

  getChunkBounds(ix, iy) {
    const xStart = this.chunkBounds.x_start;
    const yStart = this.chunkBounds.y_start;
    const minx = xStart + ix * this.chunkSize;
    const maxx = minx + this.chunkSize;
    const miny = yStart + iy * this.chunkSize;
    const maxy = miny + this.chunkSize;
    return { minx, maxx, miny, maxy };
  }

  // Assign an array of known chunks to the manager (ix, iy, url, bounds).
  setChunkList(knownChunks) {
    this.knownChunkFiles = knownChunks;
    for (const info of knownChunks) {
      const chunkKey = `${info.ix},${info.iy}`;
      const bounds = this.getChunkBounds(info.ix, info.iy);
      this.chunks[chunkKey] = {
        mesh: null,
        bounds: bounds,
        box: createBoundingBox(bounds),
        loaded: false,
        loading: false,
        url: info.url,
        buildingCount: null,
      };
    }
  }

  // --------------------------------------
  //   Cache Management
  // --------------------------------------

  /**
   * Clean up old entries in `this.chunkCache` that exceed `cacheLifetime`.
   */
  cleanupCache() {
    const now = performance.now();
    for (const [chunkKey, cacheEntry] of Object.entries(this.chunkCache)) {
      const age = now - cacheEntry.timestamp;
      if (age > this.cacheLifetime) {
        // Dispose the cached mesh to free memory
        this.disposeMesh(cacheEntry.mesh);
        delete this.chunkCache[chunkKey];
        console.log(`Cache expired for chunk: ${chunkKey}`);
      }
    }
  }

  /**
   * Put a chunk's mesh into the cache (time-stamped).
   */
  cacheChunk(chunkKey, mesh) {
    this.chunkCache[chunkKey] = {
      mesh,
      timestamp: performance.now()
    };
  }

  /**
   * If a chunk is in cache and hasn't expired, retrieve it. Otherwise `undefined`.
   */
  retrieveFromCache(chunkKey) {
    const entry = this.chunkCache[chunkKey];
    if (!entry) return undefined;

    const age = performance.now() - entry.timestamp;
    if (age > this.cacheLifetime) {
      // Expired, dispose and remove
      this.disposeMesh(entry.mesh);
      delete this.chunkCache[chunkKey];
      return undefined;
    }
    // Still valid
    return entry.mesh;
  }

  disposeMesh(mesh) {
    if (!mesh) return;
    mesh.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    });
  }

  // --------------------------------------
  //   Load / Unload Methods
  // --------------------------------------

  /**
   * Attempt to load or retrieve from cache.
   * If in cache -> reattach
   * Else -> fetch from server
   */
  async loadChunk(chunkKey) {
    const chunkInfo = this.chunks[chunkKey];
    
    if (chunkInfo.mesh && this.scene.children.includes(chunkInfo.mesh)) {
      // It's already in the scene => no need to reattach or re-fetch
      return;
    }

    chunkInfo.loading = true;

    if (this.currentLoads >= this.maxConcurrentLoads) {
        return new Promise((resolve, reject) => {
            this.loadQueue.push({ chunkKey, resolve, reject });
        });
    }

    this.currentLoads++;
    try {
      // Check if chunk is in the cache
      const cachedMesh = this.retrieveFromCache(chunkKey);
      if (cachedMesh) {
        // Reattach from cache
        chunkInfo.mesh = cachedMesh;
        chunkInfo.loaded = true;
        this.scene.add(cachedMesh);
        console.log(`Reattached chunk from cache: ${chunkInfo.url}`);
        return;
      }

      // Otherwise, fetch from the server
      const response = await fetch(chunkInfo.url);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${chunkInfo.url}: ${response.statusText}`);
      }
      const chunkData = await response.json();

      // response texture
      const respTexUrl = chunkData.resp_png_url;
      const loader = new THREE.TextureLoader();
      const displacementTex = await new Promise((resolve, reject) => {
        loader.load(
          respTexUrl,
          tex => resolve(tex),
          undefined,
          err => reject(err)
        );
      });

      const chunkObject = this.createBuildingsFromChunk(chunkData);
      // if chunkInfo.mesh was never set or if it was set from a previous partial load attempt, dispose the old one
      if (chunkInfo.mesh) this.disposeMesh(chunkInfo.mesh);

      chunkObject.name = `chunk_${chunkData.chunk_index.join('_')}`;
      chunkInfo.mesh = chunkObject;

      // we have chunkObject.material => the merged ShaderMaterial
      let mat = chunkObject.material;
      mat.uniforms.uDisplacementMap.value = displacementTex;
      displacementTex.minFilter = THREE.LinearFilter;
      displacementTex.magFilter = THREE.LinearFilter;
      displacementTex.wrapS = THREE.ClampToEdgeWrapping;
      displacementTex.wrapT = THREE.ClampToEdgeWrapping;
      // displacementTex.colorSpace = THREE.NoColorSpace;
      // displacementTex.format = THREE.RedFormat;             // Single-channel
      // displacementTex.type = THREE.UnsignedShortType;       // 16-bit unsigned integer
      displacementTex.needsUpdate = true;

      chunkInfo.loaded = true;
      chunkInfo.buildingCount = chunkData.buildings.number;
      this.scene.add(chunkObject);
      
      console.log(`Loaded chunk: ${chunkInfo.url}`);
    } catch (error) {
      console.error('Error loading chunk:', error);
    } finally {
      chunkInfo.loading = false;
      this.currentLoads--;
      if (this.loadQueue.length > 0) {
          const next = this.loadQueue.shift();
          this.loadChunk(next.chunkKey).then(next.resolve).catch(next.reject);
      }
    }
  }

  /**
   * Unloads a chunk from the scene.
   */
  unloadChunk(chunkKey) {
    // const chunkKey = `${ix},${iy}`;
    const chunkInfo = this.chunks[chunkKey];
    if (!chunkInfo || !chunkInfo.loaded) return;

    if (chunkInfo.mesh) {
      this.scene.remove(chunkInfo.mesh);
      this.cacheChunk(chunkKey, chunkInfo.mesh);
      chunkInfo.mesh = null;
    }

    chunkInfo.loaded = false;
    // chunkInfo.loading = false;

    console.log(`Unloaded chunk: ${chunkKey}`);
  }

  /**
   * isChunkInView implements a two-level margin approach:
   *  - If chunk is not loaded -> use marginIn
   *  - If chunk is loaded -> use marginOut
   */
  isChunkInView(camera, chunkKey) {
    const chunkInfo = this.chunks[chunkKey];
    if (!chunkInfo) return false;

    const margin = chunkInfo.loaded ? this.marginOut : this.marginIn;
    const expandedBox = expandBox3(chunkInfo.box, margin);

    return isBoxIntersectingCameraFrustum(camera, expandedBox);
  }

  /**
   * Update logic: load or unload chunks depending on camera
   */
  async update(camera) {
    this.cleanupCache();

    const loadPromises = [];

    for (const chunkKey in this.chunks) {
        const chunkInfo = this.chunks[chunkKey];
        if (!chunkInfo) continue;

        const shouldBeInView = this.isChunkInView(camera, chunkKey);

        if (shouldBeInView && !chunkInfo.loaded && !chunkInfo.loading) {
          // If chunk is in view and NOT loaded, load it
          loadPromises.push(this.loadChunk(chunkKey));
        } else if (!shouldBeInView && chunkInfo.loaded) {
          // If chunk is out of view but loaded, unload it
          this.unloadChunk(chunkKey);
        }
    }
    
    // Load all chunks concurrently
    await Promise.all(loadPromises);
  }
}

export { ChunkManager };
