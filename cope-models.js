let G = require('./cope').G;
let M = require('./cope').M;
let debug = require('debug')('cope.site:cope-models');

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
                resolve(u.snap.value());
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
            resolve(u.snap.data());
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
            resolve(u.snap.value());
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
          
          // TBD: check appId, and so on.
          debug('author', author);
          if (author && author.nodeId) {
            post.link('createdBy', author.nodeId);
          }
          post.val(obj).fetch().next(() => {
            if (post.snap.data()) {
              resolve(post.snap.data())
            } else {
              reject('[ERR] failed to add the new post')
            }
          });
        });
      });
    }); // end of posts.addPost

    // posts.getPosts
    model.method('getPosts', (obj, userData) => {

      // obj.viewScope == 'PUBLIC', 'MEMBERS', 'ADMINS', 'ONLY_ME', 'CHN[ ... ]', 'FOLLOWING', 'MSG( ... )'
      // Get authorIds based on obj.viewScope
      // Get posts based on authorIds, and adjust posts based on their privacy
      // Sort chronologically, starting with the most recent posts
      return new Promise((resolve, reject) => {
        let reader = userData || null;
        let authorId = obj.authorId;

        debug('LINKS of authorId', authorId);
        G.findLinks({ 
          '$name': 'createdBy', '$target': authorId 
        }).then(links => {
          debug('LINKS', links);

          G.findNodes(links.map(link => link.source)).then(nodesData => {
            resolve(nodesData);
          });
        }).catch(err => {
          reject(err);
        });
      });
    }); // end of posts.getPosts

  }); // end of model "posts"

  return false;
}();
