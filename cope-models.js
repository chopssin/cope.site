let G = require('./cope').G;
let M = require('./cope').M;
let debug = require('debug')('cope.site:cope-model')

module.exports = function() {
  debug('Set default Cope models');
  
  M.createModel('test', model => {
    
    // test.sayHi
    model.method('sayHi', () => {
      return '[model:test] Hi';
    });
  });

  M.createModel('users', model => {

    // users.addUser
    model.method('addUser', obj => {
      return new Promise((resolve, reject) => {
        let email = obj.email;
        let password = obj.pwd;
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
