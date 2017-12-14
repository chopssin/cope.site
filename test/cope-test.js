let cope = require('../cope');
let debug = require('debug')('cope.site:test/cope-test');

module.exports = function() {

  let M = cope.M;
  let test = function() {
    let count = 0;
    let queue = cope.util.makeQueue();

    // `fn` is a callback takes in the `next` function
    // Call `next` to do the next test
    return function(testName, testFn) {
      queue.add(() => {
        count += 1;
        debug(count, testName);
        let running = true;

        testFn(function() {
          running = false;
          debug('Passed.');
          queue.next();
        });

        // Indicate the testName if timeout
        setTimeout(() => {
          if (running) {
            debug('[ 2-SEC TIMEOUT TEST ] ' + testName);
          }
        }, 2000);
      })
      return;
    };
  }(); // end of test

  debug('---------------------');

  test('Begin to test', next => {
    next();
  });

  test('testModel.sayHi', next => {
    let testModel = M.model('test');
    testModel.sayHi();
    next();
  });

  test('users.addUser', next => {
    let users = M.model('users');

    users
      .addUser({ email: 'taster@xmail.com', pwd: 'taste!' })
      .then(userData => {
        debug('userData', userData);
        next();
      });
  });

  test('Sign in with wrong password', next => {

    let userNode = M.model('users').node({ 
      email: 'taster@xmail.com', 
      pwd: 'wrong_password' 
    });

    userNode.fetch().next(() => {
      if (!userNode.nodeId()) {
        next();
      } else {
        debug('[ERR] userNode.nodeId()', userNode.nodeId());
      }
    });
  });

  test('Sign in', next => {
    let userNode = M.model('users').node({ 
      email: 'taster@xmail.com', 
      pwd: 'taste!' 
    });

    userNode.fetch().next(() => {
      let userNodeId = userNode.nodeId();
      let userData = userNode.snapData();
      if (userNodeId) {
        debug('userData', userData);
        next();
      } else {
        debug('[ERR] userData', userData);
      } 
    });
  });

  test('Delete the user', next => {
    M.model('users').node({
      email: 'taster@xmail.com', 
      pwd: 'taste!' 
    }).del().then(() => {
      next();
    });
  });

  test('Delete a non-exsiting user', next => {
    M.model('users').node({
      email: 'testXXX@xmail.com' 
    }).del().catch(err => {
      debug(err);
      next();
    });
  });

  test('All tests executed.', next => {
    debug('---------------------');
    next();
  });
}();
