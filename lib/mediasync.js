var SERVICES = require( "./services" ),
    async = require( "async" ),
    subscribedServices = [],
    loginApi,
    MediaSync = {};

MediaSync.accounts = function( req, res ) {
  var service = req.params.service,
      page = parseInt( req.query.page, 10 ),
      email = req.session.email;

  if ( !page ) {
    page = 1;
  }

  if ( !email ) {
    return res.json( 500, { status: "failure", reason: "No email present on session." } );
  }

  if ( !service || !SERVICES[ service ] ) {
    return res.json( 500, { status: "failure", reason: "Unsupported service" } );
  }

  loginApi.getUser( email, function( err, user ) {

    if ( err ) {
      return res.json( 500, { status: "failure", reason: "Failure retrieving webmaker user data." } );
    }

    if ( user.servicesAccounts[ service ] ) {
      var options = {
            account: user.servicesAccounts[ service ],
            page: page,
            query: req.query,
            accountQuery: true
          };

      SERVICES[ service ]( options, function( err, results ) {

        if ( err ) {
          return res.json( 500, { status: "failure", reason: "retrieving data for " + service  + " returned an error" } );
        }

        res.json({ status: "okay", results: results.results, currentPage: page, total: results.total });
      });
    } else {
      return res.json( 500, { status: "failure", reason: "User doesn't have an account specified for the " + service + "." } );
    }
  });

};

MediaSync.search = function( req, res ) {
  var service = req.params.service,
      page = parseInt( req.query.page, 10 ),
      query = req.query,
      options = {};

  if ( !page ) {
    page = 1;
  }

  if ( !service || !SERVICES[ service ] ) {
    return res.json( 500, { status: "failure", reason: "Unsupported service" } );
  }

  options.page = page;
  options.query = query;

  SERVICES[ service ]( options, function( err, results ) {

    if ( err ) {
      return res.json( 500, { status: "failure", reason: "retrieving data for " + service  + " returned an error" } );
    }

    res.json({ status: "okay", results: results.results, currentPage: page, total: results.total });
  });
};

module.exports = function( services, loginapi ) {
  subscribedServices = services;
  loginApi = loginapi;

  return MediaSync;
};