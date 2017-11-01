(function(util, ui) {
  // cope
  // - ui
  // - user: () => <obj>userAPI
  // - graph: (<str>graphId) => <obj>graphAPI
  let cope = {};
  cope.ui = ui; // TBD: export ui

  let conn = util.conn; // used by #user, #graph

  
  // cope.user()
  // - id: <str>
  // - email: <str>
  // - fetch: () => <obj>userData
  // - signUp: (<obj>userInputs) => <obj>userAPI
  // - signIn: (<obj>userInputs) => <obj>userAPI
  // - signOut: () => <obj>userAPI
  // - deleteAccount: () => <obj>userAPI
  // - once: () => <obj>userAPI
  // - on: () => <obj>userAPI
  cope.user = function() {
    let user = {}; // user API 

    // Initialize `user`
    user.id = '';
    user.email = '';

    //user.update = update;
    //user.clear = clear;

    // Private variables
    let cbm = util.makeCallbackManager(),
        reqSignUp = conn.req('u/signup'),
        reqSignIn = conn.req('u/signin'),
        reqSignOut = conn.req('u/signout'),
        reqFetch = conn.req('u/fetch'),
        reqDelete = conn.req('u/delete');

    let resetUserData = function() {
      user.id = '';
      user.email = '';
      return;
    }; // end of `resetUserData`

    let updateUserData = function(userData) {
      if (typeof userData != 'object' || !userData) {
        resetUserData();
        return;
      } 
      if (typeof userData.id == 'string' 
          && typeof userData.email == 'string') {
        user.id = userData.id;
        user.email = userData.email;
      }
      return;
    }; // end of `updateUserData`

    reqSignUp.on('signedUp', data => {
      console.log('signedUp', data);
      resetUserData();
      cbm.use('signedUp').call();
    }).on('signedUp/error', data => {
      cbm.use('signedUp/error').call(null, data);
    });

    reqSignIn.on('signedIn', data => {
      console.log('signedIn', data);
      updateUserData(data);
      cbm.use('signedIn').call();
    }).on('signedIn/error', data => {
      cbm.use('signedIn/error').call(null, data);
    });

    reqSignOut.on('signedOut', res => {
      console.log('signedOut', res);
      resetUserData();
      cbm.use('signedOut').call();
    });

    reqFetch.on('signedIn', data => {
      console.log('signedIn', data);
      updateUserData(data);
      cbm.use('signedIn').call();
    }).on('signedOut', data => {
      console.log('signedOut', data);
      resetUserData();
      cbm.use('signedOut').call();
    });

    reqDelete.on('deleted', data => {
      console.log('deleted', data);
      cbm.use('deleted').call();
    });

    user.fetch = function() {
      resetUserData();
      reqFetch.send();
      return user;
    }; // end of user.fetch
    
    user.signUp = function(inputs) {
      // TBD
      resetUserData();
      reqSignUp.send(inputs);
      return user;
    }; // end of user.signUp

    user.signIn = function(inputs) {
      resetUserData();
      reqSignIn.send(inputs);
      return user;
    }; // end of user.signIn

    user.signOut = function() {
      resetUserData();
      reqSignOut.send();
      return user;
    }; // end of user.signOut

    user.deleteAccount = function() {
      resetUserData();
      reqDelete.send();
      return user;
    }; // end of user.deleteAccount

    user.once = function(name, callback) {
      cbm.setOnce(name, callback);
      return user;
    }; // end of user.once

    user.on = function(name, callback) {
      cbm.set(name, callback);
      return user;
    }; // end of user.on

    return user;
  }; // end of user for cope.user

  // cope.graph()
  // - id: <str>graphId
  // - node: (? <str>nodeId) => nodeAPI
  cope.graph = function(graphId) {
    let graph = {};

    // Private variables
    let cbm = util.makeCallbackManager();

    graph.node = function() {
      let node = {};
      node.val = val;
      node.then = then;
      node.snap = snap;
      node.tag = tag;
      node.alias = alias;
      node.scope = scope;

      // Private variables
      let nodeId = util.makeIdWithTime(16),
          data = {},
          nodeAlias = null,
          queue = util.makeQueue();

      console.log('nodeId', nodeId);

      function val() {
        let args = arguments;
        switch (args.length) {
          case 0: // get all values
            return get();
            break;
          case 1: // get(key) or set(values)
            if (typeof args[0] == 'string') {
              return get(args[0]);
            } else {
              return set(args[0]);
            }
            break;
          case 2: // set(key, value)
            return set(args[0], args[1]);
            break;
          default: // throw error
        };
        return console.error('node.val: invalid use of `val`');
      }; // end of val

      function then() {
        return node;
      }; // end of then

      function snap() {
        return data; 
      }; // end of snap

      function alias() {
        return node;
      };

      function tag() {
        return node;
      };

      function scope(params) { // { w:<str>, r:<str> }
        return node; 
      };

      // Private functions in function `node`
      function set() {
        let args = arguments;
        
        // Initialize `data` if necessary
        if (!data) { 
          data = {}; 
        } 

        switch (args.length) {
          case 1: // set(values)
            if (typeof args[0] == 'object') {

              // Update local node data
              for (let name in args[0]) {
                data[name] = args[0][name];
              }

              // Make the request
              queue.add(() => {
                conn.req('g/node/set').once('saved', () => {
                  queue.next();
                }).send({
                  graphId: graphId,
                  nodeId: nodeId,
                  updates: args[0]
                });
              });

              return node;
            }
            break;
          case 2: // set(key, value)
            if (typeof args[0] == 'string') {
              
              let sentData = {};
              sentData[args[0]] = args[1];

              // Update local node data
              data[args[0]] = args[1];
              
              // Make the request
              queue.add(() => {
                conn.req('g/node/set').once('saved', () => {
                  queue.next();
                }).send({
                  graphId: graphId,
                  values: sentData
                });
              });

              return node;
            }
            break;
          default: // throw error
        }
        return;
      }; // end of set

      function get() {
        let args = arguments;
        switch (args.length) {
          case 0: // get all values

            return node;
            break;
          case 1: // get(key)
            break;
          default: // throw error
        }
        return;
      }; // end of get

      return node;
    }; // end of graph.node

    return graph;
  }; // end of cope.graph 

  if (window.cope) {
    console.error('cope was already defined');
  } else {
    window.cope = cope;
  }
  return false;
})(function(io) { // io = socket.io
  // util
  // - conn: <obj>connAPI
  // - makeCallbackManager: () => <obj>callbackManagerAPI
  // - makeId: (<number>length) => <str>
  // - makeIdWithTime: (<number>length) => <str>
  // - makeTimestampWithId: () => <str>
  // - makeQueue: () => <obj>queueAPI
  let util = {};

  util.conn = function(io) {
    let conn = {};
    conn.req = req;

    // Private variables
    let socket = io(),
        connCb = function() {
          let callbacks = {};
          return function(signal) {
            if (!callbacks[signal]) {
              callbacks[signal] = util.makeCallbackManager();
            } 
            return callbacks[signal]; // callback manager for signal
          };
        }(); // end of connCb

    socket.on('toClient', res => {
      // res should be { 
      //   signal: <string>, 
      //   reqId(optional): <string>, 
      //   data: <mixed> 
      // }

      if (!res || !res.signal) {
        return console.error('Failed to find "signal" from the responded object');
      } 
      
      if (typeof res.reqId == 'string') {
        connCb(res.signal).use(res.reqId || null).call(null, res.data);
        // Note that if res.reqId does not exist, the above will call all
        // callbacks of the signal
      }
    });

    function req(apiPath) {

      if (typeof apiPath != 'string') {
        return console.error('req(apiPath): apiPath should be string');
      }

      let req = {};
      req.on = on;
      req.once = once;
      req.send = send;

      // Private variables
      let reqId = util.makeTimestampWithId();

      function on(signal, cb) {
        connCb(signal).set(reqId, cb);   
        return req;
      }; // end of on

      function once(signal, cb) {
        connCb(signal).setOnce(reqId, cb);   
        return req;
      }; // end of once

      function send(sentData) {
        socket.emit('toServer', {
          reqId: reqId,
          api: apiPath,
          data: sentData
        });
        return req;
      }; // end of send
      return req;
    }; // end of req

    return conn;
  }(io); // end of util.conn

  util.makeCallbackManager = function() {
    let cbm = {};
    cbm.set = set;
    cbm.setOnce = setOnce;
    cbm.use = use;
    cbm.del = del;

    let funcs = {}, funcsOnce = {};

    function set(name, fn) {
      if (typeof fn == 'function' && typeof name == 'string') {
        funcs[name] = fn;
      } else {
        console.error('callbackManager: invalid use of set(name, callback)');
      }
      return;
    };

    function setOnce(name, fn) {
      if (typeof fn == 'function' && typeof name == 'string') {
        funcsOnce[name] = fn;
      } else {
        console.error('callbackManager: invalid use of setOnce(name, callback)');
      }
      return;
    };

    function use(name) {
      if (typeof name != 'string') {
        return useAll;
      }
      return function() {
        if (typeof funcs[name] == 'function') {
          funcs[name].apply(null, arguments);
        } 
        
        if (typeof funcsOnce[name] == 'function') {
          funcsOnce[name].apply(null, arguments);
          delete funcsOnce[name];
        }
      };
    }

    function del() {
      delete funcs[name];
      delete funcsOnce[name];
      return;
    };

    // Private functions
    function useAll() {
      for (let name in funcs) {
        funcs[name].apply(null, arguments);
      }

      for (let name in funcsOnce) {
        funcsOnce[name].apply(null, arguments);
        delete funcsOnce[name]
      }
    }; // end of useAll

    return cbm;
  }; // end of util.makeCallbackManager

  util.makeId = function(len) {
    var text = "";
    var seeds = "_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    len = (typeof len == 'number' && len > 0) 
      ? len 
      : 5; // Five characters by default

    for (var i = 0; i < len; i++) {
      text += seeds.charAt(Math.floor(Math.random() * seeds.length));
    }
    return text;
  }; // end of util.makeId

  util.makeIdWithTime = function(len) {
    let str = (new Date().getTime()).toString(36);
    len = (typeof len == 'number' && len > 0) 
      ? len 
      : 5; // Five characters by default

    return (str + util.makeId(len - str.length)).slice(0, len);
  }; // end of util.makeIdWithTime

  util.makeTimestampWithId = function() {
    return new Date().getTime() + '_' + util.makeId();
  }; // end of util.makeTimestampWithId

  util.makeQueue = function() {
    let q = {};
    q.add = add;
    q.next = next;

    // Private variables
    let funcs = [],
        running = null,
        idx = -1;

    function add(fn) { // q.add(next => { ... });
      funcs = funcs.concat(fn);
      if (!running) { next(); }
    }; // end of add

    function next() {
      if (funcs.length > 0) {
        running = funcs[0];
        funcs = funcs.slice(1);
        running.apply(null, arguments);
      }
    }; // end of next

    return q;
  }; // end of util.makeQueue

  return util;
}(io), function() {
  // Define ui: simply views to interact with the user,
  // to send inputs and outputs back and forth
  let ui = {};

  return ui;
}(), undefined);
