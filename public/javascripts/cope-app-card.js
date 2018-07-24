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

    editor.$().append(cope.dom([{ 'div[w:100%]': [
      { 'button#delBtn.btn.btn-danger[block;relative; m:0 auto]': 'Delete This Card' }] 
    }]))

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
        cope.send('/card/update', {
          appId: appId,
          cardId: cardId,
          updates: updates
        }).then(res => {
          loadCard();
        })
      }); // end of wait.run(...)
    }); // end of #doneBtn.onclick

    $('#delBtn').on('click', evt => {
      let queue = cope.queue();
      let page = null; 
      queue.add(next => {
        cope.send('/page/del', {
          appId: appId,
          contentId: cardId
        }).then(res => {
          next();
        });
      });
      queue.add(next => {
        cope.send('/card/del', {
          appId: appId,
          id: cardId
        }).then(res => {
          location.href = '/a/' + appId + '/cards';
        });
      });
    }); // end of #delBtn.onclick
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
        let channelName = pageEditor.fetch().channel;
        let publishedAt = pageEditor.fetch().publishedAt;
        
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

            // Find channelId 
            let channelId = null;
            let queueForChannelId = cope.queue();
            queueForChannelId.add(next => {
              cope.send('/channel/get', {
                appId: appId,
                name: channelName
              }).then(res => {
                if (res.ok && res.v && res.v.id) {
                  channelId = res.v.id;
                }
                next();
              })
            });
            queueForChannelId.add(next => {
              if (!channelId && channelName) {
                // Create new channel
                cope.send('/channel/add', {
                  appId: appId,
                  name: channelName
                }).then(res => {
                  if (res.v && res.v.id) {
                    channelId = res.v.id;
                    next();
                  }
                });
              } else if (channelId) {
                next();
              }
            });

            // Save the page
            queueForChannelId.add(next => {
              // Update page's published time and channelId
              let updates = {};
              updates.channelId = channelId;
              updates.publishedAt = publishedAt;

              cope.send('/page/update', {
                query: {
                  appId: appId,
                  id: pageEditor.req('pageId')
                },
                updates: updates 
              }).then(res => {
                console.log(res); 
              });
            }); // end of queueForChannelId.add( ... )
          } // end of if ( ...pageId... )
        }); // end of queue.add( ... )
      }); // end of pageEditor.done( ... ) 

      cope.send('/page/get', {
        appId: appId,
        contentId: cardId
      }).then(res => {
        console.log('page', res.v);
        if (res && res.v && res.v.id) {
          pageEditor.set('pageId', res.v.id);

          if (res.v.channel) {
            pageEditor.loadInputs({
              publishedAt: res.v.publishedAt,
              channel: res.v.channel
            });
          }
        }
      });

      let card = cope.ui.build('Cope.Card.Editable', {
        sel: '#page-content',
        method: 'append',
        data: {
          original: true
        }
      });
    
      if (res.v) {
        card.load(res.v);
      }

      card.edit(() => {
        editCard(card);
      }, () => {
        console.log(card.fetch());
        let v = card.fetch();
        v.header = 'Copy: ' + (v.header || 'Untitled Card'); 
        if (v.id) { delete v.id; }
        cope.send('/card/add', v).then(res => {
          console.log(res);
          try {
            location.href = '/a/' + res.v.appId + '/card/' + res.v.id; 
          } catch (err) {
            console.error(err);
          }
        });
      });
    });// end of cope.send('/card/get', ...)
  } // end of loadCard

  loadCard();
});
