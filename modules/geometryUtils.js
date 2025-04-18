import * as THREE from './three-r175/build/three.module.js';

/**
 * Utility functions for creating geometries
 */

/**
 * Creates a box BufferGeometry with the specified dimensions
 * Using BufferGeometry instead of BoxGeometry for better performance
 * This reduces memory usage and potentially improves rendering speed
 * 
 * @param {number} width - Width of the box
 * @param {number} height - Height of the box
 * @param {number} depth - Depth of the box
 * @returns {THREE.BufferGeometry} A BufferGeometry representing a box
 */
export function createBoxBufferGeometry(width, height, depth) {
    const geometry = new THREE.BufferGeometry();
    
    // Define the 8 vertices of a box
    const halfWidth = width / 2;
    const halfDepth = depth / 2;
    const halfHeight = height / 2;
    
    const vertices = new Float32Array([
        // Front face
        -halfWidth, -halfHeight, halfDepth,  // 0
        halfWidth, -halfHeight, halfDepth,   // 1
        halfWidth, halfHeight, halfDepth,    // 2
        -halfWidth, halfHeight, halfDepth,   // 3
        
        // Back face
        -halfWidth, -halfHeight, -halfDepth, // 4
        halfWidth, -halfHeight, -halfDepth,  // 5
        halfWidth, halfHeight, -halfDepth,   // 6
        -halfWidth, halfHeight, -halfDepth   // 7
    ]);
    
    // Define the 12 triangles (36 indices) of a box
    const indices = new Uint16Array([
        // Front face
        0, 1, 2, 0, 2, 3,
        // Back face
        5, 4, 7, 5, 7, 6,
        // Top face
        3, 2, 6, 3, 6, 7,
        // Bottom face
        4, 5, 1, 4, 1, 0,
        // Right face
        1, 5, 6, 1, 6, 2,
        // Left face
        4, 0, 3, 4, 3, 7
    ]);
    
    // Set attributes
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    
    // Calculate normals for proper raycasting
    geometry.computeVertexNormals();
    
    return geometry;
}
