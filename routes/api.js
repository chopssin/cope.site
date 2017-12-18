let debug = require('debug')('cope.site:routes/api');
let express = require('express');
let router = express.Router();
let cope = require('../cope');
let copeModels = require('../cope-models');
let M = cope.M;

// cope.client:
// cope.req(<api>, params)
//   .then(result => { ... })
//   .catch(err => { ... })

router.get('/test', function(req, res, next) {
  res.send({ ok: true });
});

router.post('/u/signup', function(req, res, next) {
  M.model('users').addUser({ email: email, pwd: password })
    .then(userData => {
      res.send({ ok: true, data: userData }); 
    });
});

router.post('/u/signin', function(req, res, next) {
  // TBD: Clear user's client session
  let u = M.model('users').node({ email: email, pwd: password });
  u.fetch().next(() => {
    if (u.nodeId()) {
      // TBD: Save user's session
      res.send({ ok: true, data: u.snapData() });
    }
  });
});

router.post('/u/signout', function(req, res, next) {
  // TBD
});

router.post('/u/profile/get', function(req, res, next) {
  let u = M.model('users').node({ email: email, pwd: password });

  M.model('users').getUser({ email: email, pwd: password })
    .then(profileData => {
      res.send({ ok: true, data: profileData });
    });
});

module.exports = router;
