import * as THREE from "./three.js_115/build/three.module.js";


export function BLOCKBuilding_wireframe(cityMap, ib, floor_height, floor) {

    let wf;

    let bounds = cityMap.buildings.bounds[ib].reverse();
    let pN = bounds.length;
    let minH = 0.02;

    let points = [];
    for (let n = 0; n < pN-1; n++) {
        points.push( new THREE.Vector3( bounds[n][0], minH, bounds[n][1] ) );
        points.push( new THREE.Vector3( bounds[n+1][0], minH, bounds[n+1][1] ) );
        points.push( new THREE.Vector3( bounds[n][0], floor_height*floor*cityMap['coordinate scale'], bounds[n][1] ) );
        points.push( new THREE.Vector3( bounds[n+1][0], floor_height*floor*cityMap['coordinate scale'], bounds[n+1][1] ) );

        points.push( new THREE.Vector3( bounds[n][0], minH, bounds[n][1] ) );
        points.push( new THREE.Vector3( bounds[n][0], floor_height*floor*cityMap['coordinate scale'], bounds[n][1] ) );
    }
    points.push( new THREE.Vector3( bounds[pN-1][0], minH, bounds[pN-1][1] ) );
    points.push( new THREE.Vector3( bounds[0][0], minH, bounds[0][1] ) );
    points.push( new THREE.Vector3( bounds[pN-1][0], floor_height*floor*cityMap['coordinate scale'], bounds[pN-1][1] ) );
    points.push( new THREE.Vector3( bounds[0][0], floor_height*floor*cityMap['coordinate scale'], bounds[0][1] ) );

    points.push( new THREE.Vector3( bounds[pN-1][0], minH, bounds[pN-1][1] ) );
    points.push( new THREE.Vector3( bounds[pN-1][0], floor_height*floor*cityMap['coordinate scale'], bounds[pN-1][1] ) );

    let lineGeo = new THREE.BufferGeometry().setFromPoints( points );
    let lineMat = new THREE.LineBasicMaterial( { color: "#94cee2", linewidth: 0.5 } );
    wf = new THREE.LineSegments( lineGeo, lineMat );

    return wf
}