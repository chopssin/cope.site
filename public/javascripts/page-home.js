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
      cope.send('/account/signin', {
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
        { 'li@newPostBtn': 'New Post' },
        { 'li@postsBtn': 'Posts' },
        { 'li@pagesBtn': 'Pages' },
        { 'li@storeBtn': 'Store' },
        { 'li@upgradeBtn': 'Upgrade' },
        { 'li@settingsBtn': 'Settings' }] 
      }] 
    },
    { 'div.main-content': [
      { 'section@newPost': 'New Post' },
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
    if (sec == 'newPost') {
      V.build('NewPostSec', {
        sel: vu.sel('@newPost'),
        data: {
          appId: vu.get('appId')
        }
      });
    } else if (sec == 'posts') {
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
    ['newPost', 
      'posts', 
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

V.createClass('PostsSec', vu => {
  vu.dom(data => [
    { 'h3': 'Posts' },
    { '@posts': '' }
  ]);

  vu.init(data => {
    cope.send('/post/all').then(res => {
      console.log(res.data);
      vu.$('@posts').html('');
      if (Array.isArray(res && res.data)) {
        res.data.map(postId => {
          V.build('SinglePost', {
            sel: vu.sel('@posts'),
            method: 'append',
            data: { 'postId': postId }
          });
        });
      }
    });
  }); // end of PostsSec.init
}); // end of `PostsSec`

V.createClass('SinglePost', vu => {
  vu.dom(data => [
    { 'div[bgColor:#fff; mb:16px; p:16px]': [
      { '@title': '' },
      { '@subtitle': '' },
      { '@info': '' },
      { '@content': '' }] 
    }
  ]);

  vu.init(data => {
    console.log(data);
    cope.send('/post/get', {
      'postId': data.postId
    }).then(res => {
      console.log(res);
      let v = res.data;
      if (v.value) { 
        v = v.value;
        vu.$('@content').html(JSON.stringify(v));
      }
    });
  });
});

V.createClass('ContentEditor', vu => {
  vu.dom(data => [
    { 'div': 'Content Editor' }
  ]);

  vu.method('onChange', cb => {
    console.log('TBD');
    // TBD
  });
}); // end of `ContentEditor`

// Build `Cope` and saved as "CopeRoot"
DS.set('CopeRoot', V.build('Cope', {
  sel: '#page-container'
}));

}(cope);
