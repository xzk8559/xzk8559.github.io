import * as THREE from './three-r165/build/three.module.js';

export class PlaneTiles {
    constructor(zoom) {
        this.tileWidthZoom12 = 835;
        this.originPos = [309.2, 1058.0];
        this.meshes = this.create(zoom);
    }
    create(zoom) {
        const localPlane1 = new THREE.Plane( new THREE.Vector3(  1, 0, 0 ), 1195 );
        const localPlane2 = new THREE.Plane( new THREE.Vector3(  -1, 0, 0 ), 5 );
        const localPlane3 = new THREE.Plane( new THREE.Vector3(  0, 0, -1 ), 950 );
        const localPlane4 = new THREE.Plane( new THREE.Vector3(  0, 0, 1 ), 50 );

        let planeTiles = [];
        let xyList = this.getXYlist(zoom);
        let tileWidth = xyList[4];
        let nTilesX = xyList[1] - xyList[0] + 1;
        let nTilesY = xyList[3] - xyList[2] + 1;

        let tx, ty, url, pxy;

        let planeGeometry = new THREE.PlaneGeometry(tileWidth, tileWidth);
        for (let i = 0; i < nTilesX; i++) {
            for (let j = 0; j < nTilesY; j++) {
                let planeMaterial = new THREE.MeshBasicMaterial({transparent: false, opacity: 0.95, color: '#404040', clippingPlanes: [ localPlane1, localPlane2, localPlane3, localPlane4 ], clipIntersection: false});
                let planeTile = new THREE.Mesh(planeGeometry, planeMaterial);
                pxy = this.getTileCoords(tileWidth, i, j);
                planeTile.userData.relPos = [pxy[0]-this.originPos[0], pxy[1]-this.originPos[1]]

                tx = (xyList[0] + i).toString();
                ty = (xyList[2] + j).toString();
                url = 'https://api.maptiler.com/tiles/satellite-v2/' + zoom.toString() + '/' + tx + '/' + ty + '.jpg?key=TxzWDyftlQvCUrnCSyaz'

                planeTile.material.map = new THREE.TextureLoader().load(url);
                planeTile.rotation.x =-0.5 * Math.PI;
                planeTile.rotation.z = Math.PI;
                planeTile.position.set( pxy[0], -1.5, pxy[1] );
                // planeTile.scale.set( 1, 1, 1 );
                planeTile.layers.set( 0 );
                planeTile.renderOrder = 3;
                planeTiles.push(planeTile);
            }
        }

        return planeTiles
    };
    getXYlist(zoom) {
        // get [firstX, lastX, firstY, lastY, tileWidth]
        if (zoom === 12) {
            return [3428, 3429, 1672, 1673, this.tileWidthZoom12];
        } else if (zoom === 13) {
            return [6856, 6859, 3345, 3347, this.tileWidthZoom12/2];
        } else if (zoom === 14) {
            return [13712, 13719, 6690, 6695, this.tileWidthZoom12/4];
        } else if (zoom === 15) {
            return [27424, 27439, 13380, 13391, this.tileWidthZoom12/8];
        }
    };
    getTileCoords(tileWidth, i, j) {
        let px = this.originPos[0] - tileWidth * (0.5 + i);
        let py = this.originPos[1] - tileWidth * (0.5 + j);
        return [px, py];
    };
    setPos(x, y, z) {
        this.originPos = [x, z];
        this.meshes.forEach( tile => {
            tile.position.set( tile.userData.relPos[0] + x, y, tile.userData.relPos[1] + z );
        });
    }
}
