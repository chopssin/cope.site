let G = require('./cope').G;
let M = require('./cope').M;
let debug = require('debug')('cope.site:cope-model')

module.exports = function() {
  debug('Set default Cope models');
  
  M.createModel('test', model => {
    
    // test.sayHi
    model.method('sayHi', () => {
      return new Promise((resolve, reject) => {
        resolve('[model:test] Hi');
      });
    });
  });

  M.createModel('users', model => {

    // users.addUser
    model.method('addUser', obj => {
      return new Promise((resolve, reject) => {
        let email = obj.email;
        let password = obj.pwd;
        model.createNode().then(nodeId => {
          let u = model.node(nodeId);
          u.val(obj).fetch().next(() => {
            resolve(u.snap());
          });
        });
      });
    }); // end of users.addUser

    // users.getUser
    model.method('getUser', obj => {
      return new Promise((resolve, reject) => {
        let email = obj.email;
        let password = obj.pwd;
        let u = model.node({ 
          email: email, 
          pwd: password
        });

        u.fetch().next(() => {
          if (u.nodeId()) {
            resolve(u.snapData());
          } else {
            reject('[ERR] failed to get user by', obj);
          }
        });
      });
    }); // end of users.getUser

    // users.getUserProfile
    model.method('getUserProfile', obj => {
      return new Promise((resolve, reject) => {
        let email = obj.email;
        let u = model.node({ email: email }); 
        u.fetch().next(() => {
          if (u.nodeId()) {
            resolve(u.snap());
          } else {
            reject('[ERR] failed to get user by ' + JSON.stringify(obj));
          }
        });
      });
    }); // end of users.getUserProfile

  }); // end of model "users"

  return false;
}();
