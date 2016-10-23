# alexa-app-router
A simple router for the Alexa `alexa-app` library.

# Features
This skill can:
- Connect to an athlete's Strava account.
- Read back recent activity details.

# Usage

Read the [alexa-app](https://github.com/matt-kruse/alexa-app) documentation before using this add-on utility.

Sample app with code usage available at [stravalexa](https://github.com/nickcoury/stravalexa).

## Installation
```
npm install alexa-app alexa-app-router --save
```

## Registering the Router
```
var alexa = require('alexa-app');
var router = require('./alexa-app-router');

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
Shorthand for registering intents. Since we will handle intents with the routing we don't need to implement intents directly. (See Router Logic for more details).
```
var intents = {
  NumberIntent: {
    "slots": {"number":"NUMBER"},
    "utterances": [ "say the number {1-100|number}" ]
  },
  'AMAZON.YesIntent': null
};
```
This is equivalent to:
```
app.intent('NumberIntent',
  {
    "slots": {"number":"NUMBER"},
    "utterances": [ "say the number {1-100|number}" ]
  },
  function(request,response) {}
);
app.intent('AMAZON.YesIntent',
  function(request,response) {}
);
```

## Routes
Shorthand for registering intents. Since we will handle intents with the routing we don't need to implement intents directly. (See Router Logic for more details).
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
1. Match a handler on the route name set in `response.route()`.
2. Match a handler on the route name set in `config.defaultRoute`.
3. Execute the original intent handler if no route match was found.

Consider the following:
1. `response.route('/go-to-summary')` is set, and an `AMAZON.YesIntent` is received next. `summaryHandler` is called.
2. `response.route('/go-to-summary')` is set, and a `SummaryIntent` is received next. `summaryHandler` is called.
3. `response.route('/go-to-summary')` is set, and a `AMAZON.HelpIntent` is received next. `menuHandler` is called.
4. No route is set, and a `SummaryIntent` is received next. `summaryHandler` is called.
5. No route is set, and a `NumberIntent` is received next. The handler from `app.intent('NumberIntent', ...)` is called.

The router automatically registers any intents it find in the routes list with a blank handler, so it will be configured properly with the Alexa Skills Kit. This will never override a handler registered with `intents` or `app.intent()`. In other words, the `'AMAZON.YesIntent': null` in `intents` above is unnecessary. 

## Route Naming
The route names are simply strings. The `/` convention is used for familiarity, but not required.

### Backwards Compatibility
All functionality is backwards compatible with [alexa-app](https://github.com/matt-kruse/alexa-app). Intents can be registered normally, the router intents are simply a shorthand for convenience.

## Future
- Allow parameters in routes.

Special thanks to Matt Kruse for his excellent [alexa-app](https://github.com/matt-kruse/alexa-app)!

