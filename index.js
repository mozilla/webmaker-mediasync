/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

 var SERVICES = {},
     subscribedServices = [],
     MediaSync = {},
     async = require( "async" ),
     request = require( "request" ),
     KEYS = {};

KEYS.youtube = "key=AI39si5ZfBxRlydtwyL9VaAA9uOAP5J_HBIKyGJ4mZFMT-IalVyAJ5nyi_xadcONfKwcrSXl9DPFWZx_y1K1ccJ1ZbhpZf_quQ";
KEYS.soundcloud = "client_id=908c9df6f4cd8299277dc162e1bd0806";

SERVICES.youtube = function( callback ) {
  request({
    method: "GET",
    headers: {
      "X-GData-Key": KEYS.youtube
    },
    uri: "https://gdata.youtube.com/feeds/api/users/Ezimodner/uploads?alt=json"
  }, function( err, response, body ) {

    if ( err ) {
      return callback( err );
    }

    var data = JSON.parse( body );
    callback( null, data.feed.entry );

  });
};

SERVICES.soundcloud = function( callback ) {
  request({
    method: "GET",
    uri: "https://api.soundcloud.com/users/octobersveryown/tracks.json?" + KEYS.soundcloud
  }, function( err, response, body ) {

    if ( err ) {
      return callback( err );
    }

    var data = JSON.parse( body );
    callback( null, data );
  });
};

SERVICES.flickr = function( callback ) {
  callback( null, [] );
};

// What the fuck.
SERVICES.rackspace = function( callback ) {
  callback( null, [] );
};

MediaSync.get = function( req, res ) {
  function getData( service, callback ) {
    SERVICES[ service ]( function( err, results ) {

      if ( err ) {
        return res.json( 500, { status: "failure", reason: "retrieving data for " + service " returned an error" } );
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

module.exports = function( app, options ) {

  // Setup any API keys
  for ( var key in options.keys ) {
    if ( options.keys.hasOwnProperty( key ) ) {
      if ( key === "rackspace" ) {
        KEYS[ key ] = options.keys[ key ];
      }

      subscribedServices.push( key );
    }
  }

  app.get( "/api/webmaker/mediasync", MediaSync.get );
};