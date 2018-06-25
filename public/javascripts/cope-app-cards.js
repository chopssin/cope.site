cope.render('/app/cards', obj => {
  let appId = obj.appId;
  let sectionCards = cope.class(vu => {
    vu.dom(data => [
      { 'button.btn.btn-primary@createBtn': 'Create' },
      { '@cards.card-columns': '' }
    ]);

    vu.method('load', () => {
      cope.send('/card/all', { 
        'mine': true,
        'appId': appId //TBD: check this out
      }).then(res => {
        console.log(res);
        try {
          Object.keys(res.data).map(cardNodeId => {
            let cardData = res.data[cardNodeId];
            let card = cope.ui.build('Cope.Card', {
              sel: vu.sel('@cards'),
              method: 'append',
              data: cardData
            });
          })
        } catch (err) {
          console.error(err);
        }
      });   
    });
  }).build({
    sel: '#page-content'
  }); // end of sectionCards.build( ... )

  $('#li-cards').addClass('active');
  sectionCards.load();
});
