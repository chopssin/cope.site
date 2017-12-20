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
apis.set('post', '/u/signin', 'users', 'getUser');
apis.set('post', '/u/get/profile', 'users', 'getUserProfile');

apis.get().map(a => {
  try {
    router[a.method](a.apiPath, function(req, res, next) {
      let obj = req.body;
      M.model(a.modelName)[a.modelMethod](obj).then(data => {
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
router.post('u/signout', function(req, res, next) {
  // TBD: reset client session
});

module.exports = router;
