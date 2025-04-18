// file: gpuBuildings.js

import * as THREE from './three-r175/build/three.module.js';
import { BlockBuildingChunk } from './blockBuildingChunk.js';
import { mergeGeometries } from './three-r175/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * Minimal example: each building gets a unique integer ID (0..(N-1)).
 * We'll store a "buildingID" attribute in geometry, 
 * and use a data texture (displacementTex) to hold (dx, dy, dz, extra).
 *
 * The vertex shader reads: position += displacementTex(buildingID).
 */
export function createBuildingsFromChunk(chunkData) {
    // chunkData.buildings.data might be an array of building polygons, etc.
    // We'll assume each building can produce a geometry with 'buildingID' attribute.
    let allGeoms = [];
    let buildingCount = chunkData.buildings.data.length;

    chunkData.buildings.data.forEach((building, cid) => {
        // cid is the index in this chunk
        let bid = building.id; // index across all buildings
        let bounds = building.bounds;
        let storey = building.storey;
        // console.log(building);

        if (storey <= 0) { storey = 1; }
        let blockGeom = new BlockBuildingChunk(
            cid, storey, bounds,
            3.6, chunkData.coordinate_scale
        ).getGeo(1); // '1' is for LOD1 extruded model
        
        allGeoms.push(blockGeom);
    });

    // Merge them
    const mergedGeom = mergeGeometries(allGeoms, false);

    // Create a custom ShaderMaterial with a displacement texture
    const material = createDisplacementShaderMaterial(buildingCount);

    let mesh = new THREE.Mesh(mergedGeom, material);

    mesh.userData = {
        buildingCount: buildingCount,
        chunkIndex: chunkData.chunk_index
    };

    return mesh;
}

/**
 * Create a ShaderMaterial that references a 2D data texture for displacements.
 */
function createDisplacementShaderMaterial(buildingCount) {
  // figure out a minimal texture dimension to hold 'buildingCount' 
  // each building uses 1 pixel => RGBA => stores (dx, dy, dz, extra)
    let texWidth = 1;
    while (texWidth * texWidth < buildingCount) {
        texWidth *= 2;
    }
    if (texWidth < 1) texWidth = 1;

    // create float array
    const totalPixels = texWidth * texWidth;
    let dataArray = new Float32Array(totalPixels * 4); // RGBA
    dataArray.fill(0);

    let displacementTex = new THREE.DataTexture(
        dataArray,
        texWidth,
        texWidth,
        THREE.RGBAFormat,
        THREE.FloatType
    );
    displacementTex.needsUpdate = true;

    // The vertex shader
    const vertexShaderGLSL = `
    precision highp float;

    // uniform mat4 modelViewMatrix;
    // uniform mat4 projectionMatrix;
    uniform sampler2D uDisplacementMap;
    uniform float uTexSize;

    // in vec3 position;
    // in vec3 normal;
    in float buildingID;
    in vec3 color;

    out vec3 vNormal;
    out vec3 vColor;

    void main() {
        // buildingID => compute integer => map to pixel
        // ID in [0, buildingCount)
        // we find the X and Y in the texture:
        float bid = floor(buildingID + 0.5);
        float x = mod(bid, uTexSize);
        float y = floor(bid / uTexSize);

        // convert to [0,1]
        vec2 uv = vec2((x + 0.5)/uTexSize, (y+0.5)/uTexSize);

        // sample displacement
        vec4 disp = texture(uDisplacementMap, uv);

        // apply displacement
        vec3 displacedPos = position + disp.xyz;

        vNormal = normal;
        vColor = color;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPos, 1.0);
    }
    `;

    const fragmentShaderGLSL = `
    precision highp float;

    in vec3 vNormal;
    in vec3 vColor;

    void main() {
        // simple shading
        // float diff = abs(dot(normalize(vNormal), vec3(0.0,1.0,0.0)));
        // vec3 shadedColor = vColor * diff; // Modulate vertex color with lighting

        // gl_FragColor = vec4(shadedColor, 1.0);
        
        gl_FragColor = vec4(vColor+0.15, 1.0);
    }
    `;

    let material = new THREE.ShaderMaterial({
        vertexShader: vertexShaderGLSL,
        fragmentShader: fragmentShaderGLSL,
        uniforms: {
        uDisplacementMap: { value: displacementTex },
        uTexSize: { value: texWidth * 1.0 }, // float
        }
    });

    // store the texture data array in the material for easy updates
    material.userData = {
        dataArray,
        displacementTex,
        texWidth
    };

    return material;
}

/**
 * This updates the chunk's displacement texture each frame 
 * using an array of {x, y, z} displacements for each building.
 */
export function updateChunkDisplacements(chunkMesh, buildingDisplacements) {
    // buildingDisplacements => an array of length = buildingCount
    // each element: { x, y, z }
    if (!chunkMesh || !chunkMesh.material) return;

    let mat = chunkMesh.material;
    if (!mat.userData || !mat.userData.displacementTex) return;

    let dataTex = mat.userData.displacementTex;
    let dataArray = mat.userData.dataArray;
    let texWidth = mat.userData.texWidth;

    for (let i = 0; i < buildingDisplacements.length; i++) {
        const disp = buildingDisplacements[i];
        // find the pixel in dataArray
        let xCoord = i % texWidth;
        let yCoord = Math.floor(i / texWidth);
        let index = (yCoord * texWidth + xCoord) * 4;

        dataArray[index + 0] = disp.x; // R
        dataArray[index + 1] = disp.y; // G
        dataArray[index + 2] = disp.z; // B
        dataArray[index + 3] = 0.0;    // A unused
    }
    dataTex.needsUpdate = true;
}
