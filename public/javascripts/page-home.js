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

user.on('signedUp', result => {
  console.log(result);
  msg('Sign in again');
});

user.on('signedUp/error', result => {
  console.log(result);
  msg(result.msg);
});

user.on('signedIn', result => {
  console.log(result);
  msg('Welcome, ' + user.email);
});

user.on('signedIn/error', result => {
  console.log(result);
  msg(result.msg);
});

user.on('signedOut', result => {
  console.log(result);
  msg('Welcome, guest');
});

user.on('deleted', result => {
  console.log(result);
  msg('Deleted.');
});

function msg(text) {
  document.getElementById('msg').innerHTML = '<p>' + text + '</p>';
  getPosts();
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
  let newpost = graph.node();
    
  console.log(newpost.snap());
  
  newpost.save({
    title: 'SPACE: Solutions to Problems with Auxiliary Details as well as Causes and Examples'
  }).then(() => {
    console.log(newpost.snap());
  });
  //newPost.tag('post');
  //newPost.scope({ w: 'me', r: 'group/VIP' });
  
  // public
  // group/<group name>
  // admins
  // user/<userID>
  // me
};

function getPosts() {
  let postsNode = document.getElementById('posts');
  while(postsNode.hasChildNodes()) {
    postsNode.removeChild(postsNode.lastChild);
  }
  
  let query = {};
  query.tags = ['#a#b', '#post', '#item']; // (a && b) || post || item
  graph.findNodes(query).then(nodes => {
    console.log(nodes);
    nodes.map(node => {
      let nodeSnap = node.snap();
      console.log(node.id(), nodeSnap);
      let divNode = document.createElement('DIV');
      let headerNode = document.createElement('DIV');
      headerNode.innerHTML = nodeSnap.meta.createdBy || 'Guest';
      headerNode.style.fontSize = '14px';
      headerNode.style.fontWeight = '800';
      headerNode.style.marginBottom = '8px';
      divNode.setAttribute('style', 'padding:16px; font-size:20px; color:#333; width:400px; background:#aca; margin:16px 0');
      divNode.appendChild(headerNode);
      divNode.appendChild(document.createTextNode(node.data().title));
      postsNode.appendChild(divNode);
    });
  }).catch(err => {
    console.error(err);
  });
};
