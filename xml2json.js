var fs = require( 'fs' );
var path = require( 'path' );
var parser = require('xml2json');

if ( process.argv.length <= 2 ) {

    console.log( "Usage: " + path.basename( __filename ) + " xml.txt" );
    process.exit( - 1 );

}

var file = process.argv[ 2 ];

var xml = fs.readFileSync( file, 'utf8' );

console.log("input -> %s", xml);

// xml to json
var json = parser.toJson(xml);
console.log("to json -> %s", json);

fs.writeFileSync( path.basename( file, '.txt' ) + '.json', json, 'utf8' );
