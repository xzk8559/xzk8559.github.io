import * as THREE from "./three.js_115/build/three.module.js";


export function BLOCKBuilding_wireframe( building ) {

    let geometry = building.geometry;
    let edges = new THREE.EdgesGeometry( geometry );
    let lineMat = new THREE.LineBasicMaterial( { color: "#94cee2", linewidth: 0.5 } );
    let line = new THREE.LineSegments( edges, lineMat );

    return line
}