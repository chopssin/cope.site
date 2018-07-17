var debug = require('debug')('cope.site:index');
var express = require('express');
var router = express.Router();
let cope = require('../cope');
let copeModels = require('../cope-models');
let M = cope.M;
let hostname = cope.util.hostname;

router.all('*', function(req, res, next) {
  // TBD:
  //   1. CORS issue
  //   2. Rewrite the path to <appHost> + <URL>
  debug('Requesting page');
  next();
});

/* GET home page. */
router.get('/', function(req, res, next) {
  let appHost = hostname(req);
  //if (appHost) {
  //  debug('Requesting page on ' + appHost);
  //  res.render('appIndex');
  //} else {
  //  debug('Requesting Cope');
  res.render('cope-home', { title: 'Cope' });
  //}
});

router.get('/a/:appId', function(req, res, next) {
  let appHost = hostname(req);
  let appId = req.params.appId;
  if (appHost) {
    //debug('Requesting page on ' + appHost);
    //res.render('appIndex');
  } else {
    debug('Requesting Cope');
    res.render('cope-app-dashboard', { 
      title: 'Cope', 
      appId: appId,
      path: null,
      params: null
    });
  }
});

router.get('/a/:appId/card/:cardId', function(req, res, next) {
  let appHost = hostname(req);
  let appId = req.params.appId;
  let cardId = req.params.cardId;
  if (appHost) {
    debug('Requesting page on ' + appHost);
    res.render('appIndex');
  } else {
    debug('Requesting Cope');
    res.render('cope-app-card', { // Single card 
      title: 'Cope', 
      appId: appId,
      cardId: cardId
    });
  }
});

router.get('/a/:appId/post/:postId', function(req, res, next) {
  let appHost = hostname(req);
  let appId = req.params.appId;
  let postId = req.params.postId;
  if (appHost) {
    debug('Requesting page on ' + appHost);
    res.render('appIndex');
  } else {
    debug('Requesting Cope');
    res.render('cope-app', { 
      title: 'Cope', 
      appId: appId,
      path: 'post',
      params: '{"postId":"' + postId + '"}'
    });
  }
});

router.get('/a/:appId/:section', function(req, res, next) {
  let appHost = hostname(req);
  let appId = req.params.appId;
  let section = req.params.section;
  if (appHost) {
    debug('Requesting page on ' + appHost);
    res.render('appIndex');
  } else {
    debug('Requesting Cope');
    res.render('cope-app-' + section, { 
      title: 'Cope', 
      appId: appId,
      path: null,
      params: null
    });
  }
});

module.exports = router;
