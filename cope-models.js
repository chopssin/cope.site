let G = require('./cope').G;
let M = require('./cope').M;
let debug = require('debug')('cope.site:cope-models');

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
  makeModel('copeUser');
  makeModel('copeApp');
  makeModel('copeApp/member');
  makeModel('copeApp/group');
  makeModel('copeApp/post');
  makeModel('copeApp/item');
  makeModel('copeApp/req');

  M.model('copeUser').setValid('add', obj => {
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

  M.model('copeApp').setValid('add', obj => {
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

  return false;
}();
