cope.render('/app/cards', obj => {
  let appId = obj.appId;
  let sectionCards = cope.class(vu => {
    vu.dom(data => [
      { '.row@card-editor-wrap[none]': [
        { '.col-12[width:100%]': [
          { 'button.btn.btn-primary[float:right]@doneBtn': 'Done' }]
        },
        { '.col-12@card-editor[width:100%]': '' },
        { '.col-12[width:100%; text-align:center]': [
          { 'button.btn.btn-danger@delBtn': 'Delete Card' }]
        }]
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

    vu.method('addCard', cardValue => {
      //let card = cope.ui.build('Cope.Card.Editable', {
      let card = cope.ui.build('Cope.Card', {
        sel: vu.sel('@cards'),
        method: 'prepend'
      });
        
      card.load(cardValue);

      card.$().css('cursor', 'pointer')
        .on('click', evt => {
          try {
            location.href = '/a/' + appId + '/card/' + cardValue.id
          } catch (err) {
            console.error(err);
          }
        });

      //card.edit(() => {
      //  vu.openEditor(card.fetch());
        //vu.editor().load(cardData.value);
      //});

      vu.ds().watch(card.cardId(), v => {
        card.load(v);
      });

      return card;
    }); // end of sectionCards.addCard

    vu.method('load', () => {
      cope.send('/card/all', { 
        'mine': true,
        'appId': appId //TBD: check this out
      }).then(res => {
        console.log(res);
        try {
          Object.keys(res.data).map(cardNodeId => {
            let cardData = res.data[cardNodeId];
            vu.addCard(cardData.value);
          });
        } catch (err) {
          console.error(err);
        }
      });   
    }); // end of cardsSection.load

    // Build card editor
    vu.method('initEditor', function() {
      let editor = cope.ui.build('Cope.Card.Editor', {
        sel: vu.sel('@card-editor')
      });

      vu.$('@delBtn').hide();

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
          vu.$('@delBtn').show();
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
        let queue = cope.queue();

        // TBD: Save on Cope and Firebase
        let cardValue = vu.editor().fetch();
        let cardId = vu.editor().get('cardId');
        if (cardId) {
          vu.ds().set(cardId, cardValue);
        } else {
          console.log(cardId, cardValue);
          queue.add(next => {
            // TBD: Get a new cardID
            cope.send('/card/add', {
              appId: appId 
            }).then(res => {
              console.log(res);
              if (res.v && res.v.id) {
                vu.addCard(res.v);
                cardId = res.v.id;
                next();
              }
            }).catch(err => {
              console.error(err);
            });
          });
        }
        queue.add(next => {
          console.log(cardId, cardValue);
          try {
            let files = [];
            cardValue.mediaArr.map(x => {
              if (x && x.file && x.image && x.image.blob) { 
                files = files.concat([x.file, x.image.blob]);
              } else {
                files = files.concat([null, null]);
              }
            });

            cope.uploadFiles(files, { appId: appId }).then(urls => {
              console.log('urls', urls);
              cardValue.mediaArr = cardValue.mediaArr.map((x, i) => {
                if (x.file && ((2 * i + 1) < urls.length)) {
                  return {
                    image: {
                      originalURL: urls[2 * i],
                      resizedURL: urls[2 * i + 1]
                    }
                  }
                }
                return x;
              }); 

              console.log('before updating', cardValue);

              cope.send('/card/update', {
                appId: appId,
                cardId: cardId,
                updates: cardValue
              }).then(res => {
                console.log('updates', res);
                vu.ds().set(cardId, cardValue); 
                vu.closeEditor();
              });
            })
          } catch (err) {
            console.error(err);
          }
        }); // end of queue.add(...)
      }); // end of #click(...)
    }); // end of sectionCards.init(...)
  }).build({
    sel: '#page-content'
  }); // end of sectionCards.build( ... )

  $('#li-cards').addClass('active');
  sectionCards.load();
});
