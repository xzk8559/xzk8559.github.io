import { Line2 } from './three-r165/examples/jsm/lines/Line2.js';
import { LineMaterial } from './three-r165/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from './three-r165/examples/jsm/lines/LineGeometry.js';
import { triangulate, exchange0And1 } from './utilsModeling.js';
import * as THREE from './three-r165/build/three.module.js';

const X_OFFSET = 0.5;
const Z_OFFSET = -10.0;
const SCALE_FACTOR = 0.854;

export function Bound_LineSegments( pos, color ) {
    let bound;
    let geometry= new LineGeometry();
    let positions = [];

    let bound_material = new LineMaterial( {
        color: color,
        linewidth: 6,
        dashed: false,
        alphaToCoverage: true,
    } );

    for (let j = 1; j < pos.length; j++){
        positions.push( pos[j-1][0]+X_OFFSET, 1.5, pos[j-1][1]+Z_OFFSET );
        positions.push( pos[j  ][0]+X_OFFSET, 1.5, pos[j  ][1]+Z_OFFSET );
    }

    geometry.setPositions( positions );

    bound = new Line2( geometry, bound_material );
    bound.scale.set( SCALE_FACTOR, 1, SCALE_FACTOR );
    bound.layers.set( 0 );
    // console.log(road)

    return bound
}

export function boundaryMesh( pos, color ) {
    let geometry = new THREE.BufferGeometry();
    let indices = [];
    let vertices = [];
    let pN = pos.length;

    for (let i = 0; i < pN; i++) {
        vertices.push(pos[i][0]+X_OFFSET, -0.1, pos[i][1]+Z_OFFSET);
    }

    let triangles = triangulate(pos);
    for (let i = 0; i < triangles.length; i++) {
        let n = i - i % 3 + exchange0And1(i % 3);
        indices.push(triangles[n]);
    }

    geometry.setIndex(indices);
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

    let material = new THREE.MeshBasicMaterial({
        color: '#191919',
        transparent: false,
    });

    let mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    mesh.scale.set( SCALE_FACTOR, 1, SCALE_FACTOR );
    mesh.layers.set( 0 );
    mesh.renderOrder = 2;
    return mesh;
}