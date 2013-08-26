var SERVICES = {},
    KEYS = require( "./keys" ),
    request = require( "request" ),
    LIMIT = 10,
    async = require( "async" ),
    qs = require( "querystring" );

SERVICES.giphy = function( options, callback ) {
  var query = options.query.q,
      offset = ( options.page - 1 ) * LIMIT;

  query = qs.escape( query );

  request({
    method: "GET",
    uri: "http://api.giphy.com/v1/gifs/search?" + KEYS.giphy + "&q=" + query + "&limit=" + LIMIT + "&offset=" + offset
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

      dataArray.push( tempObj );
    }

    callback( null, {
      results: dataArray,
      total: data.pagination.total_count
    });
  });
};

SERVICES.youtube = function( options, callback ) {
  var page = ( ( options.page - 1 ) * LIMIT ) + 1;

  function youtubeAccount() {
    request({
      method: "GET",
      headers: {
        "X-GData-Key": KEYS.youtube
      },
      uri: "https://gdata.youtube.com/feeds/api/users/" + options.account + "/uploads?alt=json&max-results=" + LIMIT +
           "&start-index=" + page
    }, function( err, response, body ) {

      if ( err ) {
        return callback( err );
      }

      if ( body === "Invalid start-index" ) {
        return callback( "Error: Invalid Page" );
      }

      var base = JSON.parse( body ),
          data = base.feed.entry,
          oldObj,
          dataArray = [],
          tempObj;

      if ( !data ) {
        return callback( "Error: No data returned." );
      }

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

      callback( null, {
        results: dataArray,
        total: base.feed.openSearch$totalResults.$t
      });

    });
  }

  function youtubeSearch( options, callback ) {
    return callback( null, [] );
  }

  if ( options.accountQuery ) {
    return youtubeAccount();
  }

  youtubeSearch();
};

SERVICES.soundcloud = function( options, callback ) {
  function soundcloudAccount() {
    request({
      method: "GET",
      uri: "https://api.soundcloud.com/users/" + options.account + "/tracks.json?" + KEYS.soundcloud +
           "&limit=" + LIMIT + "&offset=" + ( options.page - 1 ) * LIMIT
    }, function( err, response, body ) {

      if ( err ) {
        return callback( err );
      }

      var data = JSON.parse( body ),
          oldObj,
          dataArray = [],
          tempObj,
          userId;

      // Custom parsing of data so results mimic how we build clips in Popcorn Maker
      for ( var i = 0; i < data.length; i++ ) {
        oldObj = data[ i ];
        tempObj = {};

        userId = oldObj.user.id;

        tempObj.source = oldObj.permalink_url;
        tempObj.author = options.account;
        tempObj.thumbnail = oldObj.artwork_url;
        tempObj.duration = oldObj.duration / 1000;
        tempObj.title = oldObj.title;
        tempObj.type = "SoundCloud";

        dataArray.push( tempObj );
      }

      // We have to grab the direct user object to get the total count of tracks they have.
      request({
        method: "GET",
        uri: "https://api.soundcloud.com/users/" + userId + ".json?" + KEYS.soundcloud
      }, function( err, response, body ) {

        if ( err ) {
          return callback( err );
        }

        var data = JSON.parse( body );

        callback( null, {
          results: dataArray,
          total: data.track_count
        });
      });
    });
  }

  function soundcloudSearch() {
    callback( null, [] );
  }

  if ( options.accountQuery ) {
    return soundcloudAccount();
  }

  soundcloudSearch();
};

SERVICES.flickr = function( options, callback ) {
  var jsonBits = "&format=json&nojsoncallback=flickr";

  function flickrAccount() {
    request({
      method: "GET",
      uri: "https://secure.flickr.com/services/rest/?method=flickr.people.findByUsername&" + KEYS.flickr +
           "&username=" + options.account + jsonBits
    }, function( err, response, body ) {
      if ( err ) {
        return callback( err );
      }

      var user_id = JSON.parse( body ).user.nsid;

      request({
        method: "GET",
        uri: "https://secure.flickr.com/services/rest/?method=flickr.photos.search&" + KEYS.flickr +
             "&user_id=" + user_id + "&page=" + options.page + "&per_page=" + LIMIT + jsonBits
      }, function( err, response, body ) {
        if ( err ) {
          return callback( err );
        }

        var data = JSON.parse( body ),
            totalPhotos = data.photos.total;

        if ( data.stat === "fail" ) {
          return callback( "Unknown user" );
        }

        if ( !data.photos.photo || !data.photos.photo.length || !Array.isArray( data.photos.photo ) ) {
          return callback( null, [] );
        }

        function getPhoto( photo, callback ) {
          // we have to store the photo's title from the original data set.
          var title = photo.title;

          request({
            method: "GET",
            uri: "https://secure.flickr.com/services/rest/?method=flickr.photos.getSizes&" + KEYS.flickr +
                 "&photo_id=" + photo.id + jsonBits
          }, function( err, response, body ) {
            if ( err ) {
              return callback( err );
            }

            var data = JSON.parse( body ),
                sizes = data.sizes.size,
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

        async.map( data.photos.photo, getPhoto, function( err, results ) {
          if ( err ) {
            return callback( err );
          }

          callback( null, {
            results: results,
            total: totalPhotos
          });
        });
      });
    });
  }

  function flickrSearch() {
    callback( null, [] );
  }

  if ( options.accountQuery ) {
    return flickrAccount();
  }

  flickrSearch();
};

module.exports = SERVICES;

