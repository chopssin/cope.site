window.copeApp = function(appId, path, params) {

try {
  params = params.replace(/\&quot\;/g, '"');
  params = JSON.parse(params);
} catch (err) {
  //console.error(err);
  params = {};
}

let V = cope.views();
let DS = V.dataStore();

V.createClass('PostPreviewCard', vu => {
  vu.dom(data => [
    { 'div.card': [
      { 'img.d-none.card-img-top@cover[h:180px]': '' },
      { 'div.card-body': [
        { 'h4.card-title@title': '' },
        { 'h6.card-subtitle.text-muted.mb-2@subtitle': '' },
        { 'p.card-text@text': '' }] 
      }] 
    }
  ]);

  vu.method('findText', content => {
    let text = null;
    try {
      content = JSON.parse(content);
      content.map(el => {
        if (el.text && !text) {
          text = el.text;
        }
      });
    } catch (err) {
      console.error(err, content);
    }
    return text || '';
  });

  vu.method('findCover', content => {
    let src = null;
    try {
      content = JSON.parse(content);
      for (let i = 0; i < content.length; i++) {
        let el = content[i];
        if (el.mediaArr && el.mediaArr.length) {
          for (let j = 0; j < el.mediaArr.length; j++) {
            if (el.mediaArr[j].imgsrc) {
              src = el.mediaArr[j].imgsrc;
              break;
            }
          } // end of for
        }
        if (src) {
          break;
        }
      } // end of for
    } catch (err) {
      console.error(err);
      src = null;
    } 
    return src || '';
  }); // end of PostPreviewCard.findCover

  vu.init(data => {
    cope.send('/post/get', {
      postId: vu.get('postId')
    }).then(res => {
      try {
        let v = res.data;
        if (v.value) {
          v = v.value;
        }
        vu.$('@title').text(v.title || '');
        vu.$('@subtitle').text(v.subtitle || '');
        vu.$('@text').text(vu.findText(v.content) || '');
        let coverImgsrc = vu.findCover(v.content);
        if (coverImgsrc) {
          vu.$('@cover')
            .prop('src', coverImgsrc)
            .removeClass('d-none');
        }

        vu.$().on('click', evt => {
          location.href = '/' + appId + '/post/' + vu.get('postId');
        });
      } catch (err) {
        console.error(err, res);
      }
    });
  });
}); // end of PostPreviewCard

V.createClass('EditablePostCard', vu => {
  vu.dom(data => [
    { 'div.card': [
      { 'div.card-body': [
        { 'button.btn.btn-primary.float-right@editBtn': 'Edit' },
        { 'h2.card-title@title': '' },
        { 'h4.card-subtitle.text-muted.mb-2@subtitle': '' }]
      }, 
      { 'div.card-body@content': '' }]
    }
  ]);
  vu.method('renderContent', content => {
    let dom = [];
    let html = '';
    try {
      content = JSON.parse(content);
      dom = content.map(el => {
        let elDOM = '';
        let mediaDOM = '';
        let headerDOM = el.header ? { 'h5': el.header } : '';
        let textDOM = el.text ? { 'p': el.text } : '';
        if (el.mediaArr && el.mediaArr.length > 0) {
          try {
            mediaDOM = { 
              'div': el.mediaArr.map(m => {
                  if (m.imgsrc) {
                    return [ 'img(src="' + m.imgsrc+ '" height="300px")' ];
                  } else if (m.vidsrc) {
                    return 'Video'
                  } else if (m.audsrc) {
                    return 'Audio'
                  }
                }) // end of mediaArr.map...
            
            };
          } catch (err) {
            console.error(err);
            mediaDOM = '';
          }
        }
        elDOM = {
          'div.mb-5': [
            mediaDOM,
            headerDOM,
            textDOM
          ]
        };
        if (el.link && el.link.length > 0) {
          elDOM = [
            'a.mb-5(href="' + el.link + '" target="_blank")', elDOM 
              ? [elDOM]
              : (el.link || 'Link')
          ];
        }
        return elDOM;
      });
      html = V.dom(dom, vu.id);
    } catch (err) {
      console.error(err, content);
      html = '';
    }
    return html;
  }); // end of EditablePostCard.renderContent
  vu.init(data => {
    vu.$('@editBtn').on('click', evt => {
      vu.$().fadeOut(() => {
        vu.$().remove();
        V.build('PostEditor', {
          sel: '#page-content',
          data: {
            postId: vu.get('postId')
          }
        });
      });
    });
    cope.send('/post/get', {
      postId: vu.get('postId')
    }).then(res => {
      try {
        let v = res.data;
        if (v.value) {
          v = v.value;
        }
        vu.$('@title').text(v.title || '');
        vu.$('@subtitle').text(v.subtitle || '');
        vu.$('@content').html(vu.renderContent(v.content));
      } catch (err) {
        console.error(err, res);
      }
    });
  });
}); // end of EditablePostCard

V.createClass('PostEditor', vu => {
  vu.dom(data => [
    { 'div.form-group': [
      { 'input.form-control(type="text" placeholder="Title")@title': '' }]
    }
  ]);
});

let renderPage = function() {
  switch (path) {
    case 'upgrade':
      $('#li-' + path).addClass('active');
      break;

    case 'settings':
      $('#li-' + path).addClass('active');
      break;

    case 'store':
      $('#li-' + path).addClass('active');
      break;

    case 'members':
      $('#li-' + path).addClass('active');
      break;

    case 'pages':
      $('#li-' + path).addClass('active');
      break;

    case 'post': 
      $('#li-posts').addClass('active');
      try {
        V.build('EditablePostCard', {
          sel: '#page-content',
          data: { postId: params.postId }
        }); 
      } catch (err) {
        console.error(err, params);
      }
      break;

    case 'posts':
    default: 
      $('#li-posts').addClass('active');
      $('#page-content').html(V.dom([{ '#cards.card-columns': '' }]));
      cope.send('/post/all', { appId: appId }).then(res => {
        try {
          res.data.map(postId => {
            V.build('PostPreviewCard', {
              sel: '#cards',
              method: 'append',
              data: { postId: postId }
            });
          });
        } catch (err) {
          console.error(err);
        }
      });
  } // end of switch
}; // end of renderPage

cope.send('/app/get', { appId: appId }).then(res => {
  let v = res && res.data;
  if (v && v.value) { v = v.value; }
  $('#app-name').html(v.appName || '');
  renderPage();
});

};
