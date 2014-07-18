/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var request = require( "request" ),
    traverse = require( "JSON-object-traverse" );

module.exports = function( options, callback ) {

  function parse( data ) {
    var tempObj,
        oldObj,
        dataArray = [];

    data = data || [];

    // Custom parsing of data so each results mimics results from normal search api.
    dataArray = data.map(function( video ) {
      tempObj = {};
      traverse( video );

      tempObj.source = video.traverse( "link[ 0 ].href", "" );
      tempObj.author = video.traverse( "author[ 0 ].name.$t", "" );
      tempObj.thumbnail = video.traverse( "media$group.media$thumbnail[ 0 ].url", "" );
      tempObj.duration = video.traverse( "media$group.yt$duration.seconds", 0 );
      tempObj.title = video.traverse( "title.$t", "" );
      tempObj.type = "YouTube";

      return tempObj;
    });

    // Results are returned in opposite order as they appear when searching
    // YouTube directly.
    dataArray.reverse();

    return dataArray;
  }

  function getActualTotal( options ) {
    request({
      method: "GET",
      headers: options.headers,
      json: true,
      uri: options.uri.replace( "NEW_INDEX", options.index )
    }, function( err, response, body ) {

      if ( err ) {
        return callback( err );
      }

      if ( !body || !body.feed ) {
        return callback( "[webmaker-mediasync]: No data successfully retrieved when getting total." );
      }

      if ( !body.feed.entry || !body.feed.entry.length ) {
        options.index = options.index - limit;
        return getActualTotal( options );
      }

      var actualTotal = ( options.index + body.feed.entry.length ) - 1;

      options.callback( null, {
        results: options.results,
        total: actualTotal,
        service: "YouTube"
      });
    });
  }

  var query = options.query.q,
      searchURI = "https://gdata.youtube.com/feeds/api/videos?max-results={LIMIT}&orderby=relevance&alt=json&q={QUERY}",
      headers = {
        "X-GData-Version": 2
      },
      uri = searchURI,
      limit = options.limit,
      page = ( ( options.page - 1 ) * limit ) + 1,
      searchLimit = 500,
      cachedURI;

  uri = uri.replace( "{QUERY}", query );
  uri = uri.replace( "{LIMIT}", limit );
  cachedURI = uri;
  uri += "&start-index=" + page;

  request({
    method: "GET",
    headers: headers,
    json: true,
    uri: uri
  }, function( err, response, body ) {

    if ( err ) {
      return callback( err );
    }

    if ( !body || !body.feed ) {
      if ( options.isAllQuery ) {
        return callback( null, {
          results: [],
          total: 0,
          service: "YouTube"
        });
      } else {
        return callback( "[webmaker-mediasync]: No data successfully retrieved." );
      }
    }

    var feed = body.feed,
        data = feed.entry,
        results = parse( data ),
        index = ( searchLimit - limit ) + 1;

    if ( !data || !Array.isArray( data ) || !data.length ) {
      if ( options.isAllQuery ) {
        return callback( null, {
          results: [],
          total: 0,
          service: "YouTube"
        });
      } else {
        return callback( "[webmaker-mediasync]: No data successfully retrieved." );
      }
    }

    traverse( feed );

    if ( feed.traverse( "openSearch$totalResults.$t", 0 ) === 1 ) {
      return callback( null, {
        results: results,
        total: 1,
        service: "YouTube"
      });
    }

    // YouTube reports something like 1 million. We limit it to 1000.
    // Even then, it doesn't actually have 1000 results I can get sometimes.
    getActualTotal({
      index: index,
      headers: headers,
      results: results,
      callback: callback,
      uri: cachedURI + "&start-index=NEW_INDEX"
    });
  });
};
