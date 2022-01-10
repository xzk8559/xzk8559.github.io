import * as THREE from "../three.js_130/build/three.module.js";

export function initPlane(scene) {
    let planeGeometry = new THREE.PlaneGeometry(1000, 1500, 1, 1);
    let planeMaterial = new THREE.MeshLambertMaterial({color: '#0b0c0e'});
    let plane = new THREE.Mesh( planeGeometry, planeMaterial );
    plane.rotation.x = -0.5 * Math.PI;
    plane.position.set( 277.148, 0, -617.370);
    plane.layers.set( 0 );
    scene.add(plane);
    plane.renderOrder = 1;
}