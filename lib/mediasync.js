/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var SERVICES = require( "./services" ),
    KEYS = require( "./keys" ),
    MediaSync = {};

MediaSync.search = function( req, res ) {
  var service = req.params.service,
      page = parseInt( req.query.page, 10 ),
      query = req.query,
      email = req.session.email,
      options = {};

  if ( !page ) {
    page = 1;
  }

  if ( service ) {
    service = service.toLowerCase();
  }

  if ( !service || !SERVICES[ service ] ) {
    return res.json( 500, { status: "failure", reason: "[webmaker-mediasync]: Unsupported service" } );
  }

  if ( !KEYS.get( service ) ) {
    return res.json( 500, { status: "failure", reason: "[webmaker-mediasync]: No API Key" } );
  }

  function callService( options ) {
    SERVICES[ service ]( options, function( err, results ) {

      if ( err ) {
        return res.json( 500, {
          status: "failure",
          reason: "[webmaker-mediasync]: Retrieving data for " + service  + " failed",
          error: err
        });
      }

      res.json({ status: "okay", results: results.results, currentPage: page, total: results.total });
    });
  }

  options.page = page;
  options.query = query;

  callService( options );
};

module.exports = MediaSync;
