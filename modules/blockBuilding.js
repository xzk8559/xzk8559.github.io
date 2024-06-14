import * as THREE from '../modules/three-r165/build/three.module.js';
import { Earcut } from './Earcut.js';

export class BlockBuilding {
    constructor(map, ib, floorHeight) {
        this.map = map;
        this.ib = ib;
        this.floorHeight = floorHeight;
        this.height = this.map.buildings.height[ib];
        this.floor = Math.max(Math.floor( this.height / floorHeight ), 1);
        this.bounds = this.map.buildings.bounds[this.ib].reverse();
        this.pointCount = this.bounds.length;
        this.level = 1;
        this.his = 0;
        [this.mesh, this.meshLOD0] = this.create();
    }

    create() {
        let geometry = new THREE.BufferGeometry();
        let indices = [];
        let vertices = [];
        let normals = [];
        let colors = [];

        let geometry2 = new THREE.BufferGeometry(); // LOD0
        let indices2 = [];
        let vertices2 = [];
        let colors2 = [];
        let normals2 = [];

        let pN = this.pointCount;

        for (let i0 = 0; i0 < this.floor + 1; i0++) {
            for (let i1 = 0; i1 < pN; i1++) {
                let x = this.bounds[i1][0];
                let z = this.bounds[i1][1];
                let y = i0 * this.floorHeight * this.map['coordinate scale'];
                let tmp = (i0 / this.floor - 1) * 0.03;
                vertices.push(x, y, z);
                colors.push(0.18 + tmp, 0.18 + tmp, 0.2 + tmp);
                /*let tmp = i0 / floor  * 0.2;
                colors.push( 0.1 + tmp*0.4, 0.1 + tmp*0.6, 0.1 + tmp*0.7 );*/

                normals.push(0, 1, 0.5);
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

        // LOD0
        for (let i1 = 0; i1 < pN; i1++) {
            let x = this.bounds[i1][0];
            let z = this.bounds[i1][1];
            vertices2.push(x, this.height * this.map['coordinate scale'], z);
            colors2.push(0.18, 0.18, 0.2);
            normals2.push(0, 1, .5);
        }


        let triangles = this.triangulate(this.bounds);
        for (let i = 0; i < triangles.length; i++) {
            let n = i - i % 3 + this.exchange0And1(i % 3);
            indices.push(triangles[n] + pN * this.floor);
            indices2.push(triangles[n]);
        }

        geometry.setIndex(indices);
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.attributes.position.usage = THREE.DynamicDrawUsage;
        geometry.attributes.color.usage = THREE.DynamicDrawUsage;
        geometry.computeVertexNormals();

        geometry2.setIndex(indices2);
        geometry2.setAttribute('position', new THREE.Float32BufferAttribute(vertices2, 3));
        geometry2.setAttribute('normal', new THREE.Float32BufferAttribute(normals2, 3));
        geometry2.setAttribute('color', new THREE.Float32BufferAttribute(colors2, 3));
        geometry2.attributes.position.usage = THREE.DynamicDrawUsage;
        geometry2.attributes.color.usage = THREE.DynamicDrawUsage;
        geometry2.computeVertexNormals();

        let material = new THREE.MeshLambertMaterial({
            vertexColors: true,
            side: THREE.DoubleSide,
            precision: 'lowp',
            transparent: false,
            opacity: 0.4,
        });

        let mesh = new THREE.Mesh(geometry, material);
        mesh.layers.enable( 1 );
        mesh.frustumCulled = false;
        
        let mesh2 = new THREE.Mesh(geometry2, material);
        mesh2.layers.enable( 1 );
        mesh2.frustumCulled = false;
        
        mesh.userData.parent = this;
        mesh2.userData.parent = this;
        return [mesh, mesh2];
    }

    triangulate(boundsVec3) {
        let array = [];
        for (let i1 = 0; i1 < boundsVec3.length; i1++) {
            array.push(boundsVec3[i1][0], boundsVec3[i1][1]);
        }
        return Earcut.triangulate(array);
    }

    exchange0And1(x) {
        return (3 / 2 * x * x - 5 / 2 * x + 1);
    }

    getMesh(LOD=1) {
        if (LOD === 0) {
            return this.meshLOD0;
        }
        return this.mesh;
    }
}

// Example usage:
// const building = new blockBuilding(cityMap, ib, floorHeight, floor);
// scene.add(building.getMesh());
