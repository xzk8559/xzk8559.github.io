import * as THREE from '../modules/three-r165/build/three.module.js';
import { Earcut } from './Earcut.js';
import { mergeGeometries } from '../modules/three-r165/examples/jsm/utils/BufferGeometryUtils.js';


export function BlockBuildingMerge(cityMap, dcj, eid, IDR_type) {
    /**
     * @param {Object} cityMap - Metadata of city
     *
     * @param {Object} dcj - Metadata of responses
     * @param {Array} dcj.bid - IDs of buildings with response simulated - shape (num_bu)
     * @param {Array} dcj.dcj_max - An array with shape (num_eq, num_bu)
     * @param {Array} dcj.dcj_res - An array with shape (num_eq, num_bu)
     * @param {Array} dcj.dcj_max_top - Upper limit of dcj_max - shape (num_eq)
     * @param {Array} dcj.dcj_res_top - Upper limit of dcj_res - shape (num_eq)
     *
     * @param {number} eid - ID of earthquake simulated
     * @param {string} IDR_type - choose for max or res
    **/

    let IDR, max_IDR;
    if ( IDR_type === 'maximum' ){ IDR = dcj.dcj_max[eid]; max_IDR = dcj.dcj_max_top[eid] }
    else{ IDR = dcj.dcj_res[eid]; max_IDR = dcj.dcj_res_top[eid] }

    let bid_list = dcj.bid;
    // let num_bu = dcj.num_bu;

    let floor_heights = cityMap.buildings.height;
    let geometries = [];
    for (let ib = 0; ib < cityMap.buildings.number; ib++){
        let rgb;
        let floor_height = floor_heights[ib];
        let floor = 1; // for simplification
        floor += 1; // to simulate shadow effect with vertex color shading

        let indices = [],
            vertices = [],
            normals = [],
            colors = [],
            bounds = cityMap.buildings.bounds[ib],
            pN = bounds.length;

        // rgb = get_RGB ( ib, bid_list, IDR, max_IDR );
        rgb = get_RGB_eqfield( ib, bid_list, IDR, max_IDR );

        for (let i0 = 0; i0 < floor + 1; i0++) {
            for (let i1 = 0; i1 < pN; i1++) {
                let x = bounds[i1][0];
                let z = bounds[i1][1];
                let y;
                if (i0 === floor) { 
                    y = (floor-1) * floor_height * cityMap['coordinate scale'] + .01;
                    colors.push( rgb[0] + .1, rgb[1] + .1, rgb[2] + .1 );
                } else {
                    y = i0 * floor_height * cityMap['coordinate scale']; 
                    let tmp = Math.min(0, (i0/5 - 1)) * .1 - .075;
                    tmp += Math.min(0, (i0 - 1)) * .05;
                    colors.push( rgb[0] + tmp, rgb[1] + tmp, rgb[2] + tmp );
                }
                vertices.push(x, y, z);
                normals.push( 0, 1, 0.5 );
            }

            if (i0 !== floor){
                let pos;
                for (let n = 0; n < pN-1; n++) {
                    pos = pN * i0 + n;
                    indices.push( pos + pN+1, pos + 1, pos );
                    indices.push( pos + pN+1, pos, pos + pN );
                }
                pos = pN * i0 + pN - 1;
                indices.push( pos + 1, pos + 1 - pN, pos );
                indices.push( pos + 1, pos, pos + pN );
            }
        }


        let triangles =  Triangulate( bounds );
        for (let i = 0; i <triangles.length; i++) {
            let n = i - i % 3 + exchange0And1( (i%3) );
            indices.push( triangles[n] + pN * floor );
        }

        let geometry = new THREE.BufferGeometry();
        geometry.setIndex( indices );
        geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
        geometry.setAttribute( 'normal', new THREE.Float32BufferAttribute( normals, 3 ) );
        geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );
        geometry.computeVertexNormals();

        geometries.push(geometry)
    }

    let mergedGeometry = mergeGeometries( geometries );

    let material = new THREE.MeshLambertMaterial( {vertexColors: true, side: THREE.DoubleSide} );
    material.precision = "lowp";
    material.transparent = false;
    material.opacity = 0.6;

    return new THREE.Mesh( mergedGeometry, material )
}

function Triangulate(bounds_vec3) {
    let array = [];
    for (let i1 = 0; i1 < bounds_vec3.length; i1++){
        array.push( bounds_vec3[i1][0], bounds_vec3[i1][1] );
    }
    return Earcut.triangulate( array );
}

function exchange0And1( x ){
    if ( x === 0 ) return 1;
    else if ( x === 1 ) return 0;
    return 2
    // return ( 3/2 * x * x - 5/2 * x + 1 )
}

function getRnd(min, max) {
    return Math.random() * (max - min) + min;
}

function get_RGB( ib, bid_list, IDR, max_IDR ) {
    let r, g, b
    // let r = getRnd(0.2, 0.8);
    let ind = bid_list.indexOf( ib )
    if ( ind === -1 ) { r = 0.18; g = 0.18; b = 0.2 }
    else {
        r = IDR[ind] / max_IDR * 0.6 + 0.2;
        g = 1 - r;
        b = 0.4;
    }
    return [r, g, b]
}

function get_RGB_eqfield( ib, bid_list, IDR, max_IDR ) {
    // 6 classes in cmap
    // let v_list = [0, 0.125, 0.375, 0.625, 0.875, 1];
    let v_list = [0, 0.2, 0.4, 0.6, 0.8, 1];
    let c_list = [
        // sequential - warm
        // [254,237,222], [253,208,162], [253,174,107],
        // [253,141, 60], [230, 85, 13], [166, 54,  3],

        // sequential - cold
        // [240,249,232], [204,235,197], [168,221,181],
        // [123,204,196], [ 67,162,202], [  8,104,172],

        // diverging - blue/red
        // [ 69,117,180], [145,191,219], [224,243,248],
        // [254,224,144], [252,141, 89], [215, 48, 39],

        // diverging - blue/green/yellow/red
        // [ 69,117,180], [145,191,219], [224,243,248],
        // [254,224,144], [252,141, 89], [215, 48, 39],

        // diverging - green/red
        [ 35,125, 73], [104,162, 69], [161,196, 87],
        [237,169, 85], [242,100, 64], [186, 51, 44],

        // [  4,106, 54], [ 67,131,  7], [114,154,  7],
        // [197,117,  7], [215, 57,  6], [168, 22,  7],
    ];

    let ind = bid_list.indexOf( ib );
    if ( ind === -1 ) { return [.25, .25, .25]; }
    let v = IDR[ind] / max_IDR;
    for (let i = 0; i < v_list.length-1; i++) {
        if (v <= v_list[i+1]) {
            // console.log(interp_rgb(c_list[i], c_list[i+1], v_list[i], v_list[i+1], v));
            return interp_rgb(c_list[i], c_list[i+1], v_list[i], v_list[i+1], v);
        }
    }
}

function interp_rgb(rgb1, rgb2, v1, v2, v) {
    let temp = (v - v1) / (v2 - v1);
    let r = temp * (rgb2[0] - rgb1[0]) + rgb1[0];
    let g = temp * (rgb2[1] - rgb1[1]) + rgb1[1];
    let b = temp * (rgb2[2] - rgb1[2]) + rgb1[2];
    return [r/255, g/255, b/255];
}