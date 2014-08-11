/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var SERVICES = require( "./services" ),
    KEYS = require( "./keys" ),
    cacheModule = require( "./cache" ),
    cache,
    MediaSync = {};

MediaSync.search = function( req, res ) {
  var service = req.params.service,
      page = parseInt( req.query.page, 10 ),
      query = req.query,
      email = req.session.email,
      cacheSearchKey,
      cachedSearch,
      options = {};

  if ( !page ) {
    page = 1;
  }

  if ( service ) {
    service = service.toLowerCase();
  }

  cacheSearchKey = service + "-" + page + "-" + query.q;

  if ( service === "all" ) {
    options.isAllQuery = true;
  }

  if ( !service || !SERVICES[ service ] ) {
    return res.json( 500, { status: "failure", reason: "[webmaker-mediasync]: Unsupported service" } );
  }

  if ( !KEYS.get( service ) ) {
    return res.json( 500, { status: "failure", reason: "[webmaker-mediasync]: No API Key" } );
  }

  function callService() {
    SERVICES[ service ]( options, function( err, results ) {
      var searchResults = [];

      if ( err ) {
        return res.json( 500, {
          status: "failure",
          reason: "[webmaker-mediasync]: Retrieving data for " + service  + " failed",
          error: err
        });
      }

      if ( results && results.results ) {
        searchResults = results.results;
      }

      if ( !options.isAllQuery ) {
        searchResults = [ results ];
      }

      var responseObject = {
        status: "okay",
        results: searchResults,
        currentPage: page,
        total: results.total
      };

      // Add the first page of each service to the cache as well
      if ( service === "all" ) {
        var totalResults = 0;

        responseObject.results.forEach(function( queryResults ) {
          totalResults += queryResults.total;

          cache.write( queryResults.service.toLowerCase() + "-1-" + query.q, {
            status: "okay",
            results: [ queryResults ],
            currentPage: page,
            total: queryResults.total
          });
        });

        responseObject.total = totalResults;
      }

      cache.write( cacheSearchKey, responseObject );
      res.json( responseObject );
    });
  }

  options.page = page;
  options.query = query;

  cache.read( cacheSearchKey, function( err, results ) {
    if ( err ) {
      return res.json( 500, {
        status: "failure",
        reason: "[webmaker-mediasync]: Retrieving data for " + service  + " failed",
        error: err
      });
    }

    if ( results ) {
      return res.json( results );
    }

    callService();
  });
};

module.exports = function( options ) {
  cache = cacheModule( options );

  return MediaSync;
};
