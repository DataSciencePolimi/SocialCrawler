/* global areas, google, subAreaIndex, areaIndex, Primus, social */
/* jshint browser: true*/
/* jshint jquery: true */

var primus = new Primus();
var $map = $( '#map' );
var map;

var green = 'rgb(177, 191, 114)';
var blue = 'rgb(114, 163, 191)';
var red = 'rgb(191, 114, 139)';
var heatmapData;




function addMarker( lat, lng, title ) {
  var latLng = new google.maps.LatLng( lat, lng );

  // To add the marker to the map, use the 'map' property
  var marker = new google.maps.Marker( {
      position: latLng,
      title: title
  } );

  marker.setMap( map );
}


function addMarkers( dataList ) {
  dataList.forEach( function( element ) {
    var location = element.location;
    if( location ) {
      var lat = location.coordinates[ 1 ];
      var lng = location.coordinates[ 0 ];
      var title = location.name;

      addMarker( lat, lng, title );
    }
  } );
}

function addHeatmapPoint( lat, lng ) {
  var latLng = new google.maps.LatLng( lat, lng );
  heatmapData.push( latLng );
}
function updateHeatMap( dataList ) {
  dataList.forEach( function( element ) {
    var location = element.location;
    if( location ) {
      var lat = location.coordinates[ 1 ];
      var lng = location.coordinates[ 0 ];

      addHeatmapPoint( lat, lng );
    }
  } );
}



function printGrid() {
  areas.forEach( function( subAreas, i ) {
    subAreas.forEach( function( subArea, j ) {
      var nw = subArea.nw;
      var se = subArea.se;
      
      var sw = new google.maps.LatLng( se.lat, nw.lng );
      var ne = new google.maps.LatLng( nw.lat, se.lng );

      var fillColor;
      if( i<areaIndex ) {
        fillColor = red;
      } else if( areaIndex===i ) {
        if( subAreaIndex===j ) {
          fillColor = blue;
        } else if( j>subAreaIndex ) {
          fillColor = green;
        } else {
          fillColor = red;
        }
      } else {
        fillColor = green;
      }



      var rectangle = new google.maps.Rectangle({
        strokeColor: '#000000',
        strokeOpacity: 0.5,
        strokeWeight: 0.3,

        fillColor: fillColor,
        fillOpacity: 0.3,

        map: map,
        bounds: new google.maps.LatLngBounds( sw, ne )
      } );

      rectangle.setMap( map );

    } );
  } );
}







function mapReady() {
  printGrid();

  heatmapData = new google.maps.MVCArray( [] );
  var heatmap = new google.maps.visualization.HeatmapLayer( {
    data: heatmapData
  } );
  heatmap.setMap( map );

  primus.on( 'data', updateHeatMap );

  $.getJSON( '/data/'+social )
  .done( function splitDataPoints( dataList ) {
    
    /**
     * Split data in 200 pieces to perform better
     */
    var interval = setInterval( function() {
      var list = dataList.splice( 0, 200 );
      updateHeatMap( list );
      
      if( dataList.length===0 )
        clearInterval( interval );
    }, 800 );

  } );

}


function initialize() {
  var mapOptions = {
    center: new google.maps.LatLng( 45.4627338, 9.1777323 ),
    zoom: 14
  };


  map = new google.maps.Map( $map[0], mapOptions );

  mapReady();
}
google.maps.event.addDomListener(window, 'load', initialize);