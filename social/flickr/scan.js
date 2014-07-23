/* jshint camelcase: false */
// Load system modules


// Load modules
var Promise = require( 'bluebird' );
var debug = require( 'debug' )( 'scan' );
var Flickr = require( 'flickrapi' );



// Load my modules
var config = require( './config.json' );



/**
 * Promisify the contructor
 */
Promise.promisifyAll( Flickr );

var API_KEY = config.apiKey;
var SECRET = config.secret;
var HOUR = 1000*60*60;
/**
 * Configure Flickr
 */
var flickrOptions = {
  api_key: API_KEY,
  secret: SECRET
};


var flickr;
var limit = 3600;

module.exports = exports = function scanCoordinates( coords ) {
  var promise;

  if( !flickr ) {
    promise = Flickr.tokenOnlyAsync( flickrOptions )
    .then( function flickrReady( flickrapi ) {
      Promise.promisifyAll( flickrapi );
      Promise.promisifyAll( flickrapi.photos );

      flickr = flickrapi;
      return flickrapi;
    });
  } else {
    promise = Promise.resolve( flickr );
  }

  return promise
  .then( function( flickrapi ) {
    return flickrapi.photos.searchAsync( {
      lat: coords.lat,
      lon: coords.lng,
      radius: 0.05,
      per_page: 500,
      radius_units: 'km',
      extras:  ['description', 'license', 'date_upload', 'date_taken', 'owner_name', 'icon_server', 'original_format', 'last_update', 'geo', 'tags', 'machine_tags', 'o_dims', 'views', 'media', 'url_o', 'url_sq', 'url_t', 'url_s', 'url_q', 'url_m', 'url_n', 'url_z', 'url_c', 'url_l']
    } );
  } )
  .then( function gotData( results ) {
    limit--;

    var media = results.photos.photo;
    debug( '%d data retrieved', media.length );
    
    /**
     * Adapting the location format to Mongo
     */
    for( var i=0; i<media.length; i++ ) {
      if( media[i].longitude!==0 && media[i].latitude!==0 ) {
        var location = {};

        location.type = 'Point';
        location.coordinates = [ media[i].longitude, media[i].latitude ];
        /**
         * Remove redundant data
         */
        delete media[i].longitude;
        delete media[i].latitude;
        
        media[i].location = location;
      }
    }

    /**
     * If i reached the limit per hour then wait 1H
     */
    if( limit<=1 ) {
      return Promise.delay( media, HOUR );
    } else {
      return media;
    }

    return media;
  } );
};