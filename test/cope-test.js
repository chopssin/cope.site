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
    if (typeof testModel.sayHi() == 'string') {
      next();
    } else {
      debug('Model `test` went wrong');
    }
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
    M.model('users').getUser({
      email: 'taster@xmail.com', 
      pwd: 'taste!' 
    }).then(userData => {
      debug('userData', userData);
      next();
    }).catch(err => {
      debug('[ERR] userModel.getUser(obj): failed');
    });
  });

  test('Delete the user', next => {
    M.model('users').node({
      email: 'taster@xmail.com', 
      pwd: 'taste!' 
    }).del().then(() => {
      next();
    }).catch(err => {
      debug('[ERR] This should not happen!!!', err);
    })
  });

  test('Delete a non-exsiting user', next => {
    M.model('users').node({
      email: 'testXXX@xmail.com' 
    }).del().then(() => {
      debug('[ERR] This should not be called!');
      console.log('------->>>>>> sjdkjsdlkfjdkslfjsdlk ');
    }).catch(err => {
      debug('This error should happen.', err);
      next();
    });
  });

  test('Fetch data from a non-existing user', next => {
    M.model('users').getUser({
      email: 'root@funkuu.com'
    }).then(userData => {
      debug('[ERR] This should not be called!');
    }).catch(err => {
      next();
    });
  });

  test('All tests executed.', next => {
    debug('---------------------');
    next();
  });
}();
