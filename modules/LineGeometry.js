import { LineSegmentsGeometry } from './three-r165/examples/jsm/lines/LineSegmentsGeometry.js';

class LineGeometry extends LineSegmentsGeometry {

	constructor() {

		super();
		this.type = 'LineGeometry';

	}

	setPositions( array ) {
		let pos = array;
		let x_offset = -2;
		let z_offset = -10;

		let positions = [];
		for (let i = 0; i < pos.length; i++){
			for (let j = 1; j < pos[i].length; j++){
				positions.push( pos[i][j-1][0]+x_offset, 1, pos[i][j-1][1]+z_offset );
				positions.push( pos[i][j][0]+x_offset, 1, pos[i][j][1]+z_offset );
			}
		}
		super.setPositions( positions );
		return this;
	}

	setColors( array ) {

		// converts [ r1, g1, b1,  r2, g2, b2, ... ] to pairs format

		var length = array.length - 3;
		var colors = new Float32Array( 2 * length );

		for ( var i = 0; i < length; i += 3 ) {

			colors[ 2 * i ] = array[ i ];
			colors[ 2 * i + 1 ] = array[ i + 1 ];
			colors[ 2 * i + 2 ] = array[ i + 2 ];

			colors[ 2 * i + 3 ] = array[ i + 3 ];
			colors[ 2 * i + 4 ] = array[ i + 4 ];
			colors[ 2 * i + 5 ] = array[ i + 5 ];

		}

		super.setColors( colors );

		return this;

	}

	fromLine( line ) {

		var geometry = line.geometry;

		if ( geometry.isGeometry ) {

			console.error( 'THREE.LineGeometry no longer supports Geometry. Use THREE.BufferGeometry instead.' );
			return;

		} else if ( geometry.isBufferGeometry ) {

			this.setPositions( geometry.attributes.position.array ); // assumes non-indexed

		}

		// set colors, maybe

		return this;

	}

}

LineGeometry.prototype.isLineGeometry = true;

export { LineGeometry };
