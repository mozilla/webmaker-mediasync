/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

module.exports = function( app, options ) {
  options = options || {};

  var MediaSync,
      SERVICES = require( "./lib/services" )( options.limit ),
      KEYS = require( "./lib/keys" );

  if ( options.serviceKeys ) {
    // Setup any API keys
    for ( var key in options.serviceKeys ) {
      if ( options.serviceKeys.hasOwnProperty( key ) && options.serviceKeys[ key ] ) {
        KEYS.set( key, options.serviceKeys[ key ] );
      }
    }
  } else {
    throw new Error( "[webmaker-mediasync]: No service keys were provided!" );
  }

  MediaSync = require( "./lib/mediasync" )( options );

  app.get( "/api/webmaker/search/:service", MediaSync.search );
};
