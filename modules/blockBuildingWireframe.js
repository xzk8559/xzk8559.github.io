import * as THREE from '../modules/three-r165/build/three.module.js';
import { Line2 } from '../modules/three-r165/examples/jsm/lines/Line2.js';
import { LineMaterial } from '../modules/three-r165/examples/jsm/lines/LineMaterial.js';
import { LineSegmentsGeometry } from '../modules/three-r165/examples/jsm/lines/LineSegmentsGeometry.js';


export function BlockBuildingWireframe( building ) {
    let geometry = building.geometry;
    let edges = new THREE.EdgesGeometry( geometry );
    let edges2= new LineSegmentsGeometry().setPositions( edges.attributes.position.array );
    let lineMat = new LineMaterial( {
        color: "#9BAFC8", //"#4cabff",
        linewidth: .5,
        dashed: false,
        alphaToCoverage: true,
    } );
    return new Line2(edges2, lineMat)
}