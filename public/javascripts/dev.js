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

test('cope.fileLoader: upload / download files', (next, stat) => {
  let waitUploader = false;
  let files = [];
  let loader = cope.fileLoader(newFiles => {
    files = files.concat(newFiles);
    newFiles.map(x => {
      console.log(x);
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
      { 'button@uploadBtn': 'Upload multiple files' },
      { 'div@images[w:100%; max-width:600px]': '' }]
    ]
  ], stat.id));

  stat.$('@uploadBtn').click(evt => {
    loader.upload({ multi: true });
    waitUploader = true;
  });

  loader.download('https://source.unsplash.com/random', { maxWidth: 800 });
  setTimeout(function() {
    loader.download('https://source.unsplash.com/random', { maxWidth: 300 });
  }, 5000);

  next();
}); // end of test('cope.fileLoader')

test('Upload to firebase', (next, stat) => {
  let store = firebase.storage();
  console.log(store);
  let loader = cope.fileLoader(inputs => {
    inputs.map(x => {
      if (!x.image) {
        return;
      }
      try {
        let file = x.image.blob || x.file;
        let storeRef = store.ref().child('tests/' + file.filename);
        let task = storeRef.put(file);
        task.then(snap => {
          snap.ref.getDownloadURL().then(url => {
            console.log(url);
            if (url) {
              stat.ok();
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
  });

  stat.$('@display').html(V.dom([
    { 'div': [
      { 'button@uploadBtn': 'Upload one file' },
      { 'div@images[w:100%; max-width:600px]': '' }]
    }
  ], stat.id));

  stat.$('@uploadBtn').click(evt => {
    loader.upload({ 'maxWidth': 100 });
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

  stat.$('@display').html(V.dom(tableDOM));
  stat.ok();
  next();
});

test('End with this test', (next, stat) => {
  stat.ok();
  next();
});

}(); // end of runTests
