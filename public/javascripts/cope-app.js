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

V.createClass('CardsSection', vu => {
  vu.dom(data => [
    { 'button.btn.btn-primary@createBtn': 'Create' },
    { '@cards.card-columns': '' } 
  ]);

  vu.method('load', () => {
    vu.$('@cards').html('');

    cope.send('/card/all', { mine: true }).then(res => {
      console.log(res);
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
      { 'div.card-img-top[bgColor:#987;h:100px]@media': '' },
      { '.card-body': [
        { 'h4@header': data.header || '' },
        { 'p@text': data.text.replace(/\n/g, '<br>') || '' },
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
  });

  vu.method('editable', () => {
    vu.$().prepend(V.dom([
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
      console.log(vu.get('cardId'), cardEditor.fetch());
      return;
      try {
        cope.send('/card/update', {
          cardId: vu.get('cardId'),
          updates: cardEditor.fetch()
        }).then(res => {
          console.log(res);
        });
      } catch (err) {
        console.error(err);
      }
    });
  }); // end of CardEditorSection.init
}); // end of CardEditorSection

V.createClass('CardEditor', vu => {
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
          { 'div.card-img-top[bgColor:#987;h:100px]@media': '' },
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
    let v = {};
    v.isActive = vu.get('isActive');
    v.tags = {};
    v.mediaArr = vu.get('mediaArr') || []; // TBD
    v.header = vu.$('@header').val().trim();
    v.text = vu.$('@text').val().trim();
    v.link = vu.$('@link').val().trim();
    v.keyValues = [];
    vu.$('@kv-table').children().each(function() {
      let $kv = $(this);
      //let key = $kv.data('key');
      //let value = $kv.data('value');
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
    return v;
  }); // end of CardEditor.fetch

  vu.method('render', v => {

    console.log('render', v);
    vu.$('@media').hide();
    vu.$('@header').hide();
    vu.$('@text').hide();
    vu.$('@kv-table').hide();
    vu.$('@link-wrap').hide();
    if (v.isActive.mediaArr) {
      vu.$('@media').show();
    }
    if (v.isActive.header) {
      vu.$('@header').show();
    }
    if (v.isActive.text) {
      vu.$('@text').show();
    }
    if (v.isActive.keyValues) {
      vu.$('@kv-table').show();
    }
    if (v.isActive.link) {
      vu.$('@link-wrap').show();
    }

    if (typeof v != 'object') {
      v = {};
    }
    if (!Array.isArray(v.keyValues)) {
      try {
        v.keyValues = JSON.parse(v.keyValues || '[]');
      } catch (err) {
        console.error(err, v);
        v.keyValues = [];
      }
    }
    // TBD: mediaArr
    vu.$('@header').val(v.header || '');
    vu.$('@text').val(v.text || '');
    vu.$('@link').val(v.link || '');
    vu.$('@kv-table').html('');
    v.keyValues.map(kvValue => {
      vu.appendKV(kvValue);
    });
  }); // end of CardEditor.render

  vu.init(data => {
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
