window.copeApp = function(appId, path, params) {

try {
  params = params.replace(/\&quot\;/g, '"');
  params = JSON.parse(params);
} catch (err) {
  //console.error(err);
  params = {};
}

let V = cope.views();

let debug = function(thing) { 
  V.createClass('Debug', vu => {
    let hidden = true;
    let ds = cope.dataStore();

    vu.dom(data => [
      { 'div[fixed; overflow:auto; p:60px 6px 6px; right:20px; top:20px; width:70%; max-width:300px; height:200px; bgColor:#233; color:#fff; z-index:100000]': [
        { 'div[fixed; top:26px]': [ 
          { 'button.btn@moreBtn': 'More' },
          { 'button.btn@hideBtn': 'Hide' }]
        },
        { '@latest': '' },
        { '@logs': '' }]
      }
    ]);

    vu.method('print', thing => {
      if (typeof thing == 'object') {
        try {
          thing = JSON.stringify(thing, null, 4).replace(/\n/g, '<br>').replace(/\s/g, '&nbsp;');
        } catch (err) {
          thing = '...';
        }
      }
      if (typeof thing == 'string') {
        vu.$('@logs').append('<br><br>' + thing);
        vu.$('@latest').html(thing);
      } 
    });

    vu.init(data => {
      ds.watch('moreToggle', x => {
        let more = !ds.get('more');
        ds.set('more', more);
        if (more) {
          vu.$()
            .css('max-width', '70%')
            .css('height', '80vh');
          vu.$('@logs').show();
          vu.$('@latest').hide();
          vu.$('@moreBtn').html('Less');
        } else {
          vu.$()
            .css('max-width', '300px')
            .css('height', '200px');
          vu.$('@logs').hide();
          vu.$('@latest').show();
          vu.$('@moreBtn').html('More');
        }
      });
      vu.$('@logs').hide();
      vu.$('@hideBtn').click(evt => {
        vu.$().hide();
        setTimeout(function() {
          vu.$().fadeIn();
        }, 2000);
      });
      vu.$('@moreBtn').click(evt => {
        ds.set('moreToggle');
      });
    }); // end of init
  });

  return V.build('Debug', {
    sel: 'body',
    method: 'prepend'
  }).print;
}();


V.createClass('CardsSection', vu => {
  vu.dom(data => [
    { 'button.btn.btn-primary@createBtn': 'Create' },
    { '@cards.card-columns': '' } 
  ]);

  vu.method('load', () => {
    vu.$('@cards').html('');

    cope.send('/card/all', { mine: true }).then(res => {
      //console.log(res);
      let arr = [];
      for (let nodeId in res.data) {
        let cardData = null;
        try {
          cardData = res.data[nodeId];
        } catch (err) {
          console.error(err);
        }
        if (cardData) {
          arr = arr.concat(cardData);
        }
      }
      arr.map(cardData => {
        V.build('Card', {
          'sel': vu.sel('@cards'),
          'method': 'append',
          'data': cardData.value
        }).editable()
          .onEdit(() => {
          V.build('CardEditorSection', {
            sel: '#page-content',
            data: {
              cardId: cardData.value.id,
              cardData: cardData
            }
          });
        });
      });
    });
  }); // end of CardsSection

  vu.init(data => {
    vu.$('@createBtn').on('click', evt => {
      // Request for a new card
      cope.send('/card/add', {
        appId: appId 
      }).then(res => {
        V.build('CardEditorSection', {
          sel: '#page-content',
          data: {
            cardId: res.v.id
          }
        });
      });
    });

    vu.load();
  });
}); // end of CardsSection

V.createClass('Card', vu => {
  vu.dom(data => [
    { '.card[mt:4px]': [
      { '.card-img-top[bgColor:#a37fb2;min-height:100px;overflow:hidden]@media': '' },
      { '.card-body': [
        { 'h4@header': '' },
        { 'p@text': '' },
        { 'table.table@kv-table[bgColor:#fafafa]': '' }]
      }]
    }
  ]); // end of Card.dom

  vu.method('render', data => {
    if (data.keyValues && data.keyValues.length > 0) {
      data.keyValues.map(x => {
        vu.$('@kv-table').append(V.dom([
          { 'tr': [
            { 'td': x.key || '' },
            { 'td': x.value || '' }] 
          }
        ], vu.id));
      });
    }
  }); // end of Card.render

  vu.method('onEdit', fn => {
    vu.set('onEdit', fn);
    return vu;
  }); // end of Card.onEdit

  vu.method('editable', () => {
    vu.$('.card').prepend(V.dom([
      { 'button.btn.btn-primary@editBtn[absolute;max-width:104px;top:8px;right:8px]': 'Edit' }
    ], vu.id));

    vu.$('@editBtn').on('click', evt => {
      try {
        vu.get('onEdit')();
      } catch (err) {
        console.error(err);
      }
    });
    return vu;
  }); // end of Card.editable

  vu.init(data => {
    vu.render(data);
    let imgsrc;
    try {
      imgsrc = data.mediaArr[0].image.resizedURL;
    } catch (err) {
    }
    
    if (imgsrc) {
      vu.$('@media').html(V.dom([['img(src="'+imgsrc+'" width="100%")']], vu.id));
    }
    vu.$('@header').html(data && data.header || '');
    vu.$('@text').html(data && data.text ? data.text.replace(/\n/g, '<br>') : '');
  }); // end of Card.init
}); // end of Card

V.createClass('CardEditorSection', vu => {
  let cardEditor = null;

  vu.dom(data => [
    { '.row[mb:36px]': [
      { '.col-12': [
        { '.float-right': [
          { 'button.btn.btn-success': 'Publish' },
          { 'button.btn.btn-primary@saveBtn': 'Save' }]
        }]
      }, 
      { '.col-12': [
        { '.float-right': [
          { 'button.btn.btn-danger': 'Remove' },
          { 'button.btn.btn-secondary': 'Templatize' },
          { 'button.btn.btn-secondary': 'Add To Store' }]
        }]
      }] 
    }
  ]); // end of CardEditorSection.dom

  vu.init(data => {
    cardEditor = V.build('CardEditor', {
      sel: vu.sel(),
      method: 'after',
      data: data && data.cardData || null
    }); 

    vu.$('@saveBtn').on('click', evt => {
      try {
        cardEditor.fetch().then(cardValue => {
          //console.log('cardValue', cardValue);
          debug('saved `cardValue`');
          debug(cardValue);
          cope.send('/card/update', {
            cardId: vu.get('cardId'),
            updates: cardValue
          }).then(res => {
            console.log(res);
          });
        });
      } catch (err) {
        console.error(err);
      }
    });
  }); // end of CardEditorSection.init
}); // end of CardEditorSection

V.createClass('CardEditor', vu => {
  let ds = cope.dataStore();
  let loader = cope.fileLoader(inputs => {
    inputs.map(x => {
      if (x.image) {
        let images = ds.get('images') || [];
        ds.set('images', images.concat(x));
        ds.set('newImage', x);
      }
    });
  });

  vu.dom(data => [
    { '.row[relative; m:0 auto; max-width:640px]': [
      { '.col-sm-2.col-xs-12': [
        { '.row': [
          { 'div.col-xs.col-sm-12[w:50px;cursor:pointer]@mediaArrToggler': [
            { 'i.material-icons[fz:36px]': 'photo' }]
          }, 
          { 'div.col-xs.col-sm-12[w:50px;cursor:pointer]@headerToggler': [
            { 'i.material-icons[fz:36px]': 'title' }]
          }, 
          { 'div.col-xs.col-sm-12[w:50px;cursor:pointer]@textToggler': [
            { 'i.material-icons[fz:36px]': 'short_text' }]
          }, 
          { 'div.col-xs.col-sm-12[w:50px;cursor:pointer]@keyValuesToggler': [
            { 'i.material-icons[fz:36px]': 'list' }]
          }, 
          { 'div.col-xs.col-sm-12[w:50px;cursor:pointer]@linkToggler': [
            { 'i.material-icons[fz:36px]': 'link' }]
          }]
        }]
      }, 
      { '.col-sm-10.col-xs-12': [
        { '.card[mt:4px]': [
          { 'div.card-img-top[bgColor:#a37fb2;min-height:100px;overflow:hidden]@media': '' },
          { '.card-body': [
            { 'div@text-body': [
              { 'textarea.h3(placeholder="Header")[w:100%;b:none;outline:none]@header': '' },
              { 'textarea.h5(placeholder="Text")[w:100%;b:none;outline:none]@text': '' }] 
            },
            { '.row@kv-table': '' },
            { '.row@link-wrap': [
              { '.col-12': [
                { 'hr[w:50px;h:12px;b:none;color:#e5c9c2;bgColor:#e5c9c2;mt:60px]': '' }]
              },
              { '.col-12': [
                { '.input-group': [
                  { '.input-group-prepend': [
                    { 'span.input-group-text': 'Link' }] 
                  },
                  { 'input.form-control(placeholder="Enter the URL")@link': '' },
                  { '.input-group-append': [
                    { 'div[bgColor:#ddd; h:100%; w:50px]': '' }] 
                  }]
                }]
              }] 
            }]
          }]
        }] 
      }] 
    }
  ]); // end of CardEditor.dom

  vu.method('appendKV', kvValue => {
    V.build('KVInput', {
      sel: vu.sel('@kv-table'),
      method: 'append',
      data: kvValue
    });
  }); // end of CardEditor.appendKV

  vu.method('fetch', () => {
    return new Promise((resolve, reject) => {
      let v = {};
      v.isActive = ds.get('isActive');
      v.tags = {};
      v.mediaArr = [];
      v.header = vu.$('@header').val().trim();
      v.text = vu.$('@text').val().trim();
      v.link = vu.$('@link').val().trim();
      v.keyValues = [];

      // Fetch images
      let queue = cope.queue();
      let images = ds.get('images') || [];
      images.map((x, i) => {
        v.mediaArr[i] = {
          'image': {}
        };

        if (x.image) {
          if (x.file) {
            // Get user's firebase uid
            let uid;
            try {
              uid = firebase.auth().currentUser.uid;
              debug('currentUser');
              debug(firebase.auth().currentUser);
            } catch (err) {
              debug('Firebase Error');
              debug(err);
              console.log(err);
              return;
            }

            queue.add(next => {
              // Upload the original file and get the download link
              firebase.storage().ref('files/' + uid + '/private').child(x.filename).put(x.file)
                .then(snap => {
                  snap.ref.getDownloadURL().then(url => {
                    v.mediaArr[i].image.originalURL = url;
                    next();
                  });
                })
                .catch(err => {
                  debug('Firebase Error');
                  debug(err);
                  console.error(err);
                })
            });

            queue.add(next => {
              // Upload the resized file and get the download link
              firebase.storage().ref('files/' + uid + '/private').child(x.image.name).put(x.image.blob)
                .then(snap => {
                  snap.ref.getDownloadURL().then(url => {
                    v.mediaArr[i].image.resizedURL = url;
                    next();
                  });
                })
                .catch(err => {
                  debug('Firebase Error');
                  debug(err);
                  console.error(err);
                })
            });
          }
        }
      }); // end of images.map
      queue.add(next => {
        // Fetch the table
        vu.$('@kv-table').children().each(function() {
          let $kv = $(this);
          let valid = false;
          let inputValues = [];
          let key, value;
          try {
            $kv.find('input').each(function() {
              inputValues = inputValues.concat($(this).val().trim());
            });
            key = inputValues[0] || null;
            value = inputValues[1] || null;
            if (typeof key == 'string' && key.length > 0) {
              v.tags[key] = true;
              valid = true;
            }
            if (typeof value == 'string' && value.length > 0) {
              v.tags[value] = true;
              valid = true;
            } 
          } catch (err) {
            valid = false;
          }
          if (valid) {
            v.keyValues = v.keyValues.concat({
              'key': key,
              'value': value
            });
          } 
        }); // end of v.keyValues.map}
        console.log('Done!');
        console.log(v);
        resolve(v);
      });
    }); // end of Promise
  }); // end of CardEditor.fetch

  vu.init(data => {
    ds.watch('isActive', v => {
      vu.$('@media').hide();
      vu.$('@header').hide();
      vu.$('@text').hide();
      vu.$('@kv-table').hide();
      vu.$('@link-wrap').hide();
      if (v.mediaArr) {
        vu.$('@media').show();
      }
      if (v.header) {
        vu.$('@header').show();
      }
      if (v.text) {
        vu.$('@text').show();
      }
      if (v.keyValues) {
        vu.$('@kv-table').show();
      }
      if (v.link) {
        vu.$('@link-wrap').show();
      }
    });
    ds.watch('newImage', v => {
      if (v.image && v.image.img) {
        // Render new image
        v.image.img.style.width = '100%';
        vu.$('@media').append(v.image.img);
      } 
    });
    ds.watch('newKeyValue', v => {
      vu.appendKV(v);
    });

    ['header', 'text', 'mediaArr', 'keyValues', 'link'].map(x => {
      vu.$('@' + x + 'Toggler').on('click', evt => {
        try {
          console.log(ds.get());
          let isActive = ds.get('isActive');
          isActive[x] = !isActive[x];
          ds.set('isActive', isActive);
        } catch (err) {
          console.error(err);
        }
      });
    });

    vu.$('@media').on('click', evt => {
      loader.upload({ maxWidth: 500, multi: true });
    });

    vu.$('@keyValuesToggler').on('click', evt => {
      let kvTable = vu.$('@kv-table');
      if (kvTable.children().length < 1) {
        vu.appendKV();
      }
    });

    // Initial values
    let initV = data && data.value || {};
    ds.set('isActive', initV.isActive 
      || {
      'mediaArr': false,
      'header': true,
      'text': true,
      'keyValues': false,
      'link': false
    });
    if (initV.mediaArr) {
      try {
        initV.mediaArr.map(x => {
          if (x.image && x.image.resizedURL) {
            loader.download(x.image.resizedURL);
          }
        });
      } catch (err) {
        console.error(err);
      }
    }
    vu.$('@header').val(initV.header || ''); 
    vu.$('@text').val(initV.text || ''); 
    vu.$('@link').val(initV.link || ''); 
    if (Array.isArray(initV.keyValues)) {
      initV.keyValues.map(keyValue => {
        ds.set('newKeyValue', keyValue);
      })
    }

    return;

    /*
    vu.set('isActive', (data 
      && data.value 
      && data.value.isActive) 
      || {
      'mediaArr': false,
      'header': true,
      'text': true,
      'keyValues': false,
      'link': false
    });
    ['header', 'text', 'mediaArr', 'keyValues', 'link'].map(x => {
      vu.$('@' + x + 'Toggler').on('click', evt => {
        try {
          let isActive = vu.get('isActive');
          isActive[x] = !isActive[x];
          vu.set('isActive', isActive);
          vu.render(vu.fetch());
        } catch (err) {
          console.error(err);
        }
      });
    });

    vu.$('@media').on('click', evt => {
      // TBD: upload files
    });

    vu.$('@keyValuesToggler').on('click', evt => {
      let kvTable = vu.$('@kv-table');
      if (kvTable.children().length < 1) {
        vu.appendKV();
      }
    });

    // Render the card
    let initV = data && data.value || {};
    try {
      if (!initV.isActive) {
        initV.isActive = vu.get('isActive');
      }
      vu.render(initV);
    } catch (err) {
      console.error(err);
    }
    */

  }); // end of CardEditor.init
}); // end of CardEditor

V.createClass('KVInput', vu => {
  vu.dom(data => [
    { '.col-12': [
      { '.input-group': [
        //{ '.input-group-prepend.kv-controls.d-none': [
        //  { 'div[h:100%]': [
        //    { 'i.material-icons[fz:36px; mr:4px; cursor:pointer]@delBtn': 'remove_circle_outline' }] 
        //  }]
        //},
        { 'input.form-control(placeholder="Field Name")@key': '' },
        { 'input.form-control(placeholder="Enter Anything")@value': '' },
        { '.input-group-append.d-none@kv-controls': [
          { 'div@actionBtns[h:100%]': [
            { 'i.material-icons.d-none[fz:36px; cursor:pointer]@delBtn': 'remove_circle_outline' }, 
            { 'i.material-icons.d-none[fz:36px; cursor:pointer]@upBtn': 'keyboard_arrow_up' }, 
            { 'i.material-icons.d-none[fz:36px; cursor:pointer]@downBtn': 'keyboard_arrow_down' },
            { 'i.material-icons.d-none[fz:36px; cursor:pointer]@addBtn': 'add' }, 
            { 'i.material-icons.d-none[fz:36px; cursor:pointer]@closeBtn': 'more_horiz' }, 
            { 'i.material-icons[fz:36px; cursor:pointer]@moreBtn': 'more_horiz' }]
          }] 
        }]
      }]
    }
  ]); // end of KVInput.dom

  vu.method('fetch', () => {
    ['key', 'value'].map(x => {
      let v = vu.$('@' + x).val().trim();
      vu.set(x, v);
    });
    return {
      key: vu.get('key'),
      value: vu.get('value')
    };
  }); // end of KVInput.fetch

  vu.init(data => {
    if (data && data.key) {
      vu.$('@key').val(data.key);
    }
    if (data && data.value) {
      vu.$('@value').val(data.value);
    }
    
    vu.$()
      .on('mouseenter', evt => {
        vu.$('@kv-controls').removeClass('d-none');
      })
      .on('mouseleave', evt => {
        vu.$('@kv-controls').addClass('d-none');
        vu.$('@closeBtn').click();
      });

    ['key', 'value'].map(x => {
      vu.set(x, (data && data[x]) || '');
      vu.$('@' + x).on('keyup', evt => {
        let v = vu.$('@' + x).val().trim();
        vu.set(x, v);
        console.log(vu.$().data());
      });
    });

    vu.$('@addBtn').on('click', evt => {
      V.build('KVInput', {
        sel: vu.sel(),
        method: 'after'
      });
    });

    vu.$('@upBtn').on('click', evt => {
      vu.$().prev().before(vu.$());
    });

    vu.$('@downBtn').on('click', evt => {
      vu.$().next().after(vu.$());
    });

    vu.$('@delBtn').on('click', evt => {
      vu.$().remove();
    });

    vu.$('@moreBtn').on('click', evt => {
      vu.$('@actionBtns').children().toggleClass('d-none');
    });

    vu.$('@closeBtn').on('click', evt => {
      vu.$('@actionBtns').children().addClass('d-none');
      vu.$('@moreBtn').removeClass('d-none');
    });
  }); // end of KVInput.init
}); // end of KVInput

V.createClass('PostsSection', vu => {
  vu.dom(data => [
    { '.row': [
      { '.col-12': [
        { 'button.btn.btn-primary@createBtn': 'Create' }] 
      }, 
      { '.col-12': [
        { '@posts': '' }] 
      }] 
    }
  ]);
}); // end of PostsSection

V.createClass('PostPreviewCard', vu => {
  vu.dom(data => [
    { 'div.card': [
      { 'img.d-none.card-img-top@cover[h:180px]': '' },
      { 'div.card-body': [
        { 'h4.card-title@title': '' },
        { 'h6.card-subtitle.text-muted.mb-2@subtitle': '' },
        { 'p.card-text.text-truncate.d-block@text': '' }] 
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
    { '.row': [
      { '.col-12': [
        { '.float-right': [
          { 'button.btn.btn-danger@removeBtn': 'Remove' },
          { 'button.btn.btn-secondary@templatizeBtn': 'Templatize' },
          { 'button.btn.btn-secondary@addToStoreBtn': 'Add To Store' },
          { 'button.btn.btn-success@publishBtn': 'Publish' },
          { 'button.btn.btn-primary@doneBtn': 'Done' }]
        }] 
      },
      { '.col-12': [
        { 'form': [
          { 'div.form-group': [
            { 'input.form-control.h2(type="text" placeholder="Title")[h:1.5em]@title': '' },
            { 'input.form-control.h4(type="text" placeholder="Subtitle")@subtitle': '' }]
          }]
        }]
      },
      { '.col-12@content': '' },
      { '.col-12': [
        { 'button.btn.btn-primary@addElmBtn': 'Add' }]
      }]
    }
  ]); // end of PostEditor.dom

  vu.method('render', () => {
     
  }); // end of PostEditor.render

  vu.method('appendElm', () => {
  }); // end of PostEditor.appendElm

  vu.method('save', () => {
  }); // end of PostEditor.save

  vu.method('done', () => {
  }); // end of PostEditor.done

  vu.init(data => {
    vu.$('@addElmBtn').on('click', evt => {
      vu.appendElm();
    });
  }); // end of PostEditor.init
}); // end of PostEditor

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

    case 'cards':
      $('#li-' + path).addClass('active');
      V.build('CardsSection', {
        sel: '#page-content'
      });
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
