var debug = require('debug')('cope.site:cope');

module.exports = function() {
  var cope = {};

  // cope.user API
  cope.user = function() {
    var user = {},
        userData = null;

    user.fetch = function() {
      return userData;
    }; // end of api.fetch

    user.update = function(params) {
      if (!params || typeof params != 'object') {
        userData = null;
        return;
      } 
      userData = {};
      userData.id = params.id;
      userData.email = params.email;
      return;
    };

    user.signIn = function(params) {
      return new Promise(function(resolve, reject) {

        // Resolve with the current user data; otherwise, 
        if (userData && userData.id && userData.email) { 
          resolve(userData);

        // TBD: Sign in with `params`
        } else {
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
        } // end of else
      }); // end of Promise
    }; // end of user.signIn

    user.signOut = function() {
      return new Promise(function(resolve, reject) {
        // TBD
        setTimeout(function() {
          debug('user.signOut', userData.id, userData.email);
          userData = null;
          resolve(userData);
        }, 1000);
      });
    }; // end of user.signOut
    return user;
  }; // end of cope.user

  // cope.graph
  cope.graph = function(graphId) {
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
  }; // end of cope.graph

  // s stands for socket
  cope.config = function(s) {
    var socket = s, 
        user = cope.user(); // cope user API
    
    if (!socket) { 
      throw 'Failed to find socket'
    }

    // TBD: make sure this is a private end-to-server socket
    socket.on('toServer', (obj, fn) => {
      try {
        var api = obj.api,
            data = obj.data,
            reqId = obj.reqId;

        debug('socket:toServer', obj);

        // translate restful api by using cope.user
        switch (api) {
          case 'u/fetch': 
            getUser(user => {
              let userData = user.fetch();
              debug('u/fetch:userData', userData);
              socket.emit('toClient', {
                signal: userData ? 'signedIn' : 'signedOut',
                reqId: reqId,
                data: userData
              });
            });
            break;
          case 'u/signin':
            user.signIn(data).then(function(userData) {

              // Share user data with express `req.session`
              socket.handshake.session.userData = userData;
              socket.handshake.session.save();

              debug('u/signin', userData);
              socket.emit('toClient', {
                //msg: 'u/signedin_' + data.rid,
                signal: 'signedIn',
                reqId: reqId,
                data: userData
              });  
            }).catch(function(err) {
              // TBD
            });
            break;
          case 'u/signout': 
            user.signOut(data).then(function(userData) {

              // Clear user data in express `req.session`
              socket.handshake.session.userData = null;
              socket.handshake.session.save();

              socket.emit('toClient', {
                signal: 'signedOut',
                reqId: reqId,
                data: null
              });  
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
    return;
  }; // end of cope.config

  // Utilities
  function makeQueue() {
    let queue = {},
        
    queue.add = function() {
      
    }; // end of queue.add

    queue.next = function() {
    
    }; // end fo queue.next
    return queue;
  };

  return cope;
}();
