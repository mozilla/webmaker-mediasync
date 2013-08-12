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

  // This is so dumb
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

        res.json({ status: "okay", data: results });
      });
    });
  }
};

MediaSync.get = function( req, res ) {
  var service = req.params.service,
      page = Math.max( req.params.page, 1 );

  if ( !service || !SERVICES[ service ] ) {
    return res.json( 500, { status: "failure", reason: "Unsupported service" } );
  }

  // wtf
  if ( service == "rackspace" ) {
    SERVICES.rackspace( function( err, results ) {
      // DO SOMETHING LOL WHAT THE FUCK
      res.json({ status: "okay" });
    });
    return;
  }

  loginApi.getUser( req.session.email, function( err, user ) {

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

        res.json({ status: "okay", data: results });
      });
    } else {
      return res.json( 500, { status: "failure", reason: "User doesn't have an account specified for the " + services + "." } );
    }
  });

};

module.exports = function( services, loginapi ) {
  subscribedServices = services;
  loginApi = loginapi;

  return MediaSync;
};