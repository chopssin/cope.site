var debug = require('debug')('cope.site:cope');

module.exports = function() {
  var cope = {};

  // cope.user API
  cope.user = function() {
    var api = {},
        userData = null;

    api.fetch = function() {
      return userData;
    }; // end of api.fetch

    api.update = function(params) {
      if (!params || typeof params != 'object') {
        userData = null;
        return;
      } 
      userData = {};
      userData.id = params.id;
      userData.email = params.email;
      return;
    };

    api.signIn = function(params) {
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

    api.signOut = function() {
      return new Promise(function(resolve, reject) {
        // TBD
        setTimeout(function() {
          debug('user.signOut', userData.id, userData.email);
          userData = null;
          resolve(userData);
        }, 1000);
      });
    }; // end of user.signOut
    return api;
  }; // end of cope.user

  // cope.graph
  cope.graph = function() {};

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
            let userData = user.fetch() 
              || (socket && socket.handshake 
                  && socket.handshake.session
                  && socket.handshake.session.userData)
              || null;

            // Update userData
            user.update(userData);

            debug('u/fetch:userData', userData);
            if (userData) {
              socket.emit('toClient', {
                signal: 'signedIn',
                reqId: reqId,
                data: userData
              });
            } else {
              socket.emit('toClient', {
                signal: 'signedOut',
                reqId: reqId,
                data: null
              })
            }
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
                //msg: 'u/signedout_' + data.rid,
                signal: 'signedOut',
                reqId: reqId,
                data: null
              });  
            });
            break;
          case 'g': 
            // TBD
            break;
        }
        
        // cope.graph  
      } catch (err) {
        
      }
    }); // end of socket.on('toServer')
    
    return;
  }; // end of cope.config

  return cope;
}();
