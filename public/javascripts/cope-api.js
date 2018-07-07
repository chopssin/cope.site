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
      let userAPI = {};
      if (userData 
        && typeof userData == 'object'
        && typeof userData.value == 'object') {
        userAPI.data = function() {
          return userData;
        };

        userAPI.value = function(key) {
          return userData.value[key];
        };

        userAPI.firebaseUID = function() {
          try {
            return firebase.auth().currentUser.uid;
          } catch (err) {
            console.error(err);
          }
        };
        return userAPI;
      } // end of if
      return null;
    }; // end of api.user

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
    }; // end of api.signUp

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
    }; // end of api.signIn

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
    }; // end of api.signOut

    api.fetch = function() {
      queue.add(next => {
        if (firebase.auth().currentUser) {
          cope.send('/account/me').then(res => {
            userData = res && res.data;
            next();
          })
        } else {
          next();
        }
      });
      return api;
    }; // end of api.fetch

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
    }; // end of api.delete

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
  }; // end of the returned function
}()); // end of cope.prop('auth', authContruct())

cope.prop('ui', function() {
  let uiClasses = {};
  let uiAPI = {};
  uiAPI.create = function(className, uiClass) {
    if (!uiClasses[className]) {
      uiClasses[className] = uiClass;
    } else {
      console.error('cope.ui: class "' + className+ '" already in use.');
    }
  };

  uiAPI.build = function(className, obj) {
    let uiClass = uiClasses[className];
    if (uiClass) {
      return uiClass.build(obj);
    }
    return null;
    //return V.build(className, obj);
  };

  // Cope components
  uiAPI.create('UI.List', cope.class(vu => {
    vu.method('count', $wrap => {
      if (!$wrap) {
        $wrap = vu.$();
      }
      return $wrap.children().length;
    }); // end of UI.Table.countItems

    vu.method('add', function(options, itemDOM) {
      let sel = options && options.sel || vu.sel();
      let method = options && options.method || 'append';
      let newItem = cope.class(vu => {
        vu.dom(data => itemDOM);
      }).build({
        sel: sel,
        method: method
      });
      $(sel)[method](newItem.$());
      return newItem;
    }); // end of UI.List.append

    vu.method('move', ($item, steps) => {
      if (isNaN(steps)) {
        throw '#move($row, steps): steps should be number';
        return;
      }
      for (let i = 0; i < Math.abs(steps); i++) {
        if (steps < 0) {
          $item.prev().before($item);
        } else {
          $item.next().after($item);
        }
      }
    }); // end of UI.List.move
  })); // end of UI.List

  uiAPI.create('UI.Table', cope.class(vu => {
    vu.dom(data => [
      { 'table.table[width:100%]': '' }
    ]);
    
    vu.method('countRows', () => {
      return vu.count();
    });

    vu.method('createRowDOM', function() {
      let rowDOM = [{ 'tr': [] }];
      for (let i = 0; i < arguments.length; i++) {
        let cellDOM = arguments[i];
        if (typeof cellDOM == 'object' && Object.keys(cellDOM).length > 0) {
          cellDOM = [cellDOM];
        }
        rowDOM[0]['tr'] = rowDOM[0]['tr'].concat({ 'td': cellDOM });
      }
      return rowDOM; 
    }); // end of UI.Table.createRowDOM

    vu.method('append', function() {
      //console.log(arguments)
      let target = arguments[0] || null;
      let sel;
      try {
        sel = target ? target.sel() : null
      } catch (err) {
        // Do nothing...
      }
      let rowDOM = vu.createRowDOM
        .apply(null, Array.prototype.slice.call(arguments, 1));

      return vu.add({ 
        sel: sel,
        method: target ? 'after' : 'append'
      }, rowDOM);
    }); // end of UI.Table.append
  }).extends(uiClasses['UI.List'])); // end of UI.Table

  uiAPI.create('UI.Card', cope.class(vu => {
    vu.dom(data => [
      { '.card[mt:4px]': [
        { '.card-img-top[bgColor:#a37fb2;min-height:100px;overflow:hidden]@media': '' },
        { '.card-body': [
          { 'h3@header': '' },
          { 'p@text': '' },
          { '@kv-table[bgColor:#fafafa]': '' }]
          //{ 'div.table@kv-table[bgColor:#fafafa]': '' }]
        }]
      }
    ]); // end of UI.Card.dom

    vu.method('ds', function() {
      let ds = cope.dataStore();
      ds.watch('isActive', v => {
        Object.keys(v).map(k => {
          switch (k) {
            case 'mediaArr':
              if (!v[k]) {
                vu.$('@media').hide();
              }
              break;
            case 'header':
              if (!v[k]) {
                vu.$('@header').hide();
              }
              break;
            case 'text':
              if (!v[k]) {
                vu.$('@text').hide();
              }
              break;
            case 'keyValues':
              if (!v[k]) {
                vu.$('@kv-table').hide();
              }
              break;
            default:
          } // end of switch
        });
      });
      ds.watch('header', header => {
        vu.$('@header').html(header);
      });
      ds.watch('text', text => {
        vu.$('@text').html(text.replace(/\n/g, '<br>').replace(/\s/g, '&nbsp;'));
      });
      ds.watch('mediaArr', mediaArr => {
        let media = cope.class(vu => {
          vu.dom(data => [{ 'div@images': '' }]);
        })
          .extends(uiClasses['UI.List'])
          .build({
            sel: vu.sel('@media')  
          });

        if (Array.isArray(mediaArr)) {
          mediaArr.map(x => {
            let imgDiv = media.add({
              sel: media.sel('@images')
            }, [{ 'div[relative;width:100%]': '' }]);

            if (x && x.image) {
              if (x.image.resizedURL) {
                imgDiv.$().html(cope.dom([[ 'img(src="'+x.image.resizedURL+'" width="100%")' ]]));
              } else if (x.image.dataURL) {
                //x.image.img.style.width = '100%';
                //imgDiv.$().html(x.image.img); 
                imgDiv.$().html(cope.dom([[ 'img(src="'+x.image.dataURL+'" width="100%")' ]]));
              }
            }
          });
        }
      });
      ds.watch('keyValues', keyValues => {
        try {
          let table = cope.ui.build('UI.Table', {
            sel: vu.sel('@kv-table')
          });
          keyValues.map(kv => {
             table.append(null, kv.key, kv.value);
          });
        } catch (err) {
          // Do nothing...
        }
      })
      return function() {
        return ds;
      }
    }()); // end of UI.Card.ds

    vu.method('load', value => {
      if (!value || typeof value != 'object') {
        return;
      }
      try {
        Object.keys(value).map(k => {
          vu.ds().set(k, value[k]);
        });
      } catch (err) {
        console.error(err);
      }
    }); // end of UI.Card.load

    vu.method('fetch', () => {
      return vu.ds().get();
    });
  })); // end of UI.Card

  uiAPI.create('Cope.Card', cope.class(vu => {
    vu.method('cardId', () => {
      try {
        return vu.fetch().id || null
      } catch (err) {
        console.error(err);
      }
    });
    vu.init(data => {
      try {
        vu.load(data.value);
      } catch (err) {
        console.error(err, vu);
      }
    }); // end of Cope.Card.init
  }).extends(uiClasses['UI.Card'])); // end of Cope.Card

  uiAPI.create('Cope.Card.Editable', cope.class(vu => {
    vu.method('edit', function() {
      let onEdit;
      return function(fn) {
        if (typeof fn == 'function' && !onEdit) {
          vu.$('.card-body').prepend(cope.dom([
            { 'div[w:100%; float:right]': [
              //{ 'button.btn.btn-primary@editBtn[absolute;max-width:104px;top:8px;right:8px;will-change:auto;z-index:1]': 'Edit' }
              { 'button.btn.btn-primary@editBtn[float:right;will-change:auto;z-index:1]': 'Edit' }] 
            }
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
  }).extends(uiClasses['Cope.Card'])); // end of Cope.Card.Editable

  uiAPI.create('Cope.Card.Editor', cope.class(vu => {
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
      }); // on "isActive"

      ds.watch('header', v => {
        vu.$('@header').val(v);
      });

      ds.watch('text', v => {
        vu.$('@text').val(v);
      });

      ds.watch('keyValues', v => {
        // TBD: check this out
        vu.table().load(v);
      });

      ds.watch('mediaArr', v => {
        // TBD: check this out
        vu.media().load(v);
      });

      ds.watch('link', v => {
        vu.$('@link').val(v);
      })

      return function() {
        return ds;
      };
    }()); // end of Cope.Card.Editor.ds

    vu.method('initMedia', function() {
      let Media = cope.class(vu => {
        let loader = cope.fileLoader(inputs => {
          vu.load(inputs);
        });
        vu.dom(data => [
          { '@list[width:100%]': '' },
          { 'button.btn.btn-primary[block;relative;m:0 auto]@uploadBtn': 'Upload' }
        ]);
        vu.method('upload', options => {
          return loader.upload(options);
        });
        vu.method('load', mediaArr => {
          if (Array.isArray(mediaArr)) {
            mediaArr.map(x => {
              console.log('mediaArr[x]', x);
              if (x && x.image) {

                // Create photo frame
                let imgDiv = vu.add({
                  sel: vu.sel('@list')
                }, [
                  { 'div[relative;width:100%]': [ 
                    { 'div[width:100%]@image': '' },
                    { 'div[absolute; top:10px; right:10px; width:32px; p:4px; bgColor:#fafafa]': [
                      { 'i.material-icons[cursor:pointer]@removeBtn': 'remove_circle_outline' }, 
                      { 'i.material-icons[cursor:pointer]@upBtn': 'keyboard_arrow_up' }, 
                      { 'i.material-icons[cursor:pointer]@downBtn': 'keyboard_arrow_down' }]
                    }]
                  }
                ]);

                imgDiv.set('obj', Object.assign({}, x));

                if (x.image.resizedURL) {
                  imgDiv.set('url', x.image.resizedURL);
                  imgDiv.$('@image').html(cope.dom([['img(src="' + x.image.resizedURL + '" width="100%")']]));
                } else if (x.image.img) {
                  x.image.img.style.width = '100%';
                  imgDiv.$('@image').html(x.image.img);
                } else {
                  console.warn(x);
                }

                imgDiv.$('@upBtn').click(evt => {
                  vu.move(imgDiv.$(), -1);
                });

                imgDiv.$('@downBtn').click(evt => {
                  vu.move(imgDiv.$(), 1);
                });

                imgDiv.$('@removeBtn').click(evt => {
                  imgDiv.$().remove();
                });
              }
            });
          }
        }); // end of `Media`.load
        
        vu.method('fetch', () => {
          let arr = [];
          vu.$('@list').children().each(function() {
            try {
              arr = arr.concat($(this).data('obj')); 
            } catch (err) {
              console.error(err);
            }
          });
          return arr;
        }); // end of Media.fetch
        
        vu.init(data => {
          vu.$('@uploadBtn').click(evt => {
            vu.upload({ 'maxWidth': 500, 'multi': true });
          });
        });
      }).extends(uiClasses['UI.List']); // end of Media

      let media = Media.build({
        sel: vu.sel('@media')
      });

      // Construct method "media"
      vu.method('media', () => {
        return media;
      });
    }); // end of Cope.Card.Editor.initMedia

    // Create and use UI.Table
    vu.method('initTable', function() {
      let table = uiClasses['UI.Table'].build({
        sel: vu.sel('@kv-table')
      });

      table.method('clear', () => {
        // TBD
      });

      table.method('load', keyValues => {
        // TBD
        if (Array.isArray(keyValues)) {
          keyValues.map(kv => {
            let newRow = table.addRowAfter();
            newRow.load(kv);
          });
        }
      });

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

      table.method('addRowAfter', targetRow => {
        let newRow = vu.table().append(
          targetRow, 
          { 'div[bgColor:#fafafa; p:5px 10px; m:0 -0.75rem]': [
            { 'div.input-group': [
              { 'input.form-control(placeholder="Field")@inputKey': '' }, 
              { 'input.form-control(placeholder="Enter Anything")@inputValue': '' },
              { '.input-group-append': [
                { 'i.material-icons[cursor:pointer]@moreBtn': 'more_horiz' }] 
              }]
            },
            { 'div[text-align:right]@actionBtns': [
              { 'i.material-icons[cursor:pointer]@removeBtn': 'remove_circle_outline' },
              { 'i.material-icons[cursor:pointer]@upBtn': 'keyboard_arrow_up' },
              { 'i.material-icons[cursor:pointer]@downBtn': 'keyboard_arrow_down' },
              { 'i.material-icons[cursor:pointer]@addBtn': 'add' }]
            }]
          }
        ); // end of newRow
        
        let newRowDS = cope.dataStore();

        newRow.method('load', obj => {
          try {
            Object.keys(obj).map(x => {
              newRowDS.set(x, obj[x]);
            });
          } catch (err) {
            console.error(err);
          }
        });

        newRowDS.watch('show', v => {
          if (v) {
            newRow.$('@actionBtns').show();
          } else {
            newRow.$('@actionBtns').hide();
          }
        });

        newRowDS.watch('key', v => {
          newRow.$('@inputKey').val(v); 
        });

        newRowDS.watch('value', v => {
          newRow.$('@inputValue').val(v); 
        });

        newRowDS.set('show', false);
        newRow.$('@moreBtn').click(evt => {
          newRowDS.set('show', !newRowDS.get('show'));
        });
        newRow.$().mouseleave(evt => {
          newRowDS.set('show', false);
        })

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

        return newRow;
      }); // end of table.addRowAfter

      vu.method('table', () => {
        return table;
      });
    }); // end of Cope.Card.Editor.initTable

    vu.method('load', obj => {
      try {
        Object.keys(obj).map(key => {
          vu.ds().set(key, obj[key]);
        });
      } catch (err) {
        console.error(err);
      }
    }); // end of Cope.Card.Editor.load

    vu.method('fetch', () => {
      let v = {};
      let t = vu.table().fetch();
      v.isActive = vu.ds().get('isActive');
      v.header = vu.$('@header').val().trim();
      v.text = vu.$('@text').val().trim();
      v.link = vu.$('@link').val().trim();
      v.mediaArr = vu.media().fetch();
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

      // Set up Togglers
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

      vu.initMedia(); // TBD: load images
      vu.initTable(); // TBD: load keyValues

      // Additional onclick event for keyValuesToggler
      vu.$('@keyValuesToggler').on('click', evt => {
        let table = vu.table();
        if (table.countRows() < 1) {
          table.addRowAfter();
        } // end of if
      }); // end of #on('click', ...) 
    }); // end of Cope.Card.Editor.init
  })); // end of Cope.Card.Editor

  uiAPI.create('Cope.Page.Editor', cope.class(vu => {
    vu.dom(data => [
      { 'div.card': [
        { '.card-body': [
          { 'div.h3@status': '' },
          { 'p@path': '' },
          { '.input-group': [
            { '.input-group-prepend': [
              { 'span.input-group-text': 'Date' }] 
            },
            { 'input.form-control(placeholder="2018/8/12")@date': '' },
            { 'input.form-control(type="number" placeholder="30")[ml:16px; text-align:right]@days': '' },
            { '.input-group-append': [
              { 'span.input-group-text': 'Days after' }]
            }] 
          }, 
          { '.input-group': [
            { '.input-group-prepend': [
              { 'span.input-group-text': 'Time' }] 
            },
            { 'input.form-control(placeholder="00")@hour': '' }, 
            { 'span.input-group-text': ':' },
            { 'input.form-control(placeholder="00")@min': '' }] 
          }, 
          { '.input-group': [
            { '.input-group-prepend': [
              { 'span.input-group-text': 'Channel' }] 
            },
            { 'input.form-control(placeholder="items, projects, events, ...")@channel': '' }] 
          }, 
          { '.input-group': [
            { '.input-group-prepend': [
              { 'span.input-group-text': 'Name' }] 
            },
            { 'input.form-control(placeholder="2018-12-01, no-3a, ABCD, 1234, ...")@name': '' }] 
          }, 
          { 'div[w:100%]': [ 
            { 'button.btn.btn-primary@doneBtn[float:right]': 'Done' },
            { 'button.btn.btn-primary@editBtn[float:right]': 'Edit' }]
          }]
        }]
      }
    ]); // end of Cope.Page.Editor.dom(...)

    vu.method('edit', () => {
      vu.$('@editBtn').hide();
      vu.$('@doneBtn').show();
      vu.$('.input-group').fadeIn();
    });

    vu.method('done', () => {
      vu.$('@editBtn').show();
      vu.$('@doneBtn').hide();
      vu.$('.input-group').hide();
    });

    vu.method('fetch', () => {
      try { 
        let date = vu.$('@date').val().trim();
        let hour = Number(vu.$('@hour').val().trim());
        let min = Number(vu.$('@min').val().trim());

        if (isNaN(hour) || isNaN(min)) {
          hour = 0;
          min = 0;
        }

        let channel = vu.$('@channel').val().trim().replace(/\//g, '');
        let name = vu.$('@name').val().trim().replace(/\//g, '') || vu.get('defaultName');
        let path = '/' + channel + '/' + name;
        let publishedAt = Date.parse(date) + 1000 * (hour * 3600 + min * 60); 

        if (!channel || !name) {
          path = '';
        }
        if (isNaN(publishedAt)) {
          publishedAt = null;
        }
        return {
          path: path,
          publishedAt: publishedAt
        }
      } catch (err) {
        return {
          path: '',
          publishedAt: null
        }
      }
    }); // end of Cope.Page.Editor.fetch

    vu.method('load', v => {
      let s = 'Unpublished';
      vu.$('@status').html(s);
      vu.$('@path').html('');
      if (!v) {
        return;
      }
      let t = v.publishedAt;
      let p = v.path || '';
      let now = Date.now();
      let date, days, hour, min, channel, name;
      try {
        if (t && !isNaN(t)) {
          date = new Date(t).getFullYear()
            + '/' + (new Date(t).getMonth() + 1)
            + '/' + new Date(t).getDate();
          days = Math.ceil((t - now) / 86400000);
          hour = new Date(t).getHours();
          min = new Date(t).getMinutes();
          if (hour < 10) {
            hour = '0' + hour;
          }
          if (min < 10) {
            min = '0' + min;
          }

          if (t <= now) {
            s = 'Published since ' + date + ' ' + hour + ':' + min;
          } else {
            s = 'Scheduled at ' + date + ' ' + hour + ':' + min;
          }
        }

        vu.$('@status').html(s);
        vu.$('@path').html(p);
      } catch (err) {
        // Do nothing ...
      }
    }); // end of Cope.Page.Editor.load

    vu.init(data => {
      let updateStatus = function() {
        vu.load(vu.fetch());
      };
      let updateDays = function(evt) {
        let date = vu.$('@date').val().trim();
        let days;
        try {
          date = Date.parse(date);
          now = Date.now();
          days = Math.ceil((date - now)/86400000);
        } catch (err) {
          console.error(err);
          days = '';
        }
        vu.$('@days').val(days);  
        updateStatus();
      };
      let updateDate = function(evt) {
        let days = vu.$('@days').val().trim();
        let date;
        try {
          days = parseInt(days, 10);
          if (!isNaN(days)) {
            date = new Date(Date.now() + days * 86400000);
            date = date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + date.getDate();
          }
        } catch (err) {
          console.error(err);
          date = '';
        }
        vu.$('@date').val(date);  
        updateStatus();
      };
      vu.$('@date')
        .on('focusout', updateDays)
        .on('click', updateDays)
        .on('keyup', updateDays);
      vu.$('@days')
        .on('focusout', updateDate)
        .on('click', updateDate)
        .on('keyup', updateDate);
      ['@hour', '@min', '@channel', '@name'].map(sel => {
        vu.$(sel)
          .on('focusout', updateStatus)
          .on('click', updateStatus)
          .on('keyup', updateStatus);
      });

      vu.$('@doneBtn').on('click', evt => {
        vu.done();
      });

      vu.$('@editBtn').on('click', evt => {
        vu.edit();
      });

      vu.done();
      vu.load();
    }); // end of Cope.Page.Editor.init(...)
  })); // end of Cope.Page.Editor
  // === End of Cope components ===

  return uiAPI;
}()); // end of cope.prop('ui', uiContruct())

cope.prop('render', function() {
  let pages = {};
  return function(path, arg) {
    if (typeof path != 'string') {
      throw 'cope.render(path, arg): path should be string';
    }
    if (typeof arg == 'function') {
      if (pages[path]) {
        throw 'cope.render(path, fn): "' + path + '" is in use.';
      } else {
        pages[path] = arg;
      }
    } else {
      try {
        return pages[path].call(null, arg);
      } catch (err) {
        console.error(err);
      }
    }
  };
}()); // end of cope.prop('render', renderConstruct())

cope.prop('uploadFiles', (a, options) => { // a should be an array of files

  // Deal with options
  let appId = options && options.appId;

  let files = a;
  //let counter = 0;
  let wait = cope.wait();
  let urls = [];
  if (a && !Array.isArray(a) && typeof a == 'object') {
    files = [a];
  }
  if (!Array.isArray(files)) {
    console.error('Invalid file:', a);
    throw 'cope.uploadFiles(a, options): a should be array or object containing `file`'
    return;
  }

  urls = files.map(x => null);

  return new Promise((resolve, reject) => {
    if (files.length < 1) {
      resolve(urls);
      return;
    }

    files.map((file, idx) => {
      wait.add(done => {
        if (!file) {
          done();
          return;
        }
        let queue = cope.queue()
        let filename = cope.randId(16);
        let downloadURL = null;
        //console.log(filename, file);
        queue.add(next => {
          // Firebase upload
          let auth = cope.auth();
          auth.fetch().then(() => {
            let path = 'files';
            if (auth.user()) {
              path = 'files/' + auth.user().firebaseUID();
              if (options && options.public) {
                path = path + '/public';
              } else {
                path = path + '/private';
              }
            } else if (options && options.anonymously) {
              path =  'files/anonymously';
            }
            //console.log(path);
            firebase.storage().ref(path).child(filename).put(file)
              .then(snap => {
                snap.ref.getDownloadURL().then(url => {
                  downloadURL = url;
                  next(); 
                });
              }).catch(err => {
                console.error(err);
              });
          });
        }); // end of queue.add(...)
        queue.add(next => {
          // Cope upload
          // console.log('downloadURL = ' + downloadURL);
          let fileValue =  {
            name: filename,
            type: file.type || 'unknown',
            url: downloadURL
          };
          if (appId) {
            fileValue.appId = appId;
          }
          //console.log(fileValue);

          cope.send('/file/add', fileValue).then(res => {
            urls[idx] = downloadURL;
            //counter += 1;
            //console.log('Saved', counter, files.length);
            //if (counter == files.length) {
            //  console.log('Resolved.');
            //  resolve(urls);     
            //}
            done();
          }).catch(err => {
            console.error(err);
          });
        }); // end of queue.add(...)
      }); // end of wait.add
    }); // end of a.map

    wait.run(function() {
      //console.log(urls);
      resolve(urls);
    });
  }); // end of Promise
}); // end of cope.prop('uploadFiles', func)
