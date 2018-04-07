let post = function(appDomain, postId) {
  
let V = cope.views();

V.createClass('__Post', vu => {
  vu.dom(data => [
    { 'div': [
      { 'h2@title': '' },
      { 'p@subtitle': '' },
      { '@info': '' },
      { '@content': '' }] 
    },
    { '@relatedPosts': '' }
  ]);

  vu.method('elmDOM', elmData => {
    // TBD
  }); // end of Post.elmDOM

  vu.method('render', () => {
    cope.send('/post/get', {
      postId: vu.get('postId')
    }).then(res => {
      let v = res && res.data;
      vu.$('@title').html(v.title);
      vu.$('@subtitle').html(v.subtitle);
      vu.$('@content').html('');
      
      try {
        v.content = JSON.parse(v.content);
        v.content.map(x => {
          vu.$('@content').append(vu.elmDOM(x));
        });
      } catch (err) {
        console.error(err);
        v.content = [];
      }

      // Store the current data
      vu.set(v);
    });
  });

  vu.init(data => {
    vu.render();
  });
}); // end of `__Post`

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

    cope.send('/post/get', {
      postId: postId
    }).then(res => {

      let v = res && res.data;
      console.log(v);
      try {
        v.content = JSON.parse(v.content);
      } catch (err) {
        console.error(err);
        v.content = [];
      }
      if (!v || !Array.isArray(v && v.content)) {
        console.error('Failed to recognize the post value:', v);
        return;
      }
      vu.$('@title').text(v.title || 'Untitled');
      vu.$('@subtitle').html(v.subtitle || '');
      vu.$('@content').html(V.dom(v.content.map(x => vu.elmDOM(x)), vu.id));

      vu.set(res && res.data);
    });
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

V.build('Post', {
  sel: '#page-container',
  data: {
    appDomain: appDomain,
    postId: postId
  }
});

return };
