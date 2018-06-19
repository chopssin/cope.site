cope.prop('auth', function() {
  let userData = null;
  let initialized = false; // to avoid the queue start over again
  return function() {
    let api = {};
    let queue = cope.queue();
    let errorHandler = null;
    let error = function(err) {
      if (typeof errorHandler == 'function') {
        errorHanlder(err);
      } else {
        console.error(err);
      }
    };

    api.user = function() {
      return userData;
    };

    api.signUp = function(email, pwd) {
      let fu = firebase.auth().currentUser;
      if (fu) { 
        queue.add(next => {
          firebase.auth().signOut().then(() =>{
            next();
          });
        });
      }
      if (userData) {
        api.signOut();
      }
      queue.add(next => {
        if (userData || firebase.auth().currentUser) {
          error('Failed to start sign-up flow');
        } else {
          next();
        }
      });

      // Start with "signed out" state
      queue.add(next => {
        firebase.auth().createUserWithEmailAndPassword(email, pwd).then(() => {
          next();
        }).catch(err => {
          console.error(err);
        })
      });
      queue.add(next => {
        cope.send('/account/add', {
          email: email,
          pwd: pwd,
          confirmedPwd: pwd
        }).then(res => {
          next();
        });
      });
      return api;
    };

    api.signIn = function(email, pwd) {
      let fu = firebase.auth().currentUser;
      if (fu) { 
        queue.add(next => {
          firebase.auth().signOut().then(() =>{
            next();
          });
        });
      }
      if (userData) {
        api.signOut();
      }
      queue.add(next => {
        if (userData || firebase.auth().currentUser) {
          error('Failed to start sign-in flow');
        } else {
          next();
        }
      });

      // Start with "signed out" state
      queue.add(next => {
        firebase.auth().signInWithEmailAndPassword(email, pwd).then(() => {
          next();
        }).catch(err => {
          console.error(err);
        })
      });
      queue.add(next => {
        cope.send('/account/signin', { 
          email: email,
          pwd: pwd,
          confirmedPwd: pwd
        }).then(res => {
          userData = res.data;
          next();  
        });
      });
      return api;
    };

    api.signOut = function() {
      queue.add(next => {
        firebase.auth().signOut().then(() => {
          next();
        }).catch(err => {
          console.error(err);
        })
      });
      queue.add(next => {
        cope.send('/account/signout').then(res => {
          userData = null; 
          next();
        });
      });
      queue.add(next => {
        if (userData || firebase.auth().currentUser) {
          error('Failed to sign out.');
        } else {
          next();
        }
      })
      return api;
    };

    api.fetch = function() {
      queue.add(next => {
        if (firebase.auth().currentUser) {
          cope.send('/account/me').then(res => {
            console.log(res);
            userData = res && res.data;
            next();
          })
        } else {
          next();
        }
      });
      return api;
    };

    api.delete = function(email, pwd) {
      api.signIn(email, pwd);

      queue.add(next => {
        let fu = firebase.auth().currentUser;
        if (fu) {
          fu.delete().then(() => {
            next();
          });
        } else {
          error('Abort user deletion: failed to sign in firebase.');
        }
      });
      queue.add(next => {
        cope.send('/account/del', {
          email: email,
          pwd: pwd,
          confirmedPwd: pwd
        }).then(res => {
          userData = null;
          next();
        });
      });
      queue.add(next => {
        if (fu || userData) {
          error('Failed to delete the user.');
        }
      });
      return api;
    };

    api.then = function(fn) {
      queue.add(next => {
        if (typeof fn == 'function') {
          fn();
          next();
        }
      });
      return api;
    };

    api.error = function(fn) {
      if (typeof fn == 'function') {
        errorHandler = fn;
      }
    };

    if (!initialized) {
      // Check the initial Firebase auth state
      queue.add(next => {
        firebase.auth().onAuthStateChanged(user => {
          if (!initialized) { 
            initialized = true; // prevent further calls
            next();
          } else {
            console.log('Firebase: Auth State Changed', user);
          }
        });
      });
    }

    return api;
  }; // end of auth
}()); // end of cope.prop('auth', authContructFunc())
