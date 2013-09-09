var SERVICES = {},
    KEYS = require( "./keys" ),
    request = require( "request" ),
    LIMIT = 30,
    async = require( "async" ),
    qs = require( "querystring" );

SERVICES.giphy = function( options, callback ) {
  var query = options.query.q,
      limit = parseInt( options.query.limit, 10 ) || LIMIT,
      offset = ( options.page - 1 ) * limit;

  query = qs.escape( query );

  request({
    method: "GET",
    uri: "http://api.giphy.com/v1/gifs/search?" + KEYS.giphy + "&q=" + query + "&limit=" + limit + "&offset=" + offset
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

SERVICES.youtube = function( options, callback ) {

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
      limit = parseInt( options.query.limit, 10 ) || LIMIT,
      page = ( ( options.page - 1 ) * limit ) + 1,
      searchLimit = 1000,
      cachedURI;

  if ( page + limit > searchLimit ) {
    limit = ( searchLimit - page ) + 1;
  }

  if ( options.account ) {
    uri = accountURI;
    uri = uri.replace( "\{ACCOUNT\}", options.account );
    headers = {
      "X-GData-Key": KEYS.youtube
    };
  }

  query = qs.escape( query );
  uri = uri.replace( "\{QUERY\}", query );

  uri = uri.replace( "\{LIMIT\}", limit );

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

    getActualTotal({
      index: index,
      headers: headers,
      results: results,
      callback: callback,
      uri: cachedURI + "&start-index=NEW_INDEX"
    });
  });
};

SERVICES.soundcloud = function( options, callback ) {
  var query = options.query.q,
      accountURI = "https://api.soundcloud.com/users/{ACCOUNT}/tracks.json?" + KEYS.soundcloud + "&limit={LIMIT}&offset={OFFSET}&q={QUERY}",
      searchURI = "https://api.soundcloud.com/tracks.json?" + KEYS.soundcloud + "&limit={LIMIT}&offset={OFFSET}&q={QUERY}",
      uri = searchURI,
      limit = parseInt( options.query.limit, 10 ) || LIMIT,
      page = ( options.page - 1 ) * limit,
      cachedURI;

  if ( options.account ) {
    uri = accountURI;
    uri = uri.replace( "\{ACCOUNT\}", options.account );
  }

  query = qs.escape( query );
  uri = uri.replace( "\{QUERY\}", query );
  cachedURI = uri;
  uri = uri.replace( "\{LIMIT\}", limit );
  uri = uri.replace( "\{OFFSET\}", page );

  request({
    method: "GET",
    uri: uri
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

    request({
      method: "GET",
      uri: cachedURI.replace( "\{LIMIT\}", 200 ).replace( "\{OFFSET\}", 0 )
    }, function( err, response, body ) {

      if ( err ) {
        return callback( err );
      }

      var data = JSON.parse( body );

      // SoundCloud has no concept of a total. For now, we cap the total results at 200.
      // TODO: File some sort of followup to investigate a non terrible solution to fix this.
      callback( null, {
        results: dataArray,
        total: data.length
      });
    });
  });
};

SERVICES.flickr = function( options, callback ) {
  var jsonBits = "&format=json&nojsoncallback=flickr",
      limit = parseInt( options.query.limit, 10 ) || LIMIT;

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
             "&user_id=" + user_id + "&page=" + options.page + "&per_page=" + limit + jsonBits
      }, function( err, response, body ) {
        if ( err ) {
          return callback( err );
        }

        var data = JSON.parse( body ),
            totalPhotos = data.photos.total;

        if ( data.stat === "fail" ) {
          return callback( "Unknown user" );
        }

        getPhotoLinks( data );
      });
    });
  }

  function flickrSearch() {
    var query = options.query.q;

    query = qs.escape( query );

    request({
      method: "GET",
      uri: "https://secure.flickr.com/services/rest/?method=flickr.photos.search&" + KEYS.flickr +
           "&text=" + query + "&page=" + options.page + "&per_page=" + limit + jsonBits
    }, function( err, response, body ) {
      if ( err ) {
        return callback( err );
      }

      var data = JSON.parse( body );

      getPhotoLinks( data );
    });
  }

  if ( options.accountQuery ) {
    return flickrAccount();
  }

  flickrSearch();
};

module.exports = SERVICES;

