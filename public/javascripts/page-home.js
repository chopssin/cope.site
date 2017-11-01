let user = cope.user(),
    graph = cope.graph('fakeApp');

document.getElementById('buttons').innerHTML = [
  'signUp', 
  'signInWrongly', 
  'signIn', 
  'signOut', 
  'deleteAccount',
  'post'
].map(x => '<button onclick="' + x + '()">' + x + '</button>')
.join('');

user.fetch();

user.on('signedUp', () => {
  msg('Sign in again');
});

user.on('signedUp/error', err => {
  msg(err);
});

user.on('signedIn', () => {
  msg('Welcome, ' + user.email);
});

user.on('signedIn/error', err => {
  msg(err);
});

user.on('signedOut', () => {
  msg('Welcome, guest');
});

user.on('deleted', () => {
  msg('Deleted.');
});

function msg(text) {
  document.getElementById('msg').innerHTML = '<p>' + text + '</p>';
};

function signInWrongly() {
  msg('Trying to sign in with wrong password ...');
  user.signIn({
    email: 'taster@aca.com',
    password: 'cccccadada'
  })
};

function signIn() {
  msg('Trying to sign in ...');
  user.signIn({
    email: 'taster@aca.com',
    password: 'adada'
  })
};

function signUp() {
  msg('Trying to sign up ...');
  user.signUp({ 
    email: 'taster@aca.com', 
    password: 'adada' 
  });
};

function signOut() {
  msg('Trying to sign out ...');
  user.signOut();
};

function deleteAccount() {
  msg('Trying to delete the account ...');
  user.deleteAccount();
};

function post() {
  //let newpost = graph.node();
  //newpost.val({
  //  title: 'Created at ' + new Date()
  //});
  //newPost.tag('post');
  //newPost.scope({ w: 'me', r: 'group/VIP' });
  
  // public
  // group/<group name>
  // admins
  // user/<userID>
  // me
};

function getPosts() {
  /*
  graph.findNodes({
    // post && travel && (tainan || taipei)
    tags: ['post', 'travel', 'tainan + taipei'],
    populated: true
  }).then(nodes => {
    nodes.map(node => {
      console.log(node.snap());
    });
  });*/
};
