let tests = [];
let curr = null;
let V = cope.views();
let DS = V.dataStore();
let send = function() {
  console.log(arguments);
  return cope.send.apply(null, arguments);
}
let msg = function(res) {
  console.log(res);
  let makePost = function(data) {
    let post = null;
    if (!data || (!data.title && !data.content)) {
      return post;
    }
    post = {};
    post.title = data.title || null;
    if (!Array.isArray(data.content)) {
      console.warn(data);
      try {
        data.content = JSON.parse(data.content);
      } catch (err) {
        data.content = [];
      }
    }
    post.content = data.content
      .map(p => {
        let para = {};
        if (p.link) {
          para.div = [
            [ 'a(href="' + p.link + '")', [
              { 'h3': p.header || '' },
              { 'p': p.text || '' }] 
            ]
          ];
        } else if (p.imgsrc) {
          para.div = [
            [ 'img(src="' + p.imgsrc + '")' ],
            { 'h3': p.header || '' },
            { 'p': p.text || '' }
          ]
        } else {
          para.div = [
            { 'h3[mt:16px; mb:8px]': p.header || '' }, 
            { 'p[mt:0]': p.text || '' }
          ]
        }
        return para;
      });
    console.log(post);
    return post;
  };
  let post = makePost(res && res.data && res.data.value);
  if (post) {
    V.build('post', {
      sel: '#posts', 
      method: 'append',
      data: {
        title: post.title,
        content: post.content
      }
    })
  }
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
  V.createClass('post', vu => {
    vu.dom(data => [
      { 'div[color:#333; b:2px solid #333; p:16px 32px; mt:12px]': [
        { 'h2@title': data.title || '' },
        { 'p@previewText[cursor:pointer; fz:50px]': '' },
        { '@content': data.content || '' }]
      }
    ]);

    vu.init(data => {
      vu.$()
        .on('mouseenter', evt => {
          vu.$().css('background-color', '#aca'); 
          vu.$('@previewText').html(data.text); 
        })
        .on('mouseleave', evt => {
          vu.$().css('background-color', 'transparent'); 
          vu.$('@previewText').html(''); 
        });

      let text = vu.$('@previewText');
      text
        .on('mouseenter', evt => { text.css('font-weight','800'); })
        .on('mouseleave', evt => { text.css('font-weight', 'normal'); })
        .on('click', evt => {
          text.fadeOut();
          next();
        })
    });
  });

  V.build('post', {
    sel: '#msg',
    data: {
      title: 'Welcome to Cope client tests',
      text: 'Click to start'
    }
  });

});

test(() => {
  let snap = {};
  send('/account/add', {
    email: 'test@xmail.com',
    pwd: 'test',
    confirmedPwd: 'test'
  }).then(res => {
    msg(res);
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
    msg(res);
    next(snap);
  });
});

test(snap => {
  send('/account/signin', {
    email: 'test@xmail.com',
    pwd: 'test'
  }).then(res => {
    msg(res);
    next(snap);
  });
});

test(snap => {
  send('/app/add', {
    appName: '智能旅圖'
  }).then(res => {
    msg(res);
    snap.myAppId = res.data.appId;
    next(snap);
  });
});

test(snap => {
  send('/post/add', {
    appId: snap.myAppId,
    title: '深入四草' 
  }).then(res => {
    msg(res);
    snap.myPostId = res.data.postId;
    next(snap);
  });
});

test(snap => {
  let c = JSON.stringify([
    { 
      'text': 'Text goes here.',
      'header': 'Text'
    },
    {
      'header': 'Image',
      'text': 'Image is cool.',
      'imgsrc': 'https://fakeimg.pl/250x100/'
    },
    {
      'text': 'This is a link.',
      'link': 'http://www.comicbus.com/html/1725.html'
    }
  ]);
  send('/post/update', {
    postId: snap.myPostId,
    content: c
  }).then(res => {
    msg(res);
    next(snap);
  });
});

/*
test(snap => {
  send('/post/all').then(res => {
    next(snap);
  });
});
*/

test(snap => {
  send('/account/signout').then(res => {
    msg(res);
    next(snap);
  });
});

test(snap => {
  send('/post/get', {
    postId: snap.myPostId
  }).then(res => {
    msg(res);
    next(snap);
  });
});

test(snap => {
  send('/account/signin', {
    email: 'test@xmail.com',
    pwd: 'test'
  }).then(res => {
    msg(res);
    next(snap);
  });
});

test(snap => {
  send('/post/all').then(res => {
    msg(res);
    next(snap);
  });
});

test(snap => {
  send('/post/del', {
    postId: snap.myPostId
  }).then(res => {
    msg(res);
    next(snap);
  });
});

test(snap => {
  send('/app/del', {
    appId: snap.myAppId
  }).then(res => {
    msg(res);
    next(snap);
  });
});

test(snap => {
  send('/account/signout').then(res => {
    msg(res);
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
    msg(res);
    next(snap);
  });
})

test(snap => {
  // use `snap.account.userId`
  send('/profile/get', {
    //userId: snap.account.userId
    email: 'test@xmail.com'
  }).then(res => {
    msg(res);
    V.build('post', {
      sel: '#posts',
      method: 'append',
      data: {
        title: 'All tests completed.'
      }
    });
    next(snap);
  });
});
