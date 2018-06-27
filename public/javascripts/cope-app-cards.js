cope.render('/app/cards', obj => {
  let appId = obj.appId;
  let sectionCards = cope.class(vu => {
    vu.dom(data => [
      { '.row@card-editor-wrap[none]': [
        { '.col-12[width:100%]': [
          { 'button.btn.btn-primary[float:right]@doneBtn': 'Done' }]
        },
        { '.col-12@card-editor[width:100%]': '' }] 
      },
      { '@cards-wrap': [
        { 'button.btn.btn-primary@createBtn': 'Create' },
        { '@cards.card-columns': '' }]
      }
    ]);

    vu.method('ds', function() {
      let ds = cope.dataStore();
      return function() {
        return ds;
      }
    }());

    vu.method('load', () => {
      cope.send('/card/all', { 
        'mine': true,
        'appId': appId //TBD: check this out
      }).then(res => {
        console.log(res);
        try {
          Object.keys(res.data).map(cardNodeId => {
            let cardData = res.data[cardNodeId];
            let card = cope.ui.build('Cope.Card.Editable', {
              sel: vu.sel('@cards'),
              method: 'append'
            });
              
            card.load(cardData.value);

            card.edit(() => {
              vu.openEditor(card.fetch());
              //vu.editor().load(cardData.value);
            });

            vu.ds().watch(card.cardId(), v => {
              card.load(v);
            });
          })
        } catch (err) {
          console.error(err);
        }
      });   
    });

    // Build card editor
    vu.method('initEditor', function() {
      let editor = cope.ui.build('Cope.Card.Editor', {
        sel: vu.sel('@card-editor')
      });
      vu.editor = function() {
        return editor;
      };
    });

    vu.method('openEditor', v => {
      vu.initEditor();
      if (v) {
        vu.editor().load(v);
        if (v.id) {
          vu.editor().set('cardId', v.id);
        }
      }
      vu.$('@cards-wrap').hide(); 
      vu.$('@card-editor-wrap').show(); 
    });
    
    vu.method('closeEditor', () => {
      vu.$('@cards-wrap').show(); 
      vu.$('@card-editor-wrap').hide(); 
    });

    vu.init(data => {
      vu.$('@createBtn').click(evt => {
        vu.openEditor();
      });

      vu.$('@doneBtn').click(evt => {
        // TBD: Save on Cope and Firebase
        let cardValue = vu.editor().fetch();
        let cardId = vu.editor().get('cardId');
        if (cardId) {
          vu.ds().set(cardId, cardValue);
        } else {
          console.log(cardId, cardValue);
        }
        console.log(cardId, cardValue);
        //cope.send('/card/update', {
        //  id: cardId,
        //  updates: cardValue
        //});
        try {
          let files = [];
          cardValue.mediaArr.map(x => {
            if (x && x.file && x.image && x.image.blob) { 
              files = files.concat([x.file, x.image.blob]);
            } else {
              files = files.concat([null, null]);
            }
          });

          cope.uploadFiles(files).then(urls => {
            cardValue.mediaArr = cardValue.mediaArr.map((x, i) => {
              if (x.file && urls[i]) {
                return {
                  image: {
                    originalURL: urls[2 * i],
                    resizedURL: urls[2 * i + 1]
                  }
                }
              }
              return x;
            }); 

            cope.send('/card/update', {
              cardId: cardId,
              updates: cardValue
            }).then(res => {
              console.log('updates', res);
              vu.closeEditor();
            });
          })
        } catch (err) {
          console.error(err);
        }
        //vu.closeEditor();
      });
    });
  }).build({
    sel: '#page-content'
  }); // end of sectionCards.build( ... )

  $('#li-cards').addClass('active');
  sectionCards.load();
});
