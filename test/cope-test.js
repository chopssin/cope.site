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

  test('testModel.sayHi', next => {
    let testModel = M.model('test');
    testModel.sayHi().then(() => {
      next();
    }).catch(err => {
      debug('Model `test` went wrong');
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

  test('Sign in as taster@xmail.com', next => {
    M.model('users').signIn({
      email: 'taster@xmail.com', 
      pwd: 'taste!' 
    }).then(userData => {
      debug('userData', userData);
      next();
    }).catch(err => {
      debug('[ERR] userModel.signIn(obj): failed');
    });
  });

  test('Add another user foodie@xmail.com', next => {
    M.model('users').addUser({
      email: 'foodie@xmail.com',
      pwd: 'xxxccc'
    }).then(userData => {
      debug('userData', userData);
      next();
    });
  });

  test('`foodie` follows `taster`', next => {
    let foodie = M.model('users').node({ email: 'foodie@xmail.com' });
    let taster = M.model('users').node({ email: 'taster@xmail.com' });
    taster.fetch().next(() => {
      foodie.link('following', taster.nodeId()).next(() => {
        next();
      });
    });
  });

  test('Find thier relationship by `foodie`.fetchLinks()', next => {
    let foodie = M.model('users').node({ email: 'foodie@xmail.com' });
    foodie.fetchLinks().next(() => {
      let links = foodie.snapData() && foodie.snapData().links;
      debug(links);
      if (Array.isArray(links) && links.length == 1) {
        next();
      }
    });
  });

  test('Find thier relationship by `taster`.fetchLinks()', next => {
    let taster = M.model('users').node({ email: 'taster@xmail.com' });
    taster.fetchLinks().next(() => {
      let links = taster.snapData() && taster.snapData().links;
      debug(links);
      if (Array.isArray(links) && links.length == 1) {
        next();
      }
    });
  });

  test('Find their relationship via G.findLinks({ name: "following" })', next => {
    G.findLinks({ 'name': 'following' }).then(links => {
      debug(links);
      next();
    });
  });

  test('Find their relationship via G.findLinks(foodie.nodeId())', next => {
    let foodie = M.model('users').node({ email: 'foodie@xmail.com' });
    foodie.fetch().next(() => {
      G.findLinks(foodie.nodeId()).then(links => {
        debug(links);
        next();
      });
    });
  });

  test('`foodie` unfollows `taster`', next => {
    let taster = M.model('users').node({ email: 'taster@xmail.com' });
    let foodie = M.model('users').node({ email: 'foodie@xmail.com' });
    taster.fetch().next(() => {
      foodie.unlink('following', taster.nodeId()).next(() => {
        next();
      });
    });
  });

  test('Find again their relationship via G.findLinks(foodie.nodeId())', next => {
    let foodie = M.model('users').node({ email: 'foodie@xmail.com' });
    foodie.fetch().next(() => {
      G.findLinks(foodie.nodeId()).then(links => {
        if (Array.isArray(links) && links.length === 0) {
          next();
        } else {
          debug('links', links);
        } 
      });
    });
  });

  test('Delete two users', next => {
    M.model('users').node({
      email: 'taster@xmail.com', 
      pwd: 'taste!' 
    }).del().then(() => {
      M.model('users').node({
        email: 'foodie@xmail.com', 
        pwd: 'xxxccc' 
      }).del().then(() => {
        next();
      }).catch(err => {
        debug('[ERR] when deleting `foodie`', err);
      });
    }).catch(err => {
      debug('[ERR] when deleting `taster`', err);
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
    M.model('users').getUserProfile({
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
