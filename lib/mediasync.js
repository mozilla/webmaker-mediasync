/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var SERVICES = require( "./services" ),
    loginApi,
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
    return res.json( 500, { status: "failure", reason: "Unsupported service" } );
  }

  function callService( options ) {
    SERVICES[ service ]( options, function( err, results ) {

      if ( err ) {
        return res.json( 500, { status: "failure", reason: "retrieving data for " + service  + " returned an error" } );
      }

      res.json({ status: "okay", results: results.results, currentPage: page, total: results.total });
    });
  }

  if ( query.account ) {

    if ( !email ) {
      return res.json( 500, { status: "failure", reason: "No logged in user in session" } );
    }

    loginApi.getUser( email, function( err, user ) {

      if ( err ) {
        return res.json( 500, { status: "failure", reason: "Failure retrieving webmaker user data." } );
      }

      if ( user.servicesAccounts[ service ] ) {
        options = {
          account: user.servicesAccounts[ service ],
          page: page,
          query: req.query,
          accountQuery: true
        };

        callService( options );
      } else {
        return res.json( 500, { status: "failure", reason: "User doesn't have an account specified for the " + service + "." } );
      }
    });
  } else {
    options.page = page;
    options.query = query;

    callService( options );
  }
};

module.exports = function( loginapi ) {
  loginApi = loginapi;

  return MediaSync;
};