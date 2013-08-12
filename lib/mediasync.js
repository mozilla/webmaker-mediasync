var SERVICES = require( "./services" ),
    async = require( "async" ),
    subscribedServices = [
      "youtube",
      "soundcloud",
      "flickr"
    ],
    MediaSync = {};

MediaSync.all = function( req, res ) {
  function getData( service, callback ) {
    SERVICES[ service ]( function( err, results ) {

      if ( err ) {
        return res.json( 500, { status: "failure", reason: "retrieving data for " + service  + " returned an error" } );
      }

      results = {
        type: service,
        data: results
      };

      callback( null, results );
    });
  }

  async.map( subscribedServices, getData, function( err, results ) {

    if ( err ) {
      return res.json( 500, { status: "failure", reason: err } );
    }

    res.json({ status: "okay", data: results });
  });
};

MediaSync.get = function( req, res ) {

};

MediaSync.subscribedServices = subscribedServices;

module.exports = MediaSync;