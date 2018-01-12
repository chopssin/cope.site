// Test with fetch API
fetch('/api/test').then(res => {
  console.log(res.json());
});

// Test with jQuery.ajax
$.get({
  url: '/api/test'
}).done(res => {
  console.log('/api/test', res);
});

// Build buttons
buttons = [
  'getUser',
  'fetchUser',
  'signUp',
  'signIn',
  'signOut',
  'delUser',
  'newPost'
].map(x => {
  return '<button onclick="' + x + '()">' 
    + x + '</button>';
}).reduce((a, b) => {
  return a + b;
}, '');

$('#buttons').html(buttons);

// Fetch the user
fetchUser();

function fetchUser() {
  $.get({
    url: '/api/u/fetch'
  }).done(res => {
    console.log('/api/u/fetch', res);
    let data = res.data;
    if (data) {
      $('#msg').html('Welcome, ' + data.value.email);
    }
  });
};

function getUser() {
  $.post({
    url: '/api/u/get/profile',
    data: { email: 'taster.client@xmail.com' }
  }).done(res => {
    console.log('/api/u/get/profile', res);
    let data = res.data;
    if (data) {
      $('#msg').html('User existed => ' + data.email);
    }
  });
}

function signUp() {
  $.post({
    url: '/api/u/signup',
    data: { 
      email: 'taster.client@xmail.com',
      pwd: 'taste!'
    }
  }).done(res => {
    console.log(res);
    if (res.ok) {
      $('#msg').html('Sign up as taster.client@xmail.com');
    } else {
      $('#msg').html('Failed to sign up.');
    }
  });
};

function signIn() {
  $.post({
    url: '/api/u/signin',
    data: { 
      email: 'taster.client@xmail.com',
      pwd: 'taste!'
    }
  }).done(res => {
    console.log(res);
    if (res.data) {
      let data = res.data;
      $('#msg').html('Signed in as ' + data.value.email);
    }
  });
};

function signOut() {
  $.get({
    url: '/api/u/signout'
  }).done(res => {
    if (res.ok) {
      $('#msg').html('Signed out.');
    }
  });
};

function delUser() {
  $.post({
    url: '/api/u/deluser',
    data: { 
      email: 'taster.client@xmail.com',
      pwd: 'taste!'
    }
  }).done(res => {
    console.log(res);
    $('#msg').html('Sucessfully deleted the user.');
  });
};

function newPost() {
  $.post({
    url: '/api/create/post',
    data: { 
      title: 'Noodles are awesome',
      content: 'Tasty! :)'
    }
  }).done(res => {
    console.log(res);
    $('#msg').html('Posted.');
  });
};

function getPosts() {
  $.post({
    url: '/api/get/posts',
    data: { 
      authorId: '111', //TBD: get ID of 'taster.client@xmail.com',
    }
  }).done(res => {
    console.log(res);
    let num = -1;
    $('#msg').html('Found ' + num + ' posts.');
  });
};
