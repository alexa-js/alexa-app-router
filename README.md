# alexa-app-router
A simple router for the Alexa `alexa-app` library.

# Usage
Read the [alexa-app](https://github.com/alexa-js/alexa-app) documentation before using this add-on utility.

Sample app with code usage available in the [mountain top](https://github.com/nickcoury/mountain-top) project.

## Installation
```
npm install alexa-app alexa-app-router --save
```

## Registering the Router
```
var alexa = require('alexa-app');
var router = require('alexa-app-router');

var app = new alexa.app('app-name');

var config = {...};
var intents = {...};
var routes = {...};

router.addRouter(app, config, intents, routes);
```

## Config
Configuration for the router.
```
var config = {
  defaultRoute: '/',
  pre: preHandler,
  post: postHandler,
  launch: launchHandler
};
function preHandler(request, response) {...},
function postHandler(request, response) {...},
function launchHandler(request, response) {...}
```
### defaultRoute
See Router Logic below.
### pre
Shorthand for `app.pre = function preHandler(request, response) {...}`;
### post
Shorthand for `app.post = function postHandler(request, response) {...}`;
### launch
Shorthand for `app.launch = function launchHandler(request, response) {...}`;

## Intents
Shorthand for registering intents. 

We never need to specify intent handlers directly, since this is done with the default route (See Router Logic for more details).
```
var intents = {
  NumberIntent: {
    'slots': {'number': 'NUMBER'},
    'utterances': ['say the number {1-100|number}']
  },
  'AMAZON.YesIntent': null
};
```
This is equivalent to:
```
app.intent('NumberIntent',
  {
    'slots': {'number': 'NUMBER'},
    'utterances': ['say the number {1-100|number}']
  },
  function(request,response) {}
);
app.intent('AMAZON.YesIntent',
  function(request,response) {}
);
```

## Routes
Format for registering routes.

Note that the url-style routing is recommended, but not currently required. For now, all routes are exact-matched only without any parameter support (coming in a future version!)

One route needs to be registered as a default route, and should be considered the 'default' state of your app (See Config section).  It should handle every intent your app uses, and should handle intents as if the app was just opened.

The rest of the routes should be built as the 'router state' not the 'user state', unlike most web-style routers. In other words, `.route('/summary')` doesn't indicate the user has received the summary. It instead indicates the router should handle a response about the summary. It may be easier to write `/go-to-summary` instead of `/summary` to indicate the user could respond with 'Yes', 'No', 'Menu', or anything else before the summary is provided.  (See Router Logic for more details).
```
var routes = {
    '/': {
        'AMAZON.HelpIntent': menuHandler,
        RecentActivitiesIntent: recentActivitiesHandler,
        SummaryIntent: summaryHandler
    },
    '/go-to-summary': {
        'AMAZON.NoIntent': menuHandler,
        'AMAZON.YesIntent': summaryHandler
    }
};
function menuHandler(request, response {...}
function recentActivitiesHandler(request, response {...}
function summaryHandler(request, response {...}
```

## Going to a Route
```
function launchHandler(request, response) {
  var text = 'Welcome to my app. Would you like to hear your summary?'; 
  response
    .say(text)
    .route('/go-to-summary')
    .send();
}
```
Internally the route is saved on the `route` session variable.  `.route(routeName)` is equivalent to:
```
response
  .shouldEndSession(false)
  .session('route', routeName)
```
The current route can be retrieved with `request.route`.

## Router Logic
When an intent is received, the router will look for a route handler in the following order:
1. [Exact] Match a handler on the route name set in `response.route()`.
2. [Default] Match a handler on the route name set in `config.defaultRoute`.
3. [Intent] Execute the original intent handler if no route match was found (defaulted to `noop`).

Using the example routes above, consider the following:
1. `response.route('/go-to-summary')` is set, and an `AMAZON.YesIntent` is received next. `summaryHandler` is called. [Exact]
2. `response.route('/go-to-summary')` is set, and a `SummaryIntent` is received next. `summaryHandler` is called. [Default]
3. `response.route('/go-to-summary')` is set, and a `AMAZON.HelpIntent` is received next. `menuHandler` is called. [Default]
4. No route is set, and a `SummaryIntent` is received next. `summaryHandler` is called. [Default]
5. No route is set, and a `NumberIntent` is received next. The handler from `app.intent('NumberIntent', ...)` is called. [Intent]


## Miscellaneous
The router automatically registers any intents it find in the routes list with a blank handler, so it will be configured properly with the Alexa Skills Kit. This will never override a handler registered with `intents` or `app.intent()`. In other words, the `'AMAZON.YesIntent': null` in `intents` above is unnecessary. 

The route names are simply strings. The `/` convention is used for familiarity, but not required.

### Backwards Compatibility
All functionality is backwards compatible with [alexa-app](https://github.com/alexa-js/alexa-app). Intents can be registered normally, the router intents are simply a shorthand for convenience.

## Future
- Allow route parameters, e.g. `/go-to-page/{page}`.
- Allow query parameters, e.g. `/go-to-page?page=3&pageSize=10`.
- Allow a default handler for a route, with or without specifically defined handlers. e.g.
```
var routes = {
    '/': {...},
    '/go-to-summary': {...},
    '/maybe-go-to-summary': {
        'AMAZON.NoIntent': menuHandler,
        default: summaryHandler
    },
    '/force-go-to-summary': summaryHandler
};
```

Special thanks to Matt Kruse for his excellent [alexa-app](https://github.com/alexa-js/alexa-app)!

