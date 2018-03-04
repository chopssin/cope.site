let cope = require('../cope');
let debug = require('debug')('cope.site:test/cope-test');

module.exports = function() {

  let M = cope.M;
  let G = cope.G;
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

  test('All tests executed?', next => {
    debug('\n\n\t\t\t\tYes :)\n\n');
    debug('---------------------');
    next();
  });
}();
