let G = require('./cope').G;
let M = require('./cope').M;
let debug = require('debug')('cope.site:cope-models');

/*
let checks = {};
let setCheck = function(name, cb) { // cb should return a Promise
  if (checks[name]) {
    debug('[Warning] overwritten check function `' + name + '`');
  }
  checks[name] = cb;
};
let check = function(name, obj, userData) {
  if (checks[name]) {
    return checks[name](obj, userData);
  } else {
    return new Promise((resolve, reject) => {
      // empty function
      resolve(obj);
    })
  }
};

setCheck('cope/user.addAccount', (obj, userData) => {
      return new Promise((resolve, reject) => {
        let email = obj.email;
        let pwd = obj.pwd;
        let confirmedPwd = obj.confirmedPwd;
        if (pwd === confirmedPwd) {
          debug('OKOKOK? addAccount');
          let u = M.model('cope/user').node({
            email: email,
            pwd: pwd
          });
          u.next(() => {
            if (!u.nodeId()) { // node not existed
              resolve({
                email: email, pwd: pwd
              });
            }
          });
        }
      });
});

setCheck('cope/user.delAccount', (obj, userData) => {
      return new Promise((resolve, reject) => {
        let email = obj.email;
        let pwd = obj.pwd;
        let confirmedPwd = obj.confirmedPwd;
          debug('OKOKOK? delAccount');
        if (pwd === confirmedPwd) {
          let u = M.model('cope/user').node({
            email: email,
            pwd: pwd
          });
          u.next(() => {
            if (u.nodeId()) { // node existed
              resolve({
                nodeId: u.nodeId()
              });
            }
          });
        }
      });
});

setCheck('cope/user.getProfile', (obj, userData) => {
    return new Promise((resolve, reject) => {
      let query = null;
      if (typeof obj.email == 'string') {
        query = { email: obj.email };
      } else if (typeof obj.userId == 'string') {
        query = { userId: obj.userId };
      } 

      if (query) {
        let u = M.model('cope/user').node(query);
        u.fetchData().next(() => {
          if (u.nodeId()) {
            resolve(u.snap.value());
          }
        });
      }
    });
});
*/

module.exports = function() {

  // "cope/user"
  M.createModel('cope/user', model => {
    model.method('addAccount', (obj, userData) => {
      return new Promise((resolve, reject) => {
        //check('cope/user.addAccount', obj, userData).then(valid => {
        model.checkAddAccount(obj, userData).then(valid => {
          model.createNode().then(nodeId => {
            let newUserNode = model.node(nodeId);
            valid.userId = nodeId.slice(2, 7);

            //debug('New account', nodeId);
            //debug('New account input', valid);
            newUserNode.val(valid).next(() => {
              if (newUserNode.nodeId() && newUserNode.snap.data()) {
                resolve(newUserNode.snap.data());
              }
            });
          }); 
        }); // end of check
      }); // end of Promise
    }); // end of `addAccount`

    model.method('delAccount', (obj, userData) => {
      return new Promise((resolve, reject) => {
        //check('cope/user.delAccount', obj, userData).then(valid => {
        model.checkDelAccount(obj, userData).then(valid => {
          model.node(valid.nodeId).del().then(() => {
            resolve('Account deleted.');
          }); 
        }); // end of check
      }); // end of Promise
    }); // end of `addAccount`

    model.method('getProfile', (obj, userData) => {
      return new Promise((resolve, reject) => {
        model.checkGetProfile(obj, userData).then(valid => {
          let x = model.node(valid);
          x.fetchData().next(() => {
            let v = x.snap.value() || {};
            resolve({ 
              email: v.email || 'No Email',
              name: v.name || 'No Name'
            });
          }); // end of x.fetchData 
        }); // end of check
      }); // end of Promise
    }); // end of `getProfile`

    model.method('signIn', (obj, userData) => {
      return new Promise((resolve, reject) => {
        model.checkSignIn(obj, userData).then(valid => {
          let x = model.node(valid);
          x.fetchData().next(() => {
            if (x.nodeId()) {
              resolve(x.snap.data());
            }
          }); // end of x.fetchData
        });
      });
    }); // end of `signIn`

    model.method('checkAddAccount', (obj, userData) => {
      return new Promise((resolve, reject) => {
        let email = obj.email;
        let pwd = obj.pwd;
        let confirmedPwd = obj.confirmedPwd;
        if (pwd === confirmedPwd) {
          let u = M.model('cope/user').node({
            email: email,
            pwd: pwd
          });
          u.next(() => {
            if (!u.nodeId()) { // node not existed
              resolve({
                email: email, pwd: pwd
              });
            }
          });
        }
      });
    }); // end of `checkAddAccount`

    model.method('checkDelAccount', (obj, userData) => {
      return new Promise((resolve, reject) => {
        let email = obj.email;
        let pwd = obj.pwd;
        let confirmedPwd = obj.confirmedPwd;
        if (pwd === confirmedPwd) {
          let u = M.model('cope/user').node({
            email: email,
            pwd: pwd
          });
          u.next(() => {
            if (u.nodeId()) { // node existed
              resolve({
                nodeId: u.nodeId()
              });
            }
          });
        }
      });
    }); // end of `checkDelAccount`

    model.method('checkGetProfile', (obj, userData) => {
      return new Promise((resolve, reject) => {
        let query = null;
        if (typeof obj.email == 'string') {
          query = { email: obj.email };
        } else if (typeof obj.userId == 'string') {
          query = { userId: obj.userId };
        } 

        if (query) {
          resolve(query);
        }
      });
    }); // end of `checkGetProfile`

    model.method('checkSignIn', (obj, userData) => {
      return new Promise((resolve, reject) => {
        let valid = {};
        if (obj && (typeof obj.email == 'string') && (typeof obj.pwd == 'string')) {
          resolve({
            email: obj.email,
            pwd: obj.pwd
          });
        } else {
          reject('Invalid sign-in input', obj);
        }
      });
    });
  }); // end of "cope/user"

  M.createModel('cope/app', model => {
    model.method('addApp', (obj, userData) => {
      return new Promise((resolve, reject) => {
        model.checkAddApp(obj, userData).then(valid => {
          M.model('cope/app').createNode().then(nodeId => {
            let appId = nodeId.slice(2, 10);
            let newApp = model.node(nodeId);
            newApp.val({
              appId: appId,
              appName: valid.appName
            }).link('appOwner', valid.ownerNodeId).next(() => {
              resolve(newApp.snap.value());
            });
          });
        }); // end of checkAddApp
      }); // end of Promise
    }); // end of `addApp`

    model.method('delApp', (obj, userData) => {
      return new Promise((resolve, reject) => {
        model.checkDelApp(obj, userData).then(validQuery => {
          M.model('cope/app').node(validQuery).del().then(() => {
            resolve('App deleted');
          });
        }); // end of checkDelApp
      }); // end of Promise
    }); // end of `delApp`

    model.method('getApp', (appId, userData) => {
      return new Promise((resolve, reject) => {
        let appNode = M.model('cope/app').node(validQuery);
        appNode.fetchData().next(() => {
          if (appNode.nodeId()) {
            resolve(appNode.snap.data());
          }
        });
      });
    }); // end of `getApp`

    model.method('getAllApps', (obj, userData) => {
      return new Promise((resolve, reject) => {
        model.checkGetAllApps(obj, userData).then(validQuery => {
          debug(validQuery);
          if (validQuery.appId) {
            model.getApp(validQuery.appId).then(appData => {
              resolve(appData);
            }).catch(err => {
              debug(err);
              resolve({});
            });
          } else if (typeof validQuery == 'object' 
            && Object.keys(validQuery).length > 0) {
            M.model('cope/app').findNodes(validQuery).then(appsDataObj => {
              resolve(appsDataObj);
            }).catch(err => {
              debug(err);
              resolve({});
            })
          } else {
            // Get my own apps
            let myCopeUserNodeId = userData 
              && userData.copeUserData
              && userData.copeUserData.nodeId;
            if (myCopeUserNodeId) {
              G.findLinks({ 
                '$name': 'appOwner',
                '$target': myCopeUserNodeId 
              }).then(links => {
                G.findNodes(links.map(link => link.source)).then(appsDataObj => {
                  resolve(appsDataObj);
                });
              }).catch(err => {
                debug(err);
                resolve({});
              });
            }
          }
        });
      });
    }); // end of `getAllApps`

    model.method('checkAddApp', (obj, userData) => {
      return new Promise((resolve, reject) => {
        let valid = {};
        valid.appName = (typeof obj.appName == 'string') 
          ? obj.appName 
          : 'Untitled App';
        if (userData && userData.copeUserData) {
          valid.ownerNodeId = userData.copeUserData.nodeId;
          resolve(valid);
          return;
        } else {
          reject('Required user sign in.', userData);
          return;
        }
      });
    }); // end of `checkAddApp`

    model.method('checkDelApp', (obj, userData) => {
      return new Promise((resolve, reject) => {
        let appId = obj.appId || null;
        let copeUserNodeId = userData 
          && userData.copeUserData 
          && userData.copeUserData.nodeId 
          || null;
        if (copeUserNodeId && appId) {
          let appNode = M.model('cope/app').node({ appId: appId });
          appNode.fetchData().next(() => {
            if (appNode.nodeId()) {
              let appNodeId = appNode.nodeId();
              G.findLinks(copeUserNodeId).then(links => {
                debug(links);
                let isOwner = false;
                links.map(link => {
                  if (link.name == 'appOwner' 
                    && link.target == copeUserNodeId
                    && link.source == appNodeId) {
                    isOwner = true;
                  }
                });
                if (isOwner) {
                  resolve(appNodeId);
                }
              }); // end of G.findLinks ...
            } // end of if
          }); // end of appNode...
        } // end of if
      }); // end of Promise
    }); // end of `checkDelApp`

    model.method('checkGetApp', (appId, userData) => {
      return new Promise((resolve, reject) => {
        if (typeof appId == 'string') {
          resolve(appId);
        }
      });
    }); // end of `checkGetApp`
    
    model.method('checkGetAllApps', (obj, userData) => {
      return new Promise((resolve, reject) => {
        resolve(obj);
      });
    }); // end of `checkGetAllApps`
  }); // end of "cope/app"

  M.createModel('cope/post', model => {
    model.method('addPost', (obj, userData) => {
      return new Promise((resolve, reject) => {
        model.checkAddPost(obj, userData).then(valid => {
          M.model('cope/post').createNode().then(nodeId => {

            let postNode = M.model('cope/post').node(nodeId);
            postNode.val({ 
              title: valid.title,
              postId: nodeId.slice(2, 8) + (Math.floor(Math.random() * 10000))
            })
              .link('app', valid.appNodeId)
              .link('postCreator', valid.copeUserNodeId)
              .next(() => {
                resolve(postNode.snap.value());
              });
          });
        }); // end of checkAddPost
      }); // end of Promise
    }); // end of `addPost`

    model.method('updatePost', (obj, userData) => {
      return new Promise((resolve, reject) => {
        model.checkUpdatePost(obj, userData).then(valid => {

          let postNode = model.node(valid.query);
          postNode.fetchData().next(() => {
            if (postNode.nodeId()) { // post was found
              let postValue = postNode.snap.value();
              //debug('updatePost: postValue', postValue);

              let postContent = [];
              try {
                postContent = JSON.parse(postValue && postValue.content);
              } catch (err) {
                postContent = [];
                //debug('updatePost', err);
              }

              let idx = valid.idx;
              if (isNaN(idx) || idx > postContent.length) { 
                idx = postContent.length;
              }
              if (idx < 0) { idx = 0; }
              // postContent = [ <elem> ]
              // <elem> = {
              //   header: <String>,
              //   text: <String>, 
              //   ( linkURL: <String>
              //     || imgsrc: <String>
              //     || vidsrc: <String>
              //     || audsrc: <String>
              //     || itemNodeId: <String>
              //     || postNodeId: <String> )
              // }
              switch (valid.cmd) {
                case 'move':
                  let moveTo = valid.moveTo;
                  if (moveTo >= 0 
                    && moveTo < postContent.length) {
                    let elem = postContent[idx];
                    let a = postContent.slice(0, idx);
                    let b = postContent.slice(idx + 1);
                    let tmp = a.concat(b);
                    a = tmp.slice(0, moveTo);
                    b = tmp.slice(moveTo);
                    postContent = a.concat(elem).concat(b);
                  }
                  break;
                case 'update':
                  postContent[idx] = valid.elem;
                  break;
                default: // valid.cmd == 'insert'
                  let a = postContent.slice(0, idx);
                  let b = postContent.slice(idx);
                  postContent = a.concat(valid.elem).concat(b);
              }
              postContent = JSON.stringify(postContent);
              // How to store an array in MongoDB
              // TBD Stringify JSON
              postNode.val({ content: postContent })
                .next(() => {
                  //debug('updated', postNode.snap.data());
                  let postValue = postNode.snap.value();
                  postValue.content = JSON.parse(postValue.content);
                  resolve(postValue);
              });
            }
          });
        }); // end of checkUpdatePost
      }); // end of Promise
    }); // end of `updatePost`

    model.method('delPost', (obj, userData) => {
      return new Promise((resolve, reject) => {
        model.checkDelPost(obj, userData).then(valid => {
          model.node(valid.postNodeId).del().then(() => {
            resolve('Post deleted');
          });
        });
      });
    }); // end of `delPost`

    model.method('getPost', (obj, userData) => {
      return new Promise((resolve, reject) => {
        model.checkGetPost(obj, userData).then(valid => {
          let postNode = model.node(valid.query);
          postNode.fetchData().fetchLinks().next(() => {
            if (postNode.nodeId()) {
              let postData = postNode.snap.data();
              let links = postData && postData.links;
              let isCreator = false;

              if (postData && postData.value && postData.value.content) {
                try {
                  postData.value.content = JSON.parse(postData.value.content);
                } catch (err) {
                  // TBD
                  reject(err);
                  return;
                }
              }

              links.map(x => {
                if (x.name == 'postCreator' 
                  && x.target == valid.copeUserNodeId) {
                  isCreator = true;
                }
              });
              if (!postData) {
                resolve('Post not found');
              } else {
                if (isCreator) {
                  resolve(postData);
                } else {
                  resolve({
                    title: postData.value && postData.value.title,
                    content: postData.value && postData.value.content,
                    createdAt: postData.createdAt,
                    updatedAt: postData.updatedAt
                  });
                }
              }
            }
          });
        });
      });
    }); // end of `getPost`

    model.method('getPostIds', (obj, userData) => {
      return new Promise((resolve, reject) => {
        model.checkGetPostIds(obj, userData).then(valid => {
          if (valid.linksQuery) {
            G.findLinks(valid.linksQuery).then(links => {
              G.findNodes(links.map(link => {
                return link.source;
              })).then(nodesData => {
                let postIds = [];
                debug('nodesData', nodesData);
                for (let nodeId in nodesData) {
                  let data = nodesData[nodeId];
                  if (data && data.value && data.value.postId) {
                    postIds = postIds.concat(data.value.postId);
                  }
                }
                resolve(postIds);
              }); // end of G.findNodes ...
            }); // end of model.findLinks ...
          }
        }); // end of model.checkGetPostIds ...
      }); // end of Promise
    }); // end of `getAllPostIds`

    model.method('checkAddPost', (obj, userData) => {
      return new Promise((resolve, reject) => {
        let copeUserNodeId = userData 
          && userData.copeUserData 
          && userData.copeUserData.nodeId;
        let appId = obj && obj.appId;
        if (copeUserNodeId && appId) { // require signed-in Cope user
          let appNode = M.model('cope/app').node({ appId: obj.appId });
          appNode.fetchData().next(() => {
            if (appNode.nodeId()) {
              let appNodeId = appNode.nodeId();
              resolve({
                copeUserNodeId: copeUserNodeId,
                appNodeId: appNodeId,
                title: (typeof (obj && obj.title) == 'string') 
                  ? obj.title : 'Untitled'
              });
            }
          });
        }
      }); // end of Promise
    }); // end of `checkAddPost`

    // TBD: postScope
    model.method('checkUpdatePost', (obj, userData) => {
      // { 
      //   header?, text?, linkURL?, 
      //   (imgsrc | vidsrc | audsrc)?,
      //   insertedItemId?, 
      //   insertedPostId?,
      //   postId -> for query
      // }
      return new Promise((resolve, reject) => {
        valid = {};

        let copeUserNodeId = userData 
          && userData.copeUserData 
          && userData.copeUserData.nodeId
          || null;
        if (!copeUserNodeId) {
          reject('[ERR] Require signed-in Cope user.');
          return;
        } else {
          valid.copeUserNodeId = copeUserNodeId;
        }
        
        let updateAt = parseInt(obj.updateAt, 10); 
        let insertAt = parseInt(obj.insertAt, 10);
        let idx = parseInt(obj.idx, 10);
        let moveTo = parseInt(obj.moveTo, 10);

        if (typeof obj.postId == 'string') {
          valid.query = {};
          valid.query.postId = obj.postId;
        } else {
          reject('[ERR] checkUpdatePost: invalid input that found no `postId`', obj);
          return;
        }

        if (!isNaN(updateAt)) {
          valid.cmd = 'update';
          valid.idx = updateAt;
        } else if (!isNaN(insertAt)) {
          valid.cmd = 'insert';
          valid.idx = insertAt;
        } else if (!isNaN(idx) && !isNaN(moveTo)) {
          valid.cmd = 'move';
          valid.idx = idx;
          valid.moveTo = moveTo;
          resolve(valid);
          return;
        }

        // Deal with elem to update
        let elem = {};
        elem.text = (typeof obj.text == 'string')
          ? obj.text 
          : '';
        elem.header = (typeof obj.header == 'string')
          ? obj.header
          : '';
        elem.linkURL = (typeof obj.linkURL == 'string')
          ? obj.linkURL
          : '';
        
        if (typeof obj.imgsrc == 'string') {
          elem.imgsrc = obj.imgsrc;
        } else if (typeof obj.vidsrc == 'string') {
          elem.vidsrc = obj.vidsrc;
        } else if (typeof obj.audsrc == 'string') {
          elem.audsrc = obj.audsrc;
        }

        if (obj.insertedItemId) {
          let itemNode = M.model('cope/item').node({ itemId: obj.itemId });
          itemNode.fetchData().next(() => {
            if (itemNode.nodeId()) {
              elem.itemNodeId = itemNode.nodeId();
              valid.elem = elem; 
              resolve(valid);
            }
          });
        } else if (obj.insertedPostId) {
          let postNode = M.model('cope/post').node({ postId: obj.insertedPostId });
          postNode.fetchData().next(() => {
            if (postNode.nodeId()) {
              elem.postNodeId = postNode.nodeId();
              valid.elem = elem; 
              resolve(valid);
            }
          });
        } else {
          valid.elem = elem;
          resolve(valid);
        }
        return;
      }); // end of Promise
    }); // end of `checkUpdatePost`

    model.method('checkDelPost', (obj, userData) => {
      let copeUserNodeId = userData 
        && userData.copeUserData 
        && userData.copeUserData.nodeId;
      let postId = obj.postId;
      let postNode = M.model('cope/post').node({ 
        postId: postId
      });

      return new Promise((resolve, reject) => {
        postNode.fetchData().next(() => {
          let postNodeId = postNode.nodeId();
          if (postNodeId && copeUserNodeId) {
            G.findLinks({
              '$name': 'postCreator',
              '$source': postNodeId,
              '$target': copeUserNodeId
            }).then(links => {
              //debug('LINKS', links);
              if (links.length === 1) { // the user is verified as the post's creator
                resolve({ postNodeId: postNodeId });
              }
            });
          }
        });
      }); // end of Promise
    }); // end of `checkDelPost`

    model.method('checkGetPost', (obj, userData) => {
      return new Promise((resolve, reject) => {
        let postId = obj.postId;
        let query = {};
        if (typeof postId == 'string') {
          query.postId = postId;
          resolve({ 
            query: query, 
            copeUserNodeId: userData 
              && userData.copeUserData 
              && userData.copeUserData.nodeId
          });
        }
      }); // end of Promise
    }); // end of `checkGetPost`

    model.method('checkGetPostIds', (obj, userData) => {
      let nodesQuery = {};
      let linksQuery = {};
      // TBD: validate the query object

      // "Show my posts" by default
      linksQuery = {};
      linksQuery['$name'] = 'postCreator';
      linksQuery['$target'] = userData
        && userData.copeUserData 
        && userData.copeUserData.nodeId;

      return new Promise((resolve, reject) => {
        if (linksQuery['$target']) {
          resolve({
            linksQuery: linksQuery
          });
        } else {
          reject('Require signed-in Cope user');
        }
      }); // end of Promise
    }); // end of `checkGetPostIds`
  }); // end of "cope/post"

  return false;
}();

// +CopeUsers
// +CopeApps
//   app
//     owner: <CopeUser>
//     admins: { <CopeUser> }
//     +members: { <appMember> }
//     +groups: { <appGroup> }
//     +followingships: { <fid>, <src>, <tar>, <direction>, ... }
//     +messages: { <mid>, <u1>, <u2>, ... }
//     +posts
//     +items
//     +reqs
//     +homepage

// The process of constructing an modeled node
// 1. Input check callback
// 2. Then use M's API to create or modify the node
// 3. Call resolve or reject with results

/* ---------------------------------------
let makeModel = function(modelName) {
  let funcs = {};

  M.createModel(modelName, model => {

    model.method('setValid', (method, func) => {
      funcs['valid.' + method] = func;    
    });

    model.method('setMask', (method, func) => {
      funcs['mask.' + method] = func;    
    });

    model.method('valid', (method, obj, userData) => {
      return funcs['valid.' + method](obj, userData) 
        || new Promise((resolve, reject) => {
          resolve(obj);
        });
    });

    model.method('mask', (method, obj, userData) => {
      return funcs['mask.' + method](obj, userData)
        || new Promise((resolve, reject) => {
          resolve(obj);
        });
    });

    // <model>.add
    model.method('add', (obj, userData) => {
      return new Promise((resolve, reject) => {
        model.valid('add', obj, userData).then(validObj => {

          // Create the modeled node
          model.createNode().then(nodeId => {
            let newNode = model.node(nodeId);
            newNode
              .val(validObj)
              .fetchData().next(() => {
                let masked = model.mask('add', newNode.snap.data(), userData);
                resolve({ ok: true , data: masked });
              });
          });
        }).catch(err => {
          reject(err);
        });
        // end of valid
      }); // end of Promise
    }); // end of <model>.add

    // <model>.set
    // obj: {
    //   nodeId || filter
    //   value
    // }
    model.method('set', (obj, userData) => {
      return new Promise((resolve, reject) => {
        model.valid('set', obj, userData).then(validObj => {
          model.node(obj.nodeId || obj.filter)
            .newVal(obj.value).next(() => {
              resolve({ ok: true });
            });
        }).catch(err => {
          reject(err);
        });
        // end of valid
      }); // end of Promise
    }); // end of <model>.set

    model.method('update', (obj, userData) => {
      return new Promise((resolve, reject) => {
        model.valid('update', obj, userData).then(validObj => {
          model.node(obj.nodeId || obj.filter)
            .val(obj.value).next(() => {
              resolve({ ok: true });
            });
        }).catch(err => {
          reject(err);
        });
        // end of valid
      }); // end of Promise
    }); // end of <model>.set

    // <model>.del
    model.method('del', (obj, userData) => {
      return new Promise((resolve, reject) => {
        model.valid('del', obj, userData).then(validObj => {

          let n = model.node(obj.nodeId || obj.filter);
          n.next(() => {
            if (n.nodeId()) {
              n.del().then(() => {
                resolve({ ok: true });
              });
            } 
          });

        }).catch(err => {
          reject(err);
        });
        // end of valid
      }); // end of Promise
    }); // end of <model>.del

    // <model>.getOne
    model.method('getOne', (obj, userData) => {
      return new Promise((resolve, reject) => {
        model.valid('getOne', obj, userData).then(validObj => {

          let n = model.node(validObj.nodeId || validObj.filter);
          n.fetch().next(() => {
            if (n.nodeId()) {
              resolve({ ok: true, data: model.mask('getOne', n.snap.data(), userData) });
            } else {
              resolve({ ok: false, data: null }); 
            } 
          });

        }).catch(err => {
          reject(err);
        });
        // end of valid
      }); // end of Promise
    }); // end of <model>.getOne

    // <model>.getAll
    model.method('getAll', (obj, userData) => {
      return new Promise((resolve, reject) => {
        model.valid('getAll', obj, userData).then(validObj => {
          model.findNodes(validObj.filter).then(nodesDataObj => {
            resolve({ ok: true, data: model.mask('getAll', nodesDataObj, userData) });
          });
        }).catch(err => {
          reject(err);
        });
        // end of valid
      }); // end of Promise
    }); // end of <model>.getAll
  }); // end of M.createModel
}; // end of makeModel

module.exports = function() {
  makeModel('cope/user');
  makeModel('cope/app');
  makeModel('cope/member');
  makeModel('cope/group');
  makeModel('cope/post');
  makeModel('cope/item');
  makeModel('cope/req');

  // *** cope/user ***
  M.model('cope/user').setValid('add', obj => {
    return new Promise((resolve, reject) => {
      let email = obj.email;
      let pwd = obj.pwd;
      let check = M.model('copeUser').node({ 'email': email });
      check.next(() => {
        if (!check.nodeId() && (typeof pwd == 'string')) { 
          resolve({
            email: email,
            pwd: pwd
          }); 
        }
      });
    });
  }); // end of validation of copeUsers.add

  M.model('cope/user').method('signIn', obj => {
    let userNode = M.model('cope/user').node(obj);
    userNode.val({
      'signedIn': true
    }).fetchData().then(() => {
      
    });
  }); // end of validation of copeUsers.profile

  // *** cope/app ***
  M.model('cope/app').setValid('add', obj => {
    return new Promise((resolve, reject) => {
      let appId = obj.appId;
      let ownerId = obj.ownerId;          
      if (!appId || !ownerId) { reject('[copeApp] no appId'); return; }
      let checkNode = M.model('copeApp').node({ 'appId': appId });
      checkNode.next(() => {
        if (checkNode.nodeId()) { 
          reject('[copeApp] app already existed'); 
        } else {
          let u = M.model('copeUser').node({ 'userId': ownerId });
          u.next(() => {
            if (u.nodeId()) {
              
              // Resolve with valid obj
              resolve({
                appId: appId,
                ownerId: ownerId
              });
            }
          });
        }
      }); // end of checkNode
    }); // end of Promise
  }); // end of validation of copeApps.add
  ----------------------- */

