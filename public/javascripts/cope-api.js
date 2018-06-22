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
  V.createClass('UI.Table', vu => {
    vu.dom(data => [
      { 'table@table[width:100%]': '' }
    ]);

    // Exclude the header row
    vu.method('countRows', () => {
      return vu.$('@table').children().length;
    }); // end of UI.Table.countRows

    vu.method('setHeader', function(a, b) {
      let rowDOM = [{ 'tr': [] }];
      for (let i = 0; i < arguments.length; i++) {
        let cellDOM = arguments[i];
        rowDOM[0]['tr'] = rowDOM[0]['tr'].concat({ 'th': [cellDOM] });
      }
      let tmpV = cope.views();
      tmpV.createClass('Table.Row', vu => {
        vu.dom(data => rowDOM);
      });
      return tmpV.build('Table.Row', {
        sel: vu.sel('@table')
      });
    }); // end of UI.Table.setHeader

    vu.method('append', function() {
      let target = arguments[0] || null;
      let rowDOM = [{ 'tr': [] }];
      if (target && !target.id) {
        throw 'In #append(targetRow, dom1, dom2, ...): targetRow is not valid.'
      }
      for (let i = 1; i < arguments.length; i++) {
        let cellDOM = arguments[i];
        rowDOM[0]['tr'] = rowDOM[0]['tr'].concat({ 'td': [cellDOM] });
      }
      let tmpV = cope.views();
      tmpV.createClass('Table.Row', vu => {
        vu.dom(data => rowDOM);
      });
      let newRow = tmpV.build('Table.Row', {
        sel: vu.sel('@table'),
        method: 'append'
      });
      if (target) {
        target.$().after(newRow.$());
      }
        console.log('AFTER', arguments);
      return newRow;
    }); // end of UI.Table.append

    vu.method('move', ($row, steps) => {
      if (isNaN(steps)) {
        throw '#move($row, steps): steps should be number';
        return;
      }
      for (let i = 0; i < Math.abs(steps); i++) {
        if (steps < 0) {
          $row.prev().before($row);
        } else {
          $row.next().after($row);
        }
      }
    }); // end of UI.Table.move
  }); // end of UI.Table

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
    }()); // end of UI.Card.ds
  }); // end of UI.Card

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
    }); // end of Cope.Card.init
  }); // end of Cope.Card

  V.createClass('Cope.Card.Editable', 'Cope.Card', vu => {
    vu.method('edit', function() {
      let onEdit;
      return function(fn) {
        if (typeof fn == 'function' && !onEdit) {
          vu.$('.card').prepend(V.dom([
            { 'button.btn.btn-primary@editBtn[absolute;max-width:104px;top:8px;right:8px;will-change:auto]': 'Edit' }
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
  }); // end of Cope.Card.Editable

  V.createClass('Cope.Card.Editor', vu => {
    vu.dom(data => [
      { '.row[relative; m:0 auto; max-width:640px]': [
        { '.col-sm-2.col-xs-12': [
          { '.row': [
            { 'div.col-xs.col-sm-12[w:50px;cursor:pointer]@mediaArrToggler': [
              { 'i.material-icons[fz:36px]': 'photo' }]
            }, 
            { 'div.col-xs.col-sm-12[w:50px;cursor:pointer]@headerToggler': [
              { 'i.material-icons[fz:36px]': 'title' }]
            }, 
            { 'div.col-xs.col-sm-12[w:50px;cursor:pointer]@textToggler': [
              { 'i.material-icons[fz:36px]': 'short_text' }]
            }, 
            { 'div.col-xs.col-sm-12[w:50px;cursor:pointer]@keyValuesToggler': [
              { 'i.material-icons[fz:36px]': 'list' }]
            }, 
            { 'div.col-xs.col-sm-12[w:50px;cursor:pointer]@linkToggler': [
              { 'i.material-icons[fz:36px]': 'link' }]
            }]
          }]
        }, 
        { '.col-sm-10.col-xs-12': [
          { '.card[mt:4px]': [
            { 'div.card-img-top[bgColor:#a37fb2;min-height:100px;overflow:hidden]@media': '' },
            { '.card-body': [
              { 'div@text-body': [
                { 'textarea.h3(placeholder="Header")[w:100%;b:none;outline:none]@header': '' },
                { 'textarea.h5(placeholder="Text")[w:100%;b:none;outline:none]@text': '' }] 
              },
              { '@kv-table': '' },
              { '@link-wrap': [
                { '.col-12': [
                  { 'hr[w:50px;h:12px;b:none;color:#e5c9c2;bgColor:#e5c9c2;mt:60px]': '' }]
                },
                { '.col-12': [
                  { '.input-group': [
                    { '.input-group-prepend': [
                      { 'span.input-group-text': 'Link' }] 
                    },
                    { 'input.form-control(placeholder="Enter the URL")@link': '' },
                    { '.input-group-append': [
                      { 'div[bgColor:#ddd; h:100%; w:50px]': '' }] 
                    }]
                  }]
                }] 
              }]
            }]
          }] 
        }] 
      }
    ]); // end of Cope.Card.Editor.dom

    vu.method('ds', function() {
      let ds = cope.dataStore();
      ds.watch('isActive', v => {
        vu.$('@media').hide();
        vu.$('@header').hide();
        vu.$('@text').hide();
        vu.$('@kv-table').hide();
        vu.$('@link-wrap').hide();
        if (v.mediaArr) {
          vu.$('@media').show();
        }
        if (v.header) {
          vu.$('@header').show();
        }
        if (v.text) {
          vu.$('@text').show();
        }
        if (v.keyValues) {
          vu.$('@kv-table').show();
        }
        if (v.link) {
          vu.$('@link-wrap').show();
        }
      });
      return function() {
        return ds;
      };
    }()); // end of Cope.Card.Editor.ds

    // Create and use UI.Table
    vu.method('table', function() {
      let table; 
      return function() {
        if (!table) {
          table = V.build('UI.Table', {
            sel: vu.sel('@kv-table')
          });
        }
        table.method('fetch', () => {
          let values = [];
          let tags = {};
          table.$().find('.input-group').each(function() {
            let inputs = [];
            $(this).find('input').each(function() {
              inputs = inputs.concat($(this).val().trim());
            });
            values = values.concat({
              'key': inputs[0],
              'value': inputs[1]
            });
            if (inputs[0]) { tags[inputs[0]] = true; }
            if (inputs[1]) { tags[inputs[1]] = true; }
          });
          return {
            values: values,
            tags: tags
          }
        });
        table.method('addRowAfter', target => {
          let newRow = vu.table().append(
            target, 
            { 'div': [
              { 'div.input-group': [
                { 'input.form-control(placeholder="Field")': '' }, 
                { 'input.form-control(placeholder="Enter Anything")': '' },
                { '.input-group-append': [
                  { 'i.material-icons[cursor:pointer]': 'more_horiz' }] 
                }]
              },
              { 'div[text-align:right]': [
                { 'i.material-icons[cursor:pointer]@removeBtn': 'remove_circle_outline' },
                { 'i.material-icons[cursor:pointer]@upBtn': 'keyboard_arrow_up' },
                { 'i.material-icons[cursor:pointer]@downBtn': 'keyboard_arrow_down' },
                { 'i.material-icons[cursor:pointer]@addBtn': 'add' }]
              }]
            }
          ); // end of newRow
          
          newRow.$('@removeBtn').click(evt => {
            newRow.$().remove();
          });

          newRow.$('@upBtn').click(evt => {
            table.move(newRow.$(), -1);
          });

          newRow.$('@downBtn').click(evt => {
            table.move(newRow.$(), 1);
          });

          newRow.$('@addBtn').click(evt => {
            table.addRowAfter(newRow);
          });
        }); // end of table.addRowAfter
        return table;
      };
    }()); // end of Cope.Card.Editor.table

    vu.method('fetch', () => {
      let v = {};
      let t = vu.table().fetch();
      v.header = vu.$('@header').val().trim();
      v.text = vu.$('@text').val().trim();
      v.keyValues = t.values;
      v.tags = t.tags;
      return v;
    }); // end of Cope.Card.Editor.fetch

    vu.init(data => {
      let v = data && data.value || {};
      vu.ds().set('isActive', v.isActive || {
        'mediaArr': false,
        'header': true,
        'text': true,
        'keyValues': false,
        'link': false
      });

      // Set up Toggler
      ['header', 'text', 'mediaArr', 'keyValues', 'link'].map(x => {
        vu.$('@' + x + 'Toggler').on('click', evt => {
          try {
            let isActive = vu.ds().get('isActive');
            isActive[x] = !isActive[x];
            vu.ds().set('isActive', isActive);
          } catch (err) {
            console.error(err);
          }
        });
      });

      // To upload images from file input
      vu.$('@media').on('click', evt => {
        loader.upload({ maxWidth: 500, multi: true });
      });

      // Additional onclick event for keyValuesToggler
      vu.$('@keyValuesToggler').on('click', evt => {
        let table = vu.table();
        console.log(table.countRows());
        if (table.countRows() < 1) {
          table.addRowAfter();
        } // end of if
      }); // end of #on('click', ...) 
    }); // end of Cope.Card.Editor.init
  }); // end of Cope.Card.Editor
  // === End of Cope components ===

  let uiAPI = {};
  uiAPI.build = function(className, obj) {
    return V.build(className, obj);
  };
  return uiAPI;
}()); // end of cope.prop('ui', uiContruct())
