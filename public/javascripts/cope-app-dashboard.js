cope.render('/app/dashboard', obj => {
  //console.log(obj);
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
          { 'div[fw:800]': [
            { 'span[pr:6px]': 'Found' }, 
            { 'span@entries': '0' },
            { 'span[pl:6px]': 'Card(s)' }] 
          }]
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
            { 'h2[mt:32px; font-weight:800]': 'Collections' },
            { 'div@collections': '' },
            { 'button.btn.btn-primary@addCollectionBtn': 'Add Collection' }]
          }]
        }, 
        { '.col-xs-12': [
          { 'div': [ 
            { 'h2[mt:32px; font-weight:800]': 'Recent Cards' },
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

          // Display recent cards
          cardsData.sort((a, b) => {
            if (a && a.updatedAt && b && b.updatedAt) {
              return a.updatedAt < b.updatedAt;
            }
            return true;
          }).slice(0, 4).map(cardData => {
            try { 
              let card = cope.ui.build('Cope.Card', {
                sel: vu.sel('@recent-cards'),
                method: 'append'
              });
              card.load(cardData.value);
              card.$().css('cursor', 'pointer')
                .on('click', evt => {
                  try {
                    location.href = '/a/' + appId + '/card/' + cardData.value.id; 
                  } catch (err) {
                    console.error(err);
                  }
                });
            } catch (err) {
              console.error(err);
            }
          }); // end of recent cards
          

          vu.$('@cardNum').html(cardNum + ' Cards');
          vu.$('@searchWrap').show();
        } catch (err) {
          console.error(err, res);
        }
      })
    }); // end of main.load

    vu.method('search', text => {
      try {
        texts = text
          .replace(/\,\s+/g, ',')
          .replace(/\s+/g, ',')
          .split(',');
      } catch (err) {
        //console.error(err);
        texts = []; 
      }
      if (!Array.isArray(texts)) {
        texts = [];
        return;
      }
      let cardsData = vu.get('cardsData');
      let arr = cardsData.map(x => {
        let obj = {};
        let keyValues = {};
        try {
          x.value.keyValues.map(x => {
            keyValues[x.key] = x.value;
          });
          obj.keyValues = keyValues;
          obj.data = x;
        } catch (err) {
          obj.keyValues = {};
          obj.data = null; 
        }
        return obj;
      });
      let col = cope.collection(arr);
      let matchedCards = col.filter(texts).getArray().map(x => x.data);
      let table = col.getTable(texts);
      //let entries = table.length - 1;
      let tableUI = cope.ui.build('UI.Table', {
        sel: vu.sel('@table')
      });

      // Headers
      if (table.length > 0) {
        tableUI.append.apply(null, [null].concat(table[0].map(x => { 
          return cope.dom([{ 'div[fw:800]': x }]);
        })));
      }
      
      // Values
      if (table.length > 1) {
        table.slice(1).map((row, idx) => {
          let idLink = cope.dom([['a(href="/a/' + appId + '/card/' + row[0].data.value.id + '")', idx + 1]]);
          tableUI.append.apply(null, [null, idLink].concat(row.slice(1).map(x => x.payload)));
        });
      }

      // Stats
      if (table.length > 1) {
        let stats = table[0].map((x, i) => {
          let isDateTyped = true;
          let range = cope.range(table.slice(1).map(x => {
            try { 
              if (x[i].type != 'date' || isNaN(x[i].value)) {
                isDateTyped = false;
              }
              return x[i].value;
            } catch (err) {
              // Do nothing ...
            }
            return null;
          }));

          if (isDateTyped) {
            delete range.sum;
            delete range.avg;
            let minDate = new Date(range.min);
            let maxDate = new Date(range.max);
            minDate = minDate.getFullYear() 
              + '/' + (minDate.getMonth() + 1) 
              + '/' + (minDate.getDate());
            maxDate = maxDate.getFullYear() 
              + '/' + (maxDate.getMonth() + 1) 
              + '/' + (maxDate.getDate());
            range.min = minDate;
            range.max = maxDate;
          }
          return range;
        });

        let valid = function(v) {
          if (typeof v == 'number') {
            return v + '';
          } else if (typeof v == 'string') {
            return v
          }
          return '';
        };

        [
          ['SUM'].concat(stats.slice(1).map(x => valid(x.sum))),
          ['AVG'].concat(stats.slice(1).map(x => valid(x.avg))),
          ['COUNT'].concat(stats.slice(1).map(x => valid(x.count))),
          ['MIN'].concat(stats.slice(1).map(x => valid(x.min))),
          ['MAX'].concat(stats.slice(1).map(x => valid(x.max)))
        ].map(row => {
          tableUI.append.apply(null, [null].concat(row));  
        });
      } // end of if (table.length > 1)

      console.log(matchedCards);
      // Matched Cards
      vu.$('@cards').html('');
      matchedCards.map(cardData => {
        try { 
          let card = cope.ui.build('Cope.Card', {
            sel: vu.sel('@cards'),
            method: 'append'
          });
          card.load(cardData.value);
          card.$().css('cursor', 'pointer')
            .on('click', evt => {
              try {
                location.href = '/a/' + appId + '/card/' + cardData.value.id; 
              } catch (err) {
                console.error(err);
              }
            });
        } catch (err) {
          console.error(err);
        }
      });      
      return matchedCards.length;
    }); // end of main.search

    vu.init(data => {
      vu.load();

      vu.$('@magicBtn').click(evt => {
        let entries = vu.search(vu.$('@searchInput').val().trim());
        vu.$('@entries').html(entries);
      });
    });
  }).build({
    sel: '#page-content'
  }); // end of main
});
