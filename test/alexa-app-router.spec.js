/* eslint-disable handle-callback-err, no-undef */
var _ = require('lodash');
var chai = require('chai');
var sinon = require('sinon');
var expect = chai.expect;
chai.use(require('sinon-chai'));

var alexaApp;
var app;
var router;

var config;
var intents;
var routes;

describe('alexa-app-router', function() {
  var exitHandler, helpHandler, testHandler;
  var event, context, callback;

  beforeEach(function() {
    exitHandler = sinon.stub();
    helpHandler = sinon.stub();
    testHandler = sinon.stub();

    config = {
      defaultRoutes: {
        'AMAZON.CancelIntent': '/exit',
        'AMAZON.HelpIntent': '/help',
        TestIntent: '/test'
      },
      pre: sinon.stub(),
      launch: sinon.stub()
    };

    intents = {
      TestIntent: { utterances: ['give me a test{| topic}'] }
    };

    routes = {
      '/exit': exitHandler,
      '/help': helpHandler,
      '/test': testHandler,
      '/test/{testId}': testHandler
    };

    delete require.cache[require.resolve('alexa-app')];
    alexaApp = require('alexa-app');
    app = new alexaApp.app('alexa-app-router-app');

    router = require('../alexa-app-router');

    event = {
      session: {
        new: false,
        sessionId: 'amzn1.echo-api.session.[unique-value-here]',
        attributes: {},
        user: {
          userId: 'amzn1.ask.account.[unique-value-here]'
        },
        application: {
          applicationId: 'amzn1.ask.skill.[unique-value-here]'
        }
      },
      version: '1.0',
      request: {
        locale: 'en-US',
        timestamp: '2016-10-27T21:06:28Z',
        type: 'IntentRequest',
        requestId: 'amzn1.echo-api.request.[unique-value-here]',
        intent: {
          slots: {
            Item: {
              name: 'TestItem',
              value: '123'
            }
          },
          name: 'TestIntent'
        }
      },
      context: {
        AudioPlayer: {
          playerActivity: 'IDLE'
        },
        System: {
          device: {
            supportedInterfaces: {
              AudioPlayer: {}
            }
          },
          application: {
            applicationId: 'amzn1.ask.skill.[unique-value-here]'
          },
          user: {
            userId: 'amzn1.ask.account.[unique-value-here]'
          }
        }
      }
    };
    context = {};
    callback = sinon.stub();

    sinon.spy(app, 'intent');
  });

  describe('instantiated without alexa app', function() {
    beforeEach(function() {
      app = router.addRouter();
    });

    it('should return nothing', function() {
      expect(app).to.be.undefined;
    });
  });

  describe('instantiated with valid alexa app', function() {
    var appLaunchOriginal;
    var appIntentOriginal;
    beforeEach(function() {
      appLaunchOriginal = app.launch;
      appIntentOriginal = app.intent;
    });

    it('should wrap the proper methods', function() {
      app = router.addRouter(app, config, intents, routes);

      expect(app.$$launch).to.equal(appLaunchOriginal);
      expect(app.$$intent).to.equal(appIntentOriginal);
    });
  });

  describe('instantiated with an invalid intents parameter', function() {
    beforeEach(function() {
      intents = 'not an object';
    });

    it('should still register default intents', function() {
      app = router.addRouter(app, config, intents, routes);

      expect(app.$$intent).to.have.been.called;
    });
  });

  describe('called with a route name', function() {
    beforeEach(function() {
      event.session.attributes.route = {
        TestIntent: '/help'
      };
      event.request.intent.name = 'TestIntent';
    });

    it('should call the appropriate route', function(done) {
      app = router.addRouter(app, config, intents, routes);
      app.handler(event, context, function(err, result) {
        expect(testHandler).to.not.have.been.called;
        expect(helpHandler).to.have.been.calledWithMatch({
          route: {
            params: {},
            query: {},
            route: '/help',
            url: '/help'
          }
        });
        done();
      });
    });
  });

  describe('called with an intent with no route', function() {
    beforeEach(function() {
      event.request.intent.name = 'NoRouteIntent';
    });

    it('should throw an error', function(done) {
      app = router.addRouter(app, config, intents, routes);
      app.handler(event, context, function(err, result) {
        expect(helpHandler).to.have.been.calledWithMatch({
          route: {
            params: {},
            query: {},
            route: '/help',
            url: '/help'
          }
        });
        done();
      });
    });
  });

  describe('called with query and route parameters', function() {
    beforeEach(function() {
      event.session.attributes.route = {
        TestIntent: '/test/123?parameter=456&parameter2=789'
      };
      event.request.intent.name = 'TestIntent';
    });

    it('should load them correctly', function(done) {
      app = router.addRouter(app, config, intents, routes);
      app.handler(event, context, function(err, result) {
        expect(testHandler).to.have.been.calledWithMatch({
          route: {
            params: {
              testId: '123'
            },
            query: {
              parameter: '456',
              parameter2: '789'
            },
            route: '/test/{testId}',
            url: '/test/123?parameter=456&parameter2=789'
          }
        });
        done();
      });
    });
  });
});
