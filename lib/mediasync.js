var SERVICES = require( "./services" ),
    async = require( "async" ),
    subscribedServices = [],
    loginApi,
    MediaSync = {};

MediaSync.all = function( req, res ) {
  var webmaker;

  function getData( service, callback ) {
    if ( webmaker.servicesAccounts[ service ] ) {
      var options = {
            account: webmaker.servicesAccounts[ service ],
            page: 1
          };

      SERVICES[ service ]( options, function( err, results ) {

        if ( err ) {
          return res.json( 500, { status: "failure", reason: "retrieving data for " + service  + " returned an error" } );
        }

        results = {
          type: service,
          data: results
        };

        callback( null, results );
      });
    } else {
      callback( null, [] );
    }
  }

  if ( subscribedServices.indexOf( "rackspace" ) === -1 ) {
    loginApi.getUser( req.session.email, function( err, user ) {

      if ( err ) {
        return res.json( 500, { status: "failure", reason: "Failure retrieving webmaker user data." } );
      }

      webmaker = user;

      async.map( subscribedServices, getData, function( err, results ) {

        if ( err ) {
          return res.json( 500, { status: "failure", reason: err } );
        }

        res.json({ status: "okay", results: results });
      });
    });
  }
};

MediaSync.get = function( req, res ) {
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

  if ( service == "rackspace" ) {
    SERVICES.rackspace( function( err, results ) {
      res.json({ status: "okay" });
    });
    return;
  }

  loginApi.getUser( email, function( err, user ) {

    if ( err ) {
      return res.json( 500, { status: "failure", reason: "Failure retrieving webmaker user data." } );
    }

    if ( user.servicesAccounts[ service ] ) {
      var options = {
            account: user.servicesAccounts[ service ],
            page: page
          };

      SERVICES[ service ]( options, function( err, results ) {

        if ( err ) {
          return res.json( 500, { status: "failure", reason: "retrieving data for " + service  + " returned an error" } );
        }

        res.json({ status: "okay", results: results, currentPage: page });
      });
    } else {
      return res.json( 500, { status: "failure", reason: "User doesn't have an account specified for the " + service + "." } );
    }
  });

};

module.exports = function( services, loginapi ) {
  subscribedServices = services;
  loginApi = loginapi;

  return MediaSync;
};