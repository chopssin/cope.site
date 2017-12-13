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
    model.method('getUserData', obj => {
      return new Promise((resolve, reject) => {
        let email = obj.email;
        let password = obj.pwd;
        let userNode = G.node({ email: email })
          .fetch().then(() => {
            resolve(userNode.snap());
          });
      });
    });
  });

  return false;
}();
