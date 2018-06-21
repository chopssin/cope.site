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
            //console.log('Firebase: Auth State Changed', user);
            next();
          }
        });
      });
    }

    return api;
  }; // end of auth
}()); // end of cope.prop('auth', authContruct())

cope.prop('ui', function() {
  let V = cope.views();

  // Cope components
  V.createClass('UI.Card', vu => {
    vu.dom(data => [
      { '.card[mt:4px]': [
        { '.card-img-top[bgColor:#a37fb2;min-height:100px;overflow:hidden]@media': '' },
        { '.card-body': [
          { 'h4@header': '' },
          { 'p@text': '' },
          { 'table.table@kv-table[bgColor:#fafafa]': '' }]
        }]
      }
    ]); // end of UI.Card.dom

    vu.method('ds', function() {
      let ds = cope.dataStore();
      ds.watch('header', header => {
        vu.$('@header').html(header);
      });
      ds.watch('text', text => {
        vu.$('@text').html(text.replace(/\n/g, '<br>').replace(/\s/g, '&nbsp;'));
      });
      ds.watch('mediaArr', mediaArr => {
        let imgsrc;
        try {
          imgsrc = mediaArr[0].image.resizedURL;
        } catch (err) {
          // Do nothing...
        }
        if (imgsrc) {
          vu.$('@media').html(V.dom([['img(src="'+imgsrc+'" width="100%")']], vu.id));
        }
      });
      return function() {
        return ds;
      }
    }());
  }); // end of `UI.Card`

  V.createClass('Cope.Card', 'UI.Card', vu => {
    vu.method('render', data => {
      if (data.keyValues && data.keyValues.length > 0) {
        data.keyValues.map(x => {
          vu.$('@kv-table').append(V.dom([
            { 'tr': [
              { 'td': x.key || '' },
              { 'td': x.value || '' }] 
            }
          ]));
        });
      }
    }); // end of Cope.Card.render

    vu.init(data => {
      try {
        vu.ds().set('header', data.value.header);
        vu.ds().set('text', data.value.text);
        vu.ds().set('mediaArr', data.value.mediaArr);
        vu.render(data);
      } catch (err) {
        console.error(err, vu);
      }
    });
  }); // end of `Cope.Card`

  V.createClass('Cope.Card.Editable', 'Cope.Card', vu => {
    vu.method('edit', function() {
      let onEdit;
      return function(fn) {
        if (typeof fn == 'function' && !onEdit) {
          vu.$('.card').prepend(V.dom([
            { 'button.btn.btn-primary@editBtn[absolute;max-width:104px;top:8px;right:8px]': 'Edit' }
          ], vu.id));

          vu.$('@editBtn').on('click', evt => {
            try {
              vu.edit();
            } catch (err) {
              console.error(err);
            }
          });
          onEdit = fn;
        } else if (arguments.length == 0) {
          try {
            onEdit();
          } catch (err) { 
            // Do nothing...
          }
        }
      }; 
    }()); // end of Cope.Card.Editable.edit
  }); // end of `Cope.Card.Editable`
  // === End of Cope components ===

  let uiAPI = {};
  uiAPI.build = function(className, obj) {
    return V.build(className, obj);
  };
  return uiAPI;
}()); // end of cope.prop('ui', uiContruct())
