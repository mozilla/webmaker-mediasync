/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var KEYS = require( "../keys" ),
    request = require( "request" ),
    async = require( "async" ),
    traverse = require( "JSON-object-traverse" );

module.exports = function( options, callback ) {
  var query = options.query.q,
      limit = options.limit,
      flickrKey = KEYS.get( "flickr" ),
      jsonBits = "&format=json&nojsoncallback=flickr",
      page = ( options.page - 1 ) * limit;

  function getPhoto( photo, callback ) {
    // we have to store the photo's title from the original data set.
    var title = photo.title,
        imageSizes = [
          "Large",
          "Medium 800",
          "Medium 640",
          "Medium",
          "Small 320",
          "Small",
          "Large Square",
          "Square",
          "Original"
        ];

    request({
      method: "GET",
      json: true,
      uri: "https://secure.flickr.com/services/rest/?method=flickr.photos.getSizes&" + flickrKey +
           "&photo_id=" + photo.id + jsonBits
    }, function( err, response, body ) {
      if ( err ) {
        return callback( err );
      }

      if ( !body || !body.sizes || !body.sizes.size ) {
        return callback( null, {} );
      }

      var sizes = body.sizes.size,
          obj = {},
          sourceImage,
          thumbnail;

      thumbnail = sizes.filter(function( image ) {
        return image.label === "Thumbnail" ? image : null;
      })[ 0 ];

      imageSizes.forEach(function( size ) {
        var image;

        if ( !sourceImage ) {
          image = sizes.filter(function( image ) {
            return image.label === size ? image : null;
          });

          if ( image.length ) {
            sourceImage = image[ 0 ];
          }
        }
      });

      if ( !thumbnail && sizes[ 0 ] ) {
        thumbnail = sizes[ 0 ];
      }

      if ( !sourceImage && thumbnail ) {
        sourceImage = thumbnail;
      }

      // All possible fallbacks used, return an empty object.
      if ( !sourceImage ) {
        return callback( null );
      }

      obj.source = sourceImage.source;
      obj.thumbnail = thumbnail.source;
      obj.title = title;
      obj.type = "Flickr";

      callback( null, obj );
    });
  }

  function getPhotoLinks( data ) {
    traverse( data );
    if ( !data.traverse( "photos.photo", "" ) || !data.traverse( "photos.photo.length", 0 ) ||
         !Array.isArray( data.traverse( "photos.photo", "" ) ) ) {
      return callback( null, [] );
    }

    var totalPhotos = data.traverse( "photos.total", 0 );

    async.map( data.photos.photo, getPhoto, function( err, results ) {
      if ( err ) {
        return callback( err );
      }

      callback( null, {
        results: results,
        total: parseInt( totalPhotos, 10 ),
        service: "Flickr"
      });
    });
  }

  function doSearch( id ) {
    var uri = "https://secure.flickr.com/services/rest/?method=flickr.photos.search&" + flickrKey +
              "&page=" + options.page + "&per_page=" + limit + "&text=" + query + jsonBits;

    request({
      method: "GET",
      uri: uri,
      json: true
    }, function( err, response, body ) {
      if ( err ) {
        return callback( err );
      }

      if ( !body ) {
        return callback( new Error( "[webmaker-mediasync]: No data successfully retrieved." ) );
      } else if ( body.stat === "fail" || ( body.photos && !body.photos.photo.length ) ) {
        if ( options.isAllQuery ) {
          return callback( null, {
            results: [],
            total: 0,
            service: "Flickr"
          });
        } else {
          return callback( new Error( "[webmaker-mediasync]: No data successfully retrieved.") );
        }
      }

      if ( body.stat === "ok" ) {
        getPhotoLinks( body );
        return;
      }

      callback( new Error( "[webmaker-mediasync]: Something went horribly wrong." ));
    });
  }

  doSearch();
};
