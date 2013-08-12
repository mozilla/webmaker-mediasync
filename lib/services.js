var SERVICES = {},
    KEYS = require( "./keys" ),
    request = require( "request" );

SERVICES.youtube = function( account, callback ) {
  request({
    method: "GET",
    headers: {
      "X-GData-Key": KEYS.youtube
    },
    uri: "https://gdata.youtube.com/feeds/api/users/" + account + "/uploads?alt=json"
  }, function( err, response, body ) {

    if ( err ) {
      return callback( err );
    }

    var data = JSON.parse( body );
    callback( null, data.feed.entry );

  });
};

SERVICES.soundcloud = function( account, callback ) {
  request({
    method: "GET",
    uri: "https://api.soundcloud.com/users/" + account + "/tracks.json?" + KEYS.soundcloud
  }, function( err, response, body ) {

    if ( err ) {
      return callback( err );
    }

    var data = JSON.parse( body );
    callback( null, data );
  });
};

SERVICES.flickr = function( account, callback ) {
  var jsonBits = "&format=json&nojsoncallback=flickr";
  request({
    method: "GET",
    uri: "https://secure.flickr.com/services/rest/?method=flickr.people.findByUsername&" + KEYS.flickr +
         "&username=" + account + jsonBits
  }, function( err, response, body ) {
    if ( err ) {
      return callback( err );
    }

    var user_id = JSON.parse( body ).user.nsid;

    request({
      method: "GET",
      uri: "https://secure.flickr.com/services/rest/?method=flickr.photos.search&" + KEYS.flickr +
           "&user_id=" + user_id + jsonBits
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

// What the fuck.
SERVICES.rackspace = function( callback ) {
  callback( null, [] );
};


module.exports = SERVICES;