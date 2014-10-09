/* global areas, google, subAreaIndex, areaIndex, Primus, social, oboe, dat */
/* jshint browser: true*/
/* jshint jquery: true */

var primus = new Primus();
var $map = $( '#map' );
var map;

var green = 'rgb(177, 191, 114)';
var blue = 'rgb(114, 163, 191)';
var red = 'rgb(191, 114, 139)';
var heatmapData;
var heatmap;
var gui;




function addMarker( lat, lng, title ) {
  new google.maps.Marker( {
      position: new google.maps.LatLng( lat, lng ),
      title: title,
      map: map
  } );
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
  heatmapData.push( new google.maps.LatLng( lat, lng ) );
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
  // printGrid();

  heatmapData = new google.maps.MVCArray( [] );
  heatmap = new google.maps.visualization.HeatmapLayer( {
    data: heatmapData
  } );
  heatmap.setMap( map );


  var settings = {};

  Object.defineProperties( settings, {
    'opacity': {
      set: function( val ) {
        heatmap.set( 'opacity', val );
      },
      get: function() {
        return heatmap.get( 'opacity' ) || 0.4;
      }
    },
    'radius': {
      set: function( val ) {
        heatmap.set( 'radius', val );
      },
      get: function() {
        return heatmap.get( 'radius' ) || 10;
      }
    },
    'maxIntensity': {
      set: function( val ) {
        heatmap.set( 'maxIntensity', val===0? false : val );
      },
      get: function() {
        return heatmap.get( 'maxIntensity' ) || 0;
      }
    },
    'dissipating': {
      set: function( val ) {
        heatmap.set( 'dissipating', val );
      },
      get: function() {
        return heatmap.get( 'dissipating' ) || false;
      }
    }
  } );

  gui = new dat.GUI();
  gui.add( settings, 'opacity', 0, 1 );
  gui.add( settings, 'radius', 5, 60 );
  gui.add( settings, 'maxIntensity', 0, 60 );
  gui.add( settings, 'dissipating' );



  //primus.on( 'data', updateHeatMap );


  oboe( '/data/'+social )
  .node( '!.*', function gotData( data ) {
    var location = data.location;
    addHeatmapPoint( location.coordinates[ 1 ], location.coordinates[ 0 ] );
    return oboe.drop;
  } );
}


function initialize() {
  var mapOptions = {
    center: new google.maps.LatLng( 45.4627338, 9.1777323 ),
    zoom: 13
  };


  map = new google.maps.Map( $map[0], mapOptions );

  mapReady();
}
google.maps.event.addDomListener(window, 'load', initialize);