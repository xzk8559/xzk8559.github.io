import * as THREE from './three-r175/build/three.module.js';
import { CSS2DObject } from './three-r175/examples/jsm/renderers/CSS2DRenderer.js';
import { createBoxBufferGeometry } from './geometryUtils.js';

/**
 * BuildingPickingManager
 *
 * Manages building picking meshes for interaction using InstancedMesh
 * Creates invisible boxes for each building that can be raycasted against
 * Efficiently handles large numbers of buildings (200k+) with improved performance
 */
export class BuildingPickingManager {
    constructor(scene) {
        this.scene = scene;
        this.coordinate_scale = 0.1;
        this.pickingLayer = 3; // Use a separate layer for picking

        // Instead of individual meshes, we'll use a single InstancedMesh
        this.instancedMesh = null;
        this.instanceCount = 0;
        this.maxInstances = 300000; // Maximum number of instances (can be adjusted)

        // Map to store building data by ID
        this.buildingData = new Map(); // Map of buildingId -> {data, instanceId, matrix}

        // Pool of reusable instance IDs from removed buildings
        this.reusableIds = [];

        // Matrix for setting instance transforms
        this.matrix = new THREE.Matrix4();

        // Create the base geometry that will be instanced
        this.baseGeometry = createBoxBufferGeometry(1, 1, 1); // Will be scaled per instance
        // Optimized labelPool that reuses DOM elements and minimizes scene operations
        this.labelPool = {
            active: null,
            labelObject: null,
            labelDiv: null,
            isInitialized: false,

            // Initialize the label once and reuse it
            initialize: () => {
                if (this.labelPool.isInitialized) return;

                // Create the label DOM element that will be reused
                const div = document.createElement('div');
                div.className = 'building-label';

                // Set default styles
                div.style.backgroundColor = 'rgba(0, 120, 255, 0.8)';
                div.style.color = 'white';
                div.style.padding = '4px 8px';
                div.style.borderRadius = '4px';
                div.style.fontSize = '14px';
                div.style.fontWeight = 'bold';
                div.style.pointerEvents = 'auto'; // Allow click events
                div.style.cursor = 'pointer';
                div.style.userSelect = 'none';
                div.style.transition = 'all 0.2s ease';
                div.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
                div.style.display = 'none'; // Initially hidden

                // Create the 3D object once
                const label = new CSS2DObject(div);
                label.userData.isLabel = true;

                // Add to scene once and keep it there
                this.scene.add(label);

                // Store references
                this.labelPool.labelDiv = div;
                this.labelPool.labelObject = label;
                this.labelPool.isInitialized = true;
            },

            create: (text, position) => {
                // Initialize if not already done
                if (!this.labelPool.isInitialized) {
                    this.labelPool.initialize();
                }

                const div = this.labelPool.labelDiv;
                const label = this.labelPool.labelObject;

                // Update position
                label.position.copy(position);

                // Clear previous content
                while (div.firstChild) {
                    div.removeChild(div.firstChild);
                }

                // Update content
                if (text.includes('\n')) {
                    const lines = text.split('\n');
                    lines.forEach((line, index) => {
                        const lineDiv = document.createElement('div');
                        lineDiv.textContent = line;
                        if (index > 0) {
                            lineDiv.style.marginTop = '4px';
                            lineDiv.style.fontSize = '12px';
                        }
                        div.appendChild(lineDiv);
                    });
                } else {
                    div.textContent = text;
                }

                // Show the label
                div.style.display = '';

                this.labelPool.active = true;
                return label;
            },

            remove: () => {
                if (this.labelPool.isInitialized && this.labelPool.labelDiv) {
                    // Just hide the label instead of removing from scene
                    this.labelPool.labelDiv.style.display = 'none';
                    this.labelPool.active = false;
                }
            }
        };
    }

    /**
     * Initialize the instanced mesh if it doesn't exist
     * @private
     */
    _initInstancedMesh() {
        if (this.instancedMesh) return;

        // Create an invisible material for picking
        const material = new THREE.MeshBasicMaterial({
            visible: false
        });

        // Create the instanced mesh
        this.instancedMesh = new THREE.InstancedMesh(
            this.baseGeometry,
            material,
            this.maxInstances
        );

        // Set to picking layer
        this.instancedMesh.layers.set(this.pickingLayer);
        this.instancedMesh.frustumCulled = false; // Disable frustum culling for now

        // Add to scene
        this.scene.add(this.instancedMesh);

        // Set initial count to 0 (will be updated as instances are added)
        this.instancedMesh.count = 0;
    }

    /**
     * Add a building picking mesh as an instance
     * @param {Object} buildingData - Building data from chunk
     * @param {string} chunkKey - The chunk key this building belongs to
     * @returns {number} The instance ID of the added building
     */
    addBuilding(buildingData, chunkKey, floorIndexOffset = null) {
        const { bid, bounds, center, storey } = buildingData;

        // Skip if this building already has an instance
        if (this.buildingData.has(bid)) {
            return this.buildingData.get(bid).instanceId;
        }

        // Initialize instanced mesh if needed
        this._initInstancedMesh();

        // Check if we've reached the maximum number of instances
        if (this.instanceCount >= this.maxInstances) {
            console.warn('Maximum number of instances reached', this.instanceCount, this.maxInstances);
            return -1;
        }

        // Calculate building dimensions from bounds
        const boundingBox = this.calculateBoundingBox(bounds);
        const width = boundingBox.max.x - boundingBox.min.x;
        const depth = boundingBox.max.z - boundingBox.min.z;
        const height = Math.max(1, storey) * 3.6 * this.coordinate_scale; // Assuming 3.6m per floor

        // Get an instance ID - either from the reusable pool or create a new one
        let instanceId;
        if (this.reusableIds.length > 0) {
            // Reuse an ID from the pool
            instanceId = this.reusableIds.pop();
        } else {
            // Create a new ID
            instanceId = this.instanceCount;
            this.instanceCount++;
        }

        // Set the transformation matrix for this instance
        this.matrix.makeScale(width, height, depth); // Scale
        this.matrix.setPosition(center[0], height / 2, center[1]); // Position at center

        // Apply the matrix to the instance
        this.instancedMesh.setMatrixAt(instanceId, this.matrix);

        // Store building data with instance ID
        this.buildingData.set(bid, {
            instanceId,
            chunkKey,
            buildingData,
            floorIndexOffset,
            dimensions: { width, height, depth },
            center: [center[0], height / 2, center[1]]
        });

        // Update the mesh count to be the maximum of current count and instanceId+1
        this.instancedMesh.count = Math.max(this.instancedMesh.count, instanceId + 1);
        this.instancedMesh.instanceMatrix.needsUpdate = true;

        return instanceId;
    }

    /**
     * Calculate bounding box dimensions from building bounds
     * @param {Array} bounds - Array of building boundary points
     * @returns {Object} Object with min and max points
     */
    calculateBoundingBox(bounds) {
        // Initialize with default values
        const result = {
            min: { x: 0, z: 0 },
            max: { x: 0, z: 0 }
        };

        // Initialize with first point
        if (bounds && bounds.length > 0) {
            const firstPoint = bounds[0];
            result.min.x = firstPoint[0];
            result.min.z = firstPoint[1];
            result.max.x = firstPoint[0];
            result.max.z = firstPoint[1];

            // Find min/max from all points
            for (let i = 1; i < bounds.length; i++) {
                const point = bounds[i];
                result.min.x = Math.min(result.min.x, point[0]);
                result.min.z = Math.min(result.min.z, point[1]);
                result.max.x = Math.max(result.max.x, point[0]);
                result.max.z = Math.max(result.max.z, point[1]);
            }
        }

        return result;
    }

    /**
     * Remove a single building by ID
     * @param {string|number} buildingId - The building ID to remove
     */
    removeBuilding(buildingId) {
        // With InstancedMesh, we can't actually remove an instance
        // We can only mark it as inactive by setting its scale to 0
        const buildingInfo = this.buildingData.get(buildingId);
        if (buildingInfo) {
            const { instanceId } = buildingInfo;

            // Set scale to 0 to effectively hide it
            this.matrix.makeScale(0, 0, 0);
            this.instancedMesh.setMatrixAt(instanceId, this.matrix);
            this.instancedMesh.instanceMatrix.needsUpdate = true;

            // Add the instance ID to the reusable pool
            this.reusableIds.push(instanceId);

            // Remove from our data map
            this.buildingData.delete(buildingId);
        }
    }

    /**
     * Remove buildings for a specific chunk
     * @param {string} chunkKey - The chunk key to remove buildings for
     */
    removeChunkBuildings(chunkKey) {
        // Find all buildings for this chunk
        const buildingsToRemove = [];

        for (const [id, info] of this.buildingData.entries()) {
            if (info.chunkKey === chunkKey) {
                buildingsToRemove.push(id);
            }
        }

        // Remove each building
        for (const id of buildingsToRemove) {
            this.removeBuilding(id);
        }
    }

    /**
     * Clear all picking meshes
     */
    clear() {
        // Remove the instanced mesh from the scene
        if (this.instancedMesh) {
            this.scene.remove(this.instancedMesh);
            this.instancedMesh.geometry.dispose();
            this.instancedMesh.material.dispose();
            this.instancedMesh = null;
        }

        // Clear the building data map
        this.buildingData.clear();
        this.instanceCount = 0;

        // Clear the reusable IDs pool
        this.reusableIds = [];

        // Remove the label
        this.labelPool.remove();

        // If we want to completely clean up the label pool
        if (this.labelPool.isInitialized && this.labelPool.labelObject) {
            this.scene.remove(this.labelPool.labelObject);
            this.labelPool.labelObject = null;
            this.labelPool.labelDiv = null;
            this.labelPool.isInitialized = false;
            this.labelPool.active = false;
        }
    }

    /**
     * Get building data by ID
     * @param {string|number} buildingId - The building ID
     * @returns {Object|null} The building data or null if not found
     */
    getBuildingData(buildingId) {
        return this.buildingData.get(buildingId) || null;
    }

    /**
     * Get instance ID for a building
     * @param {string|number} buildingId - The building ID
     * @returns {number|null} The instance ID or null if not found
     */
    getInstanceId(buildingId) {
        const data = this.buildingData.get(buildingId);
        return data ? data.instanceId : null;
    }

    /**
     * Check if a building is in view
     * @param {THREE.Camera} camera - The camera (not used in current implementation)
     * @param {string|number} buildingId - The building ID
     * @returns {boolean} True if in view
     */
    isBuildingInView(camera, buildingId) {
        // With InstancedMesh, we can't easily check if a specific instance is in view
        // For now, we'll assume it's in view if the building data exists
        return this.buildingData.has(buildingId);
    }
}