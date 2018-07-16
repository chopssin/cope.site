let runTests = function() {

//let V = cope.views();
//V.createClass('Stat', vu => {
let Stat = cope.class(vu => {
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
}); // end of Stat

let tests = cope.queue();
let test = function(msg, testFn) {
  tests.add(next => {
    //let statVu = V.build('Stat', {
    let statVu = Stat.build({
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

test('cope.wait', (next, stat) => {
  let wait = cope.wait();
  wait.add(done => {
    setTimeout(function() {
      stat.$('@display').append('<p>First function done.</p>');
      done();
    }, 100);
  });

  wait.add(done => {
    stat.$('@display').append('<p>Second function done.</p>');
    done();
  });

  wait.run(() => {
    stat.$('@display').append('<p>Finally done.</p>');
    stat.ok();
    next();
  });
});

test('cope.class and extensions', (next, stat) => {
  let Binit = false;
  let A = cope.class(vu => {
    vu.dom(data => [{ 'div[p:20px; bgColor:#aaa]': 'A' }]);
    vu.method('sayHi', () => {
      return 'Hi';
    });
    vu.method('myName', () => {
      return 'A';
    });
  });

  let B = cope.class(vu => {
    vu.dom(data => [{ 'div[p:20px; bgColor:#333; color:#fff]': 'B' }]);
    vu.method('sayHello', () => {
      return 'Hello';
    });
    vu.method('myName', () => {
      return 'B';
    });
    vu.init(data => {
      vu.$().html('B initiated.');
      Binit = true;
    });
  }).extends(A);

  let C = cope.class(vu => {
    vu.dom(data => [{ 'div[p:20px; bgColor:#aca]': 'C' }]);
    vu.method('sayCheese', () => {
      return 'Cheese';
    });
    vu.method('myName', () => {
      return 'C';
    });
    vu.init(data => {
      vu.$().html(cope.dom([
        { 'p': 'C initiated.' },
        { 'p': 'B <- A; C <- B; Build C.' },
        { 'p': 'P <- Q; P <- C; Build P.' }
      ]));
    });
  }).extends(B);

  let Q = cope.class(vu => {
    vu.method('mQ', () => { 
      return 'Q';
    });
  });

  let P = cope.class(vu => {
    vu.dom(data => [{ 'div[p:20px; bgColor:#aca]': 'P' }]);
    vu.method('mP', () => {
      return P;
    });
  }).extends(Q).extends(C);

  let c = C.build({
    sel: stat.sel('@display')
  });

  let p = P.build({
    sel: stat.sel('@display')
  });

  if (p.sayHi() 
    && p.sayHello() 
    && p.myName() === 'C'
    && !Binit
    && p.mP
    && p.mQ) {
    stat.ok();
  } else {
    console.error(p);
  }
  next();
}); // cope.class and extensions

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

  stat.$('@display').append(cope.dom([
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
  stat.$('@display').html(cope.dom([
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

  stat.$('@signUpBtn').click(evt => {
    stat.$('@state').html('...');
    stat.fail();

    let email = stat.$('@email').val().trim();
    let pwd = stat.$('@password').val().trim();

    cope.auth().signUp(email, pwd)
      .then(() => {
        stat.$('@state').html('Signed up as ' + email);
        stat.ok();
      }).error(err => {
        console.error(err);
      });
  });

  stat.$('@signInBtn').click(evt => {
    stat.$('@state').html('...');
    stat.fail();

    let email = stat.$('@email').val().trim();
    let pwd = stat.$('@password').val().trim();
    
    cope.auth().signIn(email, pwd)
      .then(() => {
        stat.$('@state').html('Signed in as ' + email);
        stat.ok();
      })
      .error(err => {
        console.error(err);
      });
  });

  stat.$('@signOutBtn').click(evt => {
    stat.$('@state').html('...');
    stat.fail();

    cope.auth().signOut()
      .then(() => {
        stat.$('@state').html('Signed out.');
        stat.ok();
      })
      .error(err => {
        console.error(err);
      });
  });

  stat.$('@delBtn').click(evt => {
    stat.$('@state').html('...');
    stat.fail();

    let email = stat.$('@email').val().trim();
    let pwd = stat.$('@password').val().trim();

    cope.auth().delete().then(() => {
      stat.$('@state').html('Deleted.');
      stat.ok();
    }).error(err => {
      console.error(err);
    });
  });

  firebase.auth().onAuthStateChanged(user => {
    console.log(user)
    cope.auth().fetch().then(() => {
      let user = cope.auth().user();
      stat.$('@state').html('...');
      stat.ok();
      if (user) {
        //stat.$('@state').html('Signed in as ' + user.value.email);
        stat.$('@state').html('Signed in as ' + user.value('email'));
      } 
    });
  });
  next();
}); // end of test('Sign in / Sign out Flow')

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
                  stat.$('@display').html(cope.dom([[ 'img(src="' + res.v.url + '" width="100%")' ]]))
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

  stat.$('@display').html(cope.dom([
    { 'div': [
      { 'button@uploadBtn': 'Upload one file' },
      { 'div@images[w:100%; max-width:600px]': '' }]
    }
  ], stat.id));

  stat.$('@uploadBtn').click(evt => {
    loader.upload({ 'maxWidth': 400 });
  });
  next();
}); // end of test('Upload files to firebase, save record on Cope database'

test('cope.uploadFiles(files).then(urls => { ... })', (next, stat) => {
  let Image = cope.class(vu => {
    vu.dom(data => [
      { 'div[w:100%]': [
        [ 'img(src="' + data.url + '" width="100px")' ]]
      }
    ]);
  });
  let loader = cope.fileLoader(inputs => {
    files = inputs.map(x => x.file);
    cope.uploadFiles(files).then(urls => {
      urls.map(url => {
        stat.$('@images').append()
        Image.build({ 
          sel: stat.sel('@images'),
          method: 'append',
          data: { 
            url: url
          }
        })
        stat.ok();
      });
    })
  });
  stat.$('@display').html(cope.dom([
    { 'div': [
      { 'button@uploadBtn': 'Upload one file' },
      { 'div@images[w:100%; max-width:600px]': '' }]
    }
  ], stat.id));

  stat.$('@uploadBtn').click(evt => {
    loader.upload({ 'maxWidth': 400, multi: true });
  });
  next();
}); // end of test('cope.uploadFiles(files).then(urls => { ... })')

test('/file/all', (next, stat) => {
  cope.send('/file/all', { mine: true }).then(res => {
    console.log(res);
    let auth = cope.auth();
    auth.fetch().then(() => {
      let user = auth.user();
      if ((user && res.ok) || (!user && !res.ok)) {
        stat.ok();
      }
      if (res.data) {
        try {
          Object.keys(res.data).map(nodeId => {
            let url = res.data[nodeId].value.url;
            stat.$('@display').append('<a href="' + url + '" target="_blank">' + nodeId + '</a><br>');
          });
        } catch (err) {
        
        }
      }
      console.log('/file/all', user, res);
    });
  });
  next();
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

  stat.$('@display').html(cope.dom(tableDOM));
  stat.ok();
  next();
}); // end of test('Array to Table')

test('Cope.Card and Cope.Card.Editable', (next, stat) => {
  stat.$('@display').html(cope.dom([{ '.card-columns@cards[bgColor:#335; p:8px]': '' }], stat.id));
  let cardData = {
    value: {
      header: 'Header',
      text: 'Text',
      mediaArr: [{ image: { resizedURL: 'https://source.unsplash.com/random' } }]
    }
  };

  cope.ui.build('Cope.Card', {
    sel: stat.sel('@cards'),
    data: cardData
  });

  let editableCard = cope.ui.build('Cope.Card.Editable', {
    sel: stat.sel('@cards'),
    method: 'append',
    data: cardData
  });
    
  editableCard.edit(() => {
    stat.ok();
  });

  editableCard.edit();
  next();
}); // end of test('Cope.Card')

test('Cope.Card.Editor', (next, stat) => {
  let editor = cope.ui.build('Cope.Card.Editor', {
    sel: stat.sel('@display')
  });

  // Fill in initial data
  // TBD: editor.  
  editor.load({
    header: '這是標題'
  });

  editor.load({
    text: '內文。'
  });

  editor.load({
    keyValues: [{
      key: '工種',
      value: 'FW'
    }, {
      key: '工數',
      value: 5
    }]
  });

  let data = editor.fetch();
  let isActive = data.isActive;
  if (isActive) {
    try {
      isActive = Object.assign(isActive, { 'keyValues': true });
      editor.load({
        isActive: isActive
      })
    } catch (err) {
      console.error(err);
    }
  }

  stat.$('@display').append(cope.dom([
    { 'button.btn.btn-primary[block; relative; m:0 auto]@saveBtn': 'Save' },
    { '@card': '' }
  ], stat.id));

  let firstTest = false;
  stat.$('@saveBtn').click(evt => {
    console.log(editor.fetch());
    let card = cope.ui.build('Cope.Card', {
      sel: stat.sel('@card'),
      data: {
        value: editor.fetch()
      }
    });

    let data = card.get();
    try {
      if (!firstTest && data && data.value
        && data.value.keyValues.length == 2
        && data.value.isActive.keyValues) {
        firstTest = true;
        stat.ok();
      }
    } catch (err) {
      console.error(err);
    }
  }).click();

  next();
});

test('Cope.Page.Editor', (next, stat) => {
  let pageEditor = cope.ui.build('Cope.Page.Editor', {
    sel: stat.sel('@display')
  });

  pageEditor.loadInputs({
    publishedAt: new Date().getTime(),
    channel: 'tests'
  });

  if (pageEditor.fetch()) {
    stat.ok();
  }

  next();
});

test('Cope.Channel.Editor', (next , stat) => {

  let queue = cope.queue();
  let testAppId, testCardId;

  // Find a testAppId
  queue.add(next => {
    cope.send('/app/all').then(res => {
      try {
        let apps = Object.keys(res.data).map(nid => res.data[nid]);
        if (apps && apps.length > 0) {
          let testAppId = apps[0].value.id || apps[0].value.appId;
          if (testAppId) {
            next();
          }
        }
      } catch (err) {
        console.error(err);
      }
    });
  });

  queue.add(next => {
    let channelEditor = cope.ui.build('Cope.Channel.Editor', {
      sel: stat.sel('@display'),
      data: {
        appId: testAppId
      }
    });

    setTimeout(function() {
      let channels = channelEditor.req('channels');
      stat.ok();
    }, 3000);
  });

  next();
});

test('End with this test', (next, stat) => {
  stat.ok();
  next();
});

}(); // end of runTests
