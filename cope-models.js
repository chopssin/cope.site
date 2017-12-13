let G = require('./cope').G;
let M = require('./cope').M;
let debug = require('debug')('cope.site:cope-model')

module.exports = function() {
  debug('Set default Cope models');
  
  M.createModel('test', model => {
    model.method('sayHi', () => {
      debug('[model:test] Hi');
    });
    return model;
  });

  M.createModel('users', model => {

    // TBD: What about a model without any custom method???
    model.method('addUser', obj => {
      return new Promise((resolve, reject) => {
        let email = obj.email;
        let password = obj.pwd;
        //G.createNode().then(nodeId => {
        //  let userNode = G.node(nodeId).val(obj).next(() => {
        //    resolve(userNode.snap());
        //  });
        //});
        model.createNode().then(nodeId => {
          let m = model.node(nodeId);
          m.val(obj).fetch().next(() => {
            resolve(m.snap());
          });
        });
      });
    }); // end of users.addUser

  }); // end of model "users"

  return false;
}();
