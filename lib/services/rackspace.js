/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var CACHED_TOKEN,
    CACHED_TOKEN_EXPIRE_DATE,
    CACHED_FILES_CDN_URL,
    CACHED_FILES_URL,
    CACHED_CONTAINER_CDN_URLS = {},
    FORMAT_STRING = "YYYY-MM-DDTHH:mm:ssZ";

var KEYS = require( "../keys" ),
    request = require( "request" ),
    qs = require( "querystring" ),
    traverse = require( "JSON-object-traverse" ),
    moment = require( "moment" ),
    qs = require( "querystring" ),
    async = require( "async" );

function getAuthToken( callback ) {
  var username = KEYS.get( "rackspace" ).split( "~" )[ 0 ],
      apiKey = KEYS.get( "rackspace" ).split( "~" )[ 1 ];

  request({
    method: "POST",
    json: true,
    body: {
      "auth": {
        "RAX-KSKEY:apiKeyCredentials": {
          "username": username,
          "apiKey": apiKey
        }
      }
    },
    uri: "https://identity.api.rackspacecloud.com/v2.0/tokens"
  }, function( err, response, body ) {

    if ( err ) {
      return callback( err );
    }

    // Cache the AUTH token to reduce API calls
    CACHED_TOKEN_EXPIRE_DATE = moment( body.access.token.expires ).format( FORMAT_STRING );
    CACHED_TOKEN = body.access.token.id;

    for ( var i = 0; i < body.access.serviceCatalog.length; i++ ) {
      var service = body.access.serviceCatalog[ i ];

      if ( service.name === "cloudFiles" ) {
        CACHED_FILES_URL = service.endpoints[ 0 ].publicURL;
      }

      if ( service.name === "cloudFilesCDN" ) {
        CACHED_FILES_CDN_URL = service.endpoints[ 0 ].publicURL;
      }
    }

    if ( !CACHED_FILES_URL || !CACHED_FILES_CDN_URL ) {
      return callback( "[webmaker-mediasync]: No CDN or Files url found" );
    }

    callback();
  });
}

module.exports = {
  service: function( options, callback ) {
    var container = options.query.container,
        currentDate = moment().format( FORMAT_STRING );

    function getFileInformation( file, asyncCallback ) {

      request({
        method: "HEAD",
        json: true,
        headers: {
          "X-Auth-Token": CACHED_TOKEN
        },
        uri: CACHED_FILES_URL + "/" + container + "/" + qs.escape( file.name )
      }, function( err, response, body ) {

        if ( err ) {
          return asyncCallback( err );
        }

        var dataObj = {};

        dataObj.type = "RackSpace";
        dataObj.author = "Fivel";
        dataObj.duration = response.headers[ "x-object-meta-duration" ];
        dataObj.thumbnail = response.headers[ "x-object-meta-thumbnail" ];
        dataObj.title = file.name;
        dataObj.source = CACHED_CONTAINER_CDN_URLS[ container ] + "/" + file.name;

        asyncCallback( null, dataObj );
      });
    }

    function getContainerFiles( err ) {
      if ( err ) {
        return callback( err );
      }

      request({
        method: "GET",
        json: true,
        headers: {
          "X-Auth-Token": CACHED_TOKEN
        },
        uri: CACHED_FILES_URL + "/" + container
      }, function( err, response, body ) {

        if ( err ) {
          return callback( err );
        }

        async.map( body, getFileInformation, function( err, results ) {
          if ( err ) {
            return callback( err );
          }

          callback( null, {
            results: results,
            total: results.length
          });
        });
      });
    }

    if ( !CACHED_TOKEN_EXPIRE_DATE || currentDate > CACHED_TOKEN_EXPIRE_DATE ) {
      getAuthToken( getContainerFiles );
      return;
    }

    getContainerFiles();
  },
  containers: function( req, res ) {
    var currentDate = moment().format( FORMAT_STRING );

    function getContainerNames( err ) {

      if ( err ) {
        return res.json( 500, {
          status: "failure",
          reason: "[webmaker-mediasync]: Retrieving data for rackspace container names failed",
          error: err
        });
      }

      request({
        method: "GET",
        json: true,
        headers: {
          "X-Auth-Token": CACHED_TOKEN
        },
        uri: CACHED_FILES_CDN_URL + "?enabled_only=true"
      }, function( err, response, body ) {

        if ( err ) {
          return res.json( 500, {
            status: "failure",
            reason: "[webmaker-mediasync]: Retrieving data for rackspace container names failed",
            error: err
          });
        }

        var containers = [];

        for ( var i = 0; i < body.length; i++ ) {
          var container = body[ i ];

          if ( container.log_retention ) {
            containers.push( container.name );
            CACHED_CONTAINER_CDN_URLS[ container.name ] = container.cdn_uri;
          }
        }

        res.json({
          containerNames: containers
        });
      });
    }

    if ( !CACHED_TOKEN_EXPIRE_DATE || currentDate > CACHED_TOKEN_EXPIRE_DATE ) {
      getAuthToken( getContainerNames );
      return;
    }

    getContainerNames();
  }
};

