// Load system modules


// Load modules
var mongoose = require( 'mongoose' );
var debug = require( 'debug' )( 'schema' );

// Load my modules

module.exports = exports = function createModel( db ) {
  /**
   * Define instagram schema
   */
  var DataSchema = new mongoose.Schema( {
    id: {
      type: String,
      index: true,
      unique: true
    },
    location: {
      index: '2dsphere',
      type: {}
    }
  }, {
    strict: false
  } );


  debug( 'Loading model' );
  var dataModel = db.model( 'data', DataSchema );

  return dataModel;
};
