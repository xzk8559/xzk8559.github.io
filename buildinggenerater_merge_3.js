import * as THREE from "./three.js_130/build/three.module.js";
import { Earcut } from './Earcut.js';

import { BufferGeometryUtils } from './three.js_130/examples/jsm/utils/BufferGeometryUtils.js';


export function BLOCKBuilding_merge(cityMap, dcj, IDR_type) {

    let IDR;
    if ( IDR_type === 'maximum' ){ IDR = dcj.dcj_max }
    else{ IDR = dcj.dcj_res }
    let max_IDR = Math.max( ...IDR );

    let floor_heights = cityMap.buildings.height;
    let geometries = [];
    for (let ib = 0; ib < cityMap.buildings.number; ib++){
        let floor_height = floor_heights[ib];
        let floor = 1;

        let indices = [],
            vertices = [],
            normals = [],
            colors = [],
            bounds = cityMap.buildings.bounds[ib],
            pN = bounds.length;

        // let red = getRnd(0.2, 0.8);
        let red, green, blue
        if (IDR[ib] < 1e-8){ red = 0.18; green = 0.18; blue = 0.2;}
        else{
            red = IDR[ib] / max_IDR * 0.6 + 0.2;
            green = 1 - red;
            blue = 0.4;
        }

        for (let i0 = 0; i0 < floor + 1; i0++) {
            for (let i1 = 0; i1 < pN; i1++) {
                let x = bounds[i1][0];
                let z = bounds[i1][1];
                let y = i0 * floor_height * cityMap['coordinate scale'];
                let tmp = (i0 / floor - 1) * 0.03;
                vertices.push(x, y, z);
                // colors.push( 0.18 + tmp, 0.18 + tmp, 0.2 + tmp );
                colors.push( red + tmp, green + tmp, blue + tmp );
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

    let mergedGeometry = BufferGeometryUtils.mergeBufferGeometries( geometries );

    let material = new THREE.MeshLambertMaterial( {vertexColors: THREE.VertexColors} );
    material.precision = "lowp";
    material.transparent = true;
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
    return ( 3/2 * x * x - 5/2 * x + 1 )
}

function getRnd(min, max) {
    return Math.random() * (max - min) + min;
}