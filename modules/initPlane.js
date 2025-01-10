import * as THREE from './three-r165/build/three.module.js';

export function initPlane(scene, map) {
    let h = map.mapbounds["maxx"] * 2 + 20;
    let w = map.mapbounds["maxy"] * 2 + 20;
    let planeGeometry = new THREE.BoxGeometry( h, w, 2 ); 
    let planeMaterial = new THREE.MeshLambertMaterial({color: '#141414'});
    let plane = new THREE.Mesh( planeGeometry, planeMaterial );
    plane.rotation.x = -0.5 * Math.PI;
    plane.position.set( 0, -1.-3., 0);
    plane.layers.set( 0 );
    scene.add(plane);
    plane.renderOrder = 3;

    let planeGeometry2 = new THREE.BoxGeometry( h, w, 10 ); 
    let planeMaterial2 = new THREE.MeshLambertMaterial({color: '#4b3d2f'});
    let plane2 = new THREE.Mesh( planeGeometry2, planeMaterial2 );
    plane2.rotation.x = -0.5 * Math.PI;
    plane2.position.set( 0, -7.-3., 0);
    plane2.layers.set( 0 );
    scene.add(plane2);
    plane2.renderOrder = 3;
    
    let planeGeometry3 = new THREE.BoxGeometry( h, w, 20 ); 
    let planeMaterial3 = new THREE.MeshLambertMaterial({color: '#2f261d'});
    let plane3 = new THREE.Mesh( planeGeometry3, planeMaterial3 );
    plane3.rotation.x = -0.5 * Math.PI;
    plane3.position.set( 0, -22.-3., 0);
    plane3.layers.set( 0 );
    scene.add(plane3);
    plane3.renderOrder = 3;
}