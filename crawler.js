// Load system modules
var fs = require( 'fs' );
var http = require( 'http' );
var path = require( 'path' );

// Load modules
var _ = require( 'lodash' );
var Primus = require('primus');
var express = require( 'express' );
var mkdirp = require( 'mkdirp' );
var mongoose = require( 'mongoose' );
var Promise = require( 'bluebird' );
var debug = require( 'debug' )( 'crawl' );
var argv = require('yargs').argv;

// Load my modules
var generateGrid = require( './grid.js' );
var areas = require( './areas.json' );


/**
 * Enable long stack traces
 */
Promise.longStackTraces();

/**
 * Configure social data
 */
if( argv._.length<1 ) {
  console.error( 'USAGE: node %s <social>', path.basename( argv.$0 ) );
  return;
}
var social = argv._[0];
var port = argv.p || argv.port || 80;
var key = argv.k || argv.key || 'AIzaSyCnyhvgRPmKmkx7_ER7AojeWBvenL4fUtQ';

var baseDir = path.resolve( __dirname, 'social', social );
var configFile = path.resolve( baseDir, 'config.json' );
var scanFile = path.resolve( baseDir, 'scan.js' );
var schemaFile = path.resolve( baseDir, 'schema.js' );

var config = require( configFile );
var scan = require( scanFile );
var schema = require( schemaFile );

/**
 * Init model data
 */
var DataModel = null;
Promise.promisifyAll( mongoose );






/**
 * Init status data
 */
var statusBasePath = path.resolve( __dirname, 'status' );
mkdirp.sync( statusBasePath );
var AREA_INDEX_FILE = path.resolve( statusBasePath, 'area.idx' );
var SUB_AREA_INDEX_FILE = path.resolve( statusBasePath, 'sub_area.idx' );
var GRID_INDEX_FILE = path.resolve( statusBasePath, 'grid.idx' );
var AREA_INDEX = 0;
var SUB_AREA_INDEX = 0;
var GRID_INDEX = 0;

/**
 * Get area index from file
 */
try {
  AREA_INDEX = parseInt( fs.readFileSync( AREA_INDEX_FILE, 'utf8' ) );
} catch( err ) {
  debug( 'Area file not found... no problem, create one' );
  fs.writeFileSync( AREA_INDEX_FILE, ''+AREA_INDEX );
}

/**
 * Get sub area index from file
 */
try {
  SUB_AREA_INDEX = parseInt( fs.readFileSync( SUB_AREA_INDEX_FILE, 'utf8' ) );
} catch( err ) {
  debug( 'Sub Area file not found... no problem, create one' );
  fs.writeFileSync( SUB_AREA_INDEX_FILE, ''+SUB_AREA_INDEX );
}


/**
 * Get the remaining data
 */
areas = areas.slice( AREA_INDEX );
areas[0] = areas[0].slice( SUB_AREA_INDEX );

debug( 'AREA INDEX: %d, %d more to finish', AREA_INDEX, areas.length );
debug( 'SUB AREA INDEX: %d, %d more to finish', SUB_AREA_INDEX, areas[0].length );

















/**
 * Setup server
 */
var app = express();
var server = http.createServer( app );
var primus = new Primus( server, {
  transformer: 'engine.io'
} );

/**
 * Express routes
 */
app.use( express.static( __dirname + '/public' ) );

app.get( '/', function( req, res ){
  res.redirect( '/index.html' );
} );
app.get( '/index.*', function( req, res, next ) {
  var indexFile = path.resolve( __dirname, 'pages', 'index.html' );
  
  fs.readFile( indexFile, 'utf8', function( err, data ) {
    if( err ) return next( err );

    DataModel
    .find()
    .exec( function( err, markers ) {
      if( err ) return next( err );
      
      res.type( 'html' );
      res.send( _.template( data, {
        social: social,
        key: key,
        markers: markers
      } ) );
    } );
  } );
} );














/**
 * Mongo promise, fullfilled when the connection is opened
 */
var mongoosePromise = new Promise( function mongooseResolver( resolve, reject ) {
  mongoose.connect( 'mongodb://localhost/'+config.dbname );
  
  var db = mongoose.connection;

  db.on( 'error', reject );
  db.once( 'open',  function() {
    resolve( db );
  } );
} );



/**
 * Save eash element
 */
function saveElement( savedList, element ) {
  return Promise.resolve( element )
  .then( function( el ) {
    var docElement = new DataModel( el );

    return docElement.saveAsync();
  } )
  .then( function() {
    savedList.push( element );
  }, function handleError() {
    // debug( 'Unable to save data: %s', err.message );
  } )
  .return( savedList )
  ;
}
/**
 * Call scan and save eash result
 */
function scanAndSaveCoordinates( nope, coordinates, idx ) {
  return Promise
  .resolve( coordinates )
  .then( scan )
  .then( function saveData( dataList ) {
    return Promise.reduce( dataList, saveElement, [] );
  } )
  .then( function dataSaved( savedList ) {
    if( savedList.length>0 ) {
      debug( '%d element added, bradcasting data', savedList.length );
      primus.write( savedList );
    }

    GRID_INDEX = idx;
    fs.writeFileSync( GRID_INDEX_FILE, ''+GRID_INDEX );

  }, function dataNotRetrieved( err ) {
    debug( 'Unable to retrieve data: %s', err.message );
  } );
}
/**
 * Create the grid based on the current area and sub area.
 */
function createGrid( subArea ) {
  return Promise.resolve( subArea )
  .then( generateGrid )
  .then( function( coordinates ) {
    debug( 'Generated grid has %d elements', coordinates.length );
    
    var gridFileName = 'grid_'+AREA_INDEX+'_'+SUB_AREA_INDEX+'.json';
    var gridPath = path.resolve( statusBasePath, gridFileName );
    fs.writeFileSync( gridPath, JSON.stringify( coordinates, null, 2 ) );

    return coordinates;
  } )
  ;
}
/**
 * Function to parse each subarea
 */
function cycleSubArea( nope, element, idx ) {
  debug( 'Iterating over subarea %d', idx );

  return Promise
  .resolve( element )
  .then( function loadGrid() {
    
    GRID_INDEX = parseInt( fs.readFileSync( GRID_INDEX_FILE, 'utf8' ) );
    var gridFileName = 'grid_'+AREA_INDEX+'_'+SUB_AREA_INDEX+'.json';
    var gridPath = path.resolve( statusBasePath, gridFileName );
    var coordinates = require( gridPath );

    coordinates = coordinates.slice( GRID_INDEX );

    debug( 'Grid file "%s" loaded, %d elements to finish', gridFileName, coordinates.length );
    return coordinates;
  } )
  .catch( function handleError() {
    debug( 'Grid file not found... no problem, create one' );

    GRID_INDEX = 0;
    fs.writeFileSync( GRID_INDEX_FILE, ''+GRID_INDEX );

    return createGrid( element );
  } )
  .then( function scanCoordinates( coordinates ) {
    return Promise.reduce( coordinates, scanAndSaveCoordinates );
  } )
  .then( function subAreaComplete() {
    debug( 'SubArea complete!' );
    SUB_AREA_INDEX = idx;
    fs.writeFileSync( SUB_AREA_INDEX_FILE, ''+SUB_AREA_INDEX );
  } )
  ;
}

/**
 * Function to parse each area
 */
function cycleArea( nope, subarea, idx ) {
  debug( 'Iterating over area %d', idx );

  return Promise
  .delay( 1000 )
  .return( Promise.reduce( subarea, cycleSubArea ) )
  .then( function areaComplete() {
    debug( 'Area cycle complete!' );
    AREA_INDEX = idx;
    fs.writeFileSync( AREA_INDEX_FILE, ''+AREA_INDEX );
  } )
  ;
}








/**
 * Entry point for the program
 */
Promise
.resolve( mongoosePromise )
.then( schema )
.then( function saveModel( model ) {
  DataModel = model;
  debug( 'Model loaded, starting server' );
} )
.then( function setupServer() {
  debug( 'Starting server on port %d', port );
  server.listen( port );
} )
.then( function cycleArray() {
  return Promise.reduce( areas, cycleArea );
} )
.done( function cycleComplete() {
  debug( 'Cycle complete!' );
  process.exit(0);
}, function handleError( err ) {
  debug( 'Error: %s', err.name );
  debug( err );

  process.exit(0);
} );

