/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var request = require( "request" ),
    async = require( "async" ),
    qs = require( "querystring" );

module.exports = function( options, callback ) {

  function getMetaData( video, asyncCallback ) {
    var timeString = "#start/" + video.start + "/end/" + ( parseInt( video.start, 10 ) + 30 ),
        escapedUrl = qs.escape( "https://archive.org/details/" + video.identifier + timeString );

    request({
      method: "GET",
      json: true,
      uri: "https://archive.org/services/maker.php?url=" + escapedUrl
    }, function( err, response, body ) {
      var tempObj = {};

      if ( err ) {
        return asyncCallback( err );
      }

      tempObj.source = body.media;
      tempObj.thumbnail = body.thumb;
      tempObj.duration = body.duration;
      tempObj.author = body.title;
      tempObj.title = body.title;
      tempObj.type = "Archive";
      tempObj.linkback = body.linkback;

      asyncCallback( null, tempObj );
    });
  }

  var query = options.query.q,
      uri = "https://archive.org/details/tv?output=json&sort=start+desc&q={QUERY}&rows={LIMIT}",
      limit = options.limit;

  uri = uri.replace( "{QUERY}", query );
  uri = uri.replace( "{LIMIT}", limit );

  request({
    method: "GET",
    json: true,
    uri: uri
  }, function( err, response, body ) {
    var results;

    if ( err ) {
      return callback( err );
    }

    if ( !Array.isArray( body ) ) {
      return callback( null, [] );
    }

    async.map( body, getMetaData, function( err, results ) {
      if ( err ) {
        return callback( err );
      }

      callback( null, {
        results: results,
        total: results.length
      });
    });
  });
};
