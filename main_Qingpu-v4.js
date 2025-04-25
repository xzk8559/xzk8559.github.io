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
let eq;
let lut;
let sky, sun;
let labelRenderer;
let cameraChanged = true;

let planeTiles;
let chunkManager;
let knownChunkFiles = [];

async function loadChunkFilesList() {
    try {
        const response = await fetch('./data/Qingpu/chunkFiles-Qingpu-20250425.json');
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
            const [meta_data, gm_data] = await Promise.all([
                fetchJSON('./data/Qingpu/', 'meta-Qingpu-20250425.json'),
                fetchJSON('./data/Qingpu/accelerograms/', 'elcentro.json'),
            ]);

            meta = meta_data;
            // console.log(meta);

            // Store the stats data to update the parent window
            statsData = {
                case: "上海市 青浦区",
                buildingCount: meta.total_buildings,
                chunkSize: meta.chunk_size,
                xMin: meta.map_bounds.minx,
                xMax: meta.map_bounds.maxx,
                yMin: meta.map_bounds.miny,
                yMax: meta.map_bounds.maxy
            };

            eq = {
                eid: '-',
                name: gm_data.name,
                direction: gm_data.direction,
                duration: gm_data.T / gm_data.sample_rate,
                pga: 0.05,
                acc: gm_data.acc,
            };
            setEarthquakeData()

            max_time_step = gm_data.T;
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
        camera.near = 15;    // Increase near plane to avoid Z-Fighting
        camera.far = 5000;   // Decrease far plane to avoid Z-Fighting
        camera.position.set( -400, 800, 300 );
        camera.layers.enable( 0 ); // enabled by default
        camera.layers.enable( 1 );
        camera.layers.enable( 2 );

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
        orbitControls.target.set( -400, 0, 350 );

        orbitControls.enableDamping = true;
        orbitControls.dampingFactor = 0.3;
        orbitControls.enableZoom = true;
        orbitControls.maxDistance = 2000;
        orbitControls.minDistance = 10;

        // Add a custom event listener to enforce minimum camera height
        orbitControls.addEventListener('change', function() {
            if (camera.position.y < 30) {
                camera.position.y = 30;
            }
        });

        orbitControls.mouseButtons = {
            LEFT: THREE.MOUSE.PAN,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.ROTATE
        };

        // Enable keyboard controls for arrow keys
        orbitControls.listenToKeyEvents(window);
        orbitControls.keyPanSpeed = 20;

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

        let intersects = raycaster.intersectObjects(scene.children, true);

        if (intersects.length > 0) {
            // 找到第一个拾取网格
            let pickingMesh = null;
            for (let i = 0; i < intersects.length; i++) {
                if (intersects[i].object.isInstancedMesh &&
                    intersects[i].instanceId !== undefined) {
                        pickingMesh = intersects[i];
                    break;
                }
            }

            // 如果找到实例化网格的交叉点
            if (pickingMesh) {
                const instanceId = pickingMesh.instanceId;

                // 查找与此实例ID对应的建筑ID
                let selectedBuildingId = null;
                let selectedBuildingInfo = null;

                for (const [bid, info] of chunkManager.buildingPickingManager.buildingData.entries()) {
                    if (info.instanceId === instanceId) {
                        selectedBuildingId = bid;
                        selectedBuildingInfo = info;
                        break;
                    }
                }

                // 如果找到建筑信息并且与当前选中对象不同
                if (selectedBuildingInfo && selectedBuildingId !== selectedObject) {
                    // 设置新的选择
                    selectedObject = selectedBuildingId;

                    // 获取建筑数据
                    const buildingData = selectedBuildingInfo.buildingData;
                    const chunkKey = selectedBuildingInfo.chunkKey;
                    const floorIndexOffset = selectedBuildingInfo.floorIndexOffset;

                    // 计算标签位置 - 使用存储的中心点
                    const position = new THREE.Vector3(
                        selectedBuildingInfo.center[0],
                        selectedBuildingInfo.center[1],
                        selectedBuildingInfo.center[2]
                    );

                    // 计算与相机的距离
                    const distanceToCamera = camera.position.distanceTo(position);

                    // 如果距离过远，不显示标签
                    if (distanceToCamera > 800) {
                        chunkManager.buildingPickingManager.labelPool.remove();
                        return;
                    }

                    // 上移标签位置到建筑顶部
                    if (buildingData.storey) {
                        position.y += buildingData.storey * 0.18; // 上移到建筑顶部
                    } else {
                        position.y += 0.5; // 默认上移
                    }

                    // 创建基本标签
                    let labelText = `建筑 #${buildingData.bid}`;

                    // 如果动画启用且有楼层索引信息，计算并显示位移值
                    if (window.animationEnabled && floorIndexOffset) {
                        labelText = addDisplacementInfoToLabel(chunkManager, chunkKey, floorIndexOffset, cur_time_step, labelText);
                    }

                    // 创建标签
                    chunkManager.buildingPickingManager.labelPool.create(labelText, position);
                }
            }
        } else {
            // 没有交叉，清除选择
            if (selectedObject) {
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

        if (selectedObject) {
            setBuildingData();
        }
    }

}
function animate() {
    stats.update();
    orbitControls.update();

    // Ensure camera y-coordinate is at least 30
    if (camera.position.y < 30) {
        camera.position.y = 30;
    }

    if (cameraChanged || window.animationEnabled) {
        const now = performance.now();
        if (now - chunkManager.lastUpdateTime > chunkManager.updateInterval) {
            chunkManager.update(camera);
            chunkManager.lastUpdateTime = now;
            lastCameraPosition.copy(camera.position);
            lastCameraRotation.copy(camera.rotation);

            if (window.animationEnabled) {
                // Use window.animationPaused and window.animationSpeed with fallbacks
                const isPaused = window.animationPaused !== undefined ? window.animationPaused : false;
                const speed = window.animationSpeed !== undefined ? window.animationSpeed : 1.0;
                times.update(sample_rate, isPaused, speed);
                cur_time_step = Math.ceil(times.current_step % max_time_step);

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
const BUILDING_INFO_UPDATE_INTERVAL = 200; // ms

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

    // 获取选中建筑的数据
    const buildingInfo = chunkManager.buildingPickingManager.getBuildingData(selectedObject);
    if (buildingInfo) {
        const buildingData = buildingInfo.buildingData;
        const buildingId = buildingData.bid;
        const chunkKey = buildingInfo.chunkKey;
        const floorIndexOffset = buildingInfo.floorIndexOffset;

        // 计算标签位置 - 使用存储的中心点
        const position = new THREE.Vector3(
            buildingInfo.center[0],
            buildingInfo.center[1],
            buildingInfo.center[2]
        );

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

async function setBuildingData() {
    // console.log('Setting building info ...');
    // Get building info from the BuildingPickingManager
    const buildingInfo = chunkManager.buildingPickingManager.getBuildingData(selectedObject);
    if (!buildingInfo) return;

    const data = buildingInfo.buildingData;

    // Get position from stored center
    const position = new THREE.Vector3(
        buildingInfo.center[0],
        buildingInfo.center[1],
        buildingInfo.center[2]
    );

    let coordinate = `(${position.x.toFixed(1)}, ${position.z.toFixed(1)})`;

    // Calculate approximate values for radius and triangles
    // For InstancedMesh, we don't have individual geometries, so we estimate
    const dimensions = buildingInfo.dimensions;
    const radius = Math.sqrt(dimensions.width * dimensions.width + dimensions.depth * dimensions.depth) / 2;

    window.parent.postMessage({
        type: 'building',
        data: {
            bid: data.bid,
            center: data.center,
            storey: data.storey,
            height: (data.storey*3.6).toFixed(1),
            county: '上海市',
            town: '-',
            address: '-',
            circleNum: 1,
            builtYear: -1,
            floorArea: 0.0,
            buildArea: 0.0,
            coordinate: coordinate,
            radius: radius.toFixed(2),
        },
    }, '*');
}

async function setEarthquakeData() {
    window.parent.postMessage({
        type: 'earthquake',
        data: eq,
    }, '*');
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
            type: 'time',
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

// 地震数据文件映射
const earthquakeDataFiles = {
    'El-Centro (0.05g)': 'elcentro.json',
    '南黄海 (19961109)': 'huanghai-19961109.json'
};

// 地震场景ID映射
const earthquakeScenarioIds = {
    'El-Centro (0.05g)': 0,
    '南黄海 (19961109)': 1
};

// 加载地震数据
async function loadEarthquakeData(scenario) {
    NProgress.start();
    try {
        // 获取对应的文件名
        const filename = earthquakeDataFiles[scenario] || 'ground_motion.json';
        console.log(`Loading earthquake data: ${scenario} (${filename})`);

        // 获取场景ID
        const scenarioId = earthquakeScenarioIds[scenario] !== undefined ?
            earthquakeScenarioIds[scenario] : 0;

        // 加载地震数据
        const gm_data = await fetchJSON('./data/Qingpu/accelerograms/', filename);

        // 更新地震信息
        eq = {
            eid: scenarioId,
            name: gm_data.name || scenario,
            direction: gm_data.direction || '-',
            duration: gm_data.T / gm_data.sample_rate,
            pga: gm_data.pga || 0.05,
            acc: gm_data.acc,
        };

        // 更新最大时间步
        max_time_step = gm_data.T;

        // 发送地震数据到父窗口
        setEarthquakeData();

        // 更新所有已加载的块的响应纹理
        await updateAllChunksResponseTextures(scenarioId);

        // 重置动画时间线
        times.last_step = 0;

        // 确保动画标志设置正确
        window.animationEnabled = true;

        console.log('Earthquake data loaded successfully. Animation enabled.');
    } catch (error) {
        console.error('Error loading earthquake data:', error);
    } finally {
        NProgress.done();
    }
}

// 更新所有已加载的块的响应纹理
async function updateAllChunksResponseTextures(scenarioId) {
    console.log(`Updating response textures for scenario ID: ${scenarioId}`);

    // 设置ChunkManager的当前场景ID
    chunkManager.setScenarioId(scenarioId);

    const updatePromises = [];

    // 遍历所有已加载的块
    for (const chunkKey in chunkManager.chunks) {
        const chunkInfo = chunkManager.chunks[chunkKey];

        // 只处理已加载的块
        if (chunkInfo.loaded && chunkInfo.mesh) {
            updatePromises.push(reloadChunkTexture(chunkKey));
        }
    }

    // 等待所有更新完成
    await Promise.all(updatePromises);
    console.log(`Updated response textures for ${updatePromises.length} chunks`);
}

// 重新加载块的响应纹理
async function reloadChunkTexture(chunkKey) {
    const chunkInfo = chunkManager.chunks[chunkKey];
    if (!chunkInfo || !chunkInfo.loaded || !chunkInfo.mesh) return;

    try {
        // 获取块数据
        const response = await fetch(chunkInfo.url);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${chunkInfo.url}`);
        }

        const chunkData = await response.json();

        // 确保场景存在
        const scenarioId = chunkManager.currentScenarioId;
        if (!chunkData.scenarios || !chunkData.scenarios[scenarioId]) {
            console.warn(`Scenario ${scenarioId} not found for chunk ${chunkKey}`);
            return;
        }

        // 获取对应场景的响应纹理URL
        const respTexUrl = chunkData.scenarios[scenarioId].resp_png_url;

        // 加载新的响应纹理
        const loader = new THREE.TextureLoader();
        const displacementTex = await new Promise((resolve, reject) => {
            loader.load(
                respTexUrl,
                tex => resolve(tex),
                undefined,
                err => reject(err)
            );
        });

        // 更新材质中的位移纹理
        const mat = chunkInfo.mesh.material;
        if (mat && mat.uniforms && mat.uniforms.uDisplacementMap) {
            // 释放旧纹理
            if (mat.uniforms.uDisplacementMap.value) {
                mat.uniforms.uDisplacementMap.value.dispose();
            }

            // 设置新纹理
            mat.uniforms.uDisplacementMap.value = displacementTex;
            displacementTex.minFilter = THREE.LinearFilter;
            displacementTex.magFilter = THREE.LinearFilter;
            displacementTex.wrapS = THREE.ClampToEdgeWrapping;
            displacementTex.wrapT = THREE.ClampToEdgeWrapping;
            displacementTex.flipY = false;
            displacementTex.needsUpdate = true;

            mat.uniforms.uTimeSteps.value = max_time_step * 1.0;
            mat.uniforms.uAnimate.value = 1.0;
        }

        console.log(`Updated response texture for chunk ${chunkKey}`);
    } catch (error) {
        console.error(`Error updating response texture for chunk ${chunkKey}:`, error);
    }
}

// 添加消息监听器
window.addEventListener('message', function(event) {
    if (event.data.type === 'resetCamera') {
        const { x, y, height } = event.data.data;

        // 获取相机朝向
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);

        // 设置相机位置，确保y坐标不低于100
        camera.position.set(x, Math.max(height, 30), y);

        // 更新轨道控制器目标点
        orbitControls.target.set( -400, 0, 350 );
        orbitControls.update();
    } else if (event.data.type === 'resetTimeline') {
        times.last_step = event.data.data.step;
    } else if (event.data.interactiveEnabled !== undefined) {
        // 当交互模式关闭时，移除标签
        if (!event.data.interactiveEnabled && chunkManager && chunkManager.buildingPickingManager) {
            chunkManager.buildingPickingManager.labelPool.remove();
            selectedObject = null; // 清除选中对象
        }
    } else if (event.data.type === 'resetAnimation') {
        // 重置动画
        times.last_step = 0;
    } else if (event.data.type === 'loadEarthquakeData') {
        // 加载地震数据
        const scenario = event.data.data.scenario;
        loadEarthquakeData(scenario);
    }
});
