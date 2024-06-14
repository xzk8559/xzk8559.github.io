import * as THREE from '../three.js_130/build/three.module.js';

export async function initScene(scene, scene_lut) {
    scene = new THREE.Scene();
    scene_lut = new THREE.Scene();
    scene.background = new THREE.Color('#474747');
    scene.fog = new THREE.FogExp2('#8d8d8d', 0.0006);
    // return scene, scene_lut;
}
