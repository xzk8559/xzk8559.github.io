import * as THREE from "../three.js_130/build/three.module.js";

export function initLight(scene) {
    let light = new THREE.AmbientLight( '#ffffff', 1.5 );
    scene.add( light );
}