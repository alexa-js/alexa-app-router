var router = {};

router.addRouter = function(app, config, intents, routes) {
    if (!app) return;

    app.$$launch = app.launch;
    app.launch = launchHandler;

    app.$$intent = app.intent;
    app.intent = intentHandler;

    registerIntents(intents);
    registerRoutes(routes, config);
    registerDefaultIntents(routes);

    function registerIntents(intents) {
        if (typeof intents !== 'object') return;

        for (var name in intents) {
            if (intents[name]) {
                app.intent(name, intents[name], noop);
            } else {
                app.intent(name, noop);
            }
        }
    }

    function registerRoutes(routes, config) {
        app.$$routeList = routes || {};
        app.$$routeConfig = config || {};

        if (typeof app.$$routeConfig.pre === 'function') {
            app.pre = app.$$routeConfig.pre;
        }

        if (typeof app.$$routeConfig.post === 'function') {
            app.post = app.$$routeConfig.post;
        }

        if (typeof app.$$routeConfig.launch === 'function') {
            app.launch = app.$$routeConfig.launch;
        }
    }

    function registerDefaultIntents(routes) {
        for (var routeName in routes) {
            for (var intentName in routes[routeName]) {
                if (!app.intents[intentName]) {
                    app.intent(intentName, noop);
                }
            }
        }
    }

    function noop(request, response) {}

    function launchHandler(handler) {
        app.$$launch(function (request, response) {
            response.route = function (nextRouteName) {
                response
                    .shouldEndSession(false)
                    .session('route', nextRouteName);
                return response;
            };

            return handler.apply(null, arguments);
        });
    }

    function intentHandler(name, config, handler) {
        if (typeof config == "function") {
            handler = config;
            config = null;
        }

        app.$$intent(name, config, function (request, response) {
            var routeName;
            routeName = request.session('route');
            response.session('route', null);

            request.route = routeName;

            response.route = function(nextRouteName) {
                response
                    .shouldEndSession(false)
                    .session('route', nextRouteName);
                return response;
            };

            // Call route handler
            var routeHandler = app.$$routeList[routeName];
            var defaultRouteHandler = app.$$routeList[app.$$routeConfig.defaultRoute];

            if (routeHandler && typeof routeHandler[name] === 'function') {
                return routeHandler[name].apply(null, arguments);
            } else if (defaultRouteHandler && typeof defaultRouteHandler[name] === 'function') {
                return defaultRouteHandler[name].apply(null, arguments);
            } else {
                // Call original handler if no route matches
                return handler.apply(null, arguments);
            }
        });
    }

    return app;
};

module.exports = router;