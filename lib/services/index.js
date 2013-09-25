/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var youtube = require( "./youtube" ),
    soundcloud = require( "./soundcloud" ),
    flickr = require( "./flickr" ),
    giphy = require( "./giphy" ),
    qs = require( "querystring" ),
    LIMIT;

function validate( options, validateCallback ) {
  var query = options.query.q;

  if ( !query ) {
    return validateCallback( "[webmaker-mediasync]: Request must contain a query" );
  }

  options.query.q = qs.escape( query );
  options.limit = LIMIT;

  validateCallback( null, options );
}

module.exports = function( limit ) {
  LIMIT = limit || 30;

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
};