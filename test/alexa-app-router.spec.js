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
  beforeEach(function() {
    config = {
      defaultRoute: '/',
      pre: sinon.stub(),
      launch: sinon.stub()
    };

    intents = {
      TestIntent: { utterances: ['give me a test{| topic}'] }
    };

    routes = {
      '/': {
        'AMAZON.HelpIntent': sinon.stub(),
        TestIntent: sinon.stub()
      },
      '/detail': {
        'AMAZON.NoIntent': sinon.stub(),
        'AMAZON.YesIntent': sinon.stub()
      }
    };

    delete require.cache[require.resolve('alexa-app')];
    alexaApp = require('alexa-app');
    app = new alexaApp.app('alexa-app-router-app');

    router = require('../alexa-app-router');

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
});
