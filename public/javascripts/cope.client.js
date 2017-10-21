(function(util, ui) {
  let cope = {};

  let conn = util.conn; // used by #user, #graph

  cope.ui = ui; // export ui
  cope.user = user;
  cope.graph = graph;

  // cope.user
  function user() {
    let user = {};

    // Initialize `user`
    user.id = '';
    user.email = '';
    user.fetch = fetch;
    user.signIn = signIn;
    user.signOut = signOut;
    user.once = once;
    user.on = on;
    user.update = update;
    user.clear = clear;

    // Private variables
    let cbm = util.makeCallbackManager(),
        reqSignIn = conn.req('u/signin'),
        reqSignOut = conn.req('u/signout'),
        reqFetch = conn.req('u/fetch');

    reqSignIn.on('signedIn', data => {
      console.log('signedIn', data);
      user.update(data);
      cbm.use('signedIn').call();
    });

    reqSignOut.on('signedOut', res => {
      console.log('signedOut', res);
      user.clear();
      cbm.use('signedOut').call();
    });

    reqFetch.on('signedIn', data => {
      console.log('signedIn', data);
      user.update(data);
      cbm.use('signedIn').call();
    }).on('signedOut', data => {
      console.log('signedOut', data);
      user.clear();
      cbm.use('signedOut').call();
    });

    // Functions for `user` public methods
    function fetch() {
      reqFetch.send();
      return user;
    };

    function signIn(inputs) {
      reqSignIn.send(inputs);
      return user;
    }; // end of signIn

    function signOut() {
      reqSignOut.send();
      return user;
    }; // end of signOut

    function once(name, callback) {
      cbm.setOnce(name, callback);
      return user;
    }; // end of once

    function on(name, callback) {
      cbm.set(name, callback);
      return user;
    }; // end of on

    function update(userData) {
      if (typeof userData != 'object' || !userData) {
        clear();
        return;
      } 
      user.id = userData.id;
      user.email = userData.email;
      return;
    }; // end of update

    function clear() {
      user.id = '';
      user.email = '';
      return;
    }; // end of clear

    return user;
  }; // end of user for cope.user

  function graph(graphId) {
    let graph = {};
    graph.id = graphId;
    graph.node = node;
    graph.link = link;

    // Private variables
    let cbm = util.makeCallbackManager();

    function node() {
      let node = {};
      node.val = val;
      node.then = then;
      node.snap = snap;
      node.scope = scope;

      // Private variables
      let nodeId = makeId(16),
          data = {},
          queue = util.makeQueue();

      function val() {
        let args = arguments;
        switch (args.length) {
          case 0: // get all values
            break;
          case 1: // get(key) or set(values)
            break;
          case 2: // set(key, value)
            break;
          default: // throw error
        };
        return;
      }; // end of val

      function then() {
        return node;
      }; // end of then

      function snap() {
        return data; 
      }; // end of snap

      function scope(params) { // { w:<str>, r:<str> }
        return; 
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
                  values: args[0]
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
    }; // end of node

    function link() {
      let link = {};
      return link; 
    }; // end of link

    return graph;
  }; // end of graph for cope.graph 

  if (window.cope) {
    console.error('cope was already defined');
  } else {
    window.cope = cope;
  }
  return false;
})(function(io) { // io = socket.io
  // Define util: config with socket.io 
  // to deal with data transmission on connection
  let util = {};

  util.conn = makeConn(io); // contruct `conn`
  util.makeCallbackManager = makeCallbackManager;
  util.makeId = makeId;
  util.makeTimestampWithId = makeTimestampWithId;
  util.makeQueue = makeQueue;

  function makeConn(io) {
    let conn = {};
    conn.req = req;

    // Private variables
    let socket = io(),
        connCb = function() {
          let callbacks = {};
          return function(signal) {
            if (!callbacks[signal]) {
              callbacks[signal] = makeCallbackManager();
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
      let reqId = makeTimestampWithId();

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
  }; // end of makeConn

  function makeCallbackManager() {
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
  }; // end of makeCallbackManager

  function makeId(len) {
    var text = "";
    var seeds = "_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    len = (typeof len == 'number' && len > 0) 
      ? len 
      : 5; // Five characters by default

    for (var i = 0; i < len; i++) {
      text += seeds.charAt(Math.floor(Math.random() * seeds.length));
    }
    return text;
  }; // end of makeId

  function makeTimestampWithId() {
    return new Date().getTime() + '_' + makeId();
  }; // end of makeTimestampWithId

  function makeQueue() {
    let q = {};
    q.add = add;
    q.next = next;

    // Private variables
    let funcs = [],
        runnung = null,
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
  }; // end of makeQueue

  return util;
}(io), function() {
  // Define ui: simply views to interact with the user,
  // to send inputs and outputs back and forth
  let ui = {};

  return ui;
}(), undefined);
