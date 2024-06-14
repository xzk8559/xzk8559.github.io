// import { Line2 } from './three.js_130/examples/jsm/lines/Line2.js';
// import { LineMaterial } from './three.js_130/examples/jsm/lines/LineMaterial.js';
import { Line2 } from './modules/three-r165/examples/jsm/lines/Line2.js';
import { LineMaterial } from './modules/three-r165/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from './LineGeometry.js';

export function Road_LineSegments( pos, color ) {

    let scale = 0.854;
    let road;
    let geometry;

    let road_material = new LineMaterial( {
        color: color,
        linewidth: 1.5,
        dashed: false,
        alphaToCoverage: true,
    } );

    geometry = new LineGeometry();
    geometry.setPositions( pos );

    road = new Line2( geometry, road_material );
    road.scale.set( scale, 1, scale );
    road.layers.set( 0 );
    // console.log(road)

    return road
}