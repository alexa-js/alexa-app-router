# alexa-app-router
A simple router for the Alexa `alexa-app` library.

# Table of Contents
* [Usage](#usage)
* [Breaking Changes](#breaking-changes)
* [Installation](#installation)
* [Registering the Router](#registering-the-router)
* [Gotchas and Important Notes](#gotchas-and-important-notes)
* [Config](#config)
* [Intents](#intents)
* [Routes](#routes)
* [Going to a Route](#going-to-a-route)
* [Route Parameters](#route-parameters)
* [Backwards Compatibility](#backwards-compatibility)

## Usage
Read the [alexa-app](https://github.com/alexa-js/alexa-app) documentation before using this add-on utility.

Sample app with code usage available in the [alexa-adopt-a-pet](https://github.com/nickcoury/alexa-adopt-a-pet) project.

## Breaking Changes
From `0.0.X` to `0.1.X` breaking changes were introduced:
  - The whole routing paradigm has been made more intuitive, flexible, and powerful. Read the docs below for updates.

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

## Gotchas and Important Notes
1. Every intent your app uses (including Amazon default intents) must be specified in `config.defaultRoutes`.

## Config
Configuration for the router.
```
var config = {
  defaultRoutes: {
    'AMAZON.CancelIntent': '/exit',
    'AMAZON.HelpIntent': '/help',
    'AMAZON.NextIntent': '/',
    'AMAZON.PreviousIntent': '/',
    'AMAZON.RepeatIntent': '/',
    'AMAZON.ResumeIntent': '/',
    'AMAZON.StartOverIntent': '/',
    'AMAZON.StopIntent': '/exit',
    'AMAZON.YesIntent': '/',
    PetDetailsIntent: '/pets/{petId}',
    FindPetIntent: '/pets?offset=0',
    FindShelterIntent: '/shelters?limit=5',
    MenuIntent: '/menu'
  },
  pre: preHandler,
  post: postHandler,
  launch: launchHandler
};
function preHandler(request, response) {...},
function postHandler(request, response) {...},
function launchHandler(request, response) {...}
```
### defaultRoutes
Contains the default routes to use when no route is specified. These are used on first launch, and when no route has otherwise been specified.
### pre
Shorthand for `app.pre = function preHandler(request, response) {...}`;
### post
Shorthand for `app.post = function postHandler(request, response) {...}`;
### launch
Shorthand for `app.launch = function launchHandler(request, response) {...}`;

## Intents
Shorthand for registering intents. 

We never need to specify intent handlers directly using `alexa-app`.
```
var intents = {
  FindPetIntent: {
    slots: {ANIMAL_TYPE: 'ANIMAL_TYPE'},
    utterances: ['{adopt a |find a }{-|ANIMAL_TYPE}']
  },
  MenuIntent: {utterances: ['{menu|help}']},
  ...(more intents)
};
```
This is equivalent to:
```
app.intent('FindPetIntent',
  {
    'slots': {ANIMAL_TYPE: 'ANIMAL_TYPE'},
    'utterances': ['{adopt a |find a }{-|ANIMAL_TYPE}']
  },
  function(request,response) {}
);
app.intent('MenuIntent',
  {utterances: ['{menu|help}']}
  function(request,response) {}
);
...
```

## Routes
Format for registering routes.

The url-style routing is strongly recommended. Special processing is done with route variables (`{id}`) and query parameters (`?limit=10&offset=5`) assuming url-style routes.
```
var routes = {
    '/': launchHandler,
    '/exit': exitHandler,
    '/help': helpHandler,
    '/menu': menuHandler,
    '/pets': findPetHandler,
    '/pets/{petId}': petDetailsHandler,
    '/shelters': findShelterHandler,
};
function launchHandler(request, response {...}
function exitHandler(request, response {...}
function helpHandler(request, response {...}
function menuHandler(request, response {...}
function findPetHandler(request, response {...}
function petDetailsHandler(request, response {...}
function findShelterHandler(request, response {...}
```

## Going to a Route
When prompting the user for a new response, provide the `.route()` command a map of routes to go to depending on the user's response. The route is chosen in the following way:
1. Exact intent match from `.route()`.
2. Route specified on the `default` entry.
3. Intent match on `config.defaultRoutes`.
```
function launchHandler(request, response) {
  var text = 'Welcome to my app. Would you like a list of commands?';
  response
    .say(text)
    .route({
      'default': '/'
      'AMAZON.CancelIntent': '/exit',
      'AMAZON.NoIntent': '/exit',
      'AMAZON.YesIntent': '/help',
      FindPetIntent: '/pets?offset=0',
      FindShelterIntent: '/shelters?limit=5'
    })
    .send();
}
```
This allows two useful features:
1. Since Alexa can receive any available intent at any time, you can stop unexpected intents by using the `default` route here.
2. You don't have to specify, for example, `'AMAZON.HelpIntent': '/help'` every time if it is set up on `config.defaultRoutes` and you don't use `default`;

Internally the route is saved on the `route` session variable.  `.route(routes)` is equivalent to:
```
response
  .shouldEndSession(false)
  .session('route', routes)
```

## Route Parameters
Routes support both url and query string parameters.

E.g. `.route('/pets/123/photos/45678?format=png&size=large')` will match the route `/pets/{petId}/photos/{photoId}`.

The current route info can be retrieved with `request.route`:
```
request.route = {
  params: {
    petId: '123',
    photoId: '45678'
  },
  query: {
    format: 'png',
    size: 'large'
  },
  route: '/pets/{petId}/photos/{photoId}',
  url: '/pets/123/photos/45678?format=png&size=large'
}
```

This allows easy management of complex state flows.  Consider the following interaction with the sample routes/intents above:
1. User calls the Pet skill and asks to view pets. The `config.defaultRoutes` handler for `PetIntent` is set to `'/pets?limit=1&offset=0'` which calls the `findPetHandler()`.
2. User asks for the next pet and `AMAZON.NextIntent` is triggered. In the `findPetHandler`, dynamically route `AMAZON.NextIntent` to `'/pets?limit=1&offset=' + (request.route.query.offset + 1)`.
3. Suppose this returns a pet with an internal Id of `123` in `findPetHandler()`.  When the user asks for more details, a `MoreDetailsIntent` is triggered.
4. The `MoreDetailsIntent` can be dynamically routed to `'/pets/' + pet.Id` which calls `petDetailsHandler()` with the pet Id.

## Backwards Compatibility
All functionality is backwards compatible with [alexa-app](https://github.com/alexa-js/alexa-app). Intents can be registered normally, the router intents are simply a shorthand for convenience.

Special thanks to [Matt Kruse](https://github.com/matt-kruse) for his excellent [alexa-app](https://github.com/alexa-js), and [Daniel Doubrovkine](https://github.com/dblock) for his work maintaining it!
