let tests = [];
let curr = null;
let send = function(path, params, method) {
  return new Promise((resolve, reject) => {
    console.log(path, params);
    let cmd = {};
    cmd.method = method || 'post';
    cmd.url = '/api' + path;
    if (params) { 
      cmd.data = params; 
    }
    $.ajax(cmd).done(res => {
      console.log(path, res);
      resolve(res);
    });
  });
};

let next = function(obj) {
  curr = null;
  if (tests.length > 0) {
    curr = tests[0];
    tests = tests.slice(1);
    curr(obj);
  }
};

let test = function(func) {
  tests = tests.concat(func);
  if (!curr) {
    next();
  }
};

// Start tests

test(() => {
  let snap = {};
  send('/account/add', {
    email: 'test@xmail.com',
    pwd: 'test',
    confirmedPwd: 'test'
  }).then(res => {
    snap.myId = res.data.userId;
    snap.myPwd = 'test';
    next(snap);
  })
});

test(snap => {
  // use `snap.account.userId`
  send('/profile/get', {
    //userId: snap.account.userId
    email: 'test@xmail.com'
  }).then(res => {
    next(snap);
  });
});

test(snap => {
  send('/account/signin', {
    email: 'test@xmail.com',
    pwd: 'test'
  }).then(res => {
    next(snap);
  });
});

test(snap => {
  send('/app/add', {
    appName: '智能旅圖'
  }).then(res => {
    snap.myAppId = res.data.appId;
    next(snap);
  });
});

test(snap => {
  send('/post/add', {
    appId: snap.myAppId,
    title: '深入四草' 
  }).then(res => {
    snap.myPostId = res.data.postId;
    next(snap);
  });
});

test(snap => {
  send('/post/update', {
    postId: snap.myPostId,
    text: '一位大將險些埋沒在歷史之河'
  }).then(res => {
    next(snap);
  });
});

test(snap => {
  send('/post/update', {
    postId: snap.myPostId,
    insertAt: 0,
    header: '第二段',
    text: '這裡是漢人與荷蘭人的古代戰場'
  }).then(res => {
    next(snap);
  });
});

test(snap => {
  send('/post/update', {
    postId: snap.myPostId,
    idx: 1,
    moveTo: 0
  }).then(res => {
    next(snap);
  });
});

test(snap => {
  send('/post/update', {
    postId: snap.myPostId,
    updateAt: 0, 
    header: '第一段',
    text: '一位大將險些埋沒在歷史之河'
  }).then(res => {
    // TBD: next(snap);
  });
});

test(snap => {
  send('/app/post/del', {
    postId: snap.myPostId
  }).then(res => {
    next(snap);
  });
});

test(snap => {
  send('/app/del', {
    appId: snap.myAppId
  }).then(res => {
    next(snap);
  });
});

test(snap => {
  send('/account/signout').then(res => {
    next(snap);
  });
});

test(snap => {
  send('/account/del', {
    //userId: snap.account.userId
    email: 'test@xmail.com',
    pwd: 'test',
    confirmedPwd: 'test'
  }).then(res => {
    next(snap);
  });
})

test(snap => {
  // use `snap.account.userId`
  send('/profile/get', {
    //userId: snap.account.userId
    email: 'test@xmail.com'
  }).then(res => {
    next(snap);
  });
});
