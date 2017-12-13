let debug = require('debug')('cope.site:routes/dev');
let express = require('express');
let router = express.Router();
let cope = require('../cope');

/* GET home page. */
router.get('/', function(req, res, next) {
  if (req.session.userData) {
    debug('requesting page "/dev" by', req.session.userData);
  } else {
    debug('requesting page "/dev" by anonymous user')
  }
  res.render('dev_index', { title: 'Cope - development' });
});

module.exports = router;
