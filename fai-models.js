let G = require('./cope').G;
let M = require('./cope').M;
let debug = require('debug')('cope.site:fai-models');

// +faiUsers
// +faiApps
//   app
//     owner: <faiUser>
//     admins: { <faiUser> }
//     +members: { <appMember> }
//     +groups: { <appGroup> }
//     +followingships
//     +messages
//     +posts
//     +items
//     +reqs
//     +homepage

module.exports = function() {
  M.createModel('faiUsers', model => {
    model.method('add', (obj, userData) => {
      return new Promise((resolve, reject) => {
        let email = obj.email || null;
        let pwd = obj.pwd || null;
        if (!email || !pwd) {
          debug('[ERR] faiUsers.add', email, pwd);
          reject('[ERR] faiUsers.add: failed to add faiUser');
          return;
        }
        let checkUser = model.node({
          email: email,
          pwd: pwd
        }).fetchData();
        checkUser.next(() => {
          if (checkUser.nodeId()) {
            reject('[ERR] Fai user already existed.');
          } else {

            // Add new Fai user
            model.createNode().then(nodeId => {
              let u = model.node(nodeId);
              u.val({
                email: email, pwd: pwd
              }).fetchData().next(() => {
                resolve({ ok: true , data: u.snap.data() });
              });
            });
          }
        });
      });
    }); // end of faiUsers.add

    model.method('get', (obj, userData) => {
      return new Promise((resolve, reject) => {
        let u = model.node(obj).fetchData();
        u.next(() => {
          if (u.nodeId() && u.nodeId() == userData.nodeId) {
            resolve({ ok: true , data: u.snap.data() });
          } else {
            reject('Permission denied.');
          }
        });
      });
    }); // end of faiUsers.get

    model.method('set', (obj, userData) => {
      return new Promise((resolve, reject) => {
        let u = model.node(obj).fetchData();
        u.next(() => {
          if (u.nodeId() && u.nodeId() == userData.nodeId) {
            u.val(obj).fetchData().next(() => {
              resolve({ ok: true , data: u.snap.data() });
            });
          } else {
            reject('Permission denied.');
          }
        });
      });
    }); // end of faiUsers.set

    model.method('del', (obj, userData) => {
      return new Promise((resolve, reject) => {
        let u = model.node(obj).fetchData();
        u.next(() => {
          if (u.nodeId() && u.nodeId() == userData.nodeId) {
            u.del().then(() => {
              resolve({ ok: true });
            });
          } else {
            reject('Permission denied.');
          }
        });
      });
    }); // end of faiUsers.del
  }); // end of <faiUser>
  return false;
}();
