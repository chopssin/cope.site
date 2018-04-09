var debug = require('debug')('cope.site:index');
var express = require('express');
var router = express.Router();
let cope = require('../cope');
let copeModels = require('../cope-models');
let M = cope.M;
let hostname = cope.util.hostname;

router.all('*', function(req, res, next) {
  // TBD:
  //   CORS issue
  next();
});

/* GET home page. */
router.get('/', function(req, res, next) {
  let appHost = hostname(req);
  if (appHost) {
    debug('Requesting page on ' + appHost);
    res.render('appIndex');
  } else {
    debug('Requesting Cope');
    res.render('index', { title: 'Cope' });
  }
});

router.get('/post/:postId', function(req, res) {
  let postId = req.params.postId;
  let appHost = hostname(req);
  if (appHost) {
    debug('Requesting page on ' + appHost);
    res.render('post', { postId: postId });
  } else {
    debug('Redirecting to Cope');
    res.redirect('/');
  }
});

module.exports = router;
