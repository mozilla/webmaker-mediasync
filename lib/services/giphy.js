/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var KEYS = require( "../keys" ),
    request = require( "request" );

module.exports = function( options, callback ) {
  var query = options.query.q,
      limit = options.query.limit,
      offset = ( options.page - 1 ) * limit;

  request({
    method: "GET",
    uri: "http://api.giphy.com/v1/gifs/search?" + KEYS.get( "giphy" ) + "&q=" + query + "&limit=" + limit + "&offset=" + offset
  }, function( err, response, body ) {

    if ( err ) {
      return callback( err );
    }

    var data = JSON.parse( body ),
        images = data.data,
        oldObj,
        tempObj,
        dataArray = [];

    if ( !images ) {
      return callback( "Error: No data returned." );
    }

    for ( var i = 0; i < images.length; i++ ) {
      tempObj = {};
      oldObj = images[ i ];

      tempObj.original = oldObj.images.original;
      tempObj.original.source = tempObj.original.url;
      tempObj.thumbnail = oldObj.images.fixed_width_still;
      tempObj.thumbnail.source = tempObj.thumbnail.url;
      tempObj.title = options.query.q;
      tempObj.type = "Giphy";

      dataArray.push( tempObj );
    }

    callback( null, {
      results: dataArray,
      total: data.pagination.total_count
    });
  });
};