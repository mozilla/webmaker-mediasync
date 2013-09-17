/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var KEYS = require( "../keys" ),
    request = require( "request" );

module.exports = function( options, callback ) {

  function parse( data ) {
    var tempObj,
        oldObj,
        dataArray = [];

    data = data || [];

    // Custom parsing of data so each results mimics results from normal search api.
    for ( var i = 0; i < data.length; i++ ) {
      tempObj = {};
      oldObj = data[ i ];

      tempObj.source = oldObj.link[ 0 ].href;
      tempObj.author = oldObj.author[ 0 ].name.$t;
      tempObj.thumbnail = oldObj.media$group.media$thumbnail[ 0 ].url;
      tempObj.duration = oldObj.media$group.yt$duration.seconds;
      tempObj.title = oldObj.title.$t;
      tempObj.type = "YouTube";

      dataArray.push( tempObj );
    }

    // Results are returned in opposite order as they appear when searching
    // YouTube directly.
    dataArray.reverse();

    return dataArray;
  }

  function getActualTotal( options ) {
    request({
      method: "GET",
      headers: options.headers,
      uri: options.uri.replace( "NEW_INDEX", options.index )
    }, function( err, response, body ) {

      if ( err ) {
        return callback( err );
      }

      if ( body === "Invalid start-index" ) {
        return callback( "Error: Invalid Page" );
      }

      var data = JSON.parse( body );

      if ( !data.feed.entry || !data.feed.entry.length ) {
        options.index = options.index - limit;
        return getActualTotal( options );
      }

      var actualTotal = ( options.index + data.feed.entry.length ) - 1;

      options.callback( null, {
        results: options.results,
        total: actualTotal
      });
    });
  }

  var query = options.query.q,
      accountURI = "https://gdata.youtube.com/feeds/api/users/{ACCOUNT}/uploads?alt=json&max-results={LIMIT}&q={QUERY}",
      searchURI = "https://gdata.youtube.com/feeds/api/videos?max-results={LIMIT}&orderby=relevance&alt=json&q={QUERY}",
      headers = {
        "X-GData-Version": 2
      },
      uri = searchURI,
      limit = options.query.limit,
      page = ( ( options.page - 1 ) * limit ) + 1,
      searchLimit = 1000,
      cachedURI;

  // Most of the time searching against YouTube hit's up a cached API, that arbitrarily limits
  // results to 1000, even though the reported total might be 1 million. If the
  // offset + limit are greater than that, the query will fail.
  if ( page + limit > searchLimit ) {
    limit = ( searchLimit - page ) + 1;
  }

  if ( options.account ) {
    uri = accountURI;
    uri = uri.replace( "{ACCOUNT}", options.account );
    headers = {
      "X-GData-Key": KEYS.get( "youtube" )
    };
  }

  uri = uri.replace( "{QUERY}", query );
  uri = uri.replace( "{LIMIT}", limit );
  cachedURI = uri;
  uri += "&start-index=" + page;

  request({
    method: "GET",
    headers: headers,
    uri: uri
  }, function( err, response, body ) {

    if ( err ) {
      return callback( err );
    }

    var base = JSON.parse( body ),
        data = base.feed.entry,
        results = parse( data ),
        index = ( searchLimit - limit ) + 1;

    // YouTube reports something like 1 million. We limit it to 1000.
    // Even then, it doesn't actually have 1000 results I can get.
    getActualTotal({
      index: index,
      headers: headers,
      results: results,
      callback: callback,
      uri: cachedURI + "&start-index=NEW_INDEX"
    });
  });
};