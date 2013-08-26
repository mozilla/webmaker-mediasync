/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

 var SERVICES = require( "./lib/services" ),
     MediaSync,
     subscribedServices = [
       "youtube",
       "soundcloud",
       "flickr"
     ],
     KEYS = require( "./lib/keys" );

module.exports = function( app, options ) {

  options = options || {};

  if ( options.serviceKeys ) {
    // Rather than use defaults, overwrite
    subscribedServices = [];
    // Setup any API keys
    for ( var key in options.serviceKeys ) {
      if ( options.serviceKeys.hasOwnProperty( key ) ) {
        KEYS[ key ] = options.serviceKeys[ key ];
        subscribedServices.push( key );
      }
    }
  }

  MediaSync = require( "./lib/mediasync" )( subscribedServices, options.loginAPI );

  app.get( "/api/webmaker/mediasync/:service", MediaSync.accounts );
  app.get( "/api/webmaker/:service", MediaSync.get );
};