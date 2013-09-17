/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var KEYS = require( "../keys" ),
    request = require( "request" ),
    async = require( "async" );

module.exports = function( options, callback ) {
  var query = options.query.q,
      limit = options.query.limit,
      flickrKey = KEYS.get( "flickr" ),
      jsonBits = "&format=json&nojsoncallback=flickr",
      page = ( options.page - 1 ) * limit;

  function getPhoto( photo, callback ) {
    // we have to store the photo's title from the original data set.
    var title = photo.title;

    request({
      method: "GET",
      json: true,
      uri: "https://secure.flickr.com/services/rest/?method=flickr.photos.getSizes&" + flickrKey +
           "&photo_id=" + photo.id + jsonBits
    }, function( err, response, body ) {
      if ( err ) {
        return callback( err );
      }

      var sizes = body.sizes.size,
          obj = {};

      if ( !sizes ) {
        return callback( null, obj );
      }

      for ( var i = 0; i < sizes.length; i++ ) {
        if ( sizes[ i ].label === "Original" ) {
          obj.original = sizes[ i ];
        }

        if ( sizes[ i ].label === "Thumbnail" ) {
          obj.thumbnail = sizes[ i ];
        }
      }

      if ( !obj.original ) {
        obj.fallback = sizes[ sizes.length - 1 ];
      }

      obj.title = title;
      obj.type = "Flickr";

      callback( null, obj );
    });
  }

  function getPhotoLinks( data ) {
    if ( !data.photos.photo || !data.photos.photo.length || !Array.isArray( data.photos.photo ) ) {
      return callback( null, [] );
    }

    var totalPhotos = data.photos.total;

    async.map( data.photos.photo, getPhoto, function( err, results ) {
      if ( err ) {
        return callback( err );
      }

      callback( null, {
        results: results,
        total: totalPhotos
      });
    });
  }

  function doSearch( id ) {
    var uri = "https://secure.flickr.com/services/rest/?method=flickr.photos.search&" + flickrKey +
              "&page=" + options.page + "&per_page=" + limit + "&text=" + query + jsonBits;

    if ( id ) {
      uri += "&user_id=" + id;
    }

    request({
      method: "GET",
      uri: uri,
      json: true
    }, function( err, response, body ) {
      if ( err ) {
        return callback( err );
      }

      var totalPhotos = body.photos.total;

      if ( body.stat === "fail" ) {
        return callback( "Unknown user" );
      }

      getPhotoLinks( body );
    });
  }

  if ( options.account ) {
    request({
      method: "GET",
      json: true,
      uri: "https://secure.flickr.com/services/rest/?method=flickr.people.findByUsername&" + flickrKey +
           "&username=" + options.account + jsonBits
    }, function( err, response, body ) {
      if ( err ) {
        return callback( err );
      }

      var user_id = body.user.nsid;

      doSearch( user_id );
    });
  } else {
    doSearch();
  }
};