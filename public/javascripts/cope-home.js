let copeHome = function() {
  
let V = cope.views();
//let DS = V.dataStore();

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
    vu.$('.card-body').prop('href', '/' + v.appId);
  });
});

V.createClass('SignInCard', vu => {
  vu.dom(data => [
    { 'form': [
      { '.card.p-3': [
        { '.form-group': [
          { 'input.form-control@account(type="email" placeholder="Email" value="chops@mail.com")': '' },
          { 'input.form-control@pwd(type="password" placeholder="Password" value="1234")': '' },
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
    });

    vu.$('@signInBtn').on('click', evt => {
      console.log('Sign In');
      let email = vu.$('@account').val().trim();
      let pwd = vu.$('@pwd').val().trim();
      cope.send('/account/signin', {
        email: email,
        pwd: pwd
      }); // it will open app list, once you're signed in
    }); 
  });
});

let signInCheck = function() {
  return new Promise((resolve, reject) => {
    cope.send('/account/me').then(res => {
      console.log(res);
      if (res && res.ok && res.data) {
        //DS.set('copeUserData', res.data);
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

let ds = cope.dataStore();
ds.watch('newApp', appData => {
  V.build('AppCard', {
    'sel': '#page-content',
    'method': 'append',
    'data': appData
  });
});

signInCheck().then(() => {

  $('#page-content').html(V.dom([{ 'button.btn.btn-primary#addAppBtn': 'Add' }]));
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
