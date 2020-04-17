import * as THREE from "./three.js_115/build/three.module.js";
import { Earcut } from './Earcut.js';


export function BLOCKBuilding(cityMap, ib, floor_height, floor) {

    let building;

    let geometry = new THREE.BufferGeometry();
    let indices = [];
    let vertices = [];
    let normals = [];
    let colors = [];

    let bounds = cityMap.buildings.bounds[ib].reverse();
    let pN = bounds.length;

    for (let i0 = 0; i0 < floor + 1; i0++) {

        for (let i1 = 0; i1 < pN; i1++) {
            let x = bounds[i1][0];
            let z = bounds[i1][1];
            let y = i0 * floor_height * cityMap['coordinate scale'];
            let tmp = (i0 / floor - 1) * 0.03;
            vertices.push(x, y, z);
            colors.push( 0.18 + tmp, 0.18 + tmp, 0.2 + tmp );

            /*let tmp = i0 / floor  * 0.2;
            colors.push( 0.1 + tmp*0.4, 0.1 + tmp*0.6, 0.1 + tmp*0.7 );*/

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

    geometry.setIndex( indices );
    geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
    geometry.setAttribute( 'normal', new THREE.Float32BufferAttribute( normals, 3 ) );
    geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );
    //geometry.attributes.position.usage = THREE.DynamicDrawUsage;
    //geometry.attributes.color.usage = THREE.DynamicDrawUsage;

    geometry.computeVertexNormals ();

    let material = new THREE.MeshLambertMaterial( {vertexColors: THREE.VertexColors} );

    building = new THREE.Mesh( geometry, material );

    return building
}

function Triangulate(bounds_vec3) {

    let array = [];

    for (var i1 = 0; i1 < bounds_vec3.length; i1++){
        array.push( bounds_vec3[i1][0], bounds_vec3[i1][1] );
    }

    return Earcut.triangulate( array );

}

function exchange0And1( x ){
    return ( 3/2 * x * x - 5/2 * x + 1 )
}