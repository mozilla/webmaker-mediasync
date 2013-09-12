/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

 var SERVICES = require( "./lib/services" ),
     MediaSync,
     KEYS = require( "./lib/keys" );

module.exports = function( app, options ) {

  options = options || {};

  if ( options.serviceKeys ) {
    // Setup any API keys
    for ( var key in options.serviceKeys ) {
      if ( options.serviceKeys.hasOwnProperty( key ) && options.serviceKeys[ key ] ) {
        KEYS[ key ] = options.serviceKeys[ key ];
      }
    }
  }

  MediaSync = require( "./lib/mediasync" )( options.loginAPI );

  app.get( "/api/search/:service", MediaSync.search );
};
