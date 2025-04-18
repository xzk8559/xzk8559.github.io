// -----------------------------------------------------Three.js--------------------------------------------------------
import * as THREE from './modules/three-r175/build/three.module.js';

import Stats              from './modules/three-r175/examples/jsm/libs/stats.module.js';
import {GPUStatsPanel}    from './modules/three-r175/examples/jsm/utils/GPUStatsPanel.js';
import {OrbitControls}    from './modules/three-r175/examples/jsm/controls/OrbitControls.js';

import { Sky } from './modules/three-r175/examples/jsm/objects/Sky.js';
import { CSS2DRenderer } from './modules/three-r175/examples/jsm/renderers/CSS2DRenderer.js';

// ------------------------------------------------------custom---------------------------------------------------------
import { Lut }                      from './modules/Lut.js';
import { TimeController }           from './modules/TimeController.js';
import { initLight }                from './modules/initLight.js';
import { initPlane }                from './modules/initPlane.js';

import { PlaneTiles }               from './modules/planeTiles.js';
import { ChunkManager }             from './modules/ChunkManager.js';

import { createBuildingsFromChunk } from './modules/gpuBuildings.js';
import { calculateDisplacement, findChunkMesh } from './modules/displacementUtils.js';
// ---------------------------------------------------------------------------------------------------------------------

let meta;
let stats, gpuPanel, orbitControls;
let renderer, scene, camera, raycaster;
let mouse = new THREE.Vector2(), selectedObject;
let statsData;
let eq_his;
let lut;
let sky, sun;
let labelRenderer;
let cameraChanged = true;

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

let state = {
    // animated : false,
    // extruded_model : true,
    // wireframe : false,
    // extruded_model_num : 18000,
    // color_animated : false,
    // displacement_animated : false,
    // Amplitude : 1.0,
    // Velocity : 1.0,
    // Sight_Distance : 300,
    // Update_response : update_IDR,
    // eq_select : 0,
    // IDR_type : 'maximum',
    // eq_animation : 'main_field3',
    // road : true,
    // Road_color : '#121212', //'#292c2f',
    // Bound_color : '#ababab', // orange:'#e36c11',
    // exportToObj: exportToObj,
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
    cur_time_step = 0,
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

    initLut();
    initControls();
    initTile( 13 );

    window.addEventListener( 'resize', onWindowResize, false );
    document.addEventListener( 'mousemove', onDocumentMouseMove, false );
    document.getElementById("WebGL-output").appendChild( renderer.domElement );
    labelRenderer.domElement.addEventListener( 'click', onLabelClick, false );

    async function initData() {
        NProgress.start();
        try {
            const [metaData, eqHisData] = await Promise.all([
                fetchJSON('./data/Qingpu/', 'meta-Qingpu-20250114.json'),
                fetchJSON('./data/', 'EQ_history.json'),
            ]);

            meta = metaData;
            // console.log(meta);

            // Store the stats data to update the parent window
            statsData = {
                buildingCount: meta.total_buildings,
                chunkSize: meta.chunk_size,
                xMin: meta.map_bounds.minx,
                xMax: meta.map_bounds.maxx,
                yMin: meta.map_bounds.miny,
                yMax: meta.map_bounds.maxy
            };

            eq_his = eqHisData.eq_his;
            max_time_step = meta.T;
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
    function initLut(){
        lut = new Lut( 'custom', 32 );
        lut.setMax( 1 );
        lut.setMin( 0 );
    }
    function initControls() {
        orbitControls = new OrbitControls(camera, labelRenderer.domElement);
        orbitControls.maxPolarAngle = 0.65 * Math.PI / 2;
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

        // Enable keyboard controls for arrow keys
        orbitControls.listenToKeyEvents(window);
        orbitControls.keyPanSpeed = 10;

        orbitControls.update();
        orbitControls.saveState();
    }
    // function initGui() {
    //     gui = new GUI( { width: 300 } );

    //     let generalOptions = gui.addFolder("General Options");
    //     generalOptions.add(state, "extruded_model").name("ExtrudedModel");
    //     generalOptions.add(state, "wireframe").name("Wireframe");
    //     generalOptions.add(state, "road").name("Road");
    //     generalOptions.addColor(state, "Road_color").name("Road Color").onChange(() => road.material.color.set(state.Road_color));
    //     generalOptions.addColor(state, "Bound_color").name("Bound Color").onChange(() => bound.material.color.set(state.Bound_color));
    //     generalOptions.open();

    //     let performanceOptions = gui.addFolder("Performance Options");
    //     performanceOptions.add(state, "extruded_model_num", 0, meta.total_buildings).step(1.0).name(`ExtrudedModel Number (<${meta.total_buildings})`);
    //     performanceOptions.add(state, 'Sight_Distance', 100, 1000).step(5).name("Sight Distance");
    //     performanceOptions.open();

    //     let seismicOptions = gui.addFolder("Seismic Response Options");
    //     seismicOptions.add(state, "eq_select", 0, 499).step(1.0).name("Select Earthquake");
    //     seismicOptions.add(state, 'IDR_type', ['maximum', 'residual']).name("IDR Type");
    //     seismicOptions.add(state, 'eq_animation', Object.keys(his_list)).name("EQ Animation").onChange(() => update_IDR());
    //     seismicOptions.add(state, 'Update_response').name("Update Response");
    //     seismicOptions.open();

    //     let skyOptions = gui.addFolder("Sky Options");
    //     skyOptions.add( state.skybox, "sky").name("Sky Box");
    //     skyOptions.add( state.skybox, 'turbidity', 0.0, 20.0, 0.1 ).onChange( skyChanged );
    //     skyOptions.add( state.skybox, 'rayleigh', 0.0, 4, 0.001 ).onChange( skyChanged );
    //     skyOptions.add( state.skybox, 'mieCoefficient', 0.0, 0.1, 0.001 ).onChange( skyChanged );
    //     skyOptions.add( state.skybox, 'mieDirectionalG', 0.0, 1, 0.001 ).onChange( skyChanged );
    //     skyOptions.add( state.skybox, 'elevation', 0, 90, 0.1 ).onChange( skyChanged );
    //     skyOptions.add( state.skybox, 'azimuth', - 180, 180, 0.1 ).onChange( skyChanged );
    //     skyOptions.add( state.skybox, 'exposure', 0, 1, 0.0001 ).onChange( skyChanged );
    //     skyOptions.close();

    //     let mapTileOptions = gui.addFolder("Map Tile Options");
    //     mapTileOptions.add(state.maptile, 'x', 1000, 3000).step(0.1).name("X");
    //     mapTileOptions.add(state.maptile, 'y', -10, 10).step(0.1).name("Y");
    //     mapTileOptions.add(state.maptile, 'z', 1000, 3000).step(0.1).name("Z");

    //     let exportOptions = gui.addFolder("Export Options");
    //     exportOptions.add( state, 'exportToObj' ).name( 'Export OBJ' );
    // }

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
    }

    function onDocumentMouseMove(event) {
        event.preventDefault();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        if (window.interactiveEnabled) {
            checkIntersection();
        } else if (selectedObject) {
            // 如果交互模式被禁用但仍有选中对象，清除选择
            selectedObject = null;
            if (chunkManager && chunkManager.buildingPickingManager) {
                chunkManager.buildingPickingManager.labelPool.remove();
            }
        }
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
            // console.log('Intersects with :', pickingMesh);

            // 如果找到拾取网格并且与当前选中对象不同
            if (pickingMesh && selectedObject !== pickingMesh) {
                // 取消之前的选择
                if (selectedObject) {
                    selectedObject.visible = true;
                }

                // 设置新的选择
                selectedObject = pickingMesh;

                // 创建标签 - 使用 BuildingPickingManager 的标签池
                if (selectedObject.userData && selectedObject.userData.buildingData) {
                    const buildingData = selectedObject.userData.buildingData;
                    const buildingId = buildingData.bid;
                    const chunkKey = selectedObject.userData.chunkKey;
                    const floorIndexOffset = selectedObject.userData.floorIndexOffset;

                    // 计算标签位置 - 使用对象位置并上移
                    const position = new THREE.Vector3();
                    selectedObject.getWorldPosition(position);

                    // 计算与相机的距离
                    const distanceToCamera = camera.position.distanceTo(position);

                    // 如果距离过远，不显示标签
                    if (distanceToCamera > 500) {
                        chunkManager.buildingPickingManager.labelPool.remove();
                        return;
                    }

                    if (buildingData.storey) {
                        position.y += buildingData.storey * 0.18; // 上移到建筑顶部
                    } else {
                        position.y += 0.5; // 默认上移
                    }

                    // 创建基本标签
                    let labelText = `建筑 #${buildingId}`;

                    // 如果动画启用且有楼层索引信息，计算并显示位移值
                    if (window.animationEnabled && floorIndexOffset) {
                        labelText = addDisplacementInfoToLabel(chunkManager, chunkKey, floorIndexOffset, cur_time_step, labelText);
                    }

                    // 创建标签
                    chunkManager.buildingPickingManager.labelPool.create(labelText, position);
                }
            }

            // 如果当前有选中对象且动画正在运行，在动画帧中更新位移值
            // 这个逻辑会在animate函数中处理，而不是在鼠标移动时
            // 这样可以避免鼠标移动时的频繁计算
        } else {
            // 没有交叉，清除选择
            if (selectedObject) {
                selectedObject.visible = true;
                selectedObject = null;

                // 移除标签
                chunkManager.buildingPickingManager.labelPool.remove();
            }
        }
    }

    function onLabelClick(event) {
        // 防止事件冒泡
        event.preventDefault();
        event.stopPropagation();

        if (selectedObject && selectedObject.userData && selectedObject.userData.buildingData) {
            setBuildingData();
        }
    }

}
function animate() {
    stats.update();
    orbitControls.update();

    if (cameraChanged || window.animationEnabled) {
        const now = performance.now();
        if (now - chunkManager.lastUpdateTime > chunkManager.updateInterval) {
            chunkManager.update(camera);
            chunkManager.lastUpdateTime = now;
            lastCameraPosition.copy(camera.position);
            lastCameraRotation.copy(camera.rotation);

            // times.update(sample_rate, animationPaused, animationSpeed);
            // Use window.animationSpeed with a fallback to 1.0 if undefined
            times.update(sample_rate, false, window.animationSpeed || 1.0);
            cur_time_step = Math.ceil(times.current_step % max_time_step);
            // cur_time_step = curTimeStep;

            for (const chunkKey in chunkManager.chunks) {
                const cInfo = chunkManager.chunks[chunkKey];
                if (cInfo.loaded && cInfo.mesh) {
                    // update chunk animation
                    let mat = cInfo.mesh.material;
                    if (mat && mat.uniforms && mat.uniforms.uTimeStep) {
                        mat.uniforms.uTimeStep.value = cur_time_step;
                        mat.uniforms.uAnimate.value = window.animationEnabled || false;
                        // mat.uniforms.uAmplitude.value = animationAmplitude;
                    }
                }
            }
        }
    }
    cameraChanged = cameraMovedSignificantly(camera, lastCameraPosition, lastCameraRotation);

    // 更新选中建筑的位移值显示（每秒最多10次）
    if (window.interactiveEnabled || false) {
        updateSelectedBuildingInfo();
    } else if (selectedObject) {
        // 如果交互模式关闭但还有选中对象，清除选择
        selectedObject = null;
        if (chunkManager && chunkManager.buildingPickingManager) {
            chunkManager.buildingPickingManager.labelPool.remove();
        }
    }

    render();

    function render() {
        gpuPanel.startQuery();
        updateParentPage();
        updateScene();

        renderer.clear();
        renderer.render( scene, camera );
        // 只在交互模式启用时渲染标签
        if (window.interactiveEnabled || false) {
            labelRenderer.render( scene, camera );
        } else if (chunkManager && chunkManager.buildingPickingManager) {
            // 确保交互模式关闭时标签被移除
            chunkManager.buildingPickingManager.labelPool.remove();
        }

        gpuPanel.endQuery();

        function updateScene() {
            // let fru = computeFrustumFromCamera(camera);
            planeTiles.setPos( state.maptile.x, state.maptile.y, state.maptile.z);

            if (state.skybox.sky && sky.parent !== scene) {
                scene.add(sky);
            } else if (!state.skybox.sky && sky.parent === scene ) {
                scene.remove(sky);
            }
        }
    }
}

// 上次更新选中建筑信息的时间
let lastBuildingInfoUpdateTime = 0;
// 更新间隔（毫秒）
const BUILDING_INFO_UPDATE_INTERVAL = 100; // 100ms

/**
 * 更新选中建筑的位移值显示
 */
function updateSelectedBuildingInfo() {
    // 如果没有选中对象或者交互没有启用，移除标签并返回
    if (!selectedObject || !(window.interactiveEnabled || false)) {
        if (chunkManager && chunkManager.buildingPickingManager) {
            chunkManager.buildingPickingManager.labelPool.remove();
        }
        return;
    }

    // 如果没有选中对象或者动画没有启用，直接返回
    if (!(window.animationEnabled || false)) return;

    // 检查是否需要节流
    const now = performance.now();
    if (now - lastBuildingInfoUpdateTime < BUILDING_INFO_UPDATE_INTERVAL) {
        return;
    }

    // 更新最后计算时间
    lastBuildingInfoUpdateTime = now;

    // 更新选中建筑的位移值
    if (selectedObject.userData && selectedObject.userData.buildingData) {
        const buildingData = selectedObject.userData.buildingData;
        const buildingId = buildingData.bid;
        const chunkKey = selectedObject.userData.chunkKey;
        const floorIndexOffset = selectedObject.userData.floorIndexOffset;

        // 计算标签位置 - 使用对象位置并上移
        const position = new THREE.Vector3();
        selectedObject.getWorldPosition(position);

        // 计算与相机的距离
        const distanceToCamera = camera.position.distanceTo(position);

        // 如果距离过远，不显示标签
        if (distanceToCamera > 800) {
            // 清除可能存在的标签
            chunkManager.buildingPickingManager.labelPool.remove();
            return;
        }

        if (buildingData.storey) {
            position.y += buildingData.storey * 0.18; // 上移到建筑顶部
        } else {
            position.y += 0.5; // 默认上移
        }

        // 创建基本标签
        let labelText = `建筑 #${buildingId}`;

        // 如果有楼层索引信息，计算并显示位移值
        if (floorIndexOffset) {
            labelText = addDisplacementInfoToLabel(chunkManager, chunkKey, floorIndexOffset, cur_time_step, labelText);
        }

        // 更新标签
        chunkManager.buildingPickingManager.labelPool.create(labelText, position);
    }
}

/**
 * Helper function to add displacement information to a building label
 * @param {Object} chunkManager - The chunk manager
 * @param {String} chunkKey - The chunk key
 * @param {Object} floorIndexOffset - Floor index information
 * @param {Number} cur_time_step - Current animation time step
 * @param {String} labelText - The existing label text
 * @returns {String} Updated label text with displacement information
 */
function addDisplacementInfoToLabel(chunkManager, chunkKey, floorIndexOffset, cur_time_step, labelText) {
    // 获取当前时间步的位移值
    const chunkMesh = findChunkMesh(chunkManager, chunkKey);
    if (chunkMesh) {
        const { topDisplacement, maxDrift } = calculateDisplacement(chunkMesh, floorIndexOffset, cur_time_step);
        // 添加层间位移和顶层位移信息到标签（单位为毫米）
        labelText += `\n最大层间位移: ${Math.abs(maxDrift).toFixed(2)} mm`;
        labelText += `\n顶层位移: ${Math.abs(topDisplacement).toFixed(1)} mm`;
    }
    return labelText;
}

function resetAnimation() {
    times.last_step = 0;
}

async function setBuildingData() {
    // console.log('Setting building info ...');
    const data = selectedObject.userData.buildingData;

    let position = new THREE.Vector3();
    selectedObject.getWorldPosition(position);
    let coordinate = `(${position.x.toFixed(1)}, ${position.z.toFixed(1)})`;

    const geo = selectedObject.geometry;
    let radius = geo.boundingSphere.radius.toFixed(2);
    let triangles = geo.attributes.position.count / 3;

    window.parent.postMessage({
        type: 'building',
        data: {
            bid: data.bid,
            center: data.center,
            storey: data.storey,
            height: (data.storey*3.6).toFixed(1),
            county: 'Sample County',
            town: 'Sample Town',
            circleNum: 1,
            builtYear: 2020,
            floorArea: 100.0,
            buildArea: 80.0,
            coordinate: coordinate,
            radius: radius,
            triangles: triangles,
        },
    }, '*');
}

function updateEqTable() {
//     let n = Math.round( state.eq_select );

//     // Update eq_his in parent window if available
//     if (window.parent && window.parent.app) {
//         window.parent.app.eq_his = eq_his[n];
//     }

//     // Update earthquake table attributes if available
//     if (window.parent && window.parent.table_attr && window.parent.table_attr.earthquake) {
//         const eqAttrs = window.parent.table_attr.earthquake.attributes;
//         if (eqAttrs) {
//             if (eqAttrs.eid) eqAttrs.eid.value = 'KiNet-EW-'+ n.toString();
//             if (eqAttrs.pga) eqAttrs.pga.value = 0.4;
//             if (eqAttrs.duration) eqAttrs.duration.value = 120.0;
//             if (eqAttrs.cav) eqAttrs.cav.value = '-';
//         }
//     }
}

function updateParentPage(){
    // Only update if Vue app is ready
    if (!(window.vueAppReady || false)) {
        return;
    }
    try {
        // console.log(times);
        // post dynamic value in message to vue
        window.parent.postMessage({
            type: 'overview',
            data: statsData,
        }, '*');

        window.parent.postMessage({
            type: 'earthquake',
            data: {
                cur_time_step: cur_time_step,
                max_time_step: max_time_step,
            },
        }, '*');

        window.parent.postMessage({
            type: 'cameraUpdate',
            data: {
                x: camera.position.x.toFixed(1),
                y: camera.position.z.toFixed(1),
            }
        }, '*');

        // --------------------------------------------------------------------
        // --------------------------------------------------------------------
        // --------------------------------------------------------------------
        // --------------------------------------------------------------------
        // --------------------------------------------------------------------

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

async function fetchJSON(path, filename) {
    const url = `${path}${filename}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to load ${url}: ${response.statusText}`);
    }
    return response.json();
}

function cameraMovedSignificantly(camera, lastCamPos, lastCamRot, moveThreshold = 2.0, rotThreshold = 0.05) {
    const dist = camera.position.distanceTo(lastCamPos);
    const rotDist = Math.abs(camera.rotation.x - lastCamRot.x)
                + Math.abs(camera.rotation.y - lastCamRot.y)
                + Math.abs(camera.rotation.z - lastCamRot.z);

    return (dist > moveThreshold) || (rotDist > rotThreshold);
}

// 添加消息监听器
window.addEventListener('message', function(event) {
    if (event.data.type === 'resetCamera') {
        const { x, y, height } = event.data.data;

        // 获取相机朝向
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);

        // 设置相机位置
        camera.position.set(x, height, y);

        // 更新轨道控制器目标点
        orbitControls.target.set( -600, 0, 300 );
        orbitControls.update();
    } else if (event.data.type === 'resetTimeline') {
        times.last_step = event.data.data.step;
    } else if (event.data.interactiveEnabled !== undefined) {
        // 当交互模式关闭时，移除标签
        if (!event.data.interactiveEnabled && chunkManager && chunkManager.buildingPickingManager) {
            chunkManager.buildingPickingManager.labelPool.remove();
            selectedObject = null; // 清除选中对象
        }
    }
});
