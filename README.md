Webmaker MediaSync
==================

MediaSync is a Node.js serverside NPM module designed to make searching for media from popular Web services easy with a universal API.

### Initialization ###
The initialization of the module as very few parameters currently. They are as follows:

>`App Instance`: A reference to your application's Express/Connect instance. This is used to attach the searching route to your application
>`options` - An object with the following properties:
>
> + `serviceKeys` - **required** - An object containing API keys for each service you plan to use.
> + `limit` - Used to specify the amount of results returned in a query. Defaults to 30.
> + `cacheExpiry` - Used to specify how long searches should be cached, in seconds. Defaults to 1800 seconds.

Example:
```
var mediasync = require( "webmaker-mediasync" );

mediasync( expressApp, {
  serviceKeys: {
    soundcloud: "d2idm12domodo12mdo12mdo2d12d",
    flickr: "d2di3mdi3di23md23idm",
    gihpy: "21d12d21d2d12d12d"
  }
});
```

### Supported Services ###

Currently we support query based searching with the following services: **YouTube**, **SoundCloud**, **Giphy** and **Flickr**.

**NOTE**: **YouTube** does not currently require an API Key to be given to use it.

### Usage ###

When initialized, the application will add one endpoint to your application to be used to make searches.

`/api/webmaker/search/{SERVICE}?{QUERYSTRING_PARAMETERS}`

>`SERVICE` - Expects a value matching one of the following:
> + **YouTube**, **SoundCloud**, **Giphy**, **All** and **Flickr**. These can be any case, we lowercase this value before evaluating.
> + + In the case of **All**, every supported service will have the provided query used against all supported services.
>
> `QUERYSTRING_PARAMETERS` - These are used to specify more specific values, such as:
> + `q` - The search query that you are performing. Must be a URL safe (encoded) value.
> + `page` - Used to specify the page of results you want. A query may have 400 total results, but you will only ever recieve an amount of results matching what's specified in `limit` on initialization. Increase this value to get the next set of results.

### Example Requests ###
* `/api/webmaker/search/YouTube?page=1&q=kittens`
* `/api/webmaker/search/YouTube?page=3&q=cute%20kittens`
* `/api/webmaker/search/YouTube?page=10&q=%22cute%20kittens%22`

### Responses ###

Responses are JSON.

Example success responses:
```
{
  status: "okay",
  currentPage: 3,
  results: [
    // Objects containing data
  ],
  total: 235
}
```

Example failure responses:
```
{
  status: "failure",
  reason: "[webmaker-mediasync]: Retrieving data for YouTube failed",
  error: {} // Some sort of object. For example, it could be from the service's API.
}
```
