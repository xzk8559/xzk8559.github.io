import * as THREE from './three-r175/build/three.module.js';
import { CSS2DObject } from './three-r175/examples/jsm/renderers/CSS2DRenderer.js';
import { createBoxBufferGeometry } from './geometryUtils.js';

/**
 * BuildingPickingManager
 *
 * Manages individual building picking meshes for interaction
 * Creates invisible boxes for each building that can be raycasted against
 * Efficiently handles large numbers of buildings (200k+)
 */
export class BuildingPickingManager {
    constructor(scene) {
        this.scene = scene;
        this.coordinate_scale = 0.1;
        this.pickingMeshes = new Map(); // Map of buildingId -> pickingMesh
        this.pickingLayer = 3; // Use a separate layer for picking
        this.octree = null; // For future optimization with spatial indexing
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
     * Add a building picking mesh
     * @param {Object} buildingData - Building data from chunk
     * @param {string} chunkKey - The chunk key this building belongs to
     * @returns {THREE.Mesh} The created picking mesh
     */
    addBuilding(buildingData, chunkKey, floorIndexOffset = null) {
        const { bid, bounds, center, storey } = buildingData;

        // Skip if this building already has a picking mesh
        if (this.pickingMeshes.has(bid)) {
            return this.pickingMeshes.get(bid);
        }

        // Calculate building dimensions from bounds
        const boundingBox = this.calculateBoundingBox(bounds);
        const width = boundingBox.max.x - boundingBox.min.x;
        const depth = boundingBox.max.z - boundingBox.min.z;
        const height = Math.max(1, storey) * 3.6 * this.coordinate_scale; // Assuming 3.6m per floor

        // Create a custom buffer geometry for the building using our utility function
        // This uses BufferGeometry instead of BoxGeometry for better performance
        const geometry = createBoxBufferGeometry(width, height, depth);

        // Create an invisible mesh for picking
        const material = new THREE.MeshBasicMaterial({
            visible: false,
            // transparent: true,
            // opacity: 0
        });

        const mesh = new THREE.Mesh(geometry, material);

        // Position the mesh at the center of the building
        mesh.position.set(center[0], height / 2, center[1]);

        // Set to picking layer
        mesh.layers.set(this.pickingLayer);
        // console.log(`Setting mesh for building ${bid} to layer ${this.pickingLayer}`);

        // Store building data in userData
        mesh.userData = {
            buildingId: bid,
            chunkKey,
            buildingData,
            isPickingMesh: true,
            floorIndexOffset: floorIndexOffset, // Store floor index information if provided for displacementUtils.js
        };

        // Add to scene and store in map
        this.scene.add(mesh);
        this.pickingMeshes.set(bid, mesh);

        return mesh;
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
        const mesh = this.pickingMeshes.get(buildingId);
        if (mesh) {
            this.scene.remove(mesh);
            mesh.geometry.dispose();
            mesh.material.dispose();
            this.pickingMeshes.delete(buildingId);
        }
    }

    /**
     * Remove buildings for a specific chunk
     * @param {string} chunkKey - The chunk key to remove buildings for
     */
    removeChunkBuildings(chunkKey) {
        // Find all picking meshes for this chunk
        for (const [id, mesh] of this.pickingMeshes.entries()) {
            if (mesh.userData.chunkKey === chunkKey) {
                // Remove from scene and map
                this.scene.remove(mesh);
                mesh.geometry.dispose();
                mesh.material.dispose();
                this.pickingMeshes.delete(id);
            }
        }
    }

    /**
     * Clear all picking meshes
     */
    clear() {
        this.pickingMeshes.forEach(mesh => {
            this.scene.remove(mesh);
            mesh.geometry.dispose();
            mesh.material.dispose();
        });
        this.pickingMeshes.clear();
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
     * Get picking mesh by building ID
     * @param {string|number} buildingId - The building ID
     * @returns {THREE.Mesh|null} The picking mesh or null if not found
     */
    getPickingMesh(buildingId) {
        return this.pickingMeshes.get(buildingId) || null;
    }

    /**
     * Check if a building is in view
     * @param {THREE.Camera} camera - The camera
     * @param {string|number} buildingId - The building ID
     * @returns {boolean} True if in view
     */
    isBuildingInView(camera, buildingId) {
        const mesh = this.getPickingMesh(buildingId);
        if (!mesh) return false;

        // Create frustum from camera
        const frustum = new THREE.Frustum();
        frustum.setFromProjectionMatrix(
            new THREE.Matrix4().multiplyMatrices(
                camera.projectionMatrix,
                camera.matrixWorldInverse
            )
        );

        // Check if mesh is in frustum
        return frustum.intersectsObject(mesh);
    }
}