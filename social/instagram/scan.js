/* jshint camelcase: false */
// Load system modules


// Load modules
var Promise = require( 'bluebird' );
var debug = require( 'debug' )( 'scan' );
var ig = require( 'instagram-node' ).instagram();


// Load my modules
var config = require( './config.json' );



/**
 * Promisify the library
 */
Promise.promisifyAll( ig );


var CLIENT_ID = config.clientId;
var CLIENT_SECRET = config.clientSecret;
var HOUR = 1000*60*60;
/**
 * Configure Instagram
 */
ig.use( {
  client_id: CLIENT_ID,
  client_secret: CLIENT_SECRET
} );



module.exports = exports = function scanCoordinates( coords ) {
  return ig.media_searchAsync( coords.lat, coords.lng, {
    distance: 50
  } )
  .spread( function( medias, limit ) {
    debug( '%d data retrieved, limit: %d', medias.length, limit );


    /**
     * Adapting the location format to Mongo
     */
    for( var i=0; i<medias.length; i++ ) {
      if( medias[i].location ) {
        var location = medias[i].location;

        location.type = 'Point';
        location.coordinates = [ location.longitude, location.latitude ];
        /**
         * Remove redundant data
         */
        delete location.longitude;
        delete location.latitude;
        
        medias[i].location = location;
      }
    }


    /**
     * If i reached the limit per hour then wait 1H
     */
    if( limit<=1 ) {
      return Promise.delay( medias, HOUR );
    } else {
      return medias;
    }

    return medias;
  } );
};