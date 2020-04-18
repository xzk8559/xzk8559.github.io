var fs = require( 'fs' );
var path = require( 'path' );

if ( process.argv.length <= 2 ) {

	console.log( "Usage: " + path.basename( __filename ) + " model.obj" );
	process.exit( - 1 );

}

//node obj2three.js 1007.obj

var PRECISION = 3;

function parseNumber( key, value ) {

	return typeof value === 'number' ? parseFloat( value.toFixed( PRECISION ) ) : value;

}

THREE = require( './three.js/build/three.js' );
require( './three.js/examples/js/loaders/OBJLoader.js' );

var file = process.argv[ 2 ];
var loader = new THREE.OBJLoader();

var text = fs.readFileSync( file, 'utf8' );

var content = JSON.stringify( loader.parse( text ).toJSON(), parseNumber );
fs.writeFileSync( path.basename( file, '.obj' ) + '.json', content, 'utf8' );
