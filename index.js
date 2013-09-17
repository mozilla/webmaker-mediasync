/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

module.exports = function( app, options ) {
  var MediaSync,
      SERVICES = require( "./lib/services" ),
      KEYS = require( "./lib/keys" );

  options = options || {};

  if ( options.serviceKeys ) {
    // Setup any API keys
    for ( var key in options.serviceKeys ) {
      if ( options.serviceKeys.hasOwnProperty( key ) && options.serviceKeys[ key ] &&
           SERVICES[ key ] ) {
        KEYS.set( key, options.serviceKeys[ key ] );
      }
    }
  }

  MediaSync = require( "./lib/mediasync" )( options.loginAPI );

  app.get( "/api/search/:service", MediaSync.search );
};
