const cope = require('./cope');
const G = cope.G;
const M = cope.M;
let debug = require('debug')('cope.site:cope-models');

module.exports = function() {

  // "cope/user"
  M.createModel('cope/user', model => {
    model.method('addAccount', (obj, userData) => {
      
      console.log('cope/user:addAcount', obj, userData);
      
      return new Promise((resolve, reject) => {
        //check('cope/user.addAccount', obj, userData).then(valid => {
        model.checkAddAccount(obj, userData).then(valid => {
      
          console.log('cope/user:addAcount', valid);
          
          model.createNode().then(nodeId => {
            let newUserNode = model.node(nodeId);
            valid.userId = nodeId.slice(2, 7);
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
      debug('checkSingIn', obj);
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
              resolve(newApp.snap.data());
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

    model.method('updateApp', (obj, userData) => {
      return new Promise((resolve, reject) => {
        model.checkUpdateApp(obj, userData).then(valid => {
          let appNode = M.model('cope/app').node(valid.query);
          appNode.val(valid.updates).next(() => {
            resolve(appNode.snap.data());
          });
        });
      });
    }); // end of `updateApp`

    model.method('getApp', (obj, userData, params) => {
      debug('getApp', obj, userData, params);
      return new Promise((resolve, reject) => {
        model.checkGetApp(obj, userData, params).then(validQuery => {
          debug('getApp:query', validQuery);
          let appNode = M.model('cope/app').node(validQuery);
          appNode.fetchData().next(() => {
            if (appNode.nodeId()) {
              resolve(appNode.snap.data());
            }
          });
        });
      });
    }); // end of `getApp`

    model.method('getAllApps', (obj, userData, params) => {
      return new Promise((resolve, reject) => {
        model.checkGetAllApps(obj, userData, params).then(validQuery => {
          debug('getAllApps', validQuery);
          if (typeof validQuery == 'string'  // nodeId
            || (validQuery && validQuery.appId)) {
            model.getApp(validQuery).then(appData => {
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

    model.method('checkUpdateApp', (obj, userData) => {
      return new Promise((resolve, reject) => {
        let appId = obj.appId;
        let copeUserNodeId = userData 
          && userData.copeUserData 
          && userData.copeUserData.nodeId
          || null;
        let checkNode = model.node({ appId: appId });

        if (!appId || !copeUserNodeId) {
          debug(obj, userData);
          reject('Invalid appId or unathorized request.');
          return;
        }

        checkNode.fetchData().next(() => {
          let appNodeId = checkNode.nodeId();
          if (appNodeId) {
            G.findLinks({
              '$name': 'appOwner',
              '$source': appNodeId,
              '$target': copeUserNodeId
            }).then(links => {
              if (links && links.length === 1) {
                delete obj.appId;
                resolve({
                  query: appNodeId,
                  updates: obj
                });
              }
            });
          }
        }); // end of checkNode.fetchData ...
      }); // end of Promise
    }); // end of `checkUpdateApp`

    model.method('checkGetApp', (obj, userData, params) => {
      return new Promise((resolve, reject) => {
        debug('checkGetApp', obj, userData, params);
        let appId = obj && obj.appId;
        if (typeof appId == 'string') {
          resolve({ appId: appId });
        } else if (params && params.appNodeId) {
          resolve(params.appNodeId);
        } else if (typeof obj == 'object' && Object.keys(obj).length > 0) {
          resolve(obj);
        } else {
          debug('[ERR] checkGetApp(obj, userData, params): invalid obj');
        }
      });
    }); // end of `checkGetApp`
    
    model.method('checkGetAllApps', (obj, userData, params) => {
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
                resolve(postNode.snap.data());
              });
          });
        }); // end of checkAddPost
      }); // end of Promise
    }); // end of `addPost`

    model.method('updatePost', (obj, userData) => {
      return new Promise((resolve, reject) => {
        model.checkUpdatePost(obj, userData).then(valid => {
          let postNode = model.node(valid.query);
          postNode.val(valid.updates).next(() => {
            debug('updatePost RES', postNode.snap.data());
            resolve(postNode.snap.data());
          });
        });
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

    model.method('getPost', (obj, userData, params) => {
      return new Promise((resolve, reject) => {
        model.checkGetPost(obj, userData, params).then(valid => {
          let postNode = model.node(valid.query);
          postNode.fetchData().fetchLinks().next(() => {
            if (postNode.nodeId()) {
              let postData = postNode.snap.data();
              let links = postData && postData.links;
              let isCreator = false;

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
                    subtitle: postData.value && postData.value.subtitle,
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

    model.method('getPostIds', (obj, userData, params) => {
          debug('getPostIds', obj, userData, params);
      return new Promise((resolve, reject) => {
        model.checkGetPostIds(obj, userData, params).then(valid => {
          let posts = model.sub();
          debug('getPostIds:valid', valid);
          if (valid.copeUserNodeId) {
            posts = posts.sub('postCreator', null, valid.copeUserNodeId);
          }
          if (valid.appNodeId) {
            posts = posts.sub('app', null, valid.appNodeId);
          }
          posts.then(postNodeIds => {
            debug(postNodeIds);
            G.findNodes(postNodeIds).then(nodesData => {
              let postIds = [];

              for (let nodeId in nodesData) {
                let data = nodesData[nodeId];
                if (data && data.value && data.value.postId) {
                  postIds = postIds.concat(data.value.postId);
                }
              }
              resolve(postIds);
            }); 
          }); // end of posts.then
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

    model.method('checkUpdatePost', (obj, userData) => {
      return new Promise((resolve, reject) => {
        let postNodeId = null;
        let query = null;
        let updates = null;
        let copeUserNodeId = userData 
          && userData.copeUserData 
          && userData.copeUserData.nodeId
          || null;

        if (!obj || !obj.postId || !copeUserNodeId) {
          return reject('Invalid query or failed to authenticate the user');
        }

        if (obj && (obj.content 
                   || obj.title 
                   || obj.subtitle)
        ) {
          updates = {};
          if (typeof obj.content == 'string') {
            updates.content = obj.content;
          }
          if (typeof obj.title == 'string') {
            updates.title = obj.title;
          }
          if (typeof obj.subtitle == 'string') {
            updates.subtitle = obj.subtitle;
          }
        }

        if (!updates) {
          return reject('Invalid updates');
        }

        let postNode = model.node({ postId: obj.postId });
        postNode.fetchData().next(() => {
          if (postNode.nodeId()) {
            postNodeId = postNode.nodeId();
            G.findLinks({
              '$name': 'postCreator',
              '$source': postNodeId,
              '$target': copeUserNodeId
            }).then(links => {
              if (links && links.length == 1) {
                resolve({
                  query: postNodeId,
                  updates: updates
                });
              }
            });
          } // end of if
        }); // end of postNode.fetchData ...
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

    model.method('checkGetPost', (obj, userData, params) => {
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

    model.method('checkGetPostIds', (obj, userData, params) => {
      let queue = cope.util.makeQueue();
      let appId = (params && params.appId)
        || (obj && obj.appId);
      let copeUserNodeId = userData 
        && userData.copeUserData 
        && userData.copeUserData.nodeId;
        
      return new Promise((resolve, reject) => {
        let valid = {};
        if (appId) {
          queue.add(() => {
            let appNode = M.model('cope/app').node({ 'appId': appId });
            appNode.fetchData().next(() => {
              if (appNode.nodeId()) {
                valid.appNodeId = appNode.nodeId();
              }
              queue.next();
            });
          })
        }
        if (copeUserNodeId) {
          queue.add(() => {
            valid.copeUserNodeId = copeUserNodeId;
            queue.next();
          });
        }
        queue.add(() => {
          resolve(valid);
        });
      }); // end of Promise
    }); // end of `checkGetPostIds`
  }); // end of "cope/post"

  M.createModel('cope/card', model => {
    model.setBefore('update', (obj, userData, params) => {
      return new Promise((resolve, reject) => {
        let valid = {};
        let id = obj && obj.cardId;
        if (id) {
          valid.query = { 'id': id };
          valid.updates = obj.updates;
          if (valid.updates && valid.updates.id) {
            delete valid.updates.id;
          }
          debug('cope/card: setmask: update', valid, obj, userData, params);
          resolve(valid);
        } else {
          reject('Lack of `cardId`');
        }
      });
    });

    model.setBefore('getMany', (obj, userData, params) => {
      return new Promise((resolve, reject) => {
        let valid = {};
        let copeUserNodeId = userData 
          && userData.copeUserData 
          && userData.copeUserData.nodeId 
          || null;
        if (obj && obj.mine && copeUserNodeId) {
          valid.subsetArr = [{ 'linkName': 'cardCreator', 'target': copeUserNodeId }];
        }
        debug('getMany', obj, userData, params, copeUserNodeId);
        resolve(valid);
      });
    });

    model.setAfter('add', (obj, userData, params) => {
      return new Promise((resolve, reject) => {
        let cardNodeId = obj.nodeId;
        let copeUserNodeId = userData 
          && userData.copeUserData 
          && userData.copeUserData.nodeId 
          || null;

        if (cardNodeId && copeUserNodeId) {
          G.node(cardNodeId)
            .link('cardCreator', copeUserNodeId).next(() => {
            delete obj._id;
            delete obj.nodeId;
            resolve(obj);
          });
        } else {
          // TBD
        }
      });
    });
  }); // end of "cope/card"

  return false;
}();
