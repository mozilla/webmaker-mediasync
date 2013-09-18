/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var KEYS = require( "../keys" ),
    request = require( "request" ),
    traverse = require( "JSON-object-traverse" );

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
      traverse( oldObj );

      tempObj.source = oldObj.traverse( "link[ 0 ].href", "" );
      tempObj.author = oldObj.traverse( "author[ 0 ].name.$t", "" );
      tempObj.thumbnail = oldObj.traverse( "media$group.media$thumbnail[ 0 ].url", "" );
      tempObj.duration = oldObj.traverse( "media$group.yt$duration.seconds", 0 );
      tempObj.title = oldObj.traverse( "title.$t", "" );
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
      json: true,
      uri: options.uri.replace( "NEW_INDEX", options.index )
    }, function( err, response, body ) {

      if ( err ) {
        return callback( err );
      }

      if ( !body.feed.entry || !body.feed.entry.length ) {
        options.index = options.index - limit;
        return getActualTotal( options );
      }

      var actualTotal = ( options.index + body.feed.entry.length ) - 1;

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
    json: true,
    uri: uri
  }, function( err, response, body ) {

    if ( err ) {
      return callback( err );
    }

    var data = body.feed.entry,
        results = parse( data ),
        index = ( searchLimit - limit ) + 1;

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