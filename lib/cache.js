var DEFAULT_EXPIRY = 1800; // seconds

var nodeCache = require( "node-cache" ),
    redis = require( "redis" ),
    nodeCache = require( "node-cache" ),
    url = require( "url" ),
    client;

module.exports = function( options ) {
  var cacheExpiry = options.cacheExpiry || DEFAULT_EXPIRY,
      redisUrl;

  if ( options.REDIS_URL ) {
    redisUrl = url.parse( options.REDIS_URL );
    client = redis.createClient( redisUrl.port, redisUrl.hostname );

    if ( redisUrl.auth ) {
      client.auth( redisUrl.auth.split( ":" )[ 1 ], function( err ) {
        console.log( err );
      });
    }

    client.on( "error", function( err ) {
      console.log( err );
    });

  } else {
    client = new nodeCache({
      stdTTL: cacheExpiry,
      checkperiod: 300
    });
  }

  // Add in missing method so API can be consistent
  if ( !client.hasOwnProperty( "setex" ) ) {
    client.setex = function( key, time, data ) {
      client.set( key, data );
    };
  }

  return {
    read: function( key, callback ) {
      client.get( key, function( err, results ) {
        var response;

        if ( err ) {
          return callback( err );
        }

        if ( !results ) {
          return callback( null, null );
        }

        results = typeof results === "string" ? JSON.parse( results ) : results;

        if ( !Object.keys( results ).length ) {
          return callback( null, null );
        }

        response = results;

        // Both node-cache and redis handle how they respond with their data differently
        if ( typeof results[ key ] === "string" ) {
          response = JSON.parse( results[ key ] );
        }

        callback( null, response );
      });
    },
    write: function( key, data ) {
      data = JSON.stringify( data );
      client.setex( key, cacheExpiry, data );
    }
  };
};
