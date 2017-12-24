let G = require('./cope').G;
let M = require('./cope').M;
let debug = require('debug')('cope.site:cope-model')

module.exports = function() {
  debug('Set default Cope models');
  
  M.createModel('test', model => {
    
    // test.sayHi
    model.method('sayHi', (obj, userData) => {
      debug('[model:test].sayHi <= (obj, userData)', obj, userData);
      return new Promise((resolve, reject) => {
        resolve('[model:test] Hi');
      });
    }); // end of test.sayHi
  }); // end of model "test"

  M.createModel('users', model => {

    // users.addUser
    model.method('addUser', obj => {
      return new Promise((resolve, reject) => {
        let email = obj.email;
        let password = obj.pwd;
        let checkUser = model.node({ email: email });
        checkUser.fetch().next(() => {
          if (checkUser.nodeId()) {
            reject({ 'msg': 'duplicated user' });
          } else {
            model.createNode().then(nodeId => {
              let u = model.node(nodeId);
              u.val(obj).fetch().next(() => {
                resolve(u.snap());
              });
            });
          } // end of else
        });
      });
    }); // end of users.addUser

    // users.signIn
    model.method('signIn', obj => {
      return new Promise((resolve, reject) => {
        let email = obj.email;
        let password = obj.pwd;

        if (!password) {
          reject('[ERR] lack of password');
        }

        let u = model.node({ 
          email: email, 
          pwd: password
        });

        u.fetch().next(() => {
          if (u.nodeId()) {
            resolve(u.snapData());
          } else {
            reject('[ERR] failed to get user by ' + JSON.stringify(obj));
          }
        });
      });
    }); // end of users.signIn

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

    // users.delUser
    model.method('delUser', obj => {
      return new Promise((resolve, reject) => {
        let email = obj.email;
        let pwd = obj.pwd;
        let u = model.node({ email: email, pwd: pwd });
        u.fetch().next(() => {
          if (u.nodeId()) {
            u.del().then(() => {
              resolve('Successfully deleted.');
            }).catch(err => {
              reject(err);
            });
          } else {
            reject('User not found.');
          }
        })
      });
    }); // end of users.delUser
  }); // end of model "users"

  M.createModel('posts', model => {

    // posts.addPost
    model.method('addPost', (obj, userData) => {
      return new Promise((resolve, reject) => {
        model.createNode().then(nodeId => {
          let post = model.node(nodeId);
          let author = userData || null;
          let value = {};
          
          if (author && author.nodeId) {
            // TBD: test the following
            post.link('createdBy', author.nodeId);
          }
          post.val(obj).fetch().next(() => {
            if (post.snapData()) {
              resolve(post.snapData())
            } else {
              reject('[ERR] failed to add the new post')
            }
          });
        });
      });
    });
  }); // end of model "posts"

  return false;
}();
