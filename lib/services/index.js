/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var services = {
      youtube: require( "./youtube" ),
      soundcloud: require( "./soundcloud" ),
      flickr: require( "./flickr" ),
      giphy: require( "./giphy" )
    },
    qs = require( "querystring" ),
    async = require( "async" ),
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
    all: function( options, callback ) {
      validate( options, function( err, options ) {
        if ( err ) {
          return callback( err );
        }

        function callService( type, asyncCallback ) {
          services[ type ]( options, asyncCallback );
        }

        async.map( Object.keys( services ), callService, function( err, results ) {
          if ( err ) {
            return callback( err );
          }

          callback( null, {
            results: results
          });
        });
      });
    },
    youtube: function( options, callback ) {
      validate( options, function( err, options ) {
        if ( err ) {
          return callback( err );
        }

        services.youtube( options, callback );
      });
    },
    soundcloud: function( options, callback ) {
      validate( options, function( err, options ) {
        if ( err ) {
          return callback( err );
        }

        services.soundcloud( options, callback );
      });
    },
    flickr: function( options, callback ) {
      validate( options, function( err, options ) {
        if ( err ) {
          return callback( err );
        }

        services.flickr( options, callback );
      });
    },
    giphy: function( options, callback ) {
      validate( options, function( err, options ) {
        if ( err ) {
          return callback( err );
        }

        services.giphy( options, callback );
      });
    }
  };
};