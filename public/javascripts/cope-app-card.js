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
      let updates = editor.fetch();
      cope.send('/card/update', {
        appId: appId,
        cardId: cardId,
        updates: updates
      }).then(res => {
        console.log(updates);
        console.log(res);
        loadCard();
      })
    });
  }; // end of editCard

  let loadCard = function() {
    cope.send('/card/get', {
      appId: appId,
      id: cardId
    }).then(res => {
      let card = cope.ui.build('Cope.Card.Editable', {
        sel: '#page-content'
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
