cope.render('/', obj => {
  console.log(obj);
  let appId = obj.appId;

  let main = cope.class(vu => {
    vu.dom(data => [
      //{ '.row': [
        { '.col-xs-12': [
          { 'div': [ 
            { 'h3@appName': '' }]
          }]
        }, 
        { '.col-xs-12@searchWrap': [
          { '.input-group': [
            { 'input.form-control[fz:18px; h:47px]@searchInput': '' },
            { '.input-group-append': [
              { 'button.btn.btn-primary@magicBtn': 'Search' }]
            }]
          }]
        },
        { '.col-xs-12': [
          { '@table': '' }] 
        },
        { '.col-xs-12': [
          { '@cards.card-columns': '' }] 
        },
        { '.col-xs-12': [
          { 'div': [ 
            { 'span[p:12px 0;]@cardNum': 'N Cards' },
            { 'span[p:12px]': 'M Posts' }]
          }]
        }, 
        { '.col-xs-12': [
          { 'div': [ 
            { 'h4': 'Recent Cards' },
            { 'div@recent-cards': '' }]
          }]
        } 
      //}
    ]); // end of main.dom

    vu.method('load', () => {
      vu.$('@searchWrap').hide();
      cope.send('/card/all', {
        mine: true,
        appId: appId
      }).then(res => {
        try {
          let cardsData = Object.keys(res.data).map(nodeId => {
            return res.data[nodeId];
          });

          let cardNum = cardsData.length;

          vu.set('cardsData', cardsData);
          vu.$('@cardNum').html(cardNum + ' Cards');
          vu.$('@searchWrap').show();
        } catch (err) {
          console.error(err, res);
        }
      })
    }); // end of main.load

    vu.method('search', text => {
      let tags = {};
      let split = text
        .replace(/\,\s+/g, ',')
        .replace(/\s+/g, ',')
        .split(',')
        .map(name => {
          tags[name] = true;
        })
      tags = Object.keys(tags);
      console.log(tags);

      let cardsData = vu.get('cardsData');
      let filtered = [];
      try {
        cardsData.map(c => {
          console.log(c.value.tags);
          let matched = true;
          tags.map(t => {
            try {
              if (!c.value.tags[t]) {
                matched = false;
              }
            } catch (err) {
              matched = false;
            }
          });
          if (matched) {
            filtered = filtered.concat(c);
          }
        });
      } catch (err) {
        console.error(err);
      }
      console.log(filtered);

      vu.$('@cards').html('');

      let table = cope.ui.build('UI.Table', {
        sel: vu.sel('@table')
      });


      // Add table  headers
      table.append.apply(null, [null].concat(tags.map(name => {
        return { 'div[fw:800]': name }
      })));

      filtered.map(cardData => {
        let cells = [null];
        cells = cells.concat(tags.map(name => {
          cardData.value[name]
          let v = '';
          cardData.value.keyValues.map(kv => {
            if (kv.key == name && !v) {
              v = kv.value;
            }
          });
          return v;
        }));
        console.log(cells);
        table.append.apply(null, cells);
        
        let card = cope.ui.build('Cope.Card', {
          sel: vu.sel('@cards'),
          method: 'append'
        });
        card.load(cardData.value);
        card.$().css('cursor', 'pointer')
          .on('click', evt => {
            try {
              location.href = '/' + appId + '/card/' + cardData.value.id; 
            } catch (err) {
              console.error(err);
            }
          });
      });
    });

    vu.init(data => {
      vu.load();

      vu.$('@magicBtn').click(evt => {
        vu.search(vu.$('@searchInput').val().trim());
      });
    });
  }).build({
    sel: '#page-content'
  }); // end of main
});
