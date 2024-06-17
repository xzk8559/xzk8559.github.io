import * as THREE from '../modules/three-r165/build/three.module.js';

export function initPlane(scene) {
    // console.log(scene);
    let planeGeometry = new THREE.BoxGeometry( 1200, 1000, 10 ); 
    let planeMaterial = new THREE.MeshLambertMaterial({color: '#0F0F05'});
    let plane = new THREE.Mesh( planeGeometry, planeMaterial );
    plane.rotation.x = -0.5 * Math.PI;
    plane.position.set( 600, -5, 450);
    plane.layers.set( 0 );
    scene.add(plane);
    plane.renderOrder = 1;

    
    let planeGeometry2 = new THREE.BoxGeometry( 1200, 1000, 20 ); 
    let planeMaterial2 = new THREE.MeshLambertMaterial({color: '#3C3C3C'});
    let plane2 = new THREE.Mesh( planeGeometry2, planeMaterial2 );
    plane2.rotation.x = -0.5 * Math.PI;
    plane2.position.set( 600, -20.2, 450);
    plane2.layers.set( 0 );
    scene.add(plane2);
    plane2.renderOrder = 1;
}