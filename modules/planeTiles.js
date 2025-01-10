import * as THREE from './three-r165/build/three.module.js';

export class PlaneTiles {
    constructor(zoom, bounds, meta) {
        this.meta = meta;
        this.zoom = zoom;
        this.bounds = bounds; // query from OSM
        this.tileWidthZoom12 = 838;
        this.originPos = [2240, 2610];
        
        // Reorder bounds array access:
        // bounds = [maxLon, minLon, maxLat, minLat]
        const minTile = this.latLonToTileXY(bounds[3], bounds[1], zoom); // minLat, minLon
        const maxTile = this.latLonToTileXY(bounds[2], bounds[0], zoom); // maxLat, maxLon
        
        this.tileRange = {
            minX: Math.min(minTile.tx, maxTile.tx),
            maxX: Math.max(minTile.tx, maxTile.tx),
            minY: Math.min(minTile.ty, maxTile.ty),
            maxY: Math.max(minTile.ty, maxTile.ty)
        };
        
        this.meshes = this.create(zoom);
    }

    create(zoom) {
        const localPlane1 = new THREE.Plane( new THREE.Vector3(  1, 0, 0 ), this.meta.map_bounds.maxx + 10 );
        const localPlane2 = new THREE.Plane( new THREE.Vector3(  -1, 0, 0 ), this.meta.map_bounds.maxx + 10 );
        const localPlane3 = new THREE.Plane( new THREE.Vector3(  0, 0, -1 ), this.meta.map_bounds.maxy + 10 );
        const localPlane4 = new THREE.Plane( new THREE.Vector3(  0, 0, 1 ), this.meta.map_bounds.maxy + 10 );

        let planeTiles = [];
        let xyList = this.getXYlist(zoom);
        let tileWidth = xyList[4];
        let nTilesX = xyList[1] - xyList[0] + 1;
        let nTilesY = xyList[3] - xyList[2] + 1;

        let tx, ty, url, pxy;

        let planeGeometry = new THREE.PlaneGeometry(tileWidth, tileWidth);
        for (let i = 0; i < nTilesX; i++) {
            for (let j = 0; j < nTilesY; j++) {
                let planeMaterial = new THREE.MeshBasicMaterial({
                    transparent: true, 
                    opacity: 0.525, 
                    color: '#404040', 
                    // clippingPlanes: [ localPlane1, localPlane2 ], 
                    clippingPlanes: [ localPlane1, localPlane2, localPlane3, localPlane4 ], 
                    clipIntersection: false});
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
        // Calculate tile width based on zoom level
        const tileWidth = this.tileWidthZoom12 / Math.pow(2, zoom - 12);
        
        return [
            this.tileRange.minX,
            this.tileRange.maxX,
            this.tileRange.minY,
            this.tileRange.maxY,
            tileWidth
        ];
    }

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

    latLonToTileXY(lat, lon, zoom) {
        const latRad = (lat * Math.PI) / 180; // Convert latitude to radians
        const n = Math.pow(2, zoom);          // Total tiles at this zoom level
        const tx = Math.floor((lon + 180) / 360 * n); // Tile X
        const ty = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n); // Tile Y
        return { tx, ty };
    }
}
