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
      count += 1;
      queue.add(() => {
        debug(count, testName);
        let running = true;

        testFn(function() {
          running = false;
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

  test('users.getUserData', next => {
    let users = M.model('users');
    users
      .getUserData({ email: 'aaa', pwd: 'ppp' })
      .then(userData => {
        debug('userData', userData);
        next();
      });
  });

  test('All tests executed.', next => {
    debug('---------------------');
    next();
  });
}();
