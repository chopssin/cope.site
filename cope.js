var debug = require('debug')('cope.site:cope');

 
// cope methods
// cope.user: () => <obj>userAPI
// cope.graph: (<str>graphId) => <obj>graphAPI
// cope.useSocketIO: (<obj>socket) => <undefined>
// cope.useMongoDb: (<obj>db) => <undefined>
module.exports = function() {
  let cope = {};

  // Private variables
  let db = null;

  // Utilities: private functions of object `cope`
  let makeQueue = function() {
    let queue = {};
        
    queue.add = function() {
      
    }; // end of queue.add

    queue.next = function() {
    
    }; // end fo queue.next
    return queue;
  }; // end of `makeQueue`

  // cope.user() methods
  // - fetch: () => <obj>userData
  // - update: (<obj>userData) => <undefined>
  // - signIn: (<obj>signInParams) => <promise>
  // - signOut: (<obj>signOutParams) => <promise>
  // - useSocketIO: (<obj>socket) => <undefined>
  cope.user = function() {
    var userAPI = {};

    // Private variables
    let userData = null;

    userAPI.fetch = function() {
      return userData;
    }; // end of userAPI.fetch

    userAPI.update = function(params) {
      if (!params || typeof params != 'object') {
        userData = null;
        return;
      } 
      userData = {};
      userData.id = params.id;
      userData.email = params.email;
      return;
    }; // end of userAPI.update

    userAPI.signIn = function(params) {
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
    }; // end of userAPI.signIn

    userAPI.signOut = function() {
      return new Promise(function(resolve, reject) {
        // TBD: use db
        setTimeout(function() {
          debug('user.signOut', userData.id, userData.email);
          userData = null;
          resolve(userData);
        }, 1000);
      });
    }; // end of userAPI.signOut
    
    userAPI.useSocketIO = function(socket) {
      let checkData = socket && socket.handshake 
                      && socket.handshake.session
                      && socket.handshake.session.userData;
      if (checkData && checkData.email) {
        debug('cope.user: found signed-in user: ', checkData.email);
        userAPI.update(checkData);
      }
      return;
    }; // end of userAPI.useSocketIO
    
    return userAPI;
  }; // end of `user` of object `cope`

  // cope.graph() methods
  // - node: (? <str>nodeId) => <obj>nodeAPI
  // - useSocketIO: (<obj>socket) => <undefined>
  cope.graph = function(graphId) {
    let graphAPI = {};

    // graphAPI.node() methods
    // - val: () => <obj>nodeAPI, 
    //        (<str>) => <obj>nodeAPI,
    //        (<obj>) => <obj>nodeAPI,
    //        (<str>, <mixed>) => <obj>nodeAPI
    // - then: () => <obj>nodeAPI
    // - snap: () => <obj>nodeData
    graphAPI.node = function() {
      let nodeAPI = {};

      // Private variables
      let nodeData = {};

      let set = function(updates) {
        if (typeof updates != 'object') {
          return console.error('graph.node: invalid use of `set`');
        }
        for (let name in updates) {
          nodeData[name] = updates[name]; 
        }
        // TBD: update to database
        // TBD: use queue.add
        return nodeAPI;
      }; // end of `set`
      
      let get = function() {
        // TBD: use queue.add
        // TBD: read from database
        // update nodeData
        // call resolve function
        return nodeAPI;
      }; // end of `get`

      nodeAPI.val = function() {
        return nodeAPI; 
      }; // end of nodeAPI.val

      nodeAPI.then = function() {
        return nodeAPI; 
      }; // end of nodeAPI.then

      nodeAPI.snap = function() {
        return nodeData; 
      }; // end of nodeAPI.snap

      return nodeAPI;
    }; // end of graphAPI.node

    return graphAPI;
  }; // end of cope.graph

  // Beware that `cope.useSocketIO` will be called on every single
  // connection (once a brower is linked to the server, see details in "bin/www").
  //
  // Here we set up the connection using socket.io where we take in `s` aka socket in
  // the file "bin/www".
  //
  // So if one day we ditch socket.io, this method should be fully rewitten!
  cope.useSocketIO = function(s) {
    let socket = s, 
        user = cope.user(); // cope user API
    
    if (!socket) { 
      debug('ERROR', 'Failed to find socket');
      return;
    }

    user.useSocketIO(s);
    //TBD: graph.useSocketIO(s);

    // Private functions:
    // Interpret the request object
    let readReq = function(obj) {
      let vo = {};
      vo.api = obj && obj.api;
      vo.reqId = obj && obj.reqId;
      vo.data = obj && obj.data;
      if (typeof vo.api != 'string') {
        debug('ERROR', 'readReq: `api` is not specified');
        return null;
      }
      return vo;
    }; // end of `readReq`

    // To validate the respond object before sending it
    let sendObj = function(signal, data, reqId) {
      if (typeof signal != 'string') {
        debug('ERROR', 'reqObj: failed to validate respond object in "toClient"');
        return;
      }
      debug('sendObj: ' + signal, data, reqId);
      socket.emit('toClient', {
        signal: signal,
        data: data || null,
        reqId: typeof reqId == 'string' ? reqId : null
      });
      return;
    }; // end of `sendObj`

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

    return;
  }; // end of cope.useSocketIO

  cope.useMongoDb = function(mongo) {
    // TBD: deal with mongo and modify external `db`
    db = function() {
    
    };
    return;
  }; // end of cope.useMongoDb

  return cope;
}();
