import * as THREE from './three-r165/build/three.module.js';

export class TubePipe {
    constructor(map, ib, lut) {
        // this.map = map;
        this.ib = ib;
        this.lut = lut;
        this.coords = map.coords[ib];
        this.coordsScale = map.coordsScale;
        this.visualScale = this.coordsScale * 0.001 * 10;
        this.pointCount = this.coords.length;
        this.diameter = map.attributes.DIAMETER[ib]; // mm
        this.depth1 = map.attributes.START_DEPT[ib];
        this.depth2 = map.attributes.END_DEPTH[ib];
        this.mesh = this.create();
        this.level = 1;
    }

    create() {
        if (this.diameter < .1) {
            this.diameter = 63;
        }
        
        if (this.depth1 === 0 && this.depth2 !== 0) {
            this.depth1 = this.depth2;
        } else if (this.depth1 !== 0 && this.depth2 === 0) {
            this.depth2 = this.depth1;
        }

        let path;
        let geometry;
        let curve = [];

        for (let i = 0; i < this.pointCount; i++) {
            let depth = this.depth1 + (this.depth2 - this.depth1) * i / (this.pointCount - 1);
            curve.push(new THREE.Vector3(this.coords[i][0], 10 - depth * this.coordsScale, this.coords[i][1]) );
        }
        path = new THREE.CatmullRomCurve3(curve);
        geometry = new THREE.TubeGeometry( path, this.pointCount-1, this.diameter*this.visualScale, 8, false );

        let depthColor = this.diameter / 426;
        let material = new THREE.MeshLambertMaterial( { 
            color: this.lut.getColor(depthColor),
            // side: THREE.DoubleSide,
        } );
        return new THREE.Mesh( geometry, material );
    }

    getMesh() {
        return this.mesh;
    }
}