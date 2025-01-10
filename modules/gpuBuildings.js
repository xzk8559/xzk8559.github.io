// file: gpuBuildings.js

import * as THREE from './three-r165/build/three.module.js';
import { mergeGeometries } from './three-r165/examples/jsm/utils/BufferGeometryUtils.js';

import { BlockBuildingChunk } from './blockBuildingChunk.js';


/**
 * createBuildingsFromChunk:
 *  - chunkData.buildings.data is an array of buildings, each has:
 *       { bid, bounds, center, storey }
 *  - You must also know sumFloors = sum( storey ) across all buildings in this chunk
 *    and T (the number of time steps).
 *  - We'll store a "floorIndex" attribute so each vertex knows which floor it belongs to.
 */
export function createBuildingsFromChunk(chunkData) {
    let allGeoms = [];

    // (1) Pre-calculate sumFloors if not already in chunkData
    let sumFloors = 0;
    chunkData.buildings.data.forEach(b => {
        sumFloors += Math.max(1, b.storey);
    });
    let buildingCount = chunkData.buildings.data.length;

    // We'll keep track of a running offset so building 0's floors occupy [offset..offset+storey-1],
    // then building 1's floors occupy the next range, etc.
    
    // 0 is the ground floor with no displacement
    // all buildings share the same ground floor to save memory
    let runningFloorOffset = 1; 

    chunkData.buildings.data.forEach((bld, cid) => {
        // cid is the index in this chunk
        const bid = bld.id; // index across all buildings
        const bounds = bld.bounds;
        const storey = bld.storey;
        const numFloors = Math.max(1, storey);
        
        let blockGeom = new BlockBuildingChunk(
            cid, numFloors, bounds,
            3.6, chunkData.coordinate_scale,
            runningFloorOffset, //for floorIndex
        ).getGeo( 1 ); // '1' is for LOD1 extruded model

        allGeoms.push(blockGeom);

        runningFloorOffset += numFloors;
    });

    // Merge them
    let mergedGeom = mergeGeometries(allGeoms, false);

    // Create a custom ShaderMaterial with a displacement texture
    let material = createDisplacementShaderMaterial(sumFloors, chunkData.T);

    let mesh = new THREE.Mesh(mergedGeom, material);

    mesh.userData = {
        sumFloors: sumFloors,
        T: chunkData.T,   // total time steps
        chunkIndex: chunkData.chunk_index,
        buildingCount: buildingCount,
    };

    return mesh;
}

/**
 * Create a ShaderMaterial that references a 2D data texture for displacements.
 * Size: width = sumFloors, height = T
 */
function createDisplacementShaderMaterial(sumFloors, timeSteps) {
    // We'll load an actual PNG from the server, not create an empty DataTexture.
    // So for the moment, we create a placeholder uniform. We'll load the image in loadChunk.

    let placeholderTex = new THREE.DataTexture(
        new Uint16Array(1), // Single channel with 16-bit unsigned integer
        1, 1, THREE.RGBAFormat, THREE.UnsignedShortType
    );
    placeholderTex.needsUpdate = true;
    placeholderTex.internalFormat = 'R16UI'

    // The vertex shader
    let vertexShaderGLSL = `
    precision highp float;

    // uniform mat4 modelViewMatrix;
    // uniform mat4 projectionMatrix;
    uniform sampler2D uDisplacementMap;

    // pass in the current time step from the CPU
    uniform float uTimeStep;   // in [0, T-1]

    // sumFloors => used to convert floorIndex to a column x
    uniform float uSumFloors;
    uniform float uTimeSteps;  // T

    in vec3 color;
    // in vec3 position;
    // in vec3 normal;
    in float floorIndex; // which column
    
    out vec3 vNormal;
    out vec3 vColor;

    void main() {
        // coordinate in the texture
        float x = (floorIndex + 0.5) / uSumFloors;
        float y = (uTimeStep + 0.5) / uTimeSteps;

        vec4 dispTex = texture(uDisplacementMap, vec2(x, y));
        float disp = dispTex.r * 2.0 - 1.0; // Normalize from [0,1] -> [-1,1]
        float k = abs(disp) * 2.0 - 1.0; // [-1,1]
        float k2 = k * k;
        float k3 = k * k2;
        float k4 = k * k3;

        // apply displacement
        vec3 displacedPos = position + vec3(0, 0, disp * 0.5);

        float r = -0.0670 * k4 - 0.2922 * k3 - 0.2918 * k2 + 0.5848 * k + 0.7922;
        float g =  0.3830 * k4 + 0.0976 * k3 - 0.7843 * k2 - 0.2422 * k + 0.7464;
        float b =  0.1979 * k4 - 0.0579 * k3 - 0.3181 * k2 + 0.0014 * k + 0.3497;

        vNormal = normal;
        vColor = vec3(r, g, b);

        gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPos, 1.0);
    }
    `;

    let fragmentShaderGLSL = `
    precision highp float;

    in vec3 vNormal;
    in vec3 vColor;

    out vec4 outColor;

    void main() {
        // simple shading
        // float diff = abs(dot(normalize(vNormal), vec3(0.0,1.0,0.0)));
        // vec3 shadedColor = vColor * diff; // Modulate vertex color with lighting

        // gl_FragColor = vec4(shadedColor, 1.0);
        
        outColor = vec4(vColor + 0.1, 1.0);
    }
    `;

    let material = new THREE.ShaderMaterial({
        vertexShader: vertexShaderGLSL,
        fragmentShader: fragmentShaderGLSL,
        glslVersion: THREE.GLSL3,
        uniforms: {
            uDisplacementMap: { value: placeholderTex  },
            uTimeStep: { value: 0 },
            uSumFloors: { value: sumFloors * 1.0 },
            uTimeSteps: { value: timeSteps * 1.0 },
        }
    });

    return material;
}

