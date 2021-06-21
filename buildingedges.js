import * as THREE from "./three.js_115/build/three.module.js";


export function BLOCKBuilding_wireframe( building ) {
    let geometry = building.geometry;
    let edges = new THREE.EdgesGeometry( geometry );
    let lineMat = new THREE.LineBasicMaterial( { color: "#4cabff", linewidth: 0.1 } );
    return new THREE.LineSegments(edges, lineMat)
}