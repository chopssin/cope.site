let debug = require('debug')('cope.site:routes/api');
let express = require('express');
let router = express.Router();
let cope = require('../cope');
let copeModels = require('../cope-models');
let M = cope.M;

// To get hostname without port
let hostname = cope.util.hostname;

router.all('*', function(req, res, next) {
  let appHost = hostname(req);
  if (req.session) {
    if (!req.session.appUserData) {
      req.session.appUserData = {};
    }
    if (appHost && !req.session.appUserData[appHost]) {
      let appNode = M.model('cope/app').node({ 'appHost': appHost });
      appNode.fetchData().next(() => {
        if (appNode.nodeId()) {
          let v = appNode.snap.value();

          // Init req.session.appUserData[appHost]
          req.session.appUserData[appHost] = {
            appId: v.appId,
            appNodeId: appNode.nodeId()
          };
          next();
        }
      });
    } else {
      next();
    }
  } else {
    debug('[ERR] failed to access req.session');
  }
});

/*********** 
 *** API *** 
 ***********

  /api/account/{ add, del, update, get }
  /api/profile/{ get, all }

  /api/app/{ add, del, update, get }
  /api/app/root/{ add, del, update, get }
  /api/app/admin/{ add, del, get, all }

  /api/app/member_account/{ add, del, update, get }
  /api/app/member_profile/{ get, all }
  /api/app/member_group/{ add, del, update, get } to identify VIPs and group msg 

  /api/app/post/{ add, del, update, get, all }
  /api/app/item/{ add, del, update, get, all }
  /api/app/req/{ add, del, update, get, all }
  /api/app/msg/{ add, del, get, all } between app members

************/

// method, apiPath, modelName, modelMethod
/* TBD: Remove this part
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
*/

let setAPI = function(method, apiPath, modelName, modelMethod) {
  router[method](apiPath, function(req, res, next) {
    let obj = req.body || null;

    // Use client-session to recognize user
    let userData = {};
    userData.copeUserData = req.session && req.session.copeUserData || null;
    userData.appUserData = req.session && req.session.appUserData || null;

    let params = {};
    let appHost = hostname(req);
    if (appHost) {
      params.hostname = appHost;
      params.appHost = appHost;
      params = Object.assign(params, req.session.appUserData[hostname(req)]);
    }
    debug(apiPath + ': params', params);

    M.model(modelName)[modelMethod](obj, userData, params)
      .then(data => {
      res.send({ ok: true, data: data || null });
    }).catch(err => {
      res.send({ ok: false, err: err });
    });
  }); // router[a.method]( ... )
}; // end of setAPI

setAPI('post', '/account/add', 'cope/user', 'addAccount');
setAPI('post', '/account/del', 'cope/user', 'delAccount');
setAPI('post', '/profile/get', 'cope/user', 'getProfile');

setAPI('post', '/app/add', 'cope/app', 'addApp');
setAPI('post', '/app/del', 'cope/app', 'delApp');
setAPI('post', '/app/get', 'cope/app', 'getApp');
setAPI('post', '/app/all', 'cope/app', 'getAllApps');
setAPI('post', '/app/update', 'cope/app', 'updateApp'); 

setAPI('post', '/post/add', 'cope/post', 'addPost');
setAPI('post', '/post/del', 'cope/post', 'delPost');
setAPI('post', '/post/get', 'cope/post', 'getPost');
setAPI('post', '/post/all', 'cope/post', 'getPostIds');
setAPI('post', '/post/update', 'cope/post', 'updatePost');

setAPI('post', '/card/add', 'cope/card', 'add');
setAPI('post', '/card/del', 'cope/card', 'del');
setAPI('post', '/card/get', 'cope/card', 'get');
setAPI('post', '/card/all', 'cope/card', 'getMany');
setAPI('post', '/card/update', 'cope/card', 'update');

// Define APIs which requires more flexible and custom design
router.post('/account/me', function(req, res, next) {
  if (req.session && req.session.copeUserData) {
    res.send({ ok: true, data: req.session.copeUserData });
  } else {
    res.send({ ok: false });
  }
});

router.post('/account/signin', function(req, res, next) {
  //apis.set('post', '/u/signin', 'users', 'signIn');
  debug('asdasdadas');
  M.model('cope/user').signIn(req.body).then(data => {
    if (typeof req.session == 'object' && data) {
      req.session.copeUserData = data;
      res.send({ ok: true, data: req.session.copeUserData });
    } else {
      debug('[ERR] failed to access req.session');
      res.send({ ok: false });
    }
  });
});

router.post('/account/signout', function(req, res, next) {
  // TBD: reset client session
  if (req.session && req.session.copeUserData) {
    req.session.copeUserData = null;
    res.send({ ok: true });
  } else {
    res.send({ ok: false });
  }
});

module.exports = router;
