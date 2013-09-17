/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var youtube = require( "./youtube" ),
    soundcloud = require( "./soundcloud" ),
    flickr = require( "./flickr" ),
    giphy = require( "./giphy" ),
    qs = require( "querystring" ),
    LIMIT = 30;

function validate( options, validateCallback ) {
  var query = options.query.q,
      limit = parseInt( options.query.limit, 10 ) || LIMIT;

  if ( !query ) {
    return validateCallback( "Request must contain a query" );
  }

  options.query.q = qs.escape( query );
  options.query.limit = limit;

  validateCallback( null, options );
}

module.exports = {
  youtube: function( options, callback ) {
    validate( options, function( err, options ) {
      if ( err ) {
        return callback( err );
      }

      youtube( options, callback );
    });
  },
  soundcloud: function( options, callback ) {
    validate( options, function( err, options ) {
      if ( err ) {
        return callback( err );
      }

      soundcloud( options, callback );
    });
  },
  flickr: function( options, callback ) {
    validate( options, function( err, options ) {
      if ( err ) {
        return callback( err );
      }

      flickr( options, callback );
    });
  },
  giphy: function( options, callback ) {
    validate( options, function( err, options ) {
      if ( err ) {
        return callback( err );
      }

      giphy( options, callback );
    });
  }
};