/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var KEYS = require( "../keys" ),
    request = require( "request" );

module.exports = function( options, callback ) {
  var query = options.query.q,
      soundcloudKey = KEYS.get( "soundcloud" ),
      searchURI = "https://api.soundcloud.com/tracks.json?" + soundcloudKey + "&limit={LIMIT}&offset={OFFSET}&q={QUERY}",
      uri = searchURI,
      limit = options.limit,
      page = ( options.page - 1 ) * limit,
      cachedURI;

  uri = uri.replace( "{QUERY}", query );
  cachedURI = uri;
  uri = uri.replace( "{LIMIT}", limit );
  uri = uri.replace( "{OFFSET}", page );

  request({
    method: "GET",
    json: true,
    uri: uri
  }, function( err, response, body ) {

    if ( err ) {
      return callback( err );
    }

    if ( !Array.isArray( body ) || !body.length ) {
      if ( options.isAllQuery ) {
        return callback( null, {
          results: [],
          total: 0,
          service: "SoundCloud"
        });
      } else {
        return callback( "[webmaker-mediasync]: No data successfully retrieved." );
      }
    }

    var oldObj,
        dataArray = [],
        tempObj;

    // Custom parsing of data so results mimic how we build clips in Popcorn Maker
    dataArray = body.map(function( audio ) {
      tempObj = {};

      tempObj.source = audio.permalink_url;
      tempObj.author = audio.user.username;
      tempObj.thumbnail = audio.artwork_url;
      tempObj.duration = audio.duration / 1000;
      tempObj.title = audio.title;
      tempObj.hidden = true;
      tempObj.type = "SoundCloud";

      return tempObj;
    });

    // Results are returned in opposite order as they appear when searching
    // SoundCloud directly.
    dataArray.reverse();

    request({
      method: "GET",
      json: true,
      uri: cachedURI.replace( "{LIMIT}", 200 ).replace( "{OFFSET}", 0 )
    }, function( err, response, body ) {

      if ( err ) {
        return callback( err );
      }

      // If this request failed rather than bailing use the current data array for reported
      // length
      if ( !Array.isArray( body ) ) {
        body = dataArray;
      }

      // SoundCloud has no concept of a total. For now, we cap the total results at 200.
      // TODO: File some sort of followup to investigate a non terrible solution to fix this.
      callback( null, {
        results: dataArray,
        total: body.length,
        service: "SoundCloud"
      });
    });
  });
};
