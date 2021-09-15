import { Line2 } from './three.js_130/examples/jsm/lines/Line2.js';
import { LineMaterial } from './three.js_130/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from './LineGeometry.js';

export function Road_LineSegments( pos, color ) {

    let scale = 0.854;
    let road;
    let geometry;

    let road_material = new LineMaterial( {
        color: color,
        linewidth: 0.0015,//0.0008
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