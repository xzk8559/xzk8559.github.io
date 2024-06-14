import * as THREE from '../three.js_130/build/three.module.js';
import { GPUStatsPanel } from '../three.js_130/examples/jsm/utils/GPUStatsPanel.js';

export async function initRenderer(renderer, window, gpuPanel, stats) {
    // renderer = new THREE.WebGLRenderer({ antialias: true, precision: 'lowp' });
    // renderer.setPixelRatio(window.devicePixelRatio);
    // renderer.setSize(window.innerWidth, window.innerHeight);
    // renderer.shadowMap.enabled = false;
    // renderer.autoClear = false;
    
    // gpuPanel = new GPUStatsPanel( renderer.getContext() );
    // stats.addPanel( gpuPanel );
    // stats.showPanel( 0 );

    // return new Promise(resolve => resolve());
    return new Promise((resolve) => {
        // Simulate async operation
        setTimeout(() => {
            renderer = new THREE.WebGLRenderer({ antialias: true, precision: 'lowp' });
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.shadowMap.enabled = false;
            renderer.autoClear = false;

            gpuPanel = new GPUStatsPanel(renderer.getContext());
            stats.addPanel(gpuPanel);
            stats.showPanel(0);

            resolve(); // Resolve when done
        }, 0); // Simulated delay
    });
}