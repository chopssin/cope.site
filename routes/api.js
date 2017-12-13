let debug = require('debug')('cope.site:routes/api');
let express = require('express');
let router = express.Router();
let cope = require('../cope');

router.get('/test', function(req, res, next) {
  let testNode = cope.model('test').node();
  testNode.sayHi();
  res.send({ ok: true });
});

router.post('/u/signip', function(req, res, next) {
  let userNode = cope.model('user').node();
  userNode
    .signUp(email, password)
    .then(() => {
      debug(user.data());
      res.send({ ok: true });
    });
});

module.exports = router;
