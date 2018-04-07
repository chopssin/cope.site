var debug = require('debug')('cope.site:index');
var express = require('express');
var router = express.Router();
let cope = require('../cope');
let copeModels = require('../cope-models');
let M = cope.M;

/* GET home page. */
router.get('/', function(req, res, next) {
  if (req.session.userData) {
    debug('requesting page "/" by', req.session.userData);
  } else {
    debug('requesting page "/" by anonymous user')
  }
  res.render('index', { title: 'Cope' });
});

router.get('/:appDomain', function(req, res) {
  // TBD APP PAGE
  let appDomain = req.params.appDomain;
  debug('appDomain', appDomain);
  res.render('appIndex', { appDomain: appDomain });
});

router.get('/:appDomain/post/:postId', function(req, res) {
  // TBD APP PAGE
  let appDomain = req.params.appDomain;
  let postId = req.params.postId;
  debug('appDomain', appDomain);
  debug('postId', postId);
  res.render('post', { postId: postId });
});

module.exports = router;
