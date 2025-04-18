import * as THREE from '../modules/three-r175/build/three.module.js';
import { triangulate, exchange0And1 } from './utilsModeling.js';

export class BlockBuildingChunk {
    constructor(bid, cid, storey, bounds, floorHeight=3.6, 
        coordinate_scale,
        runningFloorOffset,
        pickingColor,
    ) {
        this.bid = bid;
        this.cid = cid;
        this.floor = storey + 1; // +1 for base floor with 0-displacement
        this.bounds = bounds; // .reverse()
        this.floorHeight = floorHeight;
        this.height = storey * this.floorHeight;
        this.coord_scale = coordinate_scale;
        this.pointCount = this.bounds.length;
        this.runningFloorOffset = runningFloorOffset;
        this.pickingColor = pickingColor;
    }

    getGeo( lod = 1 ) {
        let geometry = new THREE.BufferGeometry();
        let indices = [];
        let vertices = [];
        let colors = [];
        let floorIdx = [];
        let pN = this.pointCount;

        
        if (lod === 0) {
            // lod 0: polygon in x-z plane
            for (let i1 = 0; i1 < pN; i1++) {
                let x = this.bounds[i1][0];
                let z = this.bounds[i1][1];
                vertices.push(x, this.height * this.coord_scale, z);
                colors.push(0.18, 0.18, 0.2);
                
                floorIdx.push(this.runningFloorOffset);
            }

            let triangles = triangulate(this.bounds);
            for (let i = 0; i < triangles.length; i++) {
                let n = i - i % 3 + exchange0And1(i % 3);
                indices.push(triangles[n]);
            }
        } else if (lod === 1) {
            // lod 1: extruded model
            for (let i0 = 0; i0 < this.floor + 1; i0++) {
                // +1 for seperate modeling of roof
                for (let i1 = 0; i1 < pN; i1++) {
                    let y, colorShift;
                    const [x, z] = this.bounds[i1];
                    if (i0 === this.floor) { 
                        y = (this.floor-1) * this.floorHeight * this.coord_scale + 0.02;
                        colorShift = 0.1;
                    } else {
                        y = i0 * this.floorHeight * this.coord_scale;
                        colorShift = Math.min(0, (i0 / 5 - 1)) * 0.1 + Math.min(0, (i0 - 1)) * 0.05 - 0.075;
                    }
                    vertices.push(x, y, z);
                    colors.push(0.25 + colorShift, 0.25 + colorShift, 0.25 + colorShift);

                    // Note that var "floor" includes a base floor while var "storey" doesn't
                    // e.g. assume story=8, floor=9, runningFloorOffset=10
                    // for i0 = 0...9
                    // push 0, 10, 11, 12, 13, 14, 15, 16, 17, 17
                    // result in line 0 and 10-17 in texture
                    if (i0 === 0) {
                        floorIdx.push(0);
                    } else if (i0 === this.floor) {
                        floorIdx.push(this.runningFloorOffset + i0 - 2);
                    } else {
                        floorIdx.push(this.runningFloorOffset + i0 - 1);
                    }
                    // then next building's runningFloorOffset = 10+story = 18
                }
                
                if (i0 !== this.floor) {
                    let pos;
                    for (let n = 0; n < pN - 1; n++) {
                        pos = pN * i0 + n;
                        indices.push(pos + pN + 1, pos + 1, pos);
                        indices.push(pos + pN + 1, pos, pos + pN);
                    }
                    pos = pN * i0 + pN - 1;
                    indices.push(pos + 1, pos + 1 - pN, pos);
                    indices.push(pos + 1, pos, pos + pN);
                }
            }

            let triangles = triangulate(this.bounds);
            for (let i = 0; i < triangles.length; i++) {
                let n = i - i % 3 + exchange0And1(i % 3);
                indices.push(triangles[n] + pN * this.floor);
            }
        } else {
            console.log('Error: LOD not supported');
        }

        geometry.setIndex(indices);
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.setAttribute('floorIndex', new THREE.Float32BufferAttribute(floorIdx, 1));
        geometry.attributes.position.usage = THREE.DynamicDrawUsage;
        geometry.attributes.color.usage = THREE.DynamicDrawUsage;

        // const idArray = new Float32Array(geometry.attributes.position.count).fill(this.bid);
        // geometry.setAttribute('buildingID', new THREE.BufferAttribute(idArray, 1));

        // geometry.computeVertexNormals();
        return geometry;
    }
}