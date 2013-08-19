var SERVICES = {},
    KEYS = require( "./keys" ),
    request = require( "request" ),
    LIMIT = 10;

SERVICES.youtube = function( options, callback ) {
  request({
    method: "GET",
    headers: {
      "X-GData-Key": KEYS.youtube
    },
    uri: "https://gdata.youtube.com/feeds/api/users/" + options.account + "/uploads?alt=json&max-results=" + LIMIT +
         "&start-index=" + ( ( options.page - 1 ) * LIMIT ) + 1
  }, function( err, response, body ) {

    if ( err ) {
      return callback( err );
    }

    if ( body === "Invalid start-index" ) {
      return callback( "Error: Invalid Page" );
    }

    var data = JSON.parse( body ).feed.entry,
        oldObj,
        dataArray = [],
        tempObj;

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

    callback( null, dataArray );

  });
};

SERVICES.soundcloud = function( options, callback ) {
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
        tempObj;

    // Custom parsing of data so results mimic how we build clips in Popcorn Maker
    for ( var i = 0; i < data.length; i++ ) {
      oldObj = data[ i ];
      tempObj = {};

      tempObj.source = oldObj.permalink_url;
      tempObj.author = options.account;
      tempObj.thumbnail = oldObj.artwork_url;
      tempObj.duration = oldObj.duration / 1000;
      tempObj.title = oldObj.title;
      tempObj.type = "SoundCloud";

      dataArray.push( tempObj );
    }

    callback( null, dataArray );
  });
};

SERVICES.flickr = function( options, callback ) {
  var jsonBits = "&format=json&nojsoncallback=flickr";
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

      var data = JSON.parse( body );

      if ( data.stat === "fail" ) {
        return callback( "Unknown user" );
      }

      callback( null, data.photos.photo );
    });
  })
};

module.exports = SERVICES;

