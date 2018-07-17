let copeHome = function() {
  
let V = cope.views();
let ds = cope.dataStore();
ds.watch('newApp', appData => {
  V.build('AppCard', {
    'sel': '#page-content',
    'method': 'append',
    'data': appData
  });
});


V.createClass('AppCard', vu => {
  vu.dom(data => [
    { 'div.card': [
      [ 'a.card-body', [
        { 'h4.card-title@appName': '' }] 
      ]]
    }
  ]);

  vu.init(data => {
    let v = data;
    if (v && v.value) { v = v.value; }
    vu.$('@appName').html(v.appName || 'Untitled App');
    vu.$('.card-body').prop('href', '/a/' + v.appId);
  });
});

V.createClass('SignInCard', vu => {
  vu.dom(data => [
    { 'form': [
      { '.card.p-3': [
        { '.form-group': [
          { 'input.form-control@account(type="email" placeholder="Email")': '' },
          { 'input.form-control@pwd(type="password" placeholder="Password")': '' },
          { 'button.btn.btn-primary@signUpBtn': 'Sign Up' }, 
          { 'button.btn.btn-success@signInBtn': 'Sign In' }] 
        }] 
      }]
    }
  ]);

  vu.init(data => {
    vu.$('@signUpBtn').on('click', evt => {
      evt.preventDefault();

      let email = vu.$('@account').val().trim();
      let pwd = vu.$('@pwd').val().trim();
      cope.auth().signUp(email, pwd).then(() => {
        console.log('Signed up as ' + email);
      });
      /*
      firebase.auth().createUserWithEmailAndPassword(email, pwd)
        .catch(err => {
          console.error(err);
        });
      cope.send('/account/add', {
        email: email,
        pwd: pwd,
        confirmedPwd: pwd
      }).then(res => {
        console.log(res, firebase.auth().currentUser);
      }); 
      */
    });

    vu.$('@signInBtn').on('click', evt => {
      evt.preventDefault();

      let email = vu.$('@account').val().trim();
      let pwd = vu.$('@pwd').val().trim();
      cope.auth().signIn(email, pwd).then(() => {
        //console.log(cope.auth().user());
        location.href = '/';
      });
      /*
      firebase.auth().signInWithEmailAndPassword(email, pwd)
        .catch(err => { console.error(err); });
      cope.send('/account/signin', {
        email: email,
        pwd: pwd
      }); // it will open app list, once you're signed in
      */
    }); 
  });
});

/*
 *
let signInCheck = function() {
  return new Promise((resolve, reject) => {
    cope.send('/account/me').then(res => {
      console.log(res);
      if (res && res.ok && res.data) {
        ds.set('copeUserData', res.data);
        resolve();
      } else {
        V.build('SignInCard', {
          sel: '#page-content'
        });
        //reject();
      }
    });
  });
}; // end of signInCheck
*/

//signInCheck().then(() => {
cope.auth().fetch().then(() => {

  console.log(cope.auth().user());
  if (!cope.auth().user()) {
    V.build('SignInCard', {
      sel: '#page-content'
    });
    return;
  }

  $('#page-content').html(V.dom([{ 'button.btn.btn-secondary#signOutBtn[float:right]': 'Sign Out' }]));
  $('#signOutBtn').click(evt => {
    cope.auth().signOut().then(() => {
      location.href = '/';
    });
    /*
    try {
      firebase.auth().signOut().then(() => {
        cope.send('/account/signout').then(res => {
          location.href = '/';
        })
      });
    } catch (err) {
      console.error(err);
    }
    */
  });

  $('#page-content').append(V.dom([{ 'button.btn.btn-primary#addAppBtn': 'Add' }]));
  $('#addAppBtn').click(evt => {
    cope.send('/app/add').then(res => {
      ds.set('newApp', res.data);
    })
  });

  // Load apps
  cope.send('/app/all').then(res => {
    console.log(res);
    try {
      let data = res.data;
      Object.keys(data).map(id => {
        ds.set('newApp', data[id]);
      });
    } catch (err) {
      console.error(err); 
    }
  });
});

}();
