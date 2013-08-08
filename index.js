/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

 var SERVICES = {},
     subscribedServices,
     MediaSync,
     async = require( "async" ),
     request = require( "request" );

MediaSync = {
  subscribe: function( services ) {
    subscribedServices = services;
  },
  get: function( callback ) {

  }
};

module.exports = MediaSync;