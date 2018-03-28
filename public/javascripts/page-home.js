let pageHome = function() {

let V = cope.views();
let DS = V.dataStore();

V.createClass('Cope', vu => {
  vu.dom(data => [
    { 'div@navbar.navbar-wrap': '' },
    { 'div@main.main-wrap': '' }
  ]);

  vu.init(data => {
    let navbar = V.build('Navbar', {
      sel: vu.sel('@navbar')
    });

    navbar.logoOnClick(() => {
      DS.set('CopeHome', V.build('CopeHome', {
        sel: vu.sel('@main')
      }));
    });
    
    DS.set('CopeHome', V.build('CopeHome', {
      sel: vu.sel('@main')
    }));
  });
});

V.createClass('CopeHome', vu => {
  vu.dom(data => [
    //{ 'div@navbar.navbar-wrap': '' },
    { 'div@account': '' },
    { 'div.home-wrap': [
      { 'div@apps': '' },
      { 'div@newAppSec[p:16px;mt:16px;b:2px solid #333;bgColor:#fff]': [
          { 'input@newAppNameInput(type="text" placeholder="App Name")': '' },
          { 'button@newAppBtn': 'Create New App' }] 
      }] 
    }
  ]);

  vu.method('signInCheck', cb => {
    if (typeof cb == 'function') {
      if (DS.get('copeUserData')) {
        cb(true);
      } else {
        cope.send('/account/me').then(res => {
          if (res && res.ok && res.data) {
            DS.set('copeUserData', res.data);
          } 
        });
      }
    }
  }); // end of CopeHome.signInCheck

  vu.method('openHome', () => {
    vu.$('.home-wrap').hide();
    V.build('Account', {
      sel: vu.sel('@account')
    });

    vu.signInCheck(signedIn => {
      if (signedIn) {
        vu.$('.home-wrap').show();
        vu.loadApps();
      } 
    });
  }); // end of CopeHome.openHome

  vu.method('loadApps', () => {
    vu.$('@apps').html('');
    cope.send('/app/get').then(res => {
      let apps = [];
      let data = res && res.data;
      if (data) {
        try {
          apps = Object.keys(data).map(id => data[id]);
        } catch (err) {
          console.error(err);
          apps = [];
        }
        DS.set('apps', apps);
        vu.listApps();
      } 
    });
  }); // end of CopeHome.loadApps

  vu.method('listApps', () => {
    let apps = DS.get('apps') || []; 
    apps.map((appData, idx) => {
      let appName = appData && appData.value 
        && appData.value.appName || 'App needs a name';
      let appId = appData && appData.value
        && appData.value.appId;

      if (appId) {
        vu.$('@apps').append(V.dom([
          [ 'div@app-' + appId + '[p:16px;mt:16px;b:2px solid #333]', appName ]
        ], vu.id));

        vu.$('@app-' + appId).on('click', evt => {
          vu.openApp(appData);
        });
      }
    });
  }); // end of CopeHome.listApps

  vu.method('openApp', appData => {
    V.build('AppLayout', {
      sel: DS.get('CopeRoot').sel('@main'),
      data: appData
    });
  }); // end of CopeHome.openApp

  vu.init(data => {
    DS.onChange('copeUserData', newData => {
      vu.openHome();
    });

    vu.$('@newAppBtn').on('click', evt => {
      let appName = vu.$('@newAppNameInput').val().trim();
      vu.$('@newAppNameInput').val('');

      cope.send('/app/add', {
        appName: appName
      }).then(res => {
        vu.loadApps();
      });
    });

    vu.openHome();
  });
}); // end of `CopeHome`

V.createClass('Navbar', vu => {
  let logoOnClickCb;

  vu.dom(data => [
    { 'div@logo.logo': 'Cope' }
  ]);

  vu.method('logoOnClick', cb => {
    logoOnClickCb = cb;
  });

  vu.init(data => {
    vu.$('@logo').on('click', evt => {
      if (typeof logoOnClickCb == 'function') {
        logoOnClickCb();
      }
    })
  });
}); // end of `Navbar`

V.createClass('Account', vu => {
  vu.dom(data => {
    let u = DS.get('copeUserData');
    u = u && u.value;
    if (!u) {
      return [
        { 'div': [
          { 'input@email(type="text" placeholder="Email")': '' },
          { 'input@pwd(type="text" placeholder="Password")': '' },
          { 'button@signInBtn': 'Sign In' }, 
          { 'button@signUpBtn': 'Sign Up' }] 
        }
      ];
    } else {
      return [
        { 'div': [
          { 'div': u.name || 'No Name' },
          { 'div': u.email },
          { 'button@signOutBtn': 'Sign Out' }] 
        }
      ];
    }
  }); // end of Account.dom

  vu.init(data => {

    // To sign in
    vu.$('@signInBtn').on('click', evt => {
      let email = vu.$('@email').val();
      let pwd = vu.$('@pwd').val();
      cope.send('/account/signin', {
        email: email,
        pwd: pwd
      }).then(res => {
        DS.set('copeUserData', res && res.data);
      });
    });

    // To sign up
    vu.$('@signUpBtn').on('click', evt => {
      let email = vu.$('@email').val();
      let pwd = vu.$('@pwd').val();
      cope.send('/account/add', {
        email: email,
        pwd: pwd,
        confirmedPwd: pwd
      }).then(res => {
        DS.set('copeUserData', res && res.data);
      });
    });
    
    // To sign out
    vu.$('@signOutBtn').on('click', evt => {
      cope.send('/account/signout').then(res => {
        if (res && res.ok) {
          DS.set('copeUserData', null);
        }
      });
    });
  }); // end of Account.init
}); // end of `Account`

V.createClass('AppLayout', vu => {
  vu.dom(data => [
    { 'div': data.appName || data.value.appName },
    { 'div.sidebar': [
      { 'ul': [
        { 'li@postsBtn': 'Posts' },
        { 'li@pagesBtn': 'Pages' },
        { 'li@storeBtn': 'Store' },
        { 'li@upgradeBtn': 'Upgrade' },
        { 'li@settingsBtn': 'Settings' }] 
      }] 
    },
    { 'div.main-content': [
      { 'section@posts': 'Posts' },
      { 'section@pages': 'Pages' },
      { 'section@store': 'Store' },
      { 'section@upgrade': 'Upgrade' },
      { 'section@settings': 'Settings' }]
    }
  ]);

  vu.method('show', sec => {
    vu.$('.main-content > section').hide();
    vu.$('@' + sec).show();
    /*
    if (sec == 'newPost') {
      cope.send('/post/add', {
        appId: vu.get('appId')
      }).then(res => {
        console.log(res);
        try {
          postId = res.data.postId;
        } catch (err) {
          console.error(err);
        }

        if (postId) {
          V.build('PostEditor', {
            sel: vu.sel('@newPost'),
            data: {
              appId: vu.get('appId'),
              postId: postId
            }
          });
        }
      });

      
      V.build('NewPostSec', {
        sel: vu.sel('@newPost'),
        data: {
          appId: vu.get('appId')
        }
      });
    } */
    if (sec == 'posts') {
      V.build('PostsSec', {
        sel: vu.sel('@posts'),
        data: {
          appId: vu.get('appId')
        }
      });  
    }
  });

  vu.init(data => {
    if (data && data.value) {
      data = data.value;
    }
    vu.set('appId', data 
      && data.appId 
      || null);

    vu.show('posts');
    [ 'posts', 
      'pages', 
      'store', 
      'upgrade', 
      'settings'].map(sec => {
        vu.$('@' + sec + 'Btn').on('click', evt => {
          vu.show(sec);
        });
      });
  });
}); // end of `AppLayout`

/*
V.createClass('NewPostSec', vu => {
  vu.dom(data => [
    { 'div[mb:16px]': [
      { '@status': '' },
      { 'div': [
        { 'input@title(type="text" placeholder="Title")': '' }]
      }, 
      { 'div': [
        { 'input@subtitle(type="text" placeholder="Subtitle")': '' }] 
      }, 
      { 'div@infoTable': 'Info Table' },
      { 'div@content': '[ Contents ]' }] 
    }, 
    { 'div[bt:solid 2px #333]': [
      { 'div': [
        { 'div@doneBtn': 'Done' },
        { 'div@cancelBtn': 'Cancel' },
        { 'div@publishBtn': 'Publish' },
        { 'div@addToStoreBtn': 'Add to store' }] 
      }] 
    }
  ]);

  vu.init(data => {
    let appId = data.appId || null;
    let postId = null;
    let editor = V.build('ContentEditor', {
      sel: vu.sel('@content')
    });

    console.log('add post to ' + appId);

    cope.send('/post/add', {
      appId: appId
    }).then(res => {
      console.log(res);
      try {
        postId = res.data.postId;
      } catch (err) {
        console.error(err);
      }

      if (postId) {
        vu.$('@status').html('Added as ' + postId);
      }
    });

    vu.$('@cancelBtn').on('click', evt => {
      cope.send('/post/del', {
        appId: appId,
        postId: postId 
      }).then(res => {
        console.log('/post/del', res);
      })
    });

    editor.onChange(newContentStr => {
      if (typeof newContentStr == 'string' 
        && newContent != vu.get('contentStr')) {
        cope.send('/app/post/update', {
          content: newContentStr
        }).then(res => {
          if (res.ok) {
            vu.set('contentStr', newContentStr);
          }
        });
      }
    });
  }); // end of NewPostSec.init
}); // end of `NewPostSec`
*/

V.createClass('PostsSec', vu => {
  vu.dom(data => [
    { 'h3@h3': 'Posts' },
    { '@newPostBtn[w:70px;bgColor:#44f;color:#fff;p:10px]': 'New post' },
    { '@posts': '' },
    { '@postEditor[none]': '' }
  ]);

  vu.method('newPost', () => {
    cope.send('/post/add', {
      appId: vu.get('appId')
    }).then(res => {
      console.log(res);
      try {
        postId = res.data.value.postId;
      } catch (err) {
        console.error(err);
      }

      if (postId) {
        V.build('PostEditor', {
          sel: vu.sel('@postEditor'),
          data: {
            appId: vu.get('appId'),
            postId: postId
          }
        }).done(() => {
          vu.listPosts();
          vu.mode('normal');
        });

        vu.mode('edit');
      }
    });
  }); // end of PostsSec.newPost

  vu.method('mode', mode => {
    if (mode == 'edit') {
      vu.$('@h3').hide();
      vu.$('@newPostBtn').hide();
      vu.$('@posts').hide();
      vu.$('@postEditor').fadeIn();
      vu.$('@doneEditingBtn').show();
    } else {
      vu.$('@doneEditingBtn').hide();
      vu.$('@postEditor').fadeOut();
      vu.$('@h3').show();
      vu.$('@newPostBtn').show();
      vu.$('@posts').show();
    }
  }); // end of PostsSec.mode

  vu.method('listPosts', () => {
    cope.send('/post/all').then(res => {
      console.log(res.data);
      vu.$('@posts').html('');
      if (Array.isArray(res && res.data)) {
        res.data.map(postId => {
          let postPreview = V.build('PostPreview', {
            sel: vu.sel('@posts'),
            method: 'append',
            data: { 'postId': postId }
          });
          
          postPreview.onClick(postId => {
            V.build('Post', {
              sel: vu.sel('@postEditor'),
              data: {
                postId: postId
              }
            });
            //V.build('PostEditor', {
            //  sel: vu.sel('@postEditor'),
            //  data: postData
            //}).done(() => {
            //  vu.mode('normal');
            //  postPreview.render();
            //});

            vu.mode('edit');
          });
        });
      }
    });
  }); // end of PostsSec.listPosts

  vu.init(data => {
    vu.listPosts();

    vu.$('@newPostBtn').on('click', evt => {
      vu.newPost();
    });
  }); // end of PostsSec.init
}); // end of `PostsSec`

V.createClass('PostPreview', vu => {
  let onclick;

  vu.dom(data => [
    { 'div[bgColor:#fff; mb:16px; p:16px]': [
      { 'h3@title': '' },
      { '@subtitle': '' }]
    }
  ]);

  vu.method('render', () => {
    cope.send('/post/get', {
      'postId': vu.get('postId')
    }).then(res => {
      let v = res.data;
      if (v.value) { 
        v = v.value;
        vu.$('@title').html(v.title || 'Untitled');
        vu.$('@subtitle').html(v.subtitle || '');

        console.log(vu.get('postId'), v);
        try {
          v.content = JSON.parse(v.content);
        } catch (err) {
          v.content = [];
        }
        DS.set('post-' + vu.get('postId'), {
          value: {
            title: v.title || 'Untitled',
            subtitle: v.subtitle || '',
            info: [],
            content: v.content
          }
        });
      }
    });
  }); // end of PostPreview.render

  vu.method('onClick', cb => {
    onclick = cb;
  });

  vu.init(data => {
    vu.$().on('click', evt => {
      if (typeof onclick == 'function') {
        onclick(vu.get('postId'));
      }
    });

    vu.render();
  }); // end of PostPreview.init
}); // end of `PostPreview`

V.createClass('Post', vu => {
  vu.dom(data => [
    { 'div[p:16px; bgColor:#fff]': [
      { 'h2@title': '' },
      { 'p@subtitle[fz:14px;color:#888]': '' },
      { '@info': '' },
      { '@content': '' }] 
    }
  ]); // end of Post.dom

  vu.method('render', () => {
    let postId = vu.get('postId');
    if (!postId) {
      return console.error('Failed to access post ID');
    }

    let postData = DS.get('post-' + postId);
    let v = postData && postData.value;
    if (!v || !Array.isArray(v && v.content)) {
      console.error('Failed to recognize the post value:', v);
      return;
    }
    vu.$('@title').text(v.title || 'Untitled');
    vu.$('@subtitle').html(v.subtitle || '');
    vu.$('@content').html(V.dom(v.content.map(x => vu.elmDOM(x)), vu.id));
  }); // end of Post.render

  vu.method('elmDOM', x => {
    let innerDOM = { 'div': [] };
    if (x.header) {
      innerDOM.div = innerDOM.div.concat({ 'h4': x.header }); 
    } 
    if (x.text) {
      innerDOM.div = innerDOM.div.concat({ 'p': x.text }); 
    }
    if (x.imgsrc) {
      innerDOM = {
        'div': [
          ['img(src="' + x.imgsrc + '")'],
          (innerDOM.div.length > 0) ? innerDOM : ''
        ]
      };
    }
    if (x.link) {
      innerDOM = ['a(href="' + x.link + '")', innerDOM];
    }
    return innerDOM;
  });

  vu.init(data => {
    vu.render(); 
  }); // end of Post.init
}); // end of `Post`

V.createClass('PostEditor', vu => {
  let doneCb = null;
  let done = function() {
    if (typeof doneCb == 'function') {
      doneCb.apply(null, arguments);
    }
  };
  let contentElmVus = {};

  vu.dom(data => {
    let titleElm = {};
    let infoElm = {};
    let contentElm = {};

    let infoData = Array.isArray(data && data.info) 
      ? data.info
      : [];

    let content = Array.isArray(data && data.content)
      ? data.content
      : [];

    vu.set('infoData', infoData);
    vu.set('content', content);

    titleElm['div'] = [
      { 'input(type="text" placeholder="Title")@title': '' },
      { 'input(type="text" placeholder="Subtitle")@subtitle': '' }
    ];

    infoElm['@infoTable'] = infoData.map(x => {
      return {
        'div': [
          { 'div': x.key },
          { 'div': x.value }]
      };
    });

    return [
      { 'div@controls': [
        { '@ctl-d[inline-block; p:6px; bgColor:#44f]': 'Done' },
        { '@ctl-r[inline-block; p:6px; bgColor:#e00]': 'Remove this post' },
        { '@ctl-p[inline-block; p:6px; bgColor:#ddd]': 'Set publish time' },
        { '@ctl-a[inline-block; p:6px; bgColor:#ddd]': 'Add to store' }]
      },
      titleElm,
      { 'h4': 'Info' },
      { 'button@addInfoBtn': 'Add info' },
      infoElm, 
      { 'h4': 'Content' },
      { '@content': '' },
      { 'button@addContentBtn': 'Add content' }
    ];
  }); // end of PostEditor.dom

  vu.method('prependElm', (value, sel) => {
    let params = {};
    if (typeof value != 'object' || !value) {
      value = {};
    }
    value.postEditor = vu;

    if (!sel) {
      params = {
        sel: vu.sel('@content'),
        method: 'prepend',
        data: value
      }
    } else {
      params = {
        sel: sel,
        method: 'before',
        data: value
      };
    }

    let elmVu = V.build('ContentElement', params); 
    elmVu.$().data('vuid', elmVu.id); // so that we can access "data-vuid" via this data
    vu.contentElm(elmVu); 
  }); // end of PostEditor.prependElm

  vu.method('appendElm', (value, sel) => {
    let params = {};
    if (typeof value != 'object' || !value) {
      value = {};
    }

    // Assign this post editor to its children views
    value.postEditor = vu;

    if (!sel) {
      params = {
        sel: vu.sel('@content'),
        method: 'append',
        data: value
      };
    } else {
      params = {
        sel: sel,
        method: 'after',
        data: value
      };
    }

    let elmVu = V.build('ContentElement', params); 
    elmVu.$().data('vuid', elmVu.id); // so that we can access "data-vuid" via this data
    vu.contentElm(elmVu); 
  }); // end of PostEditor.appendElm

  vu.method('contentElm', a => {
    if (typeof a == 'string') {
      return contentElmVus[a] || null;
    } else if (a && (typeof a.id == 'string')) {
      contentElmVus[a.id] = a;
      return null;
    }
  }); // end of PostEditor.contentElm

  vu.method('save', cb => {
    let params = Object.assign({}, 
      vu.fetch(),
      { postId: vu.get('postId') });

    console.log('save', params);

    if (params.content) {
      params.content = JSON.stringify(params.content);
    }
    cope.send('/post/update', params).then(res => {
      if (typeof cb == 'function') {
        console.log('saved', res);
        cb(res && res.data);  
      }
    });
  }); // end of PostEditor.save

  vu.method('fetch', () => {
    let title = vu.$('@title').val().trim();
    let subtitle = vu.$('@subtitle').val().trim();
    let info = []; // TBD: [{ tagname, value }]
    let content = [];

    vu.$('@content').children().each(function() {
      let id = $(this).data('vuid');
      let elmVu = vu.contentElm(id);
      if (elmVu) {
        let elmData = Object.assign({}, elmVu.get());
        delete elmData.postEditor;
        content = content.concat(elmData);
      }
    });

    let currData = {
      title: title,
      subtitle: subtitle,
      info: info,
      content: content
    };
    vu.set(currData);
    return currData;
  }); // end of PostEditor.fetch

  vu.method('renderView', () => {
    let content = vu.get('content');
    if (!content) {
      content = [];
      vu.set('content', []);
    }

    vu.$('@title').val(vu.get('title'));
    vu.$('@subtitle').val(vu.get('subtitle'));
    vu.$('@content').html('');
    content.map(x => {
      vu.appendElm(x);
    });
  }); // end of PostEditor.renderView

  vu.method('done', cb => {
    doneCb = cb;
  });

  vu.init(data => {
    vu.renderView();
    vu.$('@addContentBtn').on('click', evt => {
      vu.appendElm();
    });
    vu.$('@ctl-d').on('click', function() {
      vu.save();
      done();
    });
    vu.$('@ctl-r').on('click', function() {
      done();
    });
    vu.$('@title').on('keyup', function() {
      // TBD delay save
    });
    vu.$('@subtitle').on('keyup', function() {
      // TBD delay save
    });
  }); // end of PostEditor.init
}); // end of `PostEditor`

V.createClass('ContentElement', vu => {
  let postEditor = vu.get('postEditor');
  if (!postEditor) {
    return console.error('Failed to find post editor');
  }
  let onChangeCb = function() {};
  let actionBtns = { 'div@actions': [
    { '@act-d[inline-block; p:6px; bgColor:#44f]': 'Done' },
    { '@act-r[inline-block; p:6px; bgColor:#e00]': 'Remove' },
    { '@act-p[inline-block; p:6px; bgColor:#ddd]': 'Prepend' },
    { '@act-a[inline-block; p:6px; bgColor:#ddd]': 'Append' }]
  }; 

  vu.dom(data => {
    let dom = '';
    switch (data && data.type) {
      case 'text': 
        dom = vu.textDOM();
        break;
      default: // New element
        dom = vu.newDOM();
    }
    return [{ 'div[b:2px solid #333; p:8px; mb:8px]': [
      { '@elem-root': dom },
      { '@fallback[none]': 'Double click to edit' }]
    }];
  });

  vu.method('newDOM', () => {
    return [
      { '@textOp': 'Text' },
      { '@linkOp': 'Link' },
      { '@postOp': 'Post' },
      { '@imgOp': 'Image' },
      { '@vidOp': 'Video' },
      { '@audOp': 'Audio' }
    ];
  }); // end of ContentElement.newDOM

  vu.method('textDOM', () => {
    let data = vu.get();
    let header = data && data.header && data.header.trim();
    let text = data && data.text && data.text.trim();
    console.log('textDOM', data);
    return [
      { '@normal[none;p:10px;]': [
        { 'h4': data.header || '' },
        { 'p': data.text && data.text.replace(/\n/g, '<br>') || '' }] 
      },
      { '@edit': [
        [ 'input(type="text" placeholder="Header" value="' + (data.header || '') + '")', '' ],
        [ 'textarea@focusFirst(placeholder="Write something here.")', data.text || '' ],
        actionBtns] 
      }
    ];
  }); // end of ContentElement.textDOM

  vu.method('initTextElm', () => {
    vu.$('input').on('keyup', evt => {
      let header = vu.$('input').val().trim() || '';
      vu.set('header', header);
      vu.$('h4').text(header);
    });

    vu.$('textarea').on('keyup', evt => {
      let text = vu.$('textarea').val().trim() || '';
      vu.set('text', text);
      vu.$('p').html(text.replace(/\n/g, '<br>'));
    });
  }); // end of ContentElement.initTextElm

  vu.method('onChange', cb => {
    if (typeof cb == 'function') {
      onChangeCb = cb;
    }
  }); // end of ContentElement.onChange

  vu.method('checkFallback', () => {
    vu.$('@fallback').hide();
    let data = vu.get();
    switch (data.type) {
      case 'text':
        if (!data.header && !data.text) {
          vu.$('@fallback').show();
        } 
        break;
      default:
    }
  }); // end of ContentElement.checkFallback

  vu.method('initTyped', () => {
    let initFn = {
      'text': vu.initTextElm
    };
    let data = vu.get();
    if (!data || !data.type 
      || !vu[data.type + 'DOM']
      || !initFn[data.type]) {
      return;
    }
    let vuDom = vu[data.type + 'DOM']();
    vu.$('@elem-root').html(V.dom(vuDom), vu.id);

    // Init typed element
    initFn[data.type]();

    vu.$('@normal').on('dblclick', evt => {

      // Editing
      vu.$('@fallback').hide();
      vu.$('@normal').hide();
      vu.$('@edit').fadeIn();
      vu.$('@focusFirst').focus();
    });

    vu.$('@fallback').on('dblclick', evt => {
      vu.$('@normal').dblclick();
    });

    vu.$('@actions').children().off('click').on('click', evt => {

      // Done editing
      postEditor.save();
      vu.checkFallback();
      vu.$('@edit').hide();
      vu.$('@normal').fadeIn();
    });
    vu.$('@act-p').on('click', evt => {
      postEditor.prependElm(null, vu.sel());
    });
    vu.$('@act-a').on('click', evt => {
      postEditor.appendElm(null, vu.sel()); 
    });
    vu.$('@act-r').on('click', evt => {
      vu.$().css('background-color', '#e00').fadeOut(() => {
        vu.$().remove();
      });
    });
    vu.$('@focusFirst').focus();
  }); // end of ContentElement.initTyped

  vu.init(data => {
    if (!data.type) {
      [ 'text', 
        'link',
        'post',
        'img',
        'vid',
        'aud' ].map(type => {
          vu.$('@' + type + 'Op').on('click', evt => {
            vu.set('type', type);
            vu.initTyped();
          });
        });
    } else {
      vu.initTyped();
    } 
  }); // end of ContentElement.init
}); // end of `ContentElement`

/*
V.createClass('ContentEditor', vu => {
  vu.dom(data => [
    { 'div': 'Content Editor' }
  ]);

  vu.method('onChange', cb => {
    console.log('TBD');
    // TBD
  });
}); // end of `ContentEditor`
*/

// Build `Cope` and saved as "CopeRoot"
DS.set('CopeRoot', V.build('Cope', {
  sel: '#page-container'
}));

}(cope);
