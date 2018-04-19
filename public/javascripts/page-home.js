let pageHome = function() {

let V = cope.views();
let DS = V.dataStore();

V.createClass('Cope', vu => {
  vu.dom(data => [
    { 'nav@navbar.navbar': '' },
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
    cope.send('/app/all').then(res => {
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
    { 'div@logo.navbar-brand[cursor:pointer]': 'Cope' }
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
          { 'input@email(type="text" placeholder="Email" value="chops@mail.com")': '' },
          { 'input@pwd(type="text" placeholder="Password" value="1234")': '' },
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
    { 'nav.navbar.navbar-expand-sm': [
      { '.navbar-brand': data.appName || data.value.appName || 'App' },
      { 'button.navbar-toggler@togglerBtn': [{ 'span.navbar-toggler-icon': '三' }] },
      { '@collapse.collapse.navbar-collapse': [
        { 'ul.navbar-nav.mr-auto.mt-2.mt-lg-0': [
          { 'li@postsBtn.nav-item': [{ '.nav-link.active': 'Posts'}] },
          { 'li@pagesBtn.nav-item': [{ '.nav-link': 'Pages' }] },
          { 'li@storeBtn.nav-item': [{ '.nav-link': 'Store' }] },
          { 'li@upgradeBtn.nav-item': [{ '.nav-link': 'Upgrade' }] },
          { 'li@settingsBtn.nav-item': [{ '.nav-link': 'Settings' }] }] 
        }] 
      }] 
    },
    { 'div.main-content.row': [
      { 'section@posts.col': 'Posts' },
      { 'section@pages.col': 'Pages' },
      { 'section@store.col': 'Store' },
      { 'section@upgrade.col': 'Upgrade' },
      { 'section@settings.col': 'Settings' }]
    }
  ]);

  vu.method('show', sec => {
    vu.$('ul').find('.nav-link').removeClass('active');
    vu.$('@' + sec + 'Btn').find('.nav-link').addClass('active');
    vu.$('.main-content > section').hide();
    vu.$('@' + sec).show();
    if (sec == 'posts') {
      V.build('PostsSec', {
        sel: vu.sel('@posts'),
        data: {
          appId: vu.get('appId')
        }
      });  
    } else if (sec == 'settings') {
      V.build('SettingsSec', {
        sel: vu.sel('@settings'),
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

    vu.$('@togglerBtn').on('click', evt => {
      vu.$('@collapse').toggleClass('collapse');
    });

    vu.$('@collapse').find('.nav-item').on('click', evt => {
      vu.$('@collapse').addClass('collapse');
    });

    [ 'posts', 
      'pages', 
      'store', 
      'upgrade', 
      'settings'].map(sec => {
        vu.$('@' + sec + 'Btn').on('click', evt => {
          vu.show(sec);
        });
      });

    vu.show('posts');
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
    cope.send('/post/all', { appId: vu.get('appId') }).then(res => {
      vu.$('@posts').html('');
      if (Array.isArray(res && res.data)) {
        res.data.map(postId => {
          let postPreview = V.build('PostPreview', {
            sel: vu.sel('@posts'),
            method: 'append',
            data: { 'postId': postId }
          });
          
          postPreview.onClick(postId => {
            V.build('EditablePost', {
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

V.createClass('EditablePost', vu => {
  vu.dom(data => [
    { 'div[w:100%]': [
      { 'button@editBtn': 'Edit' }] 
    },
    { '@post[w:100%]': '' },
    { '@edit[none;w:100%]': '' }
  ]);

  vu.method('render', () => {
    vu.$('@editBtn').show();
    vu.$('@edit').hide();
    V.build('Post', {
      sel: vu.sel('@post'),
      data: {
        postId: vu.get('postId')
      }
    });
  }); // end of EditablePost.render

  vu.method('edit', () => {
    vu.$('@editBtn').hide();
    vu.$('@edit').show();
    V.build('PostEditor', {
      sel: vu.sel('@post'),
      data: {
        postId: vu.get('postId')
      }
    }).done(() => {
      vu.render();
    });
  }); // end of EditablePost.edit

  vu.init(data => {
    vu.render();

    vu.$('@editBtn').on('click', evt => {
      vu.edit();
    });
  });
}); // end of `EditablePost`

V.createClass('Post', vu => {
  vu.dom(data => [
    { 'div[w:100%; max-width:600px; p:16px; bgColor:#fff]': [
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
    console.log('elmDOM', x);
    let innerDOM = { 'div': [] };
    if (x.header && x.header.length > 0) {
      innerDOM.div = innerDOM.div.concat({ 'h4': x.header }); 
    } 
    if (x.text && x.text.length > 0) {
      innerDOM.div = innerDOM.div.concat({ 'p': x.text }); 
    }
    if (innerDOM.div.length < 1) {
      innerDOM = '';
    }
    if (x.mediaArr && x.mediaArr.length > 0) {
      innerDOM = {
        'div': [
          vu.mediaDOM(x.mediaArr),
          innerDOM
        ]
      };
    } 
    if (x.link) {
      innerDOM = ['a(href="' + x.link + '" target="_blank")', [innerDOM || x.link]];
    }
    console.log(innerDOM);
    return innerDOM;
  }); // end of Post.elmDOM

  vu.method('mediaDOM', mediaArr => {
    if (!Array.isArray(mediaArr) || mediaArr.length < 1) {
      return '';
    }
    let dom = { 'div': mediaArr.map(x => {
      if (x.imgsrc) {
        return ['img(src="' + x.imgsrc + '")[w:100%]'];
      } else if (x.vidsrc) {
        return ['div', 'Video: ' + x.vidsrc];
      } else if (x.audsrc) {
        return ['div', 'Audio: ' + x.audsrc];
      } else {
        return '';
      }
    }) };
    return dom;
  }); // end of Post.mediaDOM

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

  vu.dom(data => [
    { 'div': [ 
      { 'div@controls': [
        { '@ctl-d[inline-block; p:6px; bgColor:#44f]': 'Done' },
        { '@ctl-t[inline-block; p:6px; bgColor:#ddd]': 'Save as template' },
        { '@ctl-r[inline-block; p:6px; bgColor:#e00]': 'Remove this post' },
        { '@ctl-p[inline-block; p:6px; bgColor:#ddd]': 'Set publish time' },
        { '@ctl-a[inline-block; p:6px; bgColor:#ddd]': 'Add to store' }]
      },
      { 'div': [
        { 'input(type="text" placeholder="Title")@title[fz:20px;w:100%]': '' }]
      },
      { 'div': [
        { 'input(type="text" placeholder="Subtitle")@subtitle[w:100%]': '' }]
      },
      { 'h4': 'Info' },
      { '@infoTable': '' },
      { '@addInfoBtn[mt:20px]': [{ 'span[p:10px; bgColor:#fff]': 'Add'}] },
      { 'h4': 'Content' },
      { '@content': '' },
      { '@addContentBtn[mt:20px]': [{ 'span[p:10px; bgColor:#fff]': 'Add'}] }]
    }
  ]); // end of PostEditor.dom

  vu.method('done', cb => {
    doneCb = cb;
  });

  vu.method('appendElm', value => {
    V.build('EditableElement', {
      sel: vu.sel('@content'),
      method: 'append',
      data: value || {}
    }); 
  }); // end of PostEditor.appendElm

  vu.method('save', cb => {
    let params = Object.assign({}, 
      vu.fetch(),
      { postId: vu.get('postId') });

    if (params.content) {
      params.content = JSON.stringify(params.content);
    }
    cope.send('/post/update', params).then(res => {
      console.log('saved', res);
      let upd = res && res.data; // updated post data
      if (!Array.isArray(upd.value && upd.value.content)) {
        try {
          upd.value.content = JSON.parse(upd.value.content);
        } catch (err) {
          console.error(err);
          upd.value.content = [];
        }
      }
      DS.set('post-' + vu.get('postId'), res && res.data);
      if (typeof cb == 'function') {
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
      let elmVu = $(this).data('view');
      if (elmVu && elmVu.fetch) {
        let fetched = elmVu.fetch();
        if (fetched) {
          content = content.concat(Object.assign({}, fetched));
        }
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
    let postData = DS.get('post-' + vu.get('postId'));
    let v = postData && postData.value;
    if (!v) {
      console.error('Failed to fetch the post:', postData);
      return;
    }

    vu.$('@title').val(v.title || 'Untitled');
    vu.$('@subtitle').val(v.subtitle);
    vu.$('@content').html('');
    try {
      v.content.map(x => {
        vu.appendElm(x);
      });
    } catch (err) {
      v.content = [];
      console.error(err);
    }
  }); // end of PostEditor.renderView

  vu.init(data => {
    vu.renderView();
    vu.$('@ctl-d').on('click', function() {
      vu.save(() => {
        done();
      });
    });
    vu.$('@ctl-r').on('click', function() {
      done();
    });
    vu.$('@addContentBtn').on('click', function() {
      vu.appendElm();
    });
    vu.$('@title').on('keyup', function() {
      // TBD delay save
    });
    vu.$('@subtitle').on('keyup', function() {
      // TBD delay save
    });
  }); // end of PostEditor.init
}); // end of `PostEditor`

V.createClass('EditableElement', vu => {
  let elmView = {};
  
  vu.dom(data => [
    { 'div[w:100%; max-width:600px; bgColor:#fff; m:10px 0; p:10px 0;]': [
      { 'div@elm': '' },
      { 'div[h:40px]': [
        { 'div@controlBtns[none]': [
          { 'div@prependBtn[inline-block;bgColor:#fff;p:10px;mr:2px]': 'Prepend' },
          { 'div@appendBtn[inline-block;bgColor:#fff;p:10px;mr:2px]': 'Append' },
          { 'div@moveUpBtn[inline-block;bgColor:#fff;p:10px;mr:2px]': 'Move Up' },
          { 'div@moveDownBtn[inline-block;bgColor:#fff;p:10px;mr:2px]': 'Move Down' },
          { 'div@removeBtn[inline-block;color:#f00;p:10px;mr:2px]': 'Remove' }] 
        }]
      }]
    }
  ]);

  vu.method('fetch', () => {
    try {
      return elmView.fetch();
    } catch (err) {
      return null;
    }
  }); // end of EditableElement.fetch

  vu.method('mode', mode => {
    if (mode == 'edit') {
      vu.$('@controlBtns').show();
    } else {
      vu.$('@controlBtns').hide();
    }
  }); // end of EditableElement.mode

  vu.init(data => {

    vu.$().data('view', vu);

    vu.$().on('mouseenter', () => {
      vu.mode('edit');
    });
    vu.$().on('mouseleave', () => {
      vu.mode('normal');
    });

    vu.$('@prependBtn').on('click', evt => {
      V.build('EditableElement', {
        sel: vu.sel(),
        method: 'before'
      });
    });

    vu.$('@appendBtn').on('click', evt => {
      V.build('EditableElement', {
        sel: vu.sel(),
        method: 'after'
      });
    });

    vu.$('@moveUpBtn').on('click', evt => {
      vu.$().prev().before(vu.$());
    });

    vu.$('@moveDownBtn').on('click', evt => {
      vu.$().next().after(vu.$());
    });

    vu.$('@removeBtn').on('click', evt => {
      vu.$().remove();
    });

    if (data.hasOwnProperty('postId')) {
      elmView = V.build('EditablePostLink', {
        sel: vu.sel(),
        data: data
      });
    } else if (data.hasOwnProperty('link')) {
      elmView = V.build('EditableLink', {
        sel: vu.sel('@elm'),
        data: data
      });
    } else if (data.hasOwnProperty('mediaArr')) {
      elmView = V.build('EditableMedia', {
        sel: vu.sel('@elm'),
        data: data
      });
    } else if (data.hasOwnProperty('header') 
      || data.hasOwnProperty('text')) {
      elmView = V.build('EditableText', {
        sel: vu.sel('@elm'),
        data: data
      });
    } else {
      vu.$('@controlBtns').remove();
      V.build('EditableTypeSelector', {
        sel: vu.sel('@elm')
      }).onSelect(initData => {
        elmView = V.build('EditableElement', {
          sel: vu.sel(),
          method: 'after',
          data: initData
        });  

        vu.$().remove();
      });
    }
  });
}); // end of `EditalbeElement`

V.createClass('EditableTypeSelector', vu => {
  let onselect = null;
  let initData = {};
  initData.text = {
    header: '',
    text: ''
  };

  // TBD
  //initData.post = { postId: 'none' };
  initData.link = { link: '/' };
  initData.media = { mediaArr: [] };

  vu.dom(data => [
    { 'div': [
      { '@text[inline-block; p:10px; mr:10px]': 'Text' },
      { '@post[inline-block; p:10px; mr:10px]': 'Post' },
      { '@link[inline-block; p:10px; mr:10px]': 'Link' },
      { '@media[inline-block; p:10px; mr:10px]': 'Media' }] 
    }
  ]);

  vu.method('onSelect', callback => {
    onselect = callback;
  });

  vu.init(data => {
    ['text', 'post', 'link', 'media'].map(type => {
      vu.$('@' + type).on('click', evt => {
        if (typeof onselect == 'function') {
          onselect(initData[type]);
        }
      });
    });
  }); // end of EditableTypeSelector.init
}); // end of `EditableTypeSelector`

V.createClass('EditableText', vu => {
  vu.dom(data => [
    { 'div': [
      [ 'input@headerInput(placeholder="Header" value="' 
        + (data.header || '') 
        + '")[w:100%]' ]]
    },
    { 'div': [
      { 'textarea@text(row=10 placeholder="Write something here.")[w:100%]': data.text }] 
    }
  ]);

  vu.method('fetch', () => {
    let v = {};
    v.header = vu.get('header') || '';
    v.header = v.header.trim();
    v.text = vu.get('text') || '';
    v.text = v.text.trim();
    console.log('fetching text', v);
    return v;
  });

  vu.init(data => {
    vu.$('@headerInput').on('keyup', evt => {
      vu.set('header', vu.$('@headerInput').val());
    });
    vu.$('@text').on('keyup', evt => {
      vu.set('text', vu.$('@text').val());
    });
  });
}); // end of `EditableText`

V.createClass('EditableLink', vu => {
  let textView;
  let mediaView;

  vu.dom(data => [
    { 'div': [
      { '@editableCover[none]': [
        { '@cover': '' },
        { '@text': '' },
        { 'button@removeCoverBtn': 'Remove Cover' }] 
      },
      { 'input@linkInput(placeholder="URL")': '' }]
    },
    { 'div': [ 
      { 'button@editCoverBtn': 'Edit Cover' }]
    }
  ]);

  vu.method('editCover', () => {
    vu.$('@editableCover').fadeIn();
    vu.$('@editCoverBtn').hide();
  }); // end of EditableLink.editCover

  vu.method('render', () => {

    let v = vu.get();

    mediaView = V.build('EditableMedia', {
      sel: vu.sel('@cover'),
      data: {
        mediaArr: vu.get('mediaArr')
      }
    });
    // TBD: set "imgsrc" here

    textView = V.build('EditableText', {
      sel: vu.sel('@text'),
      data: {
        header: vu.get('header') || '',
        text: vu.get('text') || ''
      }
    });

    if (v.header || v.text || (v.mediaArr && v.mediaArr.length)) {
      vu.editCover();
    } 
  }); // end of EditableLink.render

  vu.method('fetch', () => {
    let v = {};
    v.link = vu.get('link') || '#';
    if (textView && textView.fetch) {
      v = Object.assign(v, textView.fetch());
    }
    if (mediaView && mediaView.fetch) {
      v = Object.assign(v, mediaView.fetch());
    }

    // Update vu's data
    vu.set(v);

    return v;
  }); // end of EditableLink.fetch

  vu.init(data => {

    let linkInput = vu.$('@linkInput');
    linkInput.on('keyup', evt => {
      vu.set('link', linkInput.val().trim() || '');
    });

    linkInput.val(data.link || '');
    
    // Click to edit cover
    vu.$('@editCoverBtn').on('click', evt => {
      vu.editCover();
    });

    // Click to remove cover
    vu.$('@removeCoverBtn').on('click', evt => {
      vu.$('@editableCover').fadeOut();
      try {
        vu.set({
          header: '',
          text: '',
          mediaArr: []
        });
      } catch (err) {
        console.error(err);
      }
      vu.render();
    });

    vu.render();
  });
}); // end of `EditableLink`

V.createClass('EditableMedia', vu => {
  vu.dom(data => [
    { 'div[w:100%;bgColor:#fff;b:2px solid #333]': [
      { '@display': '' },
      { '@panel[none]': '' },
      { '@addBtn': [
        { 'div': 'Add' }, 
        { '@addMethodBtns[none]': [
          { 'span@uploadBtn[p:10px]': 'Upload' },
          { 'span@extBtn[p:10px]': 'URL' },
          { 'span@libBtn[p:10px]': 'Library' }] 
        }]
      }]
    }
  ]); // end of EditableMedia.dom

  vu.method('mode', a => {
    if (a == 'edit') {
      vu.$('@display').hide();
      vu.$('@panel').show();
      vu.$('@saveBtn').hide();
    } else {
      vu.$('@display').show();
      vu.$('@panel').hide();
      vu.$('@saveBtn').show();
    }
  }); 

  vu.method('checkType', a => {
    // TBD
    return new Promise((resolve, reject) => {
      resolve('img');
    });
  });

  vu.method('fetch', () => {
    let v = {};
    v.mediaArr = vu.get('mediaArr') || [];
    return v;
  }); // end of EditableMedia.fetch

  vu.method('addLinkUI', () => {
    vu.mode('edit');

    vu.$('@panel').html(V.dom([
      { 'div': [
        { 'input@urlInput(type="text" placeholder="Paste the link here")': '' },
        { '@addLinkBtn[p:10px; fc:#c00]': 'Save Link' }] 
      }
    ], vu.id));

    vu.$('@addLinkBtn').off('click').on('click', evt => {
      let url = vu.$('@urlInput').val().trim();
      console.log(url);
      vu.checkType(url).then(type => {
        console.log(type);
        let v = null;
        if (type == 'img') {
          v = { imgsrc: url };
        } 

        V.build('EditableMediaItem', {
          sel: vu.sel('@display'),
          method: 'append',
          data: {
            imgsrc: url
          }
        });

        if (v) {
          vu.set('mediaArr', vu.get('mediaArr').concat(v));
        }

        vu.mode('normal');
      });
    });
  }); // end of EditableMedia.addLinkUI

  vu.method('render', () => {
    vu.$('@display').html('');
    vu.get('mediaArr').map(x => {
      V.build('EditableMediaItem', {
        sel: vu.sel('@display'),
        method: 'append',
        data: x
      });
    });
  });

  vu.init(data => {
    let mediaArr = data && data.mediaArr;
    if (!Array.isArray(mediaArr)) {
      mediaArr = [];
    }
    vu.set('mediaArr', mediaArr);
    vu.render();

    // TBD: To upload from the device

    // To set external link to the media
    vu.$('@extBtn').on('click', evt => {
      vu.addLinkUI();
    });

    // TBD: To choose from the library

    vu.$('@addBtn').on('mouseenter', evt => {
      vu.$('@addMethodBtns').fadeIn();
    });

    vu.$('@addBtn').on('mouseleave', evt => {
      vu.$('@addMethodBtns').fadeOut();
    });

  }); // end of EditableMedia.init
}); // end of EditableMedia

V.createClass('EditableMediaItem', vu => {
  vu.dom(data => [
    { 'div': '' }
  ]);

  vu.init(data => {
    if (data.imgsrc) {
      vu.$().html(V.dom([
        ['img(src="' + data.imgsrc + '")[w:200px]']
      ]), vu.id);
    }
  });
}); // end of `EditableMediaItem`

V.createClass('SettingsSec', vu => {
  vu.dom(data => [
    { 'div': [
      { 'div': [
        { 'span[p:10px]': 'App ID' },
        { 'span@appId[p:10px]': '' }] 
      }, 
      { 'div': [
        { 'span[p:10px]': 'App Name' },
        { 'span@appName[p:10px]': '' }] 
      }, 
      { 'div' : [
        { 'span[p:10px]': 'Domain' },
        { 'input@domainInput(type="text" placeholder="Set your unique domain.")': '' },
        { '@domainClaimBtn': 'Claim' }] 
      }, 
      { 'div': [ 
        { 'span': 'Host' },
        { 'input@hostInput(type="text" placeholder="Set your custom HOST")': '' },
        { '@hostClaimBtn': 'Claim' }]
      }]
    }
  ]); // end of SettingsSec.dom

  vu.method('render', () => {
    cope.send('/app/get', {
      appId: vu.get('appId')
    }).then(res => {
      let v = res && res.data && res.data.value;
      vu.$('@appId').html(v.appId || '');
      vu.$('@appName').html(v.appName || 'Untitled App');
      vu.$('@domainInput').val(v.appDomain || '');
      vu.$('@hostInput').val(v.appHost || '');
    });
  });

  vu.init(data => {
    vu.$('@domainClaimBtn').on('click', evt => {
      let domain = vu.$('@domainInput').val().trim();
      console.log('Claim');
      cope.send('/app/update', {
        appId: data.appId,
        appDomain: domain
      }).then(res => {
        console.log(res);
        vu.render();
      });
    });

    vu.$('@hostClaimBtn').on('click', evt => {
      let host = vu.$('@hostInput').val().trim();
      console.log('Claim');
      cope.send('/app/update', {
        appId: data.appId,
        appHost: host
      }).then(res => {
        console.log(res);
        vu.render();
      });
    });
    vu.render();
  }); // end of SettingsSec.init
}); // end of `SettingsSec`

// Build `Cope` and saved as "CopeRoot"
DS.set('CopeRoot', V.build('Cope', {
  sel: '#page-container'
}));

}(cope);
