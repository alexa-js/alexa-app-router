var url = require('url');

var router = {};

router.addRouter = function(app, config, intents, routes) {
  if (!app) return;

  app.$$launch = app.launch;
  app.launch = launchHandler;

  app.$$intent = app.intent;
  app.intent = intentHandler;

  app.$$routeConfig = config || {};
  app.$$routeIntents = intents || {};
  app.$$routeList = routes || {};

  registerIntents();
  registerRoutes();
  registerDefaultIntents();

  function registerIntents() {
    if (typeof app.$$routeIntents !== 'object') return;

    for (var name in app.$$routeIntents) {
      if (app.$$routeIntents[name]) {
        app.intent(name, app.$$routeIntents[name], noop);
      } else {
        app.intent(name, noop);
      }
    }
  }

  function registerRoutes() {
    if (typeof app.$$routeConfig.pre === 'function') {
      app.pre = app.$$routeConfig.pre;
    }

    if (typeof app.$$routeConfig.post === 'function') {
      app.post = app.$$routeConfig.post;
    }

    if (typeof app.$$routeConfig.launch === 'function') {
      app.launch(app.$$routeConfig.launch);
    }
  }

  function registerDefaultIntents() {
    var defaultRoutes = app.$$routeConfig && app.$$routeConfig.defaultRoutes || {};

    for (var intentName in defaultRoutes) {
      if (!app.intents[intentName]) {
        app.intent(intentName, noop);
      }
    }
  }

  function launchHandler(handler) {
    app.$$launch(function(request, response) {
      response.route = function(nextRoutes) {
        response
          .shouldEndSession(false)
          .session('route', nextRoutes);
        return response;
      };

      return handler.apply(null, arguments);
    });
  }

  function intentHandler(name, config, handler) {
    if (typeof config === 'function') {
      handler = config;
      config = null;
    }

    app.$$intent(name, config, function(request, response) {
      // Set up route handler on response.
      response.route = function(nextRouteName) {
        response
          .shouldEndSession(false)
          .session('route', nextRouteName);
        return response;
      };

      // Get current route set last session, if available
      var routes;
      routes = request.session('route') || {};
      response.session('route', null);

      var routeUrl = routes[name] || routes['default'] || getDefaultRoute(name);
      request.route = parseRoute(routeUrl, app.$$routeList);
      var routeHandler = request.route && app.$$routeList[request.route.route];

      if (typeof routeHandler === 'function') {
        // Call route handler
        return routeHandler.apply(null, arguments);
      } else {
        throw new Error('No handler for ' + name + ' at route ' + request.route.route);
      }
    });
  }

  function getDefaultRoute(name) {
    return app.$$routeConfig && app.$$routeConfig.defaultRoutes && app.$$routeConfig.defaultRoutes[name];
  }

  function parseRoute(route, routes) {
    route = route || '';
    routes = routes || {};

    var parsedUrl = url.parse(route, true);

    if (!parsedUrl || typeof parsedUrl.pathname !== 'string') return null;

    var parts = parsedUrl.pathname.split('/');

    var analyzedRoutes = Object.keys(routes)
      .map(function(target) {
        var targetParts = target.split('/');

        if (targetParts.length !== parts.length) return null;

        // Match target parts against route parts
        var params = {};
        var specificity = 0;
        targetParts.forEach(function(part, index) {
          // Specificity determines how exact the match is, with a 1 for exact match, 0 for url param.
          // The total specificity is a binary number with each entry matching a segment from left to right.
          specificity *= 2;
          var regex = /^{([a-zA-Z_$][0-9a-zA-Z_$]*)}$/.exec(targetParts[index]);
          var urlParam = regex && regex[1];

          if (targetParts[index] === parts[index]) {
            // A segment was an exact match
            specificity++;
          } else if (urlParam) {
            // A segment was a fuzzy (url parameter) match
            params[urlParam] = parts[index];
          } else {
            // A segment didn't match
            return null;
          }
        });

        return {
          params: params,
          route: target,
          specificity: specificity
        };
      })
      .filter(function(r) { return r; })
      .sort(function(a, b) { return b.specificity - a.specificity; });

    if (!analyzedRoutes.length) return null;

    return {
      params: analyzedRoutes[0].params,
      query: parsedUrl.query,
      route: analyzedRoutes[0].route,
      url: route
    };
  }

  function noop(request, response) {}

  return app;
};

module.exports = router;
