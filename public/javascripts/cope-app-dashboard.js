cope.render('/', obj => {
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
          { 'div[fw:800]': [
            { 'span[pr:6px]': 'Found' }, 
            { 'span@entries': '0' },
            { 'span[pl:6px]': 'Card(s)' }] 
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
      let texts = [];
      let headers = {};
      vu.$('@cards').html('');
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
      //console.log(texts);

      let cardsData = vu.get('cardsData');
      let findMatch = function(str, loosenSearch) {
        if (!str || str.length < 1) {
          return false;
        }
        let matched = false;
        texts.map(t => {
          if (loosenSearch) {
            if (str.indexOf(t) > -1) {
              matched = true;
            }
          } else if (t == str) {
            matched = true;
          }
        });
        return matched;
      }; // end of findMatch
      let isContainingAllTexts = function(obj) { // check if a contains b
        let yes = true;
        texts.map(x => {
          if (!obj[x]) {
            yes = false;
          }
        });
        return yes;
      };
      let matches = [];
      let tableRaws = [];
      try {
        cardsData.map(c => {
          try {
            let tmp = {};
            c.value.keyValues.map(kv => {
              tmp[kv.key] = true;
              tmp[kv.value] = true;
              if (findMatch(kv.key)) {
                headers[kv.key] = true;
              } 
            });
            
            //if (isContainingAllTexts(tmp)) {
            //  tableRaws = tableRaws.concat(c);
            //  matches = matches.concat(c);
            //} else {
            if (isContainingAllTexts(tmp)
              || findMatch(c.value.header, true)
              || findMatch(c.value.text, true)) {
              tableRaws = tableRaws.concat(c);
              matches = matches.concat(c); 
            }
          } catch (err) {
            // Do nothing ... 
            // console.error(err, c);
          }
        });
      } catch (err) {
        console.error(err);
      }

      // Display matched cards
      matches.map(cardData => {
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
      }); // end of matches.map(...)

      let table = cope.ui.build('UI.Table', {
        sel: vu.sel('@table')
      });

      // Add table headers
      headers = texts.reduce((arr, t) => {
        if (headers[t]) {
          arr = arr.concat(t);
        }
        return arr;
      }, []);
      if (headers.length > 0) {
        headers = ['#'].concat(headers);
      }
      table.append.apply(null, [null].concat(headers.map(name => {
        return { 'div[fw:800]': name }
      })));

      tableRaws = tableRaws.concat([
        'SUM', 'COUNT', 'AVG', 'MIN', 'MAX'
      ]);
      let sums = [];
      let counts = [];
      let mins = [];
      let maxes = [];
      let entries = 0;
      tableRaws.map((cardData, idx) => {
        let cells = [null];
        cells = cells.concat(headers.map((name, j) => {
          //cardData.value[name]
          let v = '';
          if (typeof cardData == 'string') { 
            if (j >= headers.length - 5 || j == 0) {
              try { 
                switch (cardData) {
                  case 'SUM':
                    return j == 0 ? 'SUM' : String(sums[j].toFixed(2));
                    break;
                  case 'COUNT':
                    return j == 0 ? 'COUNT' : String(counts[j]);
                    break;
                  case 'AVG':
                    return j == 0 ? 'AVG' : String((sums[j] / counts[j]).toFixed(2));
                    break;
                  case 'MIN':
                    return j == 0 ? 'MIN' : String(mins[j]);
                    break;
                  case 'MAX':
                    return j == 0 ? 'MAX' : String(maxes[j]);
                    break;
                  default:
                }
              } catch (err) {
                // Do nothing ...
              }
            } 
            return '';
          }
          if (j == 0) {
            try { 
              entries = idx + 1;
              return [ 'a(href="/a/' + appId + '/card/' 
                + cardData.value.id
                + '" target="_blank")', String(idx + 1) ]
            } catch (err) {
              console.error(err, cardData);
              return '';
            }
          }
          cardData.value.keyValues.map(kv => {
            if (kv.key == name && !v) {
              v = kv.value;
              let n = parseFloat(v, 10);
              if (!isNaN(n)) {
                if (!sums[j]) {
                  sums[j] = 0;
                }
                if (!counts[j]) {
                  counts[j] = 0;
                }
                sums[j] += n;
                counts[j] += 1;
                if (isNaN(mins[j]) || mins[j] > n) {
                  mins[j] = n;
                }
                if (isNaN(maxes[j]) || maxes[j] < n) {
                  maxes[j] = n;
                }
              }
            }
          }); // end of cardData...map(...)
          return v;
        })); // end of cells.concat(...)
        table.append.apply(null, cells);
      }); // end of tableRaws.map(...)

      return entries;
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
