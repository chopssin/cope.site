let app = function() {

let V = cope.views();
let DS = V.dataStore();

V.createClass('PostPreview', vu => {
  vu.dom(data => [
    { 'a(target="_blank")[block; p:20px; bgColor:#fff; mb:16px;]': [
      { '@coverImage[w:100%;]': '' },
      { 'h3@title': '' },
      { 'div@previewText': '' }]
    }
  ]);

  vu.method('render', () => {
    cope.send('/post/get', {
      postId: vu.get('postId')
    }).then(res => {
      let v = res && res.data;
      let previewText = null;
      let cover = null;
      vu.$('@title').text(v.title || 'Untitled');
      
      try {
        if (v && v.content) {
          v.content = JSON.parse(v.content);
        }
      } catch (err) { console.error(err); }


      // Find previewText
      if (v.content && v.content.length > 0) {
        v.content.map(x => {
          if (!previewText && x.text) {
            previewText = x.text;
          }
          if (!cover && x.mediaArr 
            && x.mediaArr.length > 0 
            && x.mediaArr[0]
            && x.mediaArr[0].imgsrc) {
            cover = x.mediaArr[0].imgsrc
          console.log(cover);
          }
        });
      }

      if (previewText) {
        vu.$('@previewText').html(previewText);
      }

      if (cover) {
        vu.$('@coverImage').html(V.dom([['img(src="' + cover + '")[w:100%;]']]));
      }

      vu.$().prop('href', '/post/' 
        + vu.get('postId'));      

      // Store the post value
      vu.set(v);
    });
  });

  vu.init(data => {
    vu.render();
  });
}); // end of `PostPreview`

// Main
V.createClass('App', vu => {
  vu.dom(data => [
    { 'div': [
      { 'h1@appName': '' }] 
    },
    { '@posts': '' }
  ]); // end of App.dom

  vu.method('render', () => {
    cope.send('/app/get').then(res => {
      console.log(res);
      let v = res && res.data && res.data.value;
      vu.set('appId', v.appId);
      vu.$('@appName').html(v && v.appName || 'Untitled App');
      vu.listPosts();
    });
  }); // end of App.render

  vu.method('listPosts', () => {
    cope.send('/post/all', {
      appId: vu.get('appId')
    }).then(res => {
      let postIds = res && res.data;
      console.log(postIds);

      if (Array.isArray(postIds)) {
        vu.$('@posts').html('');
        //vu.set('postIds', postIds);
        postIds.map(pid => {
          V.build('PostPreview', {
            sel: vu.sel('@posts'),
            method: 'append',
            data: {
              postId: pid
            }
          });
        });
      }
    }); 
  });

  vu.init(data => {
    vu.render();
  }); // end if App.init
}); // end of `App`

V.build('App', {
  sel: '#page-container',
});

return; };
