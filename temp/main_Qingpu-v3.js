// -----------------------------------------------------Three.js--------------------------------------------------------
import * as THREE from './modules/three-r175/build/three.module.js';

import Stats              from './modules/three-r175/examples/jsm/libs/stats.module.js';
import {GUI}              from './modules/three-r175/examples/jsm/libs/lil-gui.module.min.js';
import {GPUStatsPanel}    from './modules/three-r175/examples/jsm/utils/GPUStatsPanel.js';
import {OrbitControls}    from './modules/three-r175/examples/jsm/controls/OrbitControls.js';

import {FXAAShader}       from './modules/three-r175/examples/jsm/shaders/FXAAShader.js';
import {RenderPass}       from './modules/three-r175/examples/jsm/postprocessing/RenderPass.js';
import {ShaderPass}       from './modules/three-r175/examples/jsm/postprocessing/ShaderPass.js';
import {OutlinePass}      from './modules/three-r175/examples/jsm/postprocessing/OutlinePass.js';
import {OutputPass}       from './modules/three-r175/examples/jsm/postprocessing/OutputPass.js';
import {EffectComposer}   from './modules/three-r175/examples/jsm/postprocessing/EffectComposer.js';

import { OBJExporter } from './modules/three-r175/examples/jsm/exporters/OBJExporter.js';

import { Sky } from './modules/three-r175/examples/jsm/objects/Sky.js';
import { CSS2DRenderer, CSS2DObject } from './modules/three-r175/examples/jsm/renderers/CSS2DRenderer.js';

// ------------------------------------------------------custom---------------------------------------------------------
import { Lut }                      from './modules/Lut.js';
import { quadTree }                 from './modules/Quadtree.js';
import { Road_LineSegments }        from './modules/road.js';
import { Bound_LineSegments }       from './modules/boundary.js';
import { boundaryMesh }             from './modules/boundary.js';
import { TimeController }           from './modules/TimeController.js';
import { getRenderList }            from './modules/getRenderList_v2.js';

import { BlockBuildingOld }            from './modules/blockBuilding_old.js';
import { BlockBuildingMerge }       from './modules/blockBuildingMerge.js';
import { BlockBuildingWireframe }   from './modules/blockBuildingWireframe.js';

import { initLight }                from './modules/initLight.js';
import { initPlane }                from './modules/initPlane.js';

import { PlaneTiles }               from './modules/planeTiles.js';
import { ChunkManager }             from './modules/ChunkManager.js';

import { updateExtrudedModelsAnimated, updateExtrudedModelsStatic } from './modules/utils.js';
import { createBuildingsFromChunk } from './modules/gpuBuildings.js';
// ---------------------------------------------------------------------------------------------------------------------

/*********************
 * @param parent.app
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

let meta, map, node;
let stats, gpuPanel, orbitControls, gui;
let renderer, scene, camera, raycaster;
let building, building_merge, wf_merge;
let mouse = new THREE.Vector2(), selectedObject;
let treeIteration = 6;

let dcj, dcj_his, eq_his, max_IDR, maxIDRHis; // earthquake & response
let lut;
let road, road_pos, bound, boundMesh, bound_pos;
let composer, outlinePass, effectFXAA;
let sky, sun;
let labelRenderer;

let planeTiles;
let chunkManager;
let knownChunkFiles = [];

async function loadChunkFilesList() {
    try {
        const response = await fetch('./data/Qingpu/chunkFiles-Qingpu-20250114.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        knownChunkFiles = await response.json();
    } catch (error) {
        console.error('Error loading chunk files list:', error);
        // Fallback to empty array if loading fails
        knownChunkFiles = [];
    }
}
loadChunkFilesList();

let lastCameraPosition = new THREE.Vector3();
let lastCameraRotation = new THREE.Euler();

let lastTime = performance.now();
let fps = 0;


let his_list = {
    main_field: 'h_mainshock_nofield.json',
    main_field2: 'h_mainshock_field.json',
    main_field3: 'RH3917_20240713.json',
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
    eq_animation : 'main_field3',
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
        x: 2265.,
        y: -2.9,
        z: 2205.,
    }
};

let times = new TimeController();
let sample_rate = 50,
    max_time_step = 0;

const link = document.createElement( 'a' );
link.style.display = 'none';
document.body.appendChild( link );

// const { createClient } = supabase;
const supabaseUrl = 'https://vkifllvdhmycnuuqqqme.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZraWZsbHZkaG15Y251dXFxcW1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjM1OTkzNzAsImV4cCI6MjAzOTE3NTM3MH0.2R_dU5-hx84QhX4509Y4-on4MmilmW7PNCIzW4KyKrU';
// const _supabase = createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', async () => {
    await init();

    if (vueAppReady) {
        animate();
    } else {
        // Wait for the 'vue-app-ready' event
        window.addEventListener('vue-app-ready', () => {
            animate();
        });
    }
});

async function init() {

    await initData();
    initStats();
    initRender();
    initScene();
    initCamera();
    initPlane( scene, meta );
    initLight( scene );

    chunkManager = new ChunkManager(scene, meta, createBuildingsFromChunk);
    chunkManager.setChunkList(knownChunkFiles);

    initRoad();
    // initModel();
    initPostprocess();
    initLut();
    initControls();
    initGui();
    initTile( 13 );

    window.addEventListener( 'resize', onWindowResize, false );
    document.addEventListener( 'mousemove', onDocumentMouseMove, false );
    document.getElementById("WebGL-output").appendChild( renderer.domElement );
    labelRenderer.domElement.addEventListener( 'dblclick', onDocumentDoubleClick, false );

    async function initData() {
        NProgress.start();
        try {
            const [metaData, dcjData, eqHisData] = await Promise.all([
                fetchJSON('./data/Qingpu/', 'meta-Qingpu-20250114.json'),
                fetchJSON('./data/PuTuo/', 'R3917_20240713.json'),
                fetchJSON('./data/', 'EQ_history.json'),
            ]);

            meta = metaData;
            // console.log(meta);

            // Store the stats data to update the parent window
            const statsData = {
                buildingCount: meta.total_buildings,
                chunkCount: meta.chunk_size,
                xMin: meta.map_bounds.minx,
                xMax: meta.map_bounds.maxx,
                yMin: meta.map_bounds.miny,
                yMax: meta.map_bounds.maxy
            };

            // Function to update the parent's overviewStats
            const updateParentStats = () => {
                if (window.parent && window.parent.overviewStats) {
                    // Update the overviewStats object
                    window.parent.overviewStats.buildingCount = statsData.buildingCount;
                    window.parent.overviewStats.chunkCount = statsData.chunkCount;
                    window.parent.overviewStats.xMin = statsData.xMin;
                    window.parent.overviewStats.xMax = statsData.xMax;
                    window.parent.overviewStats.yMin = statsData.yMin;
                    window.parent.overviewStats.yMax = statsData.yMax;
                    console.log('Updated parent overviewStats successfully');
                } else {
                    console.warn("Parent overviewStats not available yet");
                }
            };

            // Try to update stats immediately if available
            updateParentStats();

            // Also listen for the vue-app-ready event to update stats when Vue is ready
            window.addEventListener('vue-app-ready', () => {
                console.log('Vue app ready event received in iframe, updating stats');
                // Wait a short time to ensure the parent window has set up overviewStats
                setTimeout(updateParentStats, 100);
            });


            dcj = dcjData;
            eq_his = eqHisData.eq_his;
            // road_pos = roadPosData.roads;
            // bound_pos = boundPosData.boundary;
            max_time_step = meta.T; //eq_his.length;
            max_IDR = dcj.dcj_max_top;
            maxIDRHis = 1;

            // Update max_time_step in parent window if available
            if (window.parent && window.parent.app) {
                window.parent.app.max_time_step = max_time_step;
            } else if (window.parent && window.parent.max_time_step !== undefined) {
                window.parent.max_time_step = max_time_step;
            }
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
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('webgl2');
        if (!context) {
            console.error('WebGL 2 is not supported by your browser or device.');
            return;
        }

        renderer = new THREE.WebGLRenderer({
            canvas: canvas, context: context,
            antialias: true, precision: 'lowp'
        });
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

        sky = new Sky();
        sky.scale.setScalar( 450000 );
        sun = new THREE.Vector3();
        scene.add( sky );

        state.skybox.exposure = renderer.toneMappingExposure;
        skyChanged();
    }
    function initCamera() {
        camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 4800);
        camera.near = 10;    // Increase near plane to avoid Z-Fighting
        camera.far = 5000;   // Decrease far plane to avoid Z-Fighting
        camera.position.set( -600, 600, 150 );
        camera.layers.enable( 0 ); // enabled by default
        camera.layers.enable( 1 );
        camera.layers.enable( 2 );
        // camera.layers.enable( 3 ); // Enable layer 3 for BuildingPickingManager meshes

        raycaster = new THREE.Raycaster();
        raycaster.layers.set( 3 );
    }
    function initRoad() {
        // road = Road_LineSegments( road_pos, state.Road_color );
        // scene.add( road );
        // road.onAfterRender = function () { scene.remove(road) }

        // bound = Bound_LineSegments( bound_pos[0], state.Bound_color );
        // scene.add( bound );

        // boundMesh = boundaryMesh( bound_pos[0], state.Bound_color );
        // scene.add( boundMesh );
    }
    function initModel() {
        // scene.add(  new THREE.AxesHelper( 10 ) );
        // initExtrudedModel();
        // initMergedModel( 0 );
        // initWireframe();
    }
    function initLut(){
        lut = new Lut( 'custom', 32 );
        lut.setMax( 1 );
        lut.setMin( 0 );
    }
    function initPostprocess() {
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
        orbitControls.minPolarAngle = 0.01 * Math.PI / 2;
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
        performanceOptions.add(state, "extruded_model_num", 0, meta.total_buildings).step(1.0).name(`ExtrudedModel Number (<${meta.total_buildings})`);
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
        mapTileOptions.add(state.maptile, 'x', 1000, 3000).step(0.1).name("X");
        mapTileOptions.add(state.maptile, 'y', -10, 10).step(0.1).name("Y");
        mapTileOptions.add(state.maptile, 'z', 1000, 3000).step(0.1).name("Z");

        let exportOptions = gui.addFolder("Export Options");
        exportOptions.add( state, 'exportToObj' ).name( 'Export OBJ' );
    }

    function initTile(zoom) {
        planeTiles = new PlaneTiles(zoom, [121.319809,120.86261,31.293817,30.941877], meta);
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

    function onDocumentMouseMove(event) {
        event.preventDefault();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        if (interactiveEnabled) checkIntersection();
    }

    function checkIntersection() {
        raycaster.setFromCamera(mouse, camera);

        // Try with layer 3 only
        let intersects = raycaster.intersectObjects(scene.children, true);
        // console.log('Intersects with layer 3:', intersects);

        if (intersects.length > 0) {
            // 找到第一个拾取网格
            let pickingMesh = null;
            for (let i = 0; i < intersects.length; i++) {
                if (intersects[i].object.userData && intersects[i].object.userData.isPickingMesh) {
                    pickingMesh = intersects[i].object;
                    break;
                }
            }

            // 如果找到拾取网格并且与当前选中对象不同
            if (pickingMesh && selectedObject !== pickingMesh) {
                // 取消之前的选择
                if (selectedObject) {
                    selectedObject.visible = true;
                }

                // 设置新的选择
                selectedObject = pickingMesh;
                outlinePass.selectedObjects = [selectedObject];

                // 创建标签 - 使用 BuildingPickingManager 的标签池
                if (selectedObject.userData && selectedObject.userData.buildingData) {
                    const buildingData = selectedObject.userData.buildingData;
                    const buildingId = buildingData.bid;

                    // 计算标签位置 - 使用对象位置并上移
                    const position = new THREE.Vector3();
                    selectedObject.getWorldPosition(position);

                    // 如果有楼层信息，根据楼层高度调整标签位置
                    if (buildingData.storey) {
                        position.y += buildingData.storey * 0.18; // 上移到建筑顶部
                    } else {
                        position.y += 0.5; // 默认上移
                    }

                    // 创建标签
                    chunkManager.buildingPickingManager.labelPool.create(`建筑 #${buildingId}`, position);
                }
            }
        } else {
            // 没有交叉，清除选择
            if (selectedObject) {
                selectedObject.visible = true;
                selectedObject = null;
                outlinePass.selectedObjects = [];

                // 移除标签
                chunkManager.buildingPickingManager.labelPool.remove();
            }
        }
    }

    // 处理双击事件 - 在sidebar显示建筑详情
    function onDocumentDoubleClick(event) {
        // 只有在有选中对象时才处理
        if (selectedObject && selectedObject.userData && selectedObject.userData.buildingData) {
            setBuildingData();

            // 添加视觉反馈
            if (chunkManager.buildingPickingManager.labelPool.active) {
                const div = chunkManager.buildingPickingManager.labelPool.active.element;
                // 添加闪烁效果
                div.style.backgroundColor = 'rgba(0, 120, 255, 0.8)';
                setTimeout(() => {
                    div.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
                }, 300);
            }
        }
    }

}
function animate() {
    stats.update();
    orbitControls.update();

    const cameraChanged = cameraMovedSignificantly(camera, lastCameraPosition, lastCameraRotation);
    if (animationEnabled || cameraChanged) {
        const now = performance.now();
        if (now - chunkManager.lastUpdateTime > chunkManager.updateInterval) {
            chunkManager.update(camera);
            chunkManager.lastUpdateTime = now;
            lastCameraPosition.copy(camera.position);
            lastCameraRotation.copy(camera.rotation);

            // times.update(sample_rate, animationPaused, animationSpeed);
            times.update(sample_rate, false, animationSpeed);
            let t = Math.ceil(times.current_step % max_time_step);

            for (const chunkKey in chunkManager.chunks) {
                const cInfo = chunkManager.chunks[chunkKey];
                if (cInfo.loaded && cInfo.mesh) {
                    // update chunk animation
                    let mat = cInfo.mesh.material;
                    if (mat && mat.uniforms && mat.uniforms.uTimeStep) {
                        mat.uniforms.uTimeStep.value = t;
                        mat.uniforms.uAnimate.value = animationEnabled;
                        // mat.uniforms.uAmplitude.value = animationAmplitude;
                    }
                }
            }
        }
    }

    render();

    function render() {
        gpuPanel.startQuery();
        updateParentPage();
        updateScene();

        renderer.clear();
        if (interactiveEnabled) {
            composer.render();
        }
        else {
            renderer.render( scene, camera );
        }

        // 始终渲染标签 - 确保标签可见
        labelRenderer.render( scene, camera );

        gpuPanel.endQuery();

        function updateScene() {
            // let fru = computeFrustumFromCamera(camera);
            // let renderList = getRenderList(fru, node, treeIteration);
            // let renderNum = Math.min(state.extruded_model_num, renderList.length);
            // if (state.extruded_model)   updateModels(renderNum, renderList);
            // if (state.wireframe)        scene.add(wf_merge);
            // if (state.road)             scene.add(road);

            planeTiles.setPos( state.maptile.x, state.maptile.y, state.maptile.z);

            if (state.skybox.sky && sky.parent !== scene) {
                scene.add(sky);
            } else if (!state.skybox.sky && sky.parent === scene ) {
                scene.remove(sky);
            }
        }
        function updateModels(renderNum, renderList) {
            if (animationEnabled) {
                // Use animation parameters from parent window if available, otherwise use defaults
                let aniPaused = false;
                let aniVelocity = animationSpeed || 1.0;

                if (window.parent && window.parent.app) {
                    aniPaused = window.parent.app.ani_paused || false;
                    aniVelocity = window.parent.app.slider_vel || animationSpeed || 1.0;
                }

                times.update(sample_rate, aniPaused, aniVelocity);
                let timeStep = Math.ceil(times.current_step);

                // Update time_step in parent window if available
                if (window.parent && window.parent.app) {
                    window.parent.app.time_step = timeStep / sample_rate;
                }

                updateExtrudedModelsAnimated(
                    building, lut, renderNum, renderList, timeStep, maxIDRHis,
                    camera, scene, state.Sight_Distance
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

    camera.position.set(parent.app.slider_x, 60, parent.app.slider_y);
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
    if (!selectedObject || !window.parent || !window.parent.table_attr) {
        return;
    }

    try {
        // 获取建筑数据
        const buildingData = selectedObject.userData.buildingData;
        if (!buildingData) {
            console.error('No building data found in selected object');
            return;
        }

        // 使用模拟数据（实际应用中可以从服务器获取真实数据）
        const mockData = {
            county: 'Sample County',
            town: 'Sample Town',
            circleNum: 1,
            builtYear: 2020,
            floorArea: 100.0,
            buildArea: 80.0
        };

        // 更新结构属性
        const structAttrs = window.parent.table_attr.structure.attributes;
        if (structAttrs) {
            // 基本属性
            if (structAttrs.county) structAttrs.county.value = mockData.county;
            if (structAttrs.town) structAttrs.town.value = mockData.town;
            if (structAttrs.circleNum) structAttrs.circleNum.value = mockData.circleNum;
            if (structAttrs.builtYear) structAttrs.builtYear.value = mockData.builtYear;
            if (structAttrs.floorArea) structAttrs.floorArea.value = mockData.floorArea.toFixed(2);
            if (structAttrs.buildArea) structAttrs.buildArea.value = mockData.buildArea.toFixed(2);

            // 建筑特定属性
            if (structAttrs.bid) structAttrs.bid.value = buildingData.bid;

            // 高度和楼层
            const height = buildingData.storey * 3.6; // 假设每层 3.6 米
            if (structAttrs.height) structAttrs.height.value = height.toFixed(1);
            if (structAttrs.floor) structAttrs.floor.value = buildingData.storey || 1;

            // 坐标
            if (structAttrs.coordinate) {
                let position = new THREE.Vector3();
                selectedObject.getWorldPosition(position);
                structAttrs.coordinate.value = `(${position.x.toFixed(1)}, ${position.z.toFixed(1)})`;
            }

            // 几何信息
            const geo = selectedObject.geometry;
            if (geo) {
                if (structAttrs.boundSp && geo.boundingSphere) {
                    structAttrs.boundSp.value = geo.boundingSphere.radius.toFixed(2);
                }
                if (structAttrs.triangles && geo.attributes && geo.attributes.position) {
                    structAttrs.triangles.value = geo.attributes.position.count / 3;
                }
            }
        }

        // 在控制台显示建筑信息（调试用）
        console.log('Building data displayed in sidebar:', buildingData);

    } catch (error) {
        console.error('Error setting building data:', error);
    }
}

function updateEqTable(){
    let n = Math.round( state.eq_select );

    // Update eq_his in parent window if available
    if (window.parent && window.parent.app) {
        window.parent.app.eq_his = eq_his[n];
    }

    // Update earthquake table attributes if available
    if (window.parent && window.parent.table_attr && window.parent.table_attr.earthquake) {
        const eqAttrs = window.parent.table_attr.earthquake.attributes;
        if (eqAttrs) {
            if (eqAttrs.eid) eqAttrs.eid.value = 'KiNet-EW-'+ n.toString();
            if (eqAttrs.pga) eqAttrs.pga.value = 0.4;
            if (eqAttrs.duration) eqAttrs.duration.value = 120.0;
            if (eqAttrs.cav) eqAttrs.cav.value = '-';
        }
    }
}

function loadResHisData() {
    NProgress.start();
    // let file = "h_mainshock_field.json";
    let file = "RH3917_20240713.json";
    // load data
    jsonLoader(file, './data/PuTuo/').then(data => {
        dcj_his = data;
        max_time_step = dcj_his.length;
        maxIDRHis = dcj_his.dcj_max;

        // Update max_time_step in parent window if available
        const newMaxTimeStep = Math.ceil(dcj_his.length / sample_rate);
        if (window.parent && window.parent.app) {
            window.parent.app.max_time_step = newMaxTimeStep;
        } else if (window.parent && window.parent.max_time_step !== undefined) {
            window.parent.max_time_step = newMaxTimeStep;
        }

        for (let ib = 0; ib < meta.total_buildings; ib++) {
            building[ib].his = dcj_his.dcj_his[ib];
        }
        console.log('Data loaded successfully.');
    }).catch(error => {
        console.error('Error loading data:', error);
    });
    NProgress.done();
}

function initMergedModel( eid ) {
    // building_merge = BlockBuildingMerge( map, dcj, eid, state.IDR_type );
    // scene.add(building_merge);
    // building_merge.layers.enable( 2 );
    // building_merge.frustumCulled = false;
    // building_merge.onAfterRender = function () { scene.remove(building_merge) }
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
    // building = [];
    // for (let ib = 0; ib < meta.total_buildings; ib++) {
    //     let floor_height = 3.0
    //     building[ib] = new BlockBuildingOld(map, ib, floor_height);
    //     // scene.add(building[ib].getMesh(1));
    // }
}
async function update_IDR(){
    NProgress.start();
    try {
        // maximum inter-story drift ratio
        // initMergedModel( state.eq_select );

        let file2 = his_list[state.eq_animation];
        dcj_his = jsonLoader(file2, './data/PuTuo/');
        max_time_step = dcj_his.length;

        // Update max_time_step in parent window if available
        const newMaxTimeStep = Math.ceil(dcj_his.length / sample_rate);
        if (window.parent && window.parent.app) {
            window.parent.app.max_time_step = newMaxTimeStep;
        } else if (window.parent && window.parent.max_time_step !== undefined) {
            window.parent.max_time_step = newMaxTimeStep;
        }

        for (let ib = 0; ib < meta.total_buildings; ib++) {
            building[ib].his = dcj_his.dcj_his[ib]
        }
    } catch (error) {
        console.error('Error loading data:', error);
    } finally {
        NProgress.done();
    }
}

function updateParentPage(){
    // Only update if Vue app is ready
    if (!window.vueAppReady || !window.parent) {
        return;
    }
    try {
        // Update camera position in parent window if available
        if (window.parent.app) {
            window.parent.app.camera_x = camera.position.x.toFixed(1);
            window.parent.app.camera_y = camera.position.z.toFixed(1);
        }

        // Check for camera reset request
        if (window.parent.cameraControls && window.parent.cameraControls.isReset === 1){
            resetCamera();
            window.parent.cameraControls.isReset = 0;
        }

        // Check for time control reset request
        if (window.parent.timeControls && window.parent.timeControls.isReset === 1){
            resetAnimation();
            window.parent.timeControls.isReset = 0;
        }

        // Check for earthquake table update request
        if (window.parent.table_attr &&
            window.parent.table_attr.earthquake &&
            window.parent.table_attr.earthquake.needsUpdate === 1){
            updateEqTable();
            window.parent.table_attr.earthquake.needsUpdate = 0;
        }

        // Check for response history load request
        if (window.parent.table_attr &&
            window.parent.table_attr.response &&
            window.parent.table_attr.response.history &&
            window.parent.table_attr.response.history.needsLoad === 1){
            // loadResHisData();
            window.parent.table_attr.response.history.needsLoad = 0;
        }
    } catch (error) {
        console.warn('Error updating parent page:', error);
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
async function fetchJSON(path, filename) {
    const url = `${path}${filename}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to load ${url}: ${response.statusText}`);
    }
    return response.json();
}

function calculateFPS() {
    const currentTime = performance.now();
    const delta = currentTime - lastTime;
    fps = 1000 / delta;
    lastTime = currentTime;
}

function cameraMovedSignificantly(camera, lastCamPos, lastCamRot, moveThreshold = 2.0, rotThreshold = 0.05) {
    const dist = camera.position.distanceTo(lastCamPos);
    const rotDist = Math.abs(camera.rotation.x - lastCamRot.x)
                + Math.abs(camera.rotation.y - lastCamRot.y)
                + Math.abs(camera.rotation.z - lastCamRot.z);

    return (dist > moveThreshold) || (rotDist > rotThreshold);
}

