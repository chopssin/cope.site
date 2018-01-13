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

// method, apiPath, modelName, modelMethod
let apis = function() {
  let apiStore = [];
  return {
    set: function(a, b, c, d) {
      let obj = {};
      obj.method = a;
      obj.apiPath = b;
      obj.modelName = c;
      obj.modelMethod = d;
      apiStore = apiStore.concat(obj);
    },
    get: function() {
      return apiStore;
    }
  };
}(); // apis

apis.set('get', '/test', 'test', 'sayHi');
apis.set('post', '/u/signup', 'users', 'addUser');
apis.set('post', '/u/get/profile', 'users', 'getUserProfile');
apis.set('post', '/u/deluser', 'users', 'delUser');
apis.set('post', '/create/post', 'posts', 'addPost');
apis.set('post', '/get/posts', 'posts', 'getPosts');

apis.set('post', '/fai/users/add', 'faiUsers', 'add');
apis.set('post', '/fai/users/get', 'faiUsers', 'get');
apis.set('post', '/fai/users/set', 'faiUsers', 'set');
apis.set('post', '/fai/users/del', 'faiUsers', 'del');

apis.get().map(a => {
  try {
    router[a.method](a.apiPath, function(req, res, next) {
      let obj = req.body;

      // TBD: Use client-session to recognize user
      let userData = req.session && req.session.userData;

      M.model(a.modelName)[a.modelMethod](obj, userData)
        .then(data => {
        res.send({ ok: true, data: data });
      }).catch(err => {
        res.send({ ok: false, err: err });
      });
    }); // router[a.method]( ... )
  } catch (err) {
    debug(err);
    res.send({ ok: false, err: err });
  }
}); // end of apis.map

// Define APIs which requires more flexible and custom design
router.post('/u/signin', function(req, res, next) {
  //apis.set('post', '/u/signin', 'users', 'signIn');
  M.model('users').signIn(req.body).then(data => {
    if (typeof req.session == 'object') {
      req.session.userData = data;
      res.send({ ok: true });
    } else {
      res.send({ ok: false });
    }
  });
});

router.get('/u/signout', function(req, res, next) {
  // TBD: reset client session
  if (req.session && req.session.userData) {
    req.session.userData = null;
    res.send({ ok: true });
  } else {
    res.send({ ok: false });
  }
});

router.get('/u/fetch', function(req, res, next) {
  // TBD: reset client session
  if (req.session && req.session.userData) {
    res.send({ ok: true, data: req.session.userData });
  } else {
    res.send({ ok: false });
  }
});

module.exports = router;
