let runTests = function() {

let V = cope.views();
V.createClass('Stat', vu => {
  let isFolded = false;

  vu.dom(data => [
    { 'div[block; position:relative; fz:20px; m:4px auto; w:100%; max-width:600px]': [
      { 'div[bgColor:#fff; w:100%; h:56px; cursor:pointer]@body': [
        { 'div[float:left; w:10%; h:100%; bgColor:red]@stat': '' },
        { 'div[float:left; w:90%; h:100%; p:16px]@msg': '' }] 
      },
      { 'div@display[w:100%;bgColor:#fff]': '' }]
    }
  ]);

  vu.method('ok', () => {
    vu.$('@stat')
      .css('background-color', 'green');
  });

  vu.method('fail', () => {
    vu.$('@stat')
      .css('background-color', 'red');
  });

  vu.method('msg', text => {
    vu.$('@msg').html(text);
  });

  vu.method('fold', () => {
    isFolded = true;
    vu.$('@display').hide();
  });

  vu.method('unfold', () => {
    isFolded = false;
    vu.$('@display').show();
  });

  vu.init(() => {
    vu.$('@body').click(evt => {
      if (isFolded) {
        vu.unfold();
      } else {
        vu.fold();
      }
    });
  });
});

let tests = cope.queue();
let test = function(msg, testFn) {
  tests.add(next => {
    let statVu = V.build('Stat', {
      sel: '#wrap',
      method: 'append'
    });
    statVu.fold();
    statVu.msg(msg);
    testFn(next, statVu);
  });
}; // end of test

test('Start with function `test`', (next, stat) => {
  stat.ok();
  next();
});

test('cope.fileLoader: download files', (next, stat) => {
  let files = [];
  let loader = cope.fileLoader(newFiles => {
    files = files.concat(newFiles);
    newFiles.map(x => {
      if (x.image) {
        stat.$('@images').append(x.image.img);
      }
    });
    if (files.length == 2) {
      stat.ok();
    }
  });

  stat.$('@display').append(V.dom([
    [ 'div', [
      { 'div@images[w:100%; max-width:600px]': '' }]
    ]
  ], stat.id));

  loader.download('https://source.unsplash.com/random', { maxWidth: 800 });
  setTimeout(function() {
    loader.download('https://source.unsplash.com/random', { maxWidth: 300 });
  }, 5000);

  next();
}); // end of test('cope.fileLoader')

test('Signin / Signout Flow', (next, stat) => {
  let state = function(action, newState) {
    let prevState = 'none';
    let valid = {
      'none': {
        'signUp': 'existed'
      },
      'existed': {
        'signIn': 'signedIn',
        'del': 'none'
      },
      'signedIn': {
        'signIn': 'signedIn',
        'signOut': 'existed',
        'del': 'none'
      }
    };
    return function(action, newState) {
      try {
        if (valid[prevState][action] === newState) {
          prevState = newState;
          return true; 
        }
      } catch (err) {
        console.error(err);
      }
      return false;
    };
  }();

  stat.$('@display').html(V.dom([
    { 'div[p:20px]': [ 
      { 'h4@state': '...' },
      { 'input.form-control(type="email" placeholder="Email")@email': '' },
      { 'input.form-control(type="password" placeholder="Password")@password': '' },
      { 'button.btn@signUpBtn': 'Sign Up' },
      { 'button.btn@signInBtn': 'Sign In' },
      { 'button.btn@signOutBtn': 'Sign Out' },
      { 'button.btn@delBtn': 'Delete Account' }]
    }
  ], stat.id));

  firebase.auth().onAuthStateChanged(user => {
    console.log(user);
  });

  stat.$('@signUpBtn').click(evt => {
    let email = stat.$('@email').val().trim();
    let pwd = stat.$('@password').val().trim();
    cope.send('/account/add', {
      email: email,
      pwd: pwd,
      confirmedPwd: pwd
    }).then(res => { 
      stat.$('@state').html('...');
      if (res.ok) {
        if (state('signUp', 'existed')) {
 
          // Sign up for Firebase
          firebase.auth().createUserWithEmailAndPassword(email, pwd)
            .catch(err => { console.error(err) });

          stat.$('@state').html('Signed up as ' + email);
          stat.ok();
        } else {
          stat.fail();
        }
      } else {
        console.log(res);
        stat.ok();
      }
    });
  });

  stat.$('@signInBtn').click(evt => {
    let email = stat.$('@email').val().trim();
    let pwd = stat.$('@password').val().trim();
    cope.send('/account/signin', {
      email: email,
      pwd: pwd,
      confirmedPwd: pwd
    }).then(res => { 
      stat.$('@state').html('...');
      if (res.ok) {
        if (state('signIn', 'signedIn')) {
          stat.$('@state').html('Signed in as ' + email);
          stat.ok();

          // Sign in Firebase
          firebase.auth().signInWithEmailAndPassword(email, pwd)
            .catch(err => { console.error(err); });
        } else {
          stat.fail();
        }
      } else {
        console.log(res);
        stat.ok();
      }
    });
  });

  stat.$('@signOutBtn').click(evt => {
    cope.send('/account/signout').then(res => {
      stat.$('@state').html('...');
      if (res.ok) {
        if (state('signOut', 'existed')) {
          stat.$('@state').html('Signed out.');
          stat.ok();

          // Sign out Firebase
          firebase.auth().signOut()
            .catch(err => { console.error(err); });
        } else {
          stat.fail();
        }
      } else {
        console.log(res);
        stat.ok();
      }
    });
  });

  stat.$('@delBtn').click(evt => {
    let email = stat.$('@email').val().trim();
    let pwd = stat.$('@password').val().trim();
    cope.send('/account/del', {
      email: email,
      pwd: pwd,
      confirmedPwd: pwd
    }).then(res => {
      stat.$('@state').html('...');
      if (res.ok) {
        if (state('del', 'none')) {
          stat.$('@state').html('Account deleted.');
          stat.ok();
          // Delete user from Firebase
          firebase.auth().currentUser.delete()
            .then(() => { 
              // User deleted from Firebase
            })
            .catch(err => { console.error(err); });
        } else {
          stat.fail();
        }
      } else {
        console.log(res);
        stat.ok();
      }
    });
  });
});

test('Upload files to firebase, save record on Cope database', (next, stat) => {
  let store = firebase.storage();
  let loader = cope.fileLoader(inputs => {
    let uid;
    try {
      uid = firebase.auth().currentUser.uid;
    } catch (err) {
      uid = null;
    }
    if (!uid) {
      stat.$('@display').prepend('Required to sign in first.');
      return;
    }
    let path = 'files/' + uid + '/public/';;
    inputs.map(x => {
      if (!x.image) {
        return;
      }
      try {
        let file = x.image.blob || x.file;
        let storeRef = store.ref().child(path + x.filename);
        let task = storeRef.put(file);
        task.then(snap => {
          snap.ref.getDownloadURL().then(url => {
            console.log(url);
            if (url) {

              // Save record on Cope
              cope.send('/file/add', {
                name: x.image.name,
                type: x.file.type,
                url: url
              }).then(res => {
                console.log(res);
                cope.send('/file/get', {
                  id: res.v.id
                }).then(res => {
                  console.log(res);
                  stat.$('@display').html(V.dom([[ 'img(src="' + res.v.url + '" width="100%")' ]]))
                  stat.ok();
                })
              })
            }
          }); 
        });

        task.on(firebase.storage.TaskEvent.STATE_CHANGED, {
          complete: function() { 
            task.snapshot.ref.getDownloadURL().then(downloadURL => {
              console.log(downloadURL);
            });
          },
          error: function(err) { console.error(err); }
        });
      } catch (err) {
        console.error(err);
      }
    });
  }); // end of loader

  stat.$('@display').html(V.dom([
    { 'div': [
      { 'button@uploadBtn': 'Upload one file' },
      { 'div@images[w:100%; max-width:600px]': '' }]
    }
  ], stat.id));

  stat.$('@uploadBtn').click(evt => {
    loader.upload({ 'maxWidth': 400 });
  });
  next();
});

test('/file/all', (next, stat) => {
  cope.send('/file/all').then(res => {
    console.log(res);
    if (!res.ok) {
      stat.ok();
    }
  });
});

test('Array to Table', (next, stat) => {

  // TBD: Rewrite this:
  // table = V.build('Table', { 
  //   sel: stat.sel('@display')
  // }) 
  //
  // Usage:
  // table.load(A) // Show all fields by default
  // table.show(['編號', 'Age'])
  // table.hide(['Age'])
  // table.sort('Age', -1)
  //
  // Inside the view: 
  //   Array A -> Argumented Array A'
  //   Print A'

  let arr = [
    { '編號': 'A', 'score': '100', 'gender': '男' },
    { '編號': 'B', 'age': '29', 'score': '九十' },
    { '編號': 'C', 'age': '36', 'score': '120' },
    { '編號': 'D', 'age': '48', 'score': '40' },
    { '編號': 'E', 'age': '57', 'score': '30' }
  ];
  //let fields = ['編號', 'age', 'score'];
  //let fields = ['編號', 'age', 'score', 'gender'];
  let fields = ['編號', 'score', 'age', 'gender'];
  let sum = function(k, arr) {
    let y;
    arr.map(x => {
      if (!isNaN(parseInt(x[k], 10))) {
        if (isNaN(y)) { y = 0; }
        y += parseInt(x[k], 10);
      }
    })
    return y;
  };
  let avg = function(k, arr) {
    let y;
    let s = sum(k, arr);
    if (arr.length > 0 && !isNaN(s)) {
      y = s / arr.length;
    }
    return isNaN(y) ? '' : y + '';
  };
  let min = function(k, arr) {
    let y;
    arr.map(x => {
      let n = parseInt(x[k], 10);
      if (isNaN(y) || (!isNaN(n) && n <= y)) {
        y = n;
      }
    });
    return isNaN(y) ? '' : y + '';
  };
  let max = function(k, arr) {
    let y;
    arr.map(x => {
      let n = parseInt(x[k], 10);
      if (isNaN(y) || (!isNaN(n) && n >= y)) {
        y = n;
      }
    });
    return isNaN(y) ? '' : y + '';
  };
  let count = function(k, arr) {
    let y = 0;
    arr.map(x => {
      if (x.hasOwnProperty(k)) {
        y += 1;
      } 
    });
    return y;
  };

  let tableDOM = [
    { 'table[w:100%]': [
      { 'tr': [{ 'th': '#' }].concat(fields.map(x => {
          return { 'th': x }
        })) 
      }].concat(arr.map((x, idx) => {
        return { 'tr': [{ 'td': (idx + 1) + '' }].concat(fields.map(k => {
          return { 'td': x[k] }
        }))}
      }))
        .concat([{ 'tr': [{ 'td': 'Sum' }].concat(fields.map(k => {
          return { 'td': (sum(k, arr) || '') + '' }
        }))}])
        .concat([{ 'tr': [{ 'td': 'Avg' }].concat(fields.map(k => {
          return { 'td': avg(k, arr) }
        }))}])
        .concat([{ 'tr': [{ 'td': 'Min' }].concat(fields.map(k => {
          return { 'td': min(k, arr) }
        }))}])
        .concat([{ 'tr': [{ 'td': 'Max' }].concat(fields.map(k => {
          return { 'td': max(k, arr) }
        }))}])
        .concat([{ 'tr': [{ 'td': 'Count' }].concat(fields.map(k => {
          return { 'td': count(k, arr) + '' }
        }))}])
    }
  ];

  stat.$('@display').html(V.dom(tableDOM));
  stat.ok();
  next();
});

test('End with this test', (next, stat) => {
  stat.ok();
  next();
});

}(); // end of runTests
