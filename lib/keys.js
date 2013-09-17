var KEYS = {
  youtube: "key=AI39si5ZfBxRlydtwyL9VaAA9uOAP5J_HBIKyGJ4mZFMT-IalVyAJ5nyi_xadcONfKwcrSXl9DPFWZx_y1K1ccJ1ZbhpZf_quQ",
  soundcloud: "client_id=908c9df6f4cd8299277dc162e1bd0806",
  flickr: "api_key=b939e5bd8aa696db965888a31b2f1964",
  giphy: "api_key=dc6zaTOxFJmzC"
};

module.exports = {
  set: function( prop, val ) {
    KEYS[ prop ] = val;
  },
  get: function( prop ) {
    return KEYS[ prop ];
  }
};