// -----------------------------------------------------Three.js--------------------------------------------------------
import * as THREE from './three.js_130/build/three.module.js';

import Stats from './three.js_130/examples/jsm/libs/stats.module.js';
import { GUI } from './three.js_130/examples/jsm/libs/dat.gui.module.js';
import { GPUStatsPanel } from './three.js_130/examples/jsm/utils/GPUStatsPanel.js';
import { MapControls } from './three.js_130/examples/jsm/controls/OrbitControls.js';

import { FXAAShader } from './three.js_130/examples/jsm/shaders/FXAAShader.js';
import { RenderPass } from './three.js_130/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from './three.js_130/examples/jsm/postprocessing/ShaderPass.js';
import { OutlinePass } from './three.js_130/examples/jsm/postprocessing/OutlinePass.js';
import { EffectComposer } from './three.js_130/examples/jsm/postprocessing/EffectComposer.js';
// ------------------------------------------------------custom---------------------------------------------------------
import { Lut } from './scripts/Lut.js';
import { quadTree } from './scripts/Quadtree.js';
import { Road_LineSegments } from './road.js';
import { Bound_LineSegments } from './boundary.js';
import { TimeController } from './scripts/TimeController.js';
import { getRenderList } from './scripts/getRenderList_v2.js';

import { BLOCKBuilding } from './buildinggenerater2_putuo.js';
import { BLOCKBuilding_merge } from './buildinggenerater_merge_3.js';
import { BLOCKBuilding_wireframe } from './buildingedges.js';

import { initLight } from './scripts/initLight.js';
import { initPlane } from './scripts/initPlane.js';
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
let building, obj, floor, building_merge, wf_merge;
let mouse = new THREE.Vector2(), selectedObject, nearestObject;
let treeIteration = 6;

let dcj, dcj_his, eq_his, max_IDR, max_IDR_his; // earthquake & response
let lut, sprite, scene_lut, camera_lut;
let road, road_pos, bound, bound_pos;
let zoom, composer, outlinePass, effectFXAA;

// let his_list = {
//     main_field: 'maxIDR_history_MainShock_field1.json',
//     main_field2: 'maxIDR_history_MainShock_field2.json',
//     main_field3: 'maxIDR_history_MainShock_field3.json',
//     main_field4: 'maxIDR_history_MainShock_field4.json',
// };
let his_list = {
    main_field: 'h_mainshock_nofield.json',
    main_field2: 'h_mainshock_field.json',
    // main_field3: 'h_sequshock_field.json',
    // main_field4: 'maxIDR_history_MainShock_field4.json',
};

let state = {
    animated : false,
    extruded_model : true,
    wireframe : true,
    extruded_model_num : 1000,
    color_animated : false,
    displacement_animated : false,
    Amplitude : 1.0,
    Velocity : 1.0,
    Sight_Distance : 300,
    Update_response : update_IDR,
    eq_select : 0,
    IDR_type : 'maximum',
    eq_animation : 'main_field',
    road : true,
    Road_color : '#292c2f',
    Bound_color : '#e36c11'
};

let times = new TimeController();
let sample_rate = 50,
    displace = 0,
    interpolation = 0,
    max_time_step = 0;

init();
animate();

function init() {

    initData();
    initStats();
    initRender();
    initScene();
    initCamera();
    initPlane( scene );
    initLight( scene );
    initRoad();
    initModel();
    iniPostprocess()
    initLut();
    initControls();
    initGui();

    window.addEventListener( 'resize', onWindowResize, false );
    document.addEventListener( 'mousemove', onDocumentMouseMove, false );
    document.getElementById("WebGL-output").appendChild( renderer.domElement );
    document.getElementById("WebGL-output").addEventListener( "dblclick", setBuildingData );

    function initData(){
        map = jsonLoader('meta.json', './data/PuTuo/');
        dcj = jsonLoader('IDR_500_8219.json', './data/');
        dcj_his = jsonLoader('IDR_history_MainShock_field1.json', './data/PuTuo/');
        // dcj_his.dcj_his = dcj_his.dcj_his.concat(jsonLoader('IDR_history_MainShock_field_b.json', './data/PuTuo/').dcj_his);
        // console.log(dcj_his)
        eq_his = jsonLoader('EQ_history.json', './data/').eq_his;
        max_time_step = dcj_his.length;
        parent.vm.max_time_step = Math.ceil(dcj_his.length / sample_rate);
        max_IDR = dcj.dcj_max_top;
        max_IDR_his = dcj_his.dcj_max;
        road_pos = jsonLoader('road.json', './data/PuTuo/').roads;
        bound_pos = jsonLoader('boundary.json', './data/PuTuo/').boundary;
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

        gpuPanel = new GPUStatsPanel( renderer.getContext() );
        stats.addPanel( gpuPanel );
        stats.showPanel( 0 );
    }
    function initScene() {
        scene = new THREE.Scene();
        scene.background = new THREE.Color( '#474747' );
        scene.fog = new THREE.FogExp2( '#8d8d8d', 0.0006 );

        scene_lut = new THREE.Scene();
    }
    function initCamera() {
        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1800);
        camera.position.set( 20, 600, 20 );
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
    }
    function initModel() {
        scene.add(  new THREE.AxesHelper( 10 ) );
        update_extruded_model();
        update_merged_model( 0 );
        update_wireframe();
        node = quadTree( map, building, treeIteration );
    }
    function initLut(){
        lut = new Lut( 'custom', 16 );
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

        effectFXAA = new ShaderPass( FXAAShader );
        effectFXAA.uniforms[ 'resolution' ].value.set( 1 / window.innerWidth, 1 / window.innerHeight );
        composer.addPass( effectFXAA );
    }
    function initControls() {
        orbitControls = new MapControls(camera, renderer.domElement);
        orbitControls.maxPolarAngle = 0.65 * Math.PI / 2;
        orbitControls.minPolarAngle = 0.1 * Math.PI / 2;
        orbitControls.target.set( 0, 0, 0 );
        //orbitControls.addEventListener( 'change', render ); // 使用animate方法时删除

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
        orbitControls.saveState ();
    }
    function initGui() {
        gui = new GUI( { width: 300 } );

        let folder = gui.addFolder( "General Options" )
        folder.add( state, "extruded_model" );
        folder.__controllers[ 0 ].name( "ExtrudedModel" );
        folder.add( state, "wireframe" );
        folder.__controllers[ 1 ].name( "Wireframe" );
        folder.add( state, "road" );
        folder.__controllers[ 2 ].name( "Road" );
        folder.addColor( state, "Road_color" ).onChange(function (){road.material.color.set(state.Road_color)})
        folder.addColor( state, "Bound_color" ).onChange(function (){bound.material.color.set(state.Bound_color)})
        folder.open();

        let folder3 = gui.addFolder( "Performance Options" );
        folder3.add( state, "extruded_model_num", 0, map.buildings.number ).step(1.0);
        folder3.__controllers[ 0 ].name( `ExtrudedModel Number (<${map.buildings.number})` );
        folder3.add( state, 'Sight_Distance', 100, 1000 ).step(5);
        folder3.open();

        let folder4 = gui.addFolder( "Seismic Response Options" );
        folder4.add( state, "eq_select", 0, 499 ).step(1.0); // .onChange( function () { updateEqTable() } )
        folder4.add( state, 'IDR_type', ['maximum', 'residual'] );
        // folder4.add( state, 'eq_animation', Object.keys( his_list ) ); //.onChange( function () { updateEqTable() } );
        folder4.add( state, 'eq_animation', Object.keys( his_list ) ).onChange( function () { update_IDR() } );
        folder4.add( state, 'Update_response' );
        folder4.open();
    }
    function onWindowResize() {

        let width = window.innerWidth;
        let height = window.innerHeight;

        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        renderer.setSize( width, height );
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
    requestAnimationFrame( animate );
    render();

    function render() {

        zoom = Math.ceil(camera.position.y / 50);
        updateParentPage();

        let fru = computeFrustumFromCamera(camera);
        let renderList = getRenderList(fru, node, treeIteration);
        let renderNum = Math.min(state.extruded_model_num, renderList.length);

        if (state.extruded_model) {
            if (parent.vm.switch_anim) {
                times.update(sample_rate, parent.vm.ani_paused, parent.vm.slider_vel);
                let time_step_int = Math.ceil(times.current_step);
                parent.vm.time_step = time_step_int / sample_rate;

                for (let i = 0; i < renderNum; i++) {

                    let ib = renderList[i];
                    if (zoom < 12 && object_in_sight(building[ib], camera)) {
                        scene.add(building[ib]);
                        building[ib].visible = true;

                        if (time_step_int < building[ib].userData.his.length && building[ib].userData.his.length > 1) {
                            let pN = map.buildings.bounds[ib].length;

                            building[ib].geometry.attributes.position.needsUpdate = true;
                            building[ib].geometry.attributes.color.needsUpdate = true;

                            for (let i = 0; i < floor[ib] + 1; i++) {
                                let inter = i / floor[ib];
                                if (parent.vm.switch_dis) {
                                    displace = building[ib].userData.his[time_step_int] * parent.vm.slider_amp * inter / max_IDR_his / 2;//Math.max(...max_IDR)
                                    for (let n = 0; n < pN; n++) {
                                        building[ib].geometry.attributes.position.array[(i * pN + n) * 3] = map.buildings.bounds[ib][n][0] + displace;
                                    }
                                }
                                if (parent.vm.switch_col) {
                                    let occlusion = (floor[ib] - i) / floor[ib] * 0.2;
                                    interpolation = Math.abs(building[ib].userData.his[time_step_int]) / max_IDR_his * 0.6 + 0.2;//Math.max(...max_IDR)
                                    for (let n = 0; n < pN; n++) {
                                        building[ib].geometry.attributes.color.array[(i * pN + n) * 3] = interpolation * 2.0 - occlusion;
                                        building[ib].geometry.attributes.color.array[(i * pN + n) * 3 + 1] = 1 - interpolation * 2.0 - occlusion;
                                    }
                                }
                            }
                        }
                    }
                }
            } else {
                scene.add(building_merge);
                for (let i = 0; i < renderNum; i++) {
                    let ib = renderList[i];
                    if (zoom < 6 && object_in_sight(building[ib], camera)) scene.add(building[ib]);
                }
            }
        }
        if (state.wireframe) scene.add(wf_merge);
        if (state.road) scene.add(road);

        // console.log(renderer.info);
        gpuPanel.startQuery();

        renderer.clear();
        if (parent.vm.switch_interact) composer.render();
        else {
            renderer.render( scene, camera );
            renderer.render( scene_lut, camera_lut );
        }

        // onAfterRender
        for (let c = 0; c < scene.children.length; c++){
            let child = scene.children[c];
            if ( (child.isMesh === true)&&(child.layers.mask===3) ) {
                scene.remove(child);
                child.visible = false;

                if (state.color_animated && times.current_step > child.userData.his.length){

                    for (let i = 0; i < floor[child.userData.bid]+1; i++) {
                        let tmp = (i / floor[child.userData.bid] - 1) * 0.03;
                        let pN = map.buildings.bounds[child.userData.bid].length;
                        for (let n = 0; n < pN; n++) {
                            child.geometry.attributes.color.array[(i * pN + n) * 3] = 0.18 + tmp;
                            child.geometry.attributes.color.array[(i * pN + n) * 3 + 1] = 0.18 + tmp;
                            child.geometry.attributes.color.array[(i * pN + n) * 3 + 2] = 0.2 + tmp;
                        }
                    }
                    child.geometry.attributes.color.needsUpdate = true;
                }
            }
        }

        gpuPanel.endQuery();
    }
}

function reset_camera() {

    let direction = new THREE.Vector3();
    camera.getWorldDirection(direction);

    camera.position.set(parent.vm.slider_x, 60, parent.vm.slider_y);
    camera.getWorldPosition(orbitControls.target);
    orbitControls.target.addScaledVector(direction, 50);
    orbitControls.update();

}
function reset_animation() {
    times.last_step = 0;
}
function computeFrustumFromCamera(camera) {
    let frustum = new THREE.Frustum();
    frustum.setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
    return frustum;
}
function object_in_sight(object, camera) {
    let x2 = Math.pow(object.geometry.attributes.position.array[0] - camera.position.x, 2);
    let z2 = Math.pow(object.geometry.attributes.position.array[2] - camera.position.z, 2);
    return ( x2 + z2 < Math.pow( state.Sight_Distance / 2, 2 ) )
}

async function setBuildingData() {
    if (selectedObject) {
        let geo = selectedObject.geometry;
        let file = "./request/bid_" + selectedObject.userData.bid.toString() + ".json";
        parent.loadTableData(file);
        parent.table_attr.structure.attributes.bid.value = selectedObject.userData.bid;
        parent.table_attr.structure.attributes.height.value = selectedObject.userData.height;
        parent.table_attr.structure.attributes.floor.value = selectedObject.userData.floor;
        parent.table_attr.structure.attributes.coordinate.value = "(" + geo.boundingSphere.center.x.toFixed(1).toString() + ", " + geo.boundingSphere.center.z.toFixed(1).toString() + ")";
        parent.table_attr.structure.attributes.boundSp.value = geo.boundingSphere.radius.toFixed(2);
        parent.table_attr.structure.attributes.triangles.value = geo.attributes.position.count;
    }
}
function jsonLoader( filename, path ) {
    let url = path + filename;
    let jsonRequest = new XMLHttpRequest();
    jsonRequest.open( "GET", url, false );
    jsonRequest.send( null );
    // console.log( jsonRequest )
    return JSON.parse( jsonRequest.response )
}
function updateEqTable(){
    let n = Math.round( state.eq_select );

    parent.vm.eq_his = eq_his[n];
    parent.table_attr.earthquake.attributes.eid.value = 'KiNet-EW-'+ n.toString();
    parent.table_attr.earthquake.attributes.pga.value = 0.4;
    parent.table_attr.earthquake.attributes.duration.value = 120.0;
    parent.table_attr.earthquake.attributes.cav.value = '-';
}
function update_merged_model( eid ) {
    building_merge = BLOCKBuilding_merge( map, dcj, eid, state.IDR_type );
    scene.add(building_merge);
    building_merge.layers.enable( 2 );
    building_merge.frustumCulled = false;
    building_merge.onAfterRender = function () { scene.remove(building_merge) }
}
function update_wireframe(){
    wf_merge = BLOCKBuilding_wireframe( building_merge );
    scene.add(wf_merge);
    wf_merge.layers.enable( 2 );
    wf_merge.layers.frustumCulled = false;
    wf_merge.onAfterRender = function () {
        scene.remove(wf_merge);
    }
}
function update_extruded_model(){
    floor = [];
    building = [];
    obj = [];

    for (let ib = 0; ib < map.buildings.number; ib++) {

        let floor_height = 3.0
        floor[ib] = Math.max(Math.floor( map.buildings.height[ib] / floor_height ), 1);

        building[ib] = BLOCKBuilding( map, ib, floor_height, floor[ib] );
        building[ib].userData = {
            bid: ib,
            height: map.buildings.height[ib],
            floor: Math.max(Math.floor(map.buildings.height[ib] / 3.0), 1),
            his: dcj_his.dcj_his[ib]
        };

        scene.add(building[ib]);

        building[ib].layers.enable( 1 );
        building[ib].frustumCulled = false;
    }
}
function update_IDR(){
    // maximum inter-story drift ratio
    // let file = rsp_list[state.eq_select];
    // dcj_8219 = jsonLoader(file, './');
    update_merged_model( state.eq_select );

    let file2 = his_list[state.eq_animation];
    dcj_his = jsonLoader(file2, './data/PuTuo/');
    // dcj_his = jsonLoader('IDR_history_MainShock_field_a.json', './data/PuTuo/');
    // dcj_his.dcj_his = dcj_his.dcj_his.concat(jsonLoader('IDR_history_MainShock_field_b.json', './data/PuTuo/').dcj_his);
    max_time_step = dcj_his.length;
    parent.vm.max_time_step = Math.ceil(dcj_his.length / sample_rate);
    for (let ib = 0; ib < map.buildings.number; ib++) {
        building[ib].userData.his = dcj_his.dcj_his[ib]
    }
}
function updateParentPage(){
    parent.vm.camera_x = camera.position.x.toFixed(1);
    parent.vm.camera_y = camera.position.z.toFixed(1);
    if (parent.cameraControls.isReset === 1){
        reset_camera();
        parent.cameraControls.isReset = 0;
    }
    if (parent.timeControls.isReset === 1){
        reset_animation();
        parent.timeControls.isReset = 0;
    }
    if (parent.table_attr.earthquake.needsUpdate === 1){
        updateEqTable();
        parent.table_attr.earthquake.needsUpdate = 0;
    }
}