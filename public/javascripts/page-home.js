let user = cope.user(),
    graph = cope.graph('fakeApp');

user.fetch();

user.on('signedIn', () => {
  document.getElementById('msg').innerHTML = '<p>Welcome, ' + user.email 
    + '</p><button onclick="signOut()">Sign out</button>'
    + '<button onclick="post()">Post</button>'
});

user.on('signedOut', () => {
  document.getElementById('msg').innerHTML = '<button onclick="signIn()">Sign in</button>';
});

function signIn() {
  user.signIn({
    email: 'taster@aca.com',
    password: 'adadadad'
  })
};

function signOut() {
  user.signOut();
};

function post() {
  let newpost = graph.node();
  newpost.val({
    title: 'Created at ' + new Date()
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
