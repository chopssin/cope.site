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

  test('users.getUser', next => {

    return next();

    let users = M.model('users');
    users
      .getUser({ email: 'aaa', pwd: 'ppp' })
      .then(userData => {
        debug('userData', userData);
        next();
      });
  });

  test('users.delUser', next => {

    return next();

    let users = M.model('users');
    users
      .delUser({ email: 'taster@xmail.com', pwd: 'taste!' })
      .then(() => {
        next();
      })
      .catch(err => {
        debug(err);
        next();
      });
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

  test('users.getUser with wrong password', next => {

    return next();

    let userNode = M.model('users').node({ 
      email: 'taster@xmail.com', 
      pwd: 'wrong_password' 
    });

    userNode.fetch().next(() => {
      let userData = userNode.snap(); 
      if (!userData) {
        next();
      } else {
        debug('[ERR] userData', userData);
      }
    });
  });

  test('users.getUser', next => {
    let userNode = M.model('users').node({ 
      email: 'taster@xmail.com', 
      pwd: 'taste!' 
    });

    userNode.fetch().next(() => {
      let userData = userNode.snapData();
      debug('userData', userData);
      if (userData) {
        next();
      } else {
        debug('[ERR] userData', userData);
      } 
    });
  });

  test('users.delUser', next => {

    return next();

    let users = M.model('users');
    users
      .delUser({ email: 'taster@xmail.com', pwd: 'taste!' })
      .then(() => {
        next();
      })
      .catch(err => {
        debug(err);
        next();
      });
  });

  test('All tests executed.', next => {
    debug('---------------------');
    next();
  });
}();
