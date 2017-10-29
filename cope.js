var debug = require('debug')('cope.site:cope');

module.exports = function() {
  var cope = {};
 
  cope.useSocketIO = useSocketIO;
  cope.useMongoDb = useMongoDb;
  cope.user = user;
  cope.graph = graph;

  // cope.user API
  function user() {
    var userAPI = {};

    userAPI.fetch = fetch;
    userAPI.update = update;
    userAPI.signIn = signIn;
    userAPI.singOut = signOut;
    userAPI.useSocketIO = useSocketIO;

    // Private variables
    let userData = null;

    function fetch() {
      return userData;
    }; // end of `fetch` of object `userAPI`

    function update(params) {
      if (!params || typeof params != 'object') {
        userData = null;
        return;
      } 
      userData = {};
      userData.id = params.id;
      userData.email = params.email;
      return;
    }; // end of `update` of object `userAPI`

    function signIn(params) {
      return new Promise(function(resolve, reject) {
        // TBD: validate params
        //if (!params) { 
        //  promise.reject();
        //}
        setTimeout(function() {
          userData = {};
          userData.id = 'fakeID';
          userData.email = params.email;
          resolve(userData);
        }, 300);
      }); // end of Promise
    }; // end of `signIn` of object `userAPI`

    function signOut() {
      return new Promise(function(resolve, reject) {
        // TBD: use db
        setTimeout(function() {
          debug('user.signOut', userData.id, userData.email);
          userData = null;
          resolve(userData);
        }, 1000);
      });
    }; // end of `signOut` of object `userAPI`
    
    function useSocketIO(socket) {
      let checkData = socket && socket.handshake 
                      && socket.handshake.session
                      && socket.handshake.session.userData;
      if (checkData) {
        update(checkData);
      }
    }; // end of `useSocketIO` of object `userAPI`
    
    return userAPI;
  }; // end of `user` of object `cope`

  // cope.graph
  function graph(graphId) {
    let graph = {};
    graph.node = node;

    function node() {
      let node = {};
      node.val = val;

      // Private variables
      let nodeData = {};

      function val() {
        
      }; // end of val

      // Private functions
      function set(updates) {
        if (typeof updates != 'object') {
          return console.error('graph.node: invalid use of `set`');
        }
        for (let name in updates) {
          nodeData[name] = updates[name]; 
        }
        // TBD: update to database
        // TBD: use queue.add
        return node;
      }; // end of set

      function get(key) {
        // TBD: use queue.add
        if (typeof key != 'string') {
          // TBD: read from database
          // update nodeData
          // call resolve function
        }
        return node;
      }; // end of get
      return node;
    }; // end of node

    return graph;
  }; // end of `graph` of object `cope`

  // Beware that `useSocketIO` will be called on every single
  // connection (once a brower is linked to the server, see details in "bin/www").
  //
  // Here we set up the connection using socket.io where we take in `s` aka socket in
  // the file "bin/www".
  //
  // So if one day we ditch socket.io, this method should be fully rewitten!
  function useSocketIO(s) {
    var socket = s, 
        user = cope.user(); // cope user API
    
    if (!socket) { 
      debug('ERROR', 'Failed to find socket');
      return;
    }

    user.useSocketIO(s);
    //TBD: graph.useSocketIO(s);


    // The format of the sent objects of "toServer" and "toClient":
    // "toServer" - {
    //   api: String,
    //   data: Mixed,
    //   reqId: String (optional)
    // } <- validated by `readReq`
    //
    // "toClient" - {
    //   signal: String,
    //   data: Mixed,
    //   reqId: String (optional)
    // } <- validated by `resObj`

    // TBD: make sure this is a private end-to-server socket
    //
    // Here we interpret client-side object, and
    // use server-side Cope api to do the corresponding tasks
    socket.on('toServer', (obj, fn) => {
      try {
        obj = readReq(obj);
        if (!obj) { return; }

        var api = obj.api,
            data = obj.data,
            reqId = obj.reqId;

        debug('socket:toServer', obj);

        // translate restful api by using cope.user
        switch (api) {
          case 'u/fetch': 
            let userData = user.fetch();
            sendObj(userData ? 'signedIn' : 'signedOut', 
                    userData,
                    reqId);
            /*
            getUser(user => {
              let userData = user.fetch();
              debug('u/fetch:userData', userData);
              socket.emit('toClient', {
                signal: userData ? 'signedIn' : 'signedOut',
                reqId: reqId,
                data: userData
              });
            });
            */
            break;
          case 'u/signin':
            user.signIn(data).then(function(userData) {

              // Share user data with express `req.session`
              socket.handshake.session.userData = userData;
              socket.handshake.session.save();

              debug('u/signin', userData);
              sendObj('signedIn', userData, reqId);
            }).catch(function(err) {
              // TBD
            });
            break;
          case 'u/signout': 
            user.signOut(data).then(function(userData) {

              // Clear user data in express `req.session`
              socket.handshake.session.userData = null;
              socket.handshake.session.save();

              sendObj('signedOut', null, reqId);
            });
            break;
          case 'g/node/set': 
            cope.graph(data.graphId)
              .node(data.nodeId)
              .val(data.values);
            //.then(() => {
            //  ...
            //});
            break;
        } // end of switch
      } catch (err) {
        
      } // end of try - catch
    }); // end of socket.on('toServer')
    
    // The reason for this function, instead of 
    // directly calling `user.fetch`, is to ensure 
    // and update whether the user's client session 
    // reamins signed-in status and to keep the user 
    // status consistent on both sides
    /*
    function getUser(callback) {
      let userData = user.fetch() 
        || (socket && socket.handshake 
            && socket.handshake.session
            && socket.handshake.session.userData)
        || null;
      user.update(userData);
      try {
        callback(user);
      } catch (err) {
        // TBD: error msg
      }
    }; // end of getUser
    */

    // Private functions:
    // Interpret the request object
    function readReq(obj) {
      let vo = {};
      vo.api = obj && obj.api;
      vo.reqId = obj && obj.reqId;
      vo.data = obj && obj.data;
      if (typeof api != 'string') {
        return null;
      }
      return vo;
    }; // end of `readReq` of function `useSocketIO`

    // To validate the respond object before sending it
    function sendObj(signal, data, reqId) {
      if (typeof signal != 'string') {
        debug('ERROR', 'reqObj: failed to validate respond object in "toClient"');
        return;
      }
      socket.emit('toClient', {
        signal: signal,
        data: data, null,
        reqId: typeof reqId == 'string' ? reqId : null
      });
      return;
    }; // end of `validateRes` of function `useSocketIO`

    return;
  }; // end of `useSocketIO` of object `cope`

  function useMongoDb() {
    // TBD
  }; // end of `useMongoDb` of object `cope`

  // Utilities: private functions of object `cope`
  function makeQueue() {
    let queue = {};
        
    queue.add = function() {
      
    }; // end of queue.add

    queue.next = function() {
    
    }; // end fo queue.next
    return queue;
  };

  return cope;
}();
