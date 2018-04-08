var debug = require('debug')('cope.site:index');
var express = require('express');
var router = express.Router();
let cope = require('../cope');
let copeModels = require('../cope-models');
let M = cope.M;
let hostname = cope.util.hostname;

router.all('*', function(req, res, next) {
  let appHost = hostname(req);
  if (appHost) {
    debug('Requesting page on ' + appHost);
    next();
  } else {
    debug('Requesting Cope');
    res.render('index', { title: 'Cope' });
  }
});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('appIndex');
});

router.get('/post/:postId', function(req, res) {
  let postId = req.params.postId;
  res.render('post', { postId: postId });
});

module.exports = router;
