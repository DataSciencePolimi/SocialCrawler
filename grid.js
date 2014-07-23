// Load system modules


// Load modules
var debug = require( 'debug' )( 'grid' );

// Load my modules


/**
 * Computes the grid out of each area.
 */
module.exports = exports = function createGrid( area ) {
  var coordinates = [];

  var diffLat = area.nw.lat - area.se.lat;
  var diffLng = area.se.lng - area.nw.lng;

  var dLat = diffLat / 50; // 50 meters for latitude
  var dLng = diffLng / 100; //  50 meters for longitude

  var offsetLng = dLng / 2;
  //var lat = area.nw.lat;
  //var lng = area.nw.lng;
  var lat, lng;

  for( var row=0; row<50; row++ ) {
    /**
     * Offset the latitude accordingly to the index
     */
    lat = area.nw.lat - dLat*row;

    for( var col=0; col<100; col++ ) {
      /**
       * Offset the longitude accordingly to the index
       */
      lng = area.nw.lng + dLng*col;

      /**
       * For the odd rows add 25 meters
       */
      if( row%2!==0 )
        lng += offsetLng;

      coordinates.push( {
        lat: lat,
        lng: lng
      } );
    }
  }

  return coordinates;
};