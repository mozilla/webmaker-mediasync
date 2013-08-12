/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

 var SERVICES = {},
     subscribedServices,
     MediaSync,
     async = require( "async" ),
     request = require( "request" ),
     KEYS = {};

SERVICES.youtube = function( callback ) {
  // "key=AI39si5ZfBxRlydtwyL9VaAA9uOAP5J_HBIKyGJ4mZFMT-IalVyAJ5nyi_xadcONfKwcrSXl9DPFWZx_y1K1ccJ1ZbhpZf_quQ"
  // https://gdata.youtube.com/feeds/api/users/{{ id }}/uploads?alt=json
};

SERVICES.soundcloud = function( callback ) {
  // https://api.soundcloud.com/users/{{ id }}/tracks?client_id=908c9df6f4cd8299277dc162e1bd0806
};

SERVICES.flickr = function( callback ) {

};

// What the fuck.
SERVICES.rackspace = function( callback ) {

};

MediaSync = {
  subscribe: function( services ) {
    subscribedServices = services;
  },
  get: function( req, res ) {

    function getData( service, callback ) {
      console.log(service);
      callback( null, [] );
    }

    async.map( SERVICES, getData, function( err, results ) {
      res.json({ status: "okay"});
    });
  }
};

module.exports = function( app, options, services ) {
  MediaSync.subscribe( services );

  // Setup any API keys
  for ( var key in options.keys ) {
    if ( options.keys.hasOwnProperty( key ) ) {
      KEYS[ key ] = options.keys[ key ];
    }
  }

  app.get( "/api/webmaker/mediasync", MediaSync.get );
};