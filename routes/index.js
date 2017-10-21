var debug = require('debug')('cope.site:index');
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  if (req.session.userData) {
    debug('requesting page "/" by', req.session.userData);
  } else {
    debug('requesting page "/" by anonymous user')
  }
  res.render('index', { title: 'Cope' });
});

module.exports = router;
