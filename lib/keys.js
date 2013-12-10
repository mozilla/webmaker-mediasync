var KEYS = {
      youtube: "ImNotneeded"
    },
    KEY_PREFIXES = {
      youtube: "key=",
      soundcloud: "client_id=",
      flickr: "api_key=",
      giphy: "api_key=",
      rackspace: ""
    };

module.exports = {
  set: function( prop, val ) {
    KEYS[ prop ] = KEY_PREFIXES[ prop ] + val;
  },
  get: function( prop ) {
    return KEYS[ prop ];
  }
};