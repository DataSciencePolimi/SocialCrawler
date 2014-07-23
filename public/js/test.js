/* jshint browser: true */
/* jshint jquery: true */
/* global google, Primus */


var primus = new Primus();
var $map = $( '#map' );
var map;


function createMarker( element ) {
  var location = element.location;
  if( location ) {
    var lat = location.coordinates[ 1 ];
    var lng = location.coordinates[ 0 ];

    var coords = new google.maps.LatLng( lat, lng );
    return new google.maps.Marker( {
        position: coords
    } );
  }
}

function createMarkers( dataList ) {
  $.each( dataList, function addMarker( i, element ) {
    var marker = createMarker( element );
    marker.setMap( map );
  } );
}



function initialize() {
  var mapOptions = {
    zoom: 14,
    center: new google.maps.LatLng( 45.4627338, 9.1777323 )
  };
  map = new google.maps.Map( $map[0], mapOptions );

  primus.on( 'data', function dataRecieved( dataList ) {
    createMarkers( dataList );
  } );
}


google.maps.event.addDomListener( window, 'load', initialize );

