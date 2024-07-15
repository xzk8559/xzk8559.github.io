import * as THREE from './modules/three-r165/build/three.module.js';
import Stats from './modules/three-r165/examples/jsm/libs/stats.module.js';
import { GUI } from './modules/three-r165/examples/jsm/libs/lil-gui.module.min.js';
import { GPUStatsPanel } from './modules/three-r165/examples/jsm/utils/GPUStatsPanel.js';
import { OrbitControls } from './modules/three-r165/examples/jsm/controls/OrbitControls.js';
import { OBJExporter } from './modules/three-r165/examples/jsm/exporters/OBJExporter.js';
import { Sky } from './modules/three-r165/examples/jsm/objects/Sky.js';
import { Lut } from './modules/Lut.js';
import { pipeLineSegments } from './modules/pipeline.js';
import { TubePipe } from './modules/tubePipe.js';
import { initPlane } from './modules/initPlane_Huarun.js';

let map;
let stats, gpuPanel, orbitControls, gui;
let renderer, scene, camera;
let pipe, pipeMerge, pipePos;
let lut, sky, sun, dirLight;
let mouse = new THREE.Vector2();

let state = {
    pipe : true,
    pipeMerge : false,
    pipeMergeColor : '#2ed5ff',
    // sky
    turbidity: 5,
    rayleigh: 3,
    mieCoefficient: 0.005,
    mieDirectionalG: 0.7,
    elevation: 2,
    azimuth: 0,
    exposure: null,
    exportToObj: exportToObj,
};

const link = document.createElement( 'a' );
link.style.display = 'none';
document.body.appendChild( link );

document.addEventListener('DOMContentLoaded', async () => {
    await init();
    animate();
});

async function init() {

    await initData();
    initStats();
    initRender();
    initScene();
    initLight( scene );
    initCamera();
    initPlane( scene );
    initLut();
    initPipeline();
    initControls();
    initGui();

    window.addEventListener( 'resize', onWindowResize, false );
    document.addEventListener( 'mousemove', onDocumentMouseMove, false );
    document.getElementById("WebGL-output").appendChild( renderer.domElement );
    async function initData() {
        NProgress.start();
        try {
            const [mapData] = await Promise.all([
                jsonLoader('huarun_ranqi.json', './data/Huarun/'),
            ]);
            map = mapData;
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            NProgress.done();
        }
    }
    
    function initStats() {
        stats = new Stats();
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.left = '0px';
        stats.domElement.style.top = '0px';
        document.getElementById("Stats-output").appendChild(stats.domElement);
    }
    function initRender(){
        renderer = new THREE.WebGLRenderer({antialias: true, precision: 'lowp'});
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = false;
        // renderer.autoClear = false;
        renderer.setAnimationLoop( animate );

        gpuPanel = new GPUStatsPanel( renderer.getContext() );
        stats.addPanel( gpuPanel );
        stats.showPanel( 0 );
    }
    function initScene() {
        scene = new THREE.Scene();
        scene.background = new THREE.Color( '#474747' );
    }
    function initCamera() {
        camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1800);
        camera.position.set( 150, 200, 150 );
    }
    function initPipeline() {
        pipePos = map.coords;
        console.log(map.attributes);
        pipeMerge = pipeLineSegments( pipePos, state.pipeMergeColor );
        scene.add( pipeMerge );

        pipe = [];
        for (let ib = 0; ib < map.nSample; ib++) {
            pipe[ib] = new TubePipe(map, ib, lut);
            scene.add(pipe[ib].getMesh());
        }
    }

    function initControls() {
        orbitControls = new OrbitControls(camera, renderer.domElement);
        orbitControls.maxPolarAngle = 0.95 * Math.PI / 2;
        orbitControls.minPolarAngle = 0.10 * Math.PI / 2;
        orbitControls.target.set( 0, 0, 0 );

        orbitControls.enableDamping = true;
        orbitControls.dampingFactor = 0.2;
        orbitControls.enableZoom = true;
        orbitControls.maxDistance = 600;
        orbitControls.minDistance = 10;

        orbitControls.mouseButtons = {
            LEFT: THREE.MOUSE.PAN,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.ROTATE
        };

        orbitControls.update();
        orbitControls.saveState();
    }
    function initGui() {
        gui = new GUI( { width: 300 } );

        let generalOptions = gui.addFolder("General Options");
        generalOptions.add(state, "pipe").name("Pipe-models");
        generalOptions.add(state, "pipeMerge").name("Pipe-lines (w/o depth)");
        generalOptions.addColor(state, "pipeMergeColor").name("Pipe-lines Color").onChange(() => pipeMerge.material.color.set(state.pipeMergeColor));
        generalOptions.open();
        
        let skyOptions = gui.addFolder("Sky Options");
        skyOptions.add( state, 'turbidity', 0.0, 20.0, 0.1 ).onChange( skyChanged );
        skyOptions.add( state, 'rayleigh', 0.0, 4, 0.001 ).onChange( skyChanged );
        skyOptions.add( state, 'mieCoefficient', 0.0, 0.1, 0.001 ).onChange( skyChanged );
        skyOptions.add( state, 'mieDirectionalG', 0.0, 1, 0.001 ).onChange( skyChanged );
        skyOptions.add( state, 'elevation', 0, 90, 0.1 ).onChange( skyChanged );
        skyOptions.add( state, 'azimuth', - 180, 180, 0.1 ).onChange( skyChanged );
        skyOptions.add( state, 'exposure', 0, 1, 0.0001 ).onChange( skyChanged );
        skyOptions.close();

        let exportOptions = gui.addFolder("Export Options");
        exportOptions.add( state, 'exportToObj' ).name( 'Export OBJ' );
    }
    function onWindowResize() {
        let width = window.innerWidth;
        let height = window.innerHeight;

        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize( width, height );
    }

    function onDocumentMouseMove( event ) {
        event.preventDefault();
        mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    }

}
function animate() {
    stats.update();
    orbitControls.update();
    render();

    function render() {
        gpuPanel.startQuery();
        renderer.clear();
        pipeMerge.visible = state.pipeMerge;
        renderer.render( scene, camera );
        gpuPanel.endQuery();
    }
}

function jsonLoader(filename, path) {
    return new Promise((resolve, reject) => {
      let url = path + filename;
      let jsonRequest = new XMLHttpRequest();
      jsonRequest.open("GET", url, true);
  
      jsonRequest.onload = function () {
        if (jsonRequest.status >= 200 && jsonRequest.status < 300) {
          resolve(JSON.parse(jsonRequest.responseText));
        } else {
          reject(new Error(`Failed to load ${url}: ${jsonRequest.statusText}`));
        }
      };
  
      jsonRequest.onerror = function () {
        reject(new Error(`Network error while fetching ${url}`));
      };
  
      jsonRequest.send(null);
    });
  }

function skyChanged() {
    const uniforms = sky.material.uniforms;
    uniforms[ 'turbidity' ].value = state.turbidity;
    uniforms[ 'rayleigh' ].value = state.rayleigh;
    uniforms[ 'mieCoefficient' ].value = state.mieCoefficient;
    uniforms[ 'mieDirectionalG' ].value = state.mieDirectionalG;

    const phi = THREE.MathUtils.degToRad( 90 - state.elevation );
    const theta = THREE.MathUtils.degToRad( state.azimuth );
    sun.setFromSphericalCoords( 1, phi, theta );
    uniforms[ 'sunPosition' ].value.copy( sun );

    dirLight.position.set( sun.x, sun.y, sun.z );
    renderer.toneMappingExposure = state.exposure;
}

function initLut(){
    lut = new Lut( 'custom', 64 );
    lut.setMax( 1 );
    lut.setMin( 0 );
}

function initLight(scene) {
    let light = new THREE.AmbientLight( '#ffffff', .5 );
    dirLight = new THREE.DirectionalLight( '#ffffff', 3 );

    sky = new Sky();
    sky.scale.setScalar( 450000 );
    sun = new THREE.Vector3(0, 100, 0);
    scene.add( sky );
    state.exposure = renderer.toneMappingExposure;
    skyChanged();

    dirLight.position.set( sun.x, sun.y, sun.z );
    scene.add( light );
    scene.add( dirLight );
}

function exportToObj() {
    const exporter = new OBJExporter();
    const result = exporter.parse( scene );
    saveString( result, 'object.obj' );
}

function save( blob, filename ) {
    link.href = URL.createObjectURL( blob );
    link.download = filename;
    link.click();
}

function saveString( text, filename ) {
    save( new Blob( [ text ], { type: 'text/plain' } ), filename );
}