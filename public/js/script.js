/* jshint browser: true */
/* jshint jquery: true */
/* global Primus */


var primus = new Primus();
var $map = $( '#map' );


function addMarker( element ) {
  var location = element.location;
  if( location ) {
    var lat = location.coordinates[ 1 ];
    var lng = location.coordinates[ 0 ];

    var $marker = $( '<google-map-marker></google-map-marker>' );
    $marker.attr( 'latitude', lat );
    $marker.attr( 'longitude', lng );

    $map.append( $marker );
  }
}

function addMarkers( dataList ) {
  dataList.forEach( addMarker );
}


primus.on( 'data', function dataRecieved( dataList ) {
  addMarkers( dataList );
} );