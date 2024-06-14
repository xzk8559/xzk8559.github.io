// import * as THREE from "../three.js_130/build/three.module.js";
import * as THREE from '../modules/three-r165/build/three.module.js';

export function initLight(scene) {
    let light = new THREE.AmbientLight( '#ffffff', 2.0 );
    scene.add( light );
}