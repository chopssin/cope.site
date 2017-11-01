let debug = require('debug')('cope.site:cope');
let fs = require('fs');
let MongoClient = require('mongodb').MongoClient;
 
// cope
// cope.util.readJSON: (<str>path, <func>callback) => <undefined>
// cope.user: () => <obj>userAPI
// cope.graph: (<str>graphId) => <obj>graphAPI
// cope.useSocketIO: (<obj>socket) => <undefined>
// cope.useMongoDb: (<obj>db) => <undefined>
module.exports = function() {
  let cope = {};

  // Database API and configuration
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

  // cope.util
  // - readJSON: (<str>path, <func>callback) => <undefined>
  cope.util = {};
  cope.util.readJSON = function(path, callback) {
    if (typeof callback == 'function') {
      fs.readFile(path, 'utf8', (err, data) => {
        let obj = null;
        try {
          obj = JSON.parse(data);
        } catch (err) {
          debug('cope.util.readJSON', err);
          return;
        }
        debug('cope.util.readJSON: ' + path, obj);
        callback(obj);
      });
    }
    return;
  }; // end of cope.util.readJSON

  // cope.user()
  // - fetch: () => <obj>userData
  // - update: (<obj>userData) => <undefined>
  // - signUp: (<obj>signUpParams) => <promise>
  // - signIn: (<obj>signInParams) => <promise>
  // - signOut: () => <promise>
  // - deleteAccount: () => <promise>
  // - useSocketIO: (<obj>socket) => <undefined>
  cope.user = function() {
    let userAPI = {};

    // Private variables
    let userData = null,
        updateSocketData = function() {}; // will be overwritten by userAPI.useSocketIO
      
    let userStatus = function() {
      let obj = {},
          currentMSG = 'USER_SIGNED_OUT';
      [ 'USER_SIGNED_UP',
        'USER_SIGNED_IN',
        'USER_SIGNED_OUT',
        'USER_DELETED',
        'WRONG_PASSWORD',
        'USER_DUPLICATED',
        'USER_NOT_FOUND' ].map((msg, idx) => {
        obj[msg] = {
          code: idx,
          msg: msg
        };  
      }); // end of map
      return function(msg) {
        if (typeof msg == 'string') {
          currentMSG = msg;
        }
        return obj[currentMSG];
      };
    }(); // end of userStatus()

    let updateUserData = function(params) {
      if (!params || typeof params != 'object') {
        userData = null;
      } else { 
        userData = {};
        userData.id = params.id;
        userData.email = params.email;
      }

      try {
        updateSocketData(userData);
      } catch (err) { debug(err); }
      return;
    }; // end of updateUserData

    let clearUserData = function() {
      return updateUserData(null);
    }; // end of clearUserData

    userAPI.fetch = function() {
      return {
        'userData': userData,
        'status': userStatus()
      };
    }; // end of userAPI.fetch

    userAPI.signUp = function(params) {
      clearUserData();
      return new Promise((resolve, reject) => {
        try {
          let email = params && params.email;
          debug('user.signUp: attemp to sign up', params);
          db({
            dbname: 'testDB'
          }).then(db => {
            debug('sucessfully connect to the db');
            db.collection('users').find({ 'email': email }).toArray((err, docs) => {
              if (err || !Array.isArray(docs)) {
                debug(err);
                db.close();
                return;
              }

              if (docs.length > 0) {
                //debug('User "' + email + '" already existed');
                //reject('User "' + email + '" already existed');
                debug('User "' + email + '"', userStatus('USER_DUPLICATED'));
                reject(userStatus('USER_DUPLICATED'))
                db.close();
              } else if (docs.length === 0) {
                db.collection('users').insertOne(params, (err, result) => {
                  if (err) { debug(); }
                  if (result && result.insertedCount === 1) {
                    debug('user.signUp: ' + (params && params.email) + ' signed up successfully');
                    resolve(userStatus('USER_SIGNED_UP'));
                  }
                  db.close();
                }); // end of signing up the user
              } // end of else if
            }); // end of finding user by email
          }); // end of db().then() 
        } catch (err) {
          debug(err);
        } 
      }); // end of Promise
    }; // end of userAPI.signUp

    userAPI.signIn = function(params) {
      clearUserData();
      return new Promise(function(resolve, reject) {
        try {
          db({
            dbname: 'testDB',
          }).then(db => {
            
            let email = params && params.email;
            let password = params && params.password;
            db.collection('users').find({ 'email': email }).toArray((err, docs) => {
              if (err) { 
                debug(err); 
                reject(err);
              }
              debug('user.signIn', docs);
              if (!docs || docs.length === 0) {
                debug('User "' + email + '" not found');
                // reject('User "' + email + '" not found');
                reject(userStatus('USER_NOT_FOUND'));
              } else if (docs.length === 1) {

                if (docs[0].password != password) {
                  debug('Wrong password of user "' + email + '"');
                  //reject('Wrong password of user "' + email + '"');
                  reject(userStatus('WRONG_PASSWORD'));
                  return;
                }

                userData = function(doc) {
                  return {
                    id: 'fakeId',
                    email: doc.email
                  }
                }(docs[0]);

                updateUserData(userData);

                resolve(userStatus('USER_SIGNED_IN'));
              } else {
                debug('Found multiple users of "' + email + '"');
                //reject('Found multiple users of "' + email + '"');
                reject(userStatus('USER_DUPLICATED'));
              }
            
              db.close();
            }); // end of db.find().toArray()
          }).catch(err => {
            debug(err);
            debug('failed to connect to db `testDB`');
          });
        
        } catch (err) {
          debug(err);
        }
      }); // end of Promise
    }; // end of userAPI.signIn

    userAPI.signOut = function() {
      clearUserData();
      return new Promise(function(resolve, reject) {
        debug('user.signOut: clear up `userData`');
        resolve(userStatus('USER_SIGNED_OUT'));
      });
    }; // end of userAPI.signOut

    userAPI.deleteAccount = function() {
      return new Promise((resolve, reject) => {
        let email = userData && userData.email;
        if (!email) {
          debug('user.deleteAccount: userData is null');
          //reject('user.deleteAccount: userData is null');
          reject(userStatus('USER_NOT_FOUND'));
          return;
        }

        try {
          db({ dbname: 'testDB' }).then(db => {
            db.collection('users').findOneAndDelete({ 'email': email }, (err, result) => {
              if (err) { 
                debug(err); 
                reject(err);
              } else {
                debug('user.deleteAccount: user "' + email + '" deleted');
                clearUserData();
                userAPI.signOut().then(() => {
                  //resolve({ 'status': 'ok' });
                  resolve(userStatus('USER_DELETED'));
                });
              }
              db.close();
            });
          });
        } catch (err) {
          debug(err);
        }
      }); 
    }; // end of userAPI.deleteAccount
    
    userAPI.useSocketIO = function(socket) {

      // Overwrite the outer variable
      updateSocketData = function(userData) {
        try {
          debug('updateSocketData', userData);
          socket.handshake.session.userData = userData; // TBD: Not working???
          socket.handshake.session.save();
        } catch (err) {
          debug(err);
        }
      }; // end of updateSocketData

      let checkData = socket && socket.handshake 
                      && socket.handshake.session
                      && socket.handshake.session.userData;
      if (checkData && checkData.email) {
        debug('cope.user: found signed-in user: ', checkData.email);
        updateUserData(checkData);
      }

      return;
    }; // end of userAPI.useSocketIO
    
    return userAPI;
  }; // end of cope.user

  // cope.graph() 
  // - node: (? <str>nodeId) => <obj>nodeAPI
  // - useSocketIO: (<obj>socket) => <undefined>
  cope.graph = function(graphId) {
    let graphAPI = {};

    // graphAPI.node()
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

    debug('cope.useSocketIO: use socket');

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
            let userData = user.fetch().userData;
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
          case 'u/signup':
            user.signUp(data).then(userStatus => {
              debug('u/signup', userStatus);
              sendObj('signedUp', userStatus, reqId);
            }).catch(function(err) {
              sendObj('signedUp/error', err, reqId);
            });
            break;
          case 'u/signin':
            user.signIn(data).then(function(userStatus) {

              // Share user data with express `req.session`
              // socket.handshake.session.userData = userData;
              // socket.handshake.session.save();
              let userData = user.fetch().userData;
              debug('u/signin', userData);
              sendObj('signedIn', userData, reqId);
            }).catch(function(err) {
              sendObj('signedIn/error', err, reqId); 
            });
            break;
          case 'u/signout': 
            user.signOut().then(userStatus => {

              // Clear user data in express `req.session`
              // socket.handshake.session.userData = null;
              // socket.handshake.session.save();

              sendObj('signedOut', userStatus, reqId);
            });
            break;
          case 'u/delete':
            user.deleteAccount().then(userStatus => {
              sendObj('deleted', userStatus, reqId);
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

  // We use this method to set `db`.
  // `db` should be a function like this:
  // (params) => <Promise>promise
  // where the db instance comes when resolved
  // and the params should be {
  //  dbname: <string>,
  //  username: <string>,
  //  password: <string>
  // }
  // e.g.
  //   db({
  //     dbname: 'test',
  //     username: 'aca',
  //     password: '123456'
  //   }).then(db => { ... });
  cope.useMongoDb = function(params) {

    // TBD: Initialize System Admin User
    cope.util.readJSON('./config/credentials.json', obj => {
      config({
        host: obj.MONGODB_HOST,
        port: obj.MONGODB_PORT
      });
    });

    function config(obj) {
      let host = obj.host;
      let port = obj.port;
      if (!host || !port) {
        return;
      }

      let baseURL = host + ':' + port;

      debug('cope.useMongoDb: set `db`');
      db = function(params) {
        if (typeof params != 'object') {
          params = {};
        }

        let url = baseURL,
            dbname = params.dbname,
            username = params.username,
            password = params.password;

        return new Promise((resolve, reject) => {

          // Deal with `url`
          if (dbname) {
            url = url + '/' + dbname;
          } else {
            debug('`dbname` is not specified');
            reject('`dbname` is not specified');
            return;
          }

          if (username && password) {
            url = username + ':' + password + '@' + url; 
          }

          url = 'mongodb://' + url; debug('url = ' + url);

          MongoClient.connect(url, (err, db) => {
            if (err) {
              debug(err);
              reject(err);
            } else {
              resolve(db);
            }
            return;
          });
          return;
        }); // end of new Promise
      }; // end of `db`
    }; // end of `config` in cope.useMongoDb
    
    return;
  }; // end of cope.useMongoDb

  return cope;
}();
