import * as THREE from './three-r165/build/three.module.js';

export function initPlane(scene) {
    let planeGeometry = new THREE.BoxGeometry( 1400, 800, 10 ); 
    let planeMaterial = new THREE.MeshLambertMaterial({color: '#191919'});
    let plane = new THREE.Mesh( planeGeometry, planeMaterial );
    plane.rotation.x = -0.5 * Math.PI;
    plane.position.set( 0, -5.5, 0);
    plane.layers.set( 0 );
    scene.add(plane);
    plane.renderOrder = 3;
        
    let planeGeometry2 = new THREE.BoxGeometry( 1400, 800, 20 ); 
    let planeMaterial2 = new THREE.MeshLambertMaterial({color: '#3C3C3C'});
    let plane2 = new THREE.Mesh( planeGeometry2, planeMaterial2 );
    plane2.rotation.x = -0.5 * Math.PI;
    plane2.position.set( 0, -20.7, 0);
    plane2.layers.set( 0 );
    scene.add(plane2);
    plane2.renderOrder = 3;
}