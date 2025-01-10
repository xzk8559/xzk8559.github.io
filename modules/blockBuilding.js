import * as THREE from '../modules/three-r165/build/three.module.js';
import { triangulate, exchange0And1 } from './utilsModeling.js';

export class BlockBuilding {
    constructor(map, ib, floorHeight) {
        this.map = map;
        this.ib = ib;
        this.floorHeight = floorHeight;
        this.height = this.map.buildings.height;
        this.floor = Math.max(Math.floor( this.height / floorHeight ), 1);
        this.bounds = this.map.buildings.bounds; // .reverse()
        this.pointCount = this.bounds.length;
        this.level = 1;
        this.his = 0;
        [this.mesh, this.meshLOD0] = this.create();
    }

    create() {
        let geometry = new THREE.BufferGeometry();
        let indices = [];
        let vertices = [];
        let colors = [];

        let geometry2 = new THREE.BufferGeometry(); // LOD0
        let indices2 = [];
        let vertices2 = [];
        let colors2 = [];

        let pN = this.pointCount;

        for (let i0 = 0; i0 < this.floor + 1; i0++) {
            for (let i1 = 0; i1 < pN; i1++) {
                const [x, z] = this.bounds[i1];
                let y = i0 * this.floorHeight * this.map.coordinate_scale;
                let colorShift = (i0 / this.floor - 1) * 0.03;
                vertices.push(x, y, z);
                colors.push(0.18 + colorShift, 0.18 + colorShift, 0.2 + colorShift);
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
            vertices2.push(x, this.height * this.map.coordinate_scale, z);
            colors2.push(0.18, 0.18, 0.2);
        }


        let triangles = triangulate(this.bounds);
        for (let i = 0; i < triangles.length; i++) {
            let n = i - i % 3 + exchange0And1(i % 3);
            indices.push(triangles[n] + pN * this.floor);
            indices2.push(triangles[n]);
        }

        geometry.setIndex(indices);
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.attributes.position.usage = THREE.DynamicDrawUsage;
        geometry.attributes.color.usage = THREE.DynamicDrawUsage;
        // geometry.computeVertexNormals();

        geometry2.setIndex(indices2);
        geometry2.setAttribute('position', new THREE.Float32BufferAttribute(vertices2, 3));
        geometry2.setAttribute('color', new THREE.Float32BufferAttribute(colors2, 3));
        geometry2.attributes.color.usage = THREE.DynamicDrawUsage;
        // geometry2.computeVertexNormals();

        let material = new THREE.MeshBasicMaterial({
            vertexColors: true,
            side: THREE.DoubleSide,
            precision: 'lowp',
            transparent: false,
        });

        let mesh = new THREE.Mesh(geometry, material);
        mesh.layers.enable( 1 );
        mesh.frustumCulled = false;
        // console.log(mesh);
        
        let mesh2 = new THREE.Mesh(geometry2, material);
        mesh2.layers.enable( 1 );
        mesh2.frustumCulled = false;
        
        mesh.userData.parent = this;
        mesh2.userData.parent = this;
        return [mesh, mesh2];
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
