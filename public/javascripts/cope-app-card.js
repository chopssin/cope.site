cope.render('/app/card', obj => {
  let appId = obj.appId;
  let cardId = obj.cardId;

  let editCard = function(card) {
    let editor = cope.ui.build('Cope.Card.Editor', {
      sel: '#page-content'
    });

    editor.load(card.fetch());

    editor.$().prepend(cope.dom([{ 'div[w:100%]': [
      { 'button#doneBtn.btn.btn-primary[float:right]': 'Done' }] 
    }]));

    $('#doneBtn').on('click', evt => {
      let wait = cope.wait(); // outer wait
      let updates = editor.fetch();

      try {
        updates.mediaArr.map((x, idx) => {
          if (x.file && x.image && x.image.blob) {
            wait.add(outerDone => {
              let queue = cope.queue();
              let y = {};
              y.image = {};
              queue.add(next => {
                cope.uploadFiles(x.file, { appId: appId }).then(urls => {
                  try {
                    //updates.mediaArr[idx].image.originalURL = urls[0];
                    y.image.originalURL = urls[0];
                    next();
                  } catch (err) {
                    console.error(err);
                  }
                });
              });
              queue.add(next => {
                cope.uploadFiles(x.image.blob, { appId: appId }).then(urls => {
                  try {
                    //updates.mediaArr[idx].image.resizedURL = urls[0];
                    y.image.resizedURL = urls[0];
                    next();
                  } catch (err) {
                    console.error(err);
                  }
                });
              });
              queue.add(next => {
                updates.mediaArr[idx] = y;
                outerDone();
              });
            }); // end of outer wait.add(...)
          } // end of if
        }); // end of #map(...)
      } catch (err) {
        console.error(err);
      }

      wait.run(() => { // outer wait.run(...)
        // TBD: issue: this function is overwriten by cope.uploadFiles's innate
        // wait!!!!!!!!
        cope.send('/card/update', {
          appId: appId,
          cardId: cardId,
          updates: updates
        }).then(res => {
          loadCard();
        })
      }); // end of wait.run(...)
    });
  }; // end of editCard

  let loadCard = function() {
    cope.send('/card/get', {
      appId: appId,
      id: cardId
    }).then(res => {
      let pageEditor = cope.ui.build('Cope.Page.Editor', {
        sel: '#page-content'
      });

      pageEditor.done(() => {
        let queue = cope.queue();
        queue.add(next => {
          if (!pageEditor.get('pageId')) {
            cope.send('/page/add', {
              appId: appId,
              type: 'card',
              contentId: cardId
            }).then(res => {
              if (res && res.v && res.v.id) {
                pageEditor.set('pageId', res.v.id);
              }
              next();
            })
          } else {
            next();
          }
        });
        queue.add(next => {
          if (pageEditor.get('pageId')) {
            let updates = {};
            let fetched = pageEditor.fetch();
            updates.channel = fetched.channel;
            updates.name = fetched.name;
            console.log(updates);

            cope.send('/page/update', {
              query: {
                appId: appId,
                id: pageEditor.get('pageId')
              },
              updates: updates
            }).then(res => {
              console.log(res); 
            });
          } 
        });
      });

      cope.send('/page/get', {
        appId: appId,
        contentId: cardId
      }).then(res => {
        if (res && res.v && res.v.id) {
          pageEditor.set('pageId', res.v.id);

          let path = '';
          if (res.v.channel) {
            if (res.v.name) {
              path = '/' + res.v.channel + '/' + res.v.name;
            } else {
              path = '/' + res.v.channel + '/' + cardId;
            }
          }
          pageEditor.load({
            publishedAt: res.v.publishedAt,
            path: path
          });
        }
      });

      let card = cope.ui.build('Cope.Card.Editable', {
        sel: '#page-content',
        method: 'append'
      });
    
      if (res.v) {
        card.load(res.v);
      }

      card.edit(() => {
        editCard(card);
      });
    });
  } // end of loadCard

  loadCard();
});
