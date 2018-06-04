let runTests = function() {

let V = cope.views();
V.createClass('Stat', vu => {
  vu.dom(data => [
    { 'div[block; position:relative; fz:20px; m:4px auto; w:100%; max-width:600px]': [
      { 'div[bgColor:#fff; w:100%; h:56px]': [
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
});

let tests = cope.queue();
let test = function(msg, testFn) {
  tests.add(next => {
    let statVu = V.build('Stat', {
      sel: '#wrap',
      method: 'append'
    });
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
      stat.$('@images').append(x.img);
    });
    if (files.length == 2) {
      if (!waitUploader) {
        stat.$('@display').fadeOut(5000);
      }
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
  let loader = cope.fileLoader(files => {
    files.map(file => {
      let thing = file.originalFile || file.blob;
      let dataURL = file.dataURL;
      let storeRef = store.ref().child('tests/' + file.filename);
      let task;
      if (thing) { 
        task = storeRef.put(thing);
      } else if (dataURL) {
        task = storeRef.putString(dataURL, 'data_url');
      }
      task.then(snap => {
        snap.ref.getDownloadURL().then(url => {
          console.log(url);
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

test('End with this test', (next, stat) => {
  stat.ok();
  next();
});

}(); // end of runTests
