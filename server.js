// Load system modules
var fs = require( 'fs' );
var http = require( 'http' );
var path = require( 'path' );

// Load modules
var _ = require( 'lodash' );
var Primus = require('primus');
var express = require( 'express' );
var swig = require( 'swig' );
var mongo = require( 'mongodb' );
var request = require( 'request' );
var Promise = require( 'bluebird' );
var debug = require( 'debug' )( 'server' );
var argv = require( 'yargs' ).argv;

// Load my modules
var areas = require( './areas.json' );
var MongoClient = mongo.MongoClient;
var mongoClient;

/**
 * Enable long stack traces
 */
Promise.longStackTraces();
Promise.promisifyAll( fs );
Promise.promisifyAll( request );
Promise.promisifyAll( mongo );



/**
 * Configure social data
 */
var port = argv.p || 80;
var socket = argv.s || 'https://localhost:801';
var key = argv.k || 'AIzaSyCnyhvgRPmKmkx7_ER7AojeWBvenL4fUtQ';




/**
 * Init status data
 */
var statusBasePath = path.resolve( __dirname, 'status' );
var AREA_INDEX_FILE = path.resolve( statusBasePath, 'area.idx' );
var SUB_AREA_INDEX_FILE = path.resolve( statusBasePath, 'sub_area.idx' );
var GRID_INDEX_FILE = path.resolve( statusBasePath, 'grid.idx' );
var AREA_INDEX, SUB_AREA_INDEX, GRID_INDEX;
var grid;





/**
 * Mongo promise, fullfilled when the connection is opened
 */
function connectToMongo() {
  return MongoClient
  .connectAsync( 'mongodb://localhost:27017/' )
  .then( function( client ) {
    debug( 'Connected to mongo' );
    mongoClient = client;
    return mongoClient;
  } );
}
function selectDatabase( dataBase ) {
  return mongoClient.db( dataBase );
}











/**
 * Setup server
 */
var app = express();
app.locals.key = key;

var server = http.createServer( app );
var primus = new Primus( server, {
  transformer: 'engine.io'
} );


app.engine( 'html', swig.renderFile );
app.set( 'view engine', 'html' );


app.use( express.static( __dirname + '/public' ) );

app.get( '/', function( req, res ){
  res.redirect( '/status/Instagram' );
} );
app.get( '/status/:social', function( req, res ) {
  res.render( 'status', {
    areaIndex: AREA_INDEX,
    subAreaIndex: SUB_AREA_INDEX,
    gridIndex: GRID_INDEX,
    areas: areas,
    subAreas: areas[AREA_INDEX],
    grid: grid,
    social: req.params.social
  } );
} );
app.get( '/data/:social', function( req, res, next ) {
  var social = req.params.social || 'Instagram';

  Promise
  .resolve( social )
  .then( selectDatabase )
  .then( function( db ) {
    db
    .collection( 'datas' )
    .find()
    .toArray( function( err, dataList ) {
      if( err ) return next( err );
      
      res.json( dataList );
    } );
  } );
} );




function readFile( file ) {
  return fs.readFileAsync( file, 'utf8' );
}







// http://localhost/status

/**
 * Entry point for the program
 */
// Load AREA INDEX
connectToMongo()



/**
 * Load status files
 */
.return( AREA_INDEX_FILE )
.then( readFile )
.then( parseInt )
.then( function setArea( index ) {
  AREA_INDEX = index;
} )
.catch( function areaIndexError() {
  AREA_INDEX = 0;
} )
// Load SUB AREA INDEX
.return( SUB_AREA_INDEX_FILE )
.then( readFile )
.then( parseInt )
.then( function setSubArea( index ) {
  SUB_AREA_INDEX = index;
} )
.catch( function subAreaIndexError() {
  SUB_AREA_INDEX = 0;
} )
// Load GRID INDEX
.return( GRID_INDEX_FILE )
.then( readFile )
.then( parseInt )
.then( function setGrid( index ) {
  GRID_INDEX = index;
} )
.catch( function gridIndexError() {
  GRID_INDEX = 0;
} )
.then( function genGridFile() {
  var gridFileName = 'grid_'+AREA_INDEX+'_'+SUB_AREA_INDEX+'.json';
  var gridPath = path.resolve( statusBasePath, gridFileName );
  return gridPath;
} )
.then( readFile )
.then( JSON.parse )
.then( function saveCoords( coordinates ) {
  grid = coordinates;
} )
.catch( function returnCoords() {
  return [];
} )




/**
 * Start the server
 */
.then( function startServer() {
  server.listen( port );
  debug( 'Server started @ port %d', port );
} )





/**
 * Live data feed
 */
.then( function getPrimusConfiguration() {
  return request.getAsync( {
    url: socket+'/primus/spec',
    json: true,
    strictSSL: false
  } );
} )
.spread( function createSocket( req, conf ) {
  debug( conf );
  var Socket = Primus.createSocket( conf );

  var client = new Socket( socket );
  return client;
} )
.then( function listenToData( client ) {
  client.on( 'error', debug );

  client.on( 'data', function( data ) {
    primus.write( data );
  } );

} )





.catch( function error( err ) {
  debug( 'Error!' );
  debug( err );
} );