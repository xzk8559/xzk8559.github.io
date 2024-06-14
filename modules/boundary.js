// import { Line2 } from './three.js_130/examples/jsm/lines/Line2.js';
// import { LineMaterial } from './three.js_130/examples/jsm/lines/LineMaterial.js';
// import { LineGeometry } from './three.js_130/examples/jsm/lines/LineGeometry.js';
import { Line2 } from './three-r165/examples/jsm/lines/Line2.js';
import { LineMaterial } from './three-r165/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from './three-r165/examples/jsm/lines/LineGeometry.js';

export function Bound_LineSegments( pos, color ) {

    let x_offset = -2;
    let z_offset = -10;
    let scale = 0.854;

    let bound;
    let geometry= new LineGeometry();
    let positions = [];

    let bound_material = new LineMaterial( {
        color: color,
        linewidth: 3,
        dashed: false,
        alphaToCoverage: true,
    } );

    for (let j = 1; j < pos.length; j++){
        positions.push( pos[j-1][0]+x_offset, 1.5, pos[j-1][1]+z_offset );
        positions.push( pos[j][0]+x_offset, 1.5, pos[j][1]+z_offset );
    }

    geometry.setPositions( positions );

    bound = new Line2( geometry, bound_material );
    bound.scale.set( scale, 1, scale );
    bound.layers.set( 0 );
    // console.log(road)

    return bound
}