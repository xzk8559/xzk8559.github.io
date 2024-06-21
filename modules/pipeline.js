import { Line2 } from './three-r165/examples/jsm/lines/Line2.js';
import { LineMaterial } from './three-r165/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from './LineGeometry.js';
// import * as THREE from './three-r165/build/three.module.js';

const X_OFFSET = 0.0;
const Z_OFFSET = 0.0;
const SCALE_FACTOR = 1.0;

export function pipeLineSegments( pos, color ) {
    let bound;

    let bound_material = new LineMaterial( {
        color: color,
        linewidth: 0.5,
        dashed: false,
        alphaToCoverage: true,
    } );

    let geometry= new LineGeometry();
    geometry.setPositions( pos, 0, 0 );

    bound = new Line2( geometry, bound_material );
    
    bound.position.set( 0, 9, 0 );
    bound.scale.set( SCALE_FACTOR, 1, SCALE_FACTOR );
    bound.layers.set( 0 );

    return bound
}
