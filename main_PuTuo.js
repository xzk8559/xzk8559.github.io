// -----------------------------------------------------Three.js--------------------------------------------------------
import * as THREE from './modules/three-r165/build/three.module.js';

import Stats              from './modules/three-r165/examples/jsm/libs/stats.module.js';
import {GUI}              from './modules/three-r165/examples/jsm/libs/lil-gui.module.min.js';
import {GPUStatsPanel}    from './modules/three-r165/examples/jsm/utils/GPUStatsPanel.js';
import {OrbitControls}    from './modules/three-r165/examples/jsm/controls/OrbitControls.js';

import {FXAAShader}       from './modules/three-r165/examples/jsm/shaders/FXAAShader.js';
import {RenderPass}       from './modules/three-r165/examples/jsm/postprocessing/RenderPass.js';
import {ShaderPass}       from './modules/three-r165/examples/jsm/postprocessing/ShaderPass.js';
import {OutlinePass}      from './modules/three-r165/examples/jsm/postprocessing/OutlinePass.js';
import {OutputPass}       from './modules/three-r165/examples/jsm/postprocessing/OutputPass.js';
import {EffectComposer}   from './modules/three-r165/examples/jsm/postprocessing/EffectComposer.js';

import { OBJExporter } from './modules/three-r165/examples/jsm/exporters/OBJExporter.js';

import { Sky } from './modules/three-r165/examples/jsm/objects/Sky.js';
import { CSS2DRenderer, CSS2DObject } from './modules/three-r165/examples/jsm/renderers/CSS2DRenderer.js';
// ------------------------------------------------------custom---------------------------------------------------------
import { Lut }                      from './modules/Lut.js';
import { quadTree }                 from './modules/Quadtree.js';
import { Road_LineSegments }        from './modules/road.js';
import { Bound_LineSegments }       from './modules/boundary.js';
import { boundaryMesh }             from './modules/boundary.js';
import { TimeController }           from './modules/TimeController.js';
import { getRenderList }            from './modules/getRenderList_v2.js';

import { BlockBuilding }            from './modules/blockBuilding.js';
import { BlockBuildingMerge }       from './modules/blockBuildingMerge.js';
import { BlockBuildingWireframe }   from './modules/blockBuildingWireframe.js';

import { initLight }                from './modules/initLight.js';
import { initPlane }                from './modules/initPlane.js';

import { PlaneTiles }               from './modules/planeTiles.js';

import { updateExtrudedModelsAnimated, updateExtrudedModelsStatic } from './modules/utils.js';
// ---------------------------------------------------------------------------------------------------------------------

/*********************
 * @param parent.vm
 * @param {Object} parent.cameraControls
 * @param {Object} parent.timeControls
 * @param {Object} parent.table_attr
 * @param {Function} parent.loadTableData
 *
 * @param {Object} map.buildings
 * @param {number} map.buildings.number
 * @param {Array} map.buildings.bounds
 *
 * @param {Array} dcj.dcj_max
 * @param {Array} dcj_his.dcj_his
 ********************/

let map, node;
let stats, gpuPanel, orbitControls, gui;
let renderer, scene, camera, raycaster;
let building, building_merge, wf_merge;
let mouse = new THREE.Vector2(), selectedObject, nearestObject;
let treeIteration = 6;

let dcj, dcj_his, eq_his, max_IDR, maxIDRHis; // earthquake & response
let lut, sprite, scene_lut, camera_lut;
let road, road_pos, bound, boundMesh, bound_pos;
let composer, outlinePass, effectFXAA;
let sky, sun;
let labels, labelRenderer;

let planeTiles;

let lastCameraPosition = new THREE.Vector3();
let lastCameraRotation = new THREE.Euler();

let skipRenderNextFrame = false;
let lastTime = performance.now();
let fps = 0;


let his_list = {
    main_field: 'h_mainshock_nofield.json',
    main_field2: 'h_mainshock_field.json',
};

let state = {
    animated : false,
    extruded_model : true,
    wireframe : false,
    extruded_model_num : 18000,
    color_animated : false,
    displacement_animated : false,
    Amplitude : 1.0,
    Velocity : 1.0,
    Sight_Distance : 300,
    Update_response : update_IDR,
    eq_select : 0,
    IDR_type : 'maximum',
    eq_animation : 'main_field2',
    road : true,
    Road_color : '#121212', //'#292c2f',
    Bound_color : '#ababab', // orange:'#e36c11',
    exportToObj: exportToObj,
    skybox: {
        sky: !isMobile(),
        turbidity: 5,
        rayleigh: 3,
        mieCoefficient: 0.005,
        mieDirectionalG: 0.7,
        elevation: 2,
        azimuth: 0,
        exposure: null,
    },
    maptile: {
        x: 309.2,
        y: -1.5,
        z: 1058.0,
    }
};

let times = new TimeController();
let sample_rate = 50,
    max_time_step = 0;

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
    initCamera();
    initPlane( scene );
    initLight( scene );
    initRoad();
    initModel();
    initLabel();
    iniPostprocess()
    initLut();
    initControls();
    initGui();
    initTile( 15 );

    
    window.addEventListener( 'resize', onWindowResize, false );
    document.addEventListener( 'mousemove', onDocumentMouseMove, false );
    document.getElementById("WebGL-output").appendChild( renderer.domElement );
    document.getElementById("Label-output").addEventListener( "dblclick", setBuildingData );
    async function initData() {
        NProgress.start();
        try {
            const [mapData, dcjData, eqHisData, roadPosData, boundPosData] = await Promise.all([
                jsonLoader('meta_invX.json', './data/PuTuo/'),
                jsonLoader('IDR_500_8219.json', './data/'),
                jsonLoader('EQ_history.json', './data/'),
                jsonLoader('road_invX.json', './data/PuTuo/'),
                jsonLoader('boundary_invX.json', './data/PuTuo/')
            ]);
    
            map = mapData;
            dcj = dcjData;
            eq_his = eqHisData.eq_his;
            road_pos = roadPosData.roads;
            bound_pos = boundPosData.boundary;
            max_time_step = eq_his.length;
            max_IDR = dcj.dcj_max_top;
            maxIDRHis = 1;
            parent.vm.max_time_step = Math.ceil(eq_his.length / sample_rate);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            NProgress.done();
        }
    }
    
    function initStats() {
        stats = new Stats();
        // Align top-left
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
        renderer.autoClear = false;
        renderer.setAnimationLoop( animate );
        renderer.localClippingEnabled = true;
        
        labelRenderer = new CSS2DRenderer();
        labelRenderer.setSize( window.innerWidth, window.innerHeight );
        labelRenderer.domElement.id = 'Label-output';
        labelRenderer.domElement.style.position = 'absolute';
        labelRenderer.domElement.style.top = '0px';
        document.body.appendChild( labelRenderer.domElement );

        gpuPanel = new GPUStatsPanel( renderer.getContext() );
        stats.addPanel( gpuPanel );
        stats.showPanel( 0 );
    }
    function initScene() {
        scene = new THREE.Scene();
        scene.background = new THREE.Color( '#474747' );
        // scene.fog = new THREE.FogExp2( '#8d8d8d', 0.0006 );
        scene_lut = new THREE.Scene();

        sky = new Sky();
        sky.scale.setScalar( 450000 );
        sun = new THREE.Vector3();
        scene.add( sky );

        state.skybox.exposure = renderer.toneMappingExposure;
        skyChanged();
    }
    function initCamera() {
        camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1800);
        camera.position.set( -600, 600, 150 );
        camera.layers.enable( 0 ); // enabled by default
        camera.layers.enable( 1 );
        camera.layers.enable( 2 );

        raycaster = new THREE.Raycaster();
        raycaster.layers.set( 1 );

        // Lut
        camera_lut = new THREE.OrthographicCamera( - 1, 1, 1, - 1, 1, 2 );
        // camera_lut.position.set( -0.8, 0.2, 1 );
    }
    function initRoad() {
        road = Road_LineSegments( road_pos, state.Road_color );
        scene.add( road );
        road.onAfterRender = function () { scene.remove(road) }

        bound = Bound_LineSegments( bound_pos[0], state.Bound_color );
        scene.add( bound );

        // boundMesh = boundaryMesh( bound_pos[0], state.Bound_color );
        // scene.add( boundMesh );
    }
    function initModel() {
        // scene.add(  new THREE.AxesHelper( 10 ) );
        initExtrudedModel();
        initMergedModel( 0 );
        initWireframe();
        // console.log(map);
        node = quadTree( map, building, treeIteration );
    }
    function initLut(){
        lut = new Lut( 'custom', 32 );
        sprite = new THREE.Sprite( new THREE.SpriteMaterial( {
            map: new THREE.CanvasTexture( lut.createCanvas() )
        } ) );
        sprite.scale.set( .035, .25, .05 );
        sprite.position.set( .95, -.8, -1 );
        scene_lut.add( sprite );
        lut.setMax( 1 );
        lut.setMin( 0 );
    }
    function iniPostprocess() {
        composer = new EffectComposer( renderer );
        let renderPass = new RenderPass( scene, camera );
        composer.addPass( renderPass );

        outlinePass = new OutlinePass( new THREE.Vector2( window.innerWidth, window.innerHeight ), scene, camera );
        outlinePass.edgeStrength = 4;
        outlinePass.edgeGlow = 0;
        outlinePass.edgeThickness = 1;
        outlinePass.pulsePeriod = 0;
        outlinePass.visibleEdgeColor.set( '#ffffff' );
        outlinePass.hiddenEdgeColor.set( '#190a05' );
        composer.addPass( outlinePass );

        let outputPass = new OutputPass();
        composer.addPass( outputPass );

        effectFXAA = new ShaderPass( FXAAShader );
        effectFXAA.uniforms[ 'resolution' ].value.set( 1 / window.innerWidth, 1 / window.innerHeight );
        composer.addPass( effectFXAA );
    }
    function initControls() {
        orbitControls = new OrbitControls(camera, labelRenderer.domElement);
        orbitControls.maxPolarAngle = 0.95 * Math.PI / 2;
        orbitControls.minPolarAngle = 0.10 * Math.PI / 2;
        orbitControls.target.set( -600, 0, 300 );

        orbitControls.enableDamping = false;
        orbitControls.dampingFactor = 0.3;
        orbitControls.enableZoom = true;
        orbitControls.maxDistance = 1000;
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
        generalOptions.add(state, "extruded_model").name("ExtrudedModel");
        generalOptions.add(state, "wireframe").name("Wireframe");
        generalOptions.add(state, "road").name("Road");
        generalOptions.addColor(state, "Road_color").name("Road Color").onChange(() => road.material.color.set(state.Road_color));
        generalOptions.addColor(state, "Bound_color").name("Bound Color").onChange(() => bound.material.color.set(state.Bound_color));
        generalOptions.open();

        let performanceOptions = gui.addFolder("Performance Options");
        performanceOptions.add(state, "extruded_model_num", 0, map.buildings.number).step(1.0).name(`ExtrudedModel Number (<${map.buildings.number})`);
        performanceOptions.add(state, 'Sight_Distance', 100, 1000).step(5).name("Sight Distance");
        performanceOptions.open();

        let seismicOptions = gui.addFolder("Seismic Response Options");
        seismicOptions.add(state, "eq_select", 0, 499).step(1.0).name("Select Earthquake");
        seismicOptions.add(state, 'IDR_type', ['maximum', 'residual']).name("IDR Type");
        seismicOptions.add(state, 'eq_animation', Object.keys(his_list)).name("EQ Animation").onChange(() => update_IDR());
        seismicOptions.add(state, 'Update_response').name("Update Response");
        seismicOptions.open();
        
        let skyOptions = gui.addFolder("Sky Options");
        skyOptions.add( state.skybox, "sky").name("Sky Box");
        skyOptions.add( state.skybox, 'turbidity', 0.0, 20.0, 0.1 ).onChange( skyChanged );
        skyOptions.add( state.skybox, 'rayleigh', 0.0, 4, 0.001 ).onChange( skyChanged );
        skyOptions.add( state.skybox, 'mieCoefficient', 0.0, 0.1, 0.001 ).onChange( skyChanged );
        skyOptions.add( state.skybox, 'mieDirectionalG', 0.0, 1, 0.001 ).onChange( skyChanged );
        skyOptions.add( state.skybox, 'elevation', 0, 90, 0.1 ).onChange( skyChanged );
        skyOptions.add( state.skybox, 'azimuth', - 180, 180, 0.1 ).onChange( skyChanged );
        skyOptions.add( state.skybox, 'exposure', 0, 1, 0.0001 ).onChange( skyChanged );
        skyOptions.close();

        let mapTileOptions = gui.addFolder("Map Tile Options");
        mapTileOptions.add(state.maptile, 'x', -280, 350).step(0.1).name("X");
        mapTileOptions.add(state.maptile, 'y', -1, 1).step(0.1).name("Y");
        mapTileOptions.add(state.maptile, 'z', 1000, 1100).step(0.1).name("Z");

        let exportOptions = gui.addFolder("Export Options");
        exportOptions.add( state, 'exportToObj' ).name( 'Export OBJ' );
    }

    function initTile(zoom) {
        planeTiles = new PlaneTiles(zoom);
        planeTiles.meshes.forEach( tile => {
            scene.add( tile );
        });
    }
    function onWindowResize() {
        let width = window.innerWidth;
        let height = window.innerHeight;

        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize( width, height );
        labelRenderer.setSize( width, height );
        composer.setSize( window.innerWidth, window.innerHeight );
        effectFXAA.uniforms[ 'resolution' ].value.set( 1 / window.innerWidth, 1 / window.innerHeight );
    }

    function onDocumentMouseMove( event ) {
        event.preventDefault();
        mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
        if (parent.vm.switch_interact) checkIntersection();
    }

    function getNearestObject( intersects ) {
        for (let i = 0; i < intersects.length; i++){
            let n = intersects[i].object
            if ( n.layers.mask===3 ) return n;
        }
        return null
    }

    function checkIntersection() {
        raycaster.setFromCamera( mouse, camera );
        let intersects = raycaster.intersectObjects( scene.children );
        if ( intersects.length > 0 ) {
            nearestObject = getNearestObject(intersects);

            if ( (selectedObject !== nearestObject) && (nearestObject.type !== 'LineSegments') ) {
                if ( selectedObject ) {
                    selectedObject.visible = false;
                }
                selectedObject = nearestObject;
                outlinePass.selectedObjects = [selectedObject];

                selectedObject.visible = true;
                selectedObject.add( labels[selectedObject.userData.parent.ib] );
            }
        } else {
            if ( selectedObject ) {
                selectedObject.visible = false;
            }
            selectedObject = null;
            outlinePass.selectedObjects = [];
        }
    }

}
function animate() {
    stats.update();
    orbitControls.update();
    
    render();
    
    calculateFPS()
    if (fps < 15) state.Sight_Distance = fps * 20;
    if (parent.vm.switch_anim || hasCameraChanged(camera)) {
        skipRenderNextFrame = false;
    }

    function render() {
        gpuPanel.startQuery();
        updateParentPage();
        updateScene();

        if (!skipRenderNextFrame) {
            renderer.clear();
            if (parent.vm.switch_interact) {
                composer.render();
                renderer.render( scene_lut, camera_lut );
            }
            else {
                renderer.render( scene, camera );
                renderer.render( scene_lut, camera_lut );
                // console.log(renderer.info);
            }
            onAfterRender();
        }
        labelRenderer.render( scene, camera );

        skipRenderNextFrame = false;
        gpuPanel.endQuery();

        function onAfterRender(){
            for (let c = 0; c < scene.children.length; c++){
                let child = scene.children[c];
                if ( (child.isMesh === true)&&(child.layers.mask===3) ) {
                    scene.remove(child);
                    child.visible = false;
                    child.remove(labels[child.userData.parent.ib]);
    
                    if (state.color_animated && times.current_step > child.userData.parent.his.length){
                        if (child.userData.parent.level == 1) {
                            for (let i = 0; i < child.userData.parent.floor+1; i++) {
                                let tmp = (i / child.userData.parent.floor - 1) * 0.03;
                                let pointCount = map.buildings.bounds[child.userData.parent.ib].length;
                                for (let n = 0; n < pointCount; n++) {
                                    child.geometry.attributes.color.array[(i * pointCount + n) * 3] = 0.18 + tmp;
                                    child.geometry.attributes.color.array[(i * pointCount + n) * 3 + 1] = 0.18 + tmp;
                                    child.geometry.attributes.color.array[(i * pointCount + n) * 3 + 2] = 0.2 + tmp;
                                }
                            }
                        } else {
                            for (let n = 0; n < pointCount; n++) {
                                child.geometry.attributes.color.array[n * 3] = 0.18;
                                child.geometry.attributes.color.array[n * 3 + 1] = 0.18;
                                child.geometry.attributes.color.array[n * 3 + 2] = 0.2;
                            }
                        }
                        
                        child.geometry.attributes.color.needsUpdate = true;
                    }
                }
            }
        }
        function updateScene() {
            let fru = computeFrustumFromCamera(camera);
            let renderList = getRenderList(fru, node, treeIteration);
            let renderNum = Math.min(state.extruded_model_num, renderList.length);
            if (state.extruded_model)   updateModels(renderNum, renderList);
            if (state.wireframe)        scene.add(wf_merge);
            if (state.road)             scene.add(road);

            planeTiles.setPos( state.maptile.x, state.maptile.y, state.maptile.z);

            if (state.skybox.sky && sky.parent !== scene) {
                scene.add(sky);
            } else if (!state.skybox.sky && sky.parent === scene ) {
                scene.remove(sky);
            }
        }
        function updateModels(renderNum, renderList) {
            if (parent.vm.switch_anim) {
                times.update(sample_rate, parent.vm.ani_paused, parent.vm.slider_vel);
                let timeStep = Math.ceil(times.current_step);
                parent.vm.time_step = timeStep / sample_rate;
                
                updateExtrudedModelsAnimated(
                    building, lut, renderNum, renderList, timeStep, maxIDRHis, parent.vm, camera, scene, state.Sight_Distance
                )
            } else {
                updateExtrudedModelsStatic(
                    building, building_merge, renderNum, renderList, camera, scene, state.Sight_Distance
                )
            }
        }
    }
}

function resetCamera() {
    let direction = new THREE.Vector3();
    camera.getWorldDirection(direction);

    camera.position.set(parent.vm.slider_x, 60, parent.vm.slider_y);
    camera.getWorldPosition(orbitControls.target);
    orbitControls.target.addScaledVector(direction, 50);
    orbitControls.update();

}
function resetAnimation() {
    times.last_step = 0;
}
function computeFrustumFromCamera(camera) {
    let frustum = new THREE.Frustum();
    frustum.setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
    return frustum;
}

async function setBuildingData() {
    if (selectedObject) {
        let geo = selectedObject.geometry;
        let file = "./request/bid_" + selectedObject.userData.parent.ib.toString() + ".json";
        parent.loadTableData(file);
        parent.table_attr.structure.attributes.bid.value = selectedObject.userData.parent.ib;
        parent.table_attr.structure.attributes.height.value = selectedObject.userData.parent.height;
        parent.table_attr.structure.attributes.floor.value = selectedObject.userData.parent.floor;
        parent.table_attr.structure.attributes.coordinate.value = "(" + geo.boundingSphere.center.x.toFixed(1).toString() + ", " + geo.boundingSphere.center.z.toFixed(1).toString() + ")";
        parent.table_attr.structure.attributes.boundSp.value = geo.boundingSphere.radius.toFixed(2);
        parent.table_attr.structure.attributes.triangles.value = geo.attributes.position.count;
    }
}

function updateEqTable(){
    let n = Math.round( state.eq_select );
    parent.vm.eq_his = eq_his[n];
    parent.table_attr.earthquake.attributes.eid.value = 'KiNet-EW-'+ n.toString();
    parent.table_attr.earthquake.attributes.pga.value = 0.4;
    parent.table_attr.earthquake.attributes.duration.value = 120.0;
    parent.table_attr.earthquake.attributes.cav.value = '-';
}

function loadResHisData() {
    NProgress.start();
    let file = "h_mainshock_field.json";
    // load data
    jsonLoader(file, './data/PuTuo/').then(data => {
        dcj_his = data;
        max_time_step = dcj_his.length;
        maxIDRHis = dcj_his.dcj_max;
        parent.vm.max_time_step = Math.ceil(dcj_his.length / sample_rate);
        for (let ib = 0; ib < map.buildings.number; ib++) {
            building[ib].his = dcj_his.dcj_his[ib];
        }
        console.log('Data loaded successfully.');
    }).catch(error => {
        console.error('Error loading data:', error);
    });
    NProgress.done();
}

function initMergedModel( eid ) {
    building_merge = BlockBuildingMerge( map, dcj, eid, state.IDR_type );
    scene.add(building_merge);
    building_merge.layers.enable( 2 );
    building_merge.frustumCulled = false;
    building_merge.onAfterRender = function () { scene.remove(building_merge) }
}
function initWireframe(){
    wf_merge = BlockBuildingWireframe( building_merge );
    scene.add(wf_merge);
    wf_merge.layers.enable( 2 );
    wf_merge.layers.frustumCulled = false;
    wf_merge.onAfterRender = function () {
        scene.remove(wf_merge);
    }
}
function initExtrudedModel(){
    building = [];
    for (let ib = 0; ib < map.buildings.number; ib++) {
        let floor_height = 3.0
        building[ib] = new BlockBuilding(map, ib, floor_height);
        // scene.add(building[ib].getMesh(1));
    }
}
async function update_IDR(){
    NProgress.start();
    try {
        // maximum inter-story drift ratio
        initMergedModel( state.eq_select );

        let file2 = his_list[state.eq_animation];
        dcj_his = jsonLoader(file2, './data/PuTuo/');
        max_time_step = dcj_his.length;
        parent.vm.max_time_step = Math.ceil(dcj_his.length / sample_rate);
        for (let ib = 0; ib < map.buildings.number; ib++) {
            building[ib].his = dcj_his.dcj_his[ib]
        }
    } catch (error) {
        console.error('Error loading data:', error);
    } finally {
        NProgress.done();
    }
}

function updateParentPage(){
    parent.vm.camera_x = camera.position.x.toFixed(1);
    parent.vm.camera_y = camera.position.z.toFixed(1);
    if (parent.cameraControls.isReset === 1){
        resetCamera();
        parent.cameraControls.isReset = 0;
    }
    if (parent.timeControls.isReset === 1){
        resetAnimation();
        parent.timeControls.isReset = 0;
    }
    if (parent.table_attr.earthquake.needsUpdate === 1){
        updateEqTable();
        parent.table_attr.earthquake.needsUpdate = 0;
    }
    if (parent.table_attr.response.history.needsLoad === 1){
        loadResHisData();
        parent.table_attr.response.history.needsLoad = 0;
    }
}

function skyChanged() {
    const uniforms = sky.material.uniforms;
    uniforms[ 'turbidity' ].value = state.skybox.turbidity;
    uniforms[ 'rayleigh' ].value = state.skybox.rayleigh;
    uniforms[ 'mieCoefficient' ].value = state.skybox.mieCoefficient;
    uniforms[ 'mieDirectionalG' ].value = state.skybox.mieDirectionalG;

    const phi = THREE.MathUtils.degToRad( 90 - state.skybox.elevation );
    const theta = THREE.MathUtils.degToRad( state.skybox.azimuth );

    sun.setFromSphericalCoords( 1, phi, theta );

    uniforms[ 'sunPosition' ].value.copy( sun );

    renderer.toneMappingExposure = state.skybox.exposure;
}

function initLabel() {
    labels = [];
    for (let ib = 0; ib < map.buildings.number; ib++) {
        const div = document.createElement('div');
        div.textContent = 'Building' + ib.toString();
        div.style.backgroundColor = 'transparent';
        div.style.textShadow = '0px 0px 6px black';
        div.style.fontSize = '16px';

        labels[ib] = new CSS2DObject( div );
        const pos = building[ib].getMesh(1).geometry.boundingSphere.center;
        labels[ib].position.set( pos.x, building[ib].floor * 0.3, pos.z );
        labels[ib].layers.set( 0 );
        // labels[ib].center.set( 0.5, 0.5 );
    }
}

export function exportToObj() {
    const exporter = new OBJExporter();
    scene.add( building_merge )
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

function isMobile() {
    const toMatch = [
        /Android/i,
        /webOS/i,
        /iPhone/i,
        /iPad/i,
        /iPod/i,
        /BlackBerry/i,
        /Windows Phone/i
    ];

    return toMatch.some( (toMatchItem) => {
        return navigator.userAgent.match(toMatchItem);
    });
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

function calculateFPS() {
    const currentTime = performance.now();
    const delta = currentTime - lastTime;
    fps = 1000 / delta;
    lastTime = currentTime;
}

function hasCameraChanged(camera) {
    // Check if the camera position has changed
    if (!lastCameraPosition.equals(camera.position)) {
        lastCameraPosition.copy(camera.position);
        return true;
    }

    // Check if the camera rotation has changed
    if (!lastCameraRotation.equals(camera.rotation)) {
        lastCameraRotation.copy(camera.rotation);
        return true;
    }

    return false;
}