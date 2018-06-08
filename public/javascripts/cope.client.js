window.cope = function($) {

if (!jQuery) {
  return console.error('require jQuery');
}

/*
let thumbnailer = function(dataURL, file, options) {
  let self = {};
  let maxWidth = options && options.maxWidth || 40;
  let lobes = options && options.lobes || 1;
  let myThumb = {};
  try {
    let img = new Image();
    img.onload = function() {
      // Deal with the image with maxWidth
      let elem = document.createElement('canvas');
      myThumb = new Thumbnailer(elem, img, maxWidth, lobes);
      myThumb.onload = function() {
        self.dataURL = myThumb.canvas.toDataURL(file.type);
        self.file = dataURItoBlob(self.dataURL);
        try {
          self.onload();
        } catch (err) {
          console.error(err);
        }
      };
    }; 
    img.src= dataURL;
  } catch (err) {
    console.error(err);
  }
  return self;    
}; // end of thumbnailer

// returns a function that calculates lanczos weight
function lanczosCreate(lobes) {
  return function(x) {
      if (x > lobes)
          return 0;
      x *= Math.PI;
      if (Math.abs(x) < 1e-16)
          return 1;
      let xx = x / lobes;
      return Math.sin(x) * Math.sin(xx) / x / xx;
  };
}

// elem: canvas element, img: image element, sx: scaled width, lobes: kernel radius
function Thumbnailer(elem, img, sx, lobes) {
  this.canvas = elem;
  elem.width = img.width;
  elem.height = img.height;
  elem.style.display = "none";
  this.ctx = elem.getContext("2d");
  this.ctx.drawImage(img, 0, 0);
  this.img = img;
  this.src = this.ctx.getImageData(0, 0, img.width, img.height);
  this.dest = {
      width : sx,
      height : Math.round(img.height * sx / img.width),
  };
  this.dest.data = new Array(this.dest.width * this.dest.height * 3);
  this.lanczos = lanczosCreate(lobes);
  this.ratio = img.width / sx;
  this.rcp_ratio = 2 / this.ratio;
  this.range2 = Math.ceil(this.ratio * lobes / 2);
  this.cacheLanc = {};
  this.center = {};
  this.icenter = {};
  this.p_unit = Math.ceil(sx / 100);
  this._progress = 0;

  if ((img.width / sx) < 2) {
    setTimeout(this.process3, 0, this);
  } else {
    setTimeout(this.process1, 0, this, 0);
  }
}
Thumbnailer.prototype.onload = function() {
  if (this.onload) {
    this.onload.call();
  } else {
        console.log('setTimeout 300 onload');
    setTimeout(function() {
      if (this.onload) {
        this.onload.call();
      } 
    }, 300);
  }
};
Thumbnailer.prototype.onprogress = function(_p) {
  if (this.onprogress) {
    this.onprogress.call(_p);
  } else {
    setTimeout(function() {
      if (this.onprogress) {
        this.onprogress.call();
      } 
    }, 300);
  }
};
Thumbnailer.prototype.process1 = function(self, u) {
  if (u % self.p_unit == 0) {
    self.onprogress(u / self.dest.width);
  } 
  self.center.x = (u + 0.5) * self.ratio;
  self.icenter.x = Math.floor(self.center.x);
  for (let v = 0; v < self.dest.height; v++) {
      self.center.y = (v + 0.5) * self.ratio;
      self.icenter.y = Math.floor(self.center.y);
      let a, r, g, b;
      a = r = g = b = 0;
      for (let i = self.icenter.x - self.range2; i <= self.icenter.x + self.range2; i++) {
          if (i < 0 || i >= self.src.width)
              continue;
          let f_x = Math.floor(1000 * Math.abs(i - self.center.x));
          if (!self.cacheLanc[f_x])
              self.cacheLanc[f_x] = {};
          for (let j = self.icenter.y - self.range2; j <= self.icenter.y + self.range2; j++) {
              if (j < 0 || j >= self.src.height)
                  continue;
              let f_y = Math.floor(1000 * Math.abs(j - self.center.y));
              if (self.cacheLanc[f_x][f_y] == undefined)
                  self.cacheLanc[f_x][f_y] = self.lanczos(Math.sqrt(Math.pow(f_x * self.rcp_ratio, 2)
                          + Math.pow(f_y * self.rcp_ratio, 2)) / 1000);
              weight = self.cacheLanc[f_x][f_y];
              if (weight > 0) {
                  let idx = (j * self.src.width + i) * 4;
                  a += weight;
                  r += weight * self.src.data[idx];
                  g += weight * self.src.data[idx + 1];
                  b += weight * self.src.data[idx + 2];
              }
          }
      }
      let idx = (v * self.dest.width + u) * 3;
      self.dest.data[idx] = r / a;
      self.dest.data[idx + 1] = g / a;
      self.dest.data[idx + 2] = b / a;
  }

  if (++u < self.dest.width)
      setTimeout(self.process1, 0, self, u);
  else
      setTimeout(self.process2, 0, self);
};
Thumbnailer.prototype.process2 = function(self) {
  console.log('process2');
  self.canvas.width = self.dest.width;
  self.canvas.height = self.dest.height;
  self.ctx.drawImage(self.img, 0, 0, self.dest.width, self.dest.height);
  self.src = self.ctx.getImageData(0, 0, self.dest.width, self.dest.height);
  let idx, idx2;
  for (let i = 0; i < self.dest.width; i++) {
      for (let j = 0; j < self.dest.height; j++) {
          idx = (j * self.dest.width + i) * 3;
          idx2 = (j * self.dest.width + i) * 4;
          self.src.data[idx2] = self.dest.data[idx];
          self.src.data[idx2 + 1] = self.dest.data[idx + 1];
          self.src.data[idx2 + 2] = self.dest.data[idx + 2];
      }
  }
  self.ctx.putImageData(self.src, 0, 0);
  self.canvas.style.display = "block";
  self.onload();
};
Thumbnailer.prototype.process3 = function(self) {
  console.log('process3: actually just turn img into canvas');
  self.ctx.putImageData(self.src, 0, 0);
  self.canvas.style.display = "block";
  self.onload();
}
// end of Thumbnailer
*/
  
function dataURItoBlob(dataURI) {
  // convert base64/URLEncoded data component to raw binary data held in a string
  let byteString;
  if (dataURI.split(',')[0].indexOf('base64') >= 0)
      byteString = atob(dataURI.split(',')[1]);
  else
      byteString = unescape(dataURI.split(',')[1]);

  // separate out the mime component
  let mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

  // write the bytes of the string to a typed array
  let ia = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
  }

  return new Blob([ia], {type:mimeString});
}; //dataURItoBlob

let readTag = function(tag, val, vuId) {
  let ret = {},
      i, j, parse, tmp, tmp2,
      err;

  err = function() {
    throw 'readTag: Syntax error';
  };
  ret.originalTag = tag;
  ret.tagname = 'div';
  ret.id = '';
  ret.vuId = '';
  ret.comps = [];
  ret.classes = [];
  ret.props = '';
  ret.psuedoStyle = '';
  ret.html = '';

  // Extract [ ... ] to get ret.psuedoStyle
  i = tag.indexOf('[');
  j = tag.lastIndexOf(']');
  if (i > -1 && i < j) {
    ret.psuedoStyle = tag.slice(i + 1, j);
    tag = tag.slice(0, i).concat(tag.slice(j + 1));
  }
   
  // Extract ( ... ) to get ret.props
  i = tag.indexOf('(');
  j = tag.lastIndexOf(')');
  if (i > -1 && i < j) {
    ret.props = tag.slice(i + 1, j);
    tag = tag.slice(0, i).concat(tag.slice(j + 1));
  }
  
  // Check validity and find the tagname
  parse = /^([\w]+)?([@#\[\.\*][^@#\[\.\*]+|\(.+\))*$/g;
  tmp = parse.exec(tag);
  if (!tmp) { return err(); }
  ret.tagname = tmp[1] || 'div';
  
  // Check for id, classes, vu-id, vu-comp
  parse = /[@#\.\*][\w\d\-]+/g;
  tmp = tag.match(parse);
  if (tmp && tmp.length) {
    tmp.map(x => {
      switch (x.charAt(0)) {
        case '*':
          ret.vuId = x.slice(1);
          break;
        case '@':
          ret.comps = ret.comps.concat(x.slice(1));
          break;
        case '#':
          ret.id = x.slice(1);
          break;
        case '.':
          ret.classes = ret.classes.concat(x.slice(1));
          break;
        default:
      }
    }); 
  }
  
  // Update all comps with vu-id
  if (ret.comps.length) {
    ret.comps = ret.comps.map(x => {
      let prefix = (vuId || ret.vuId || ''); 
      if (prefix) {
        x = prefix + '-' + x;
      }
      return x;
    });
  }
  
  // Handle props
  ret.props = ret.props.trim(); 
  
  // Set the style
  ret.psuedoStyle = ret.psuedoStyle + ';';
  tmp = ret.psuedoStyle.split(';').map(x => {
    let style = '',
        s = '',
        shortcuts;
    shortcuts = {
      w: 'width',
      h: 'height',
      m: 'margin',
      mt: 'margin-top',
      ml: 'margin-left',
      mr: 'margin-right',
      mb: 'margin-bottom',
      p: 'padding',
      pt: 'padding-top',
      pl: 'padding-left',
      pr: 'padding-right',
      pb: 'padding-bottom',
      b: 'border',
      bt: 'border-top',
      bl: 'border-left',
      br: 'border-right',
      bb: 'border-bottom',
      bg: 'background',
      bgColor: 'background-color',
      bgSize: 'background-size',
      c: 'color',
      z: 'z-index',
      fz: 'font-size',
      fw: 'font-weight'
    };
    if (!x) { return ''; }
    x = x.trim();
    
    ['block', 'inline-block', 'inline', 'flex', 'none'].map(s => {
      if (x == s) {
        style = 'display:' + x;
      }
    });
    
    ['absolute', 'relative', 'fixed'].map(s => {
      if (x == s) {
        style = 'position:' + x;
      }
    })

    if (x == 'pointer') {
      style = 'cursor: pointer';
    }
    
    Object.keys(shortcuts).map(s => {
      if (x.indexOf(s + ':') == 0) {
        style = shortcuts[s] + ':' + x.slice(s.length + 1); 
      }
    });
    
    if (!style) {
      style = x;
    }
    
    return style;
  }).join(';') || '';
  
  if (tmp && tmp != ';') {
    //if (!ret.props.style) { ret.props.style = ''; }
    ret.props = ret.props + ' style="' + tmp + '"';
  }
  
  // Generate html
  tmp = ret.tagname + ' ' +
    (ret.id ? (' id="' + ret.id + '" ') : '') +
    (ret.classes.length ? (' class="' + ret.classes.join(' ') + '" ') : '') +
    (ret.vuId ? (' data-vuid="' + ret.vuId + '" ') : '') +
    (ret.comps.length ? (' ' + ret.comps.map(x => {
      return 'data-component="' + x + '"'; 
    }).join(' ') + ' ') : '') + 
    ret.props;

  tmp = '<' + tmp.trim() + '>';
  if (ret.tagname != 'input' 
        && ret.tagname != 'area'
        && ret.tagname != 'base'
        && ret.tagname != 'br'
        && ret.tagname != 'col'
        && ret.tagname != 'command'
        && ret.tagname != 'embed'
        && ret.tagname != 'hr'
        && ret.tagname != 'keygen'
        && ret.tagname != 'link'
        && ret.tagname != 'meta'
        && ret.tagname != 'param'
        && ret.tagname != 'source'
        && ret.tagname != 'img') {
    tmp = tmp + (val || '') + '</' + ret.tagname + '>';
  }
  ret.html = tmp;

  return ret;
}; // end of readTag

let domToHtml = function(val, vuId) {
  let readNode, // node => { tag: val } || [tag, val] || str 
      readDom, // dom => [node]
      readVal; // val => str || dom
  
  readNode = function(node) {
    let tag, val, ret;
    if (typeof node == 'string') {
      return node;
    } else if (Array.isArray(node)) {
      tag = node[0];
      val = node[1] || '';
    } else if (typeof node == 'object') {
      tag = Object.keys(node)[0];
      val = node[tag];
    }
    return readTag(tag, readVal(val), vuId).html;
  };
  
  readDom = function(nodes) {
    if (Array.isArray(nodes)) {
      return nodes.map(node => readNode(node)).join('');
    } 
    return '';
  }

  readVal = function(val) {
    return (typeof val == 'string') ? val : readDom(val);
  };
  
  return readVal(val);
}; // end of domToHtml

let newVu = function(obj, render) {
  let vuAPI = {};
  let init = null;
  let domBuilder = null;
  let viewData = obj && obj.data || {}; // private data store for this view
  let viewDOM = [];
  let viewHTML = '';
  let viewId = new Date().getTime().toString(36) 
    + Math.floor(Math.random() * 10000).toString(36);

  vuAPI.id = viewId;
  
  vuAPI.sel = function(_path) {
    let root = '[data-vuid="' + viewId + '"]';
    if (!_path) {
      return root;
    } else if (_path.charAt(0) === '@') { // eg. "@display"
      let cmp = '[data-component="' + _path.slice(1) + '"]',
          newCmp = '[data-component="' + viewId + '-' + _path.slice(1) + '"]';
      if (cmp.indexOf(' ') > -1) {
        console.error(`Invalid data-component "${cmp}"`);
      } else {
        return root + cmp + ', ' + root + ' ' + cmp + ', ' + newCmp;
      }
    }
    return root + _path + ', ' + root + ' ' + _path;
  }; // end of vuAPI.sel

  vuAPI.$ = function(selector) {
    return $(vuAPI.sel(selector));
  }; // end of vuAPI.$

  // To set the DOM builder function, 
  // or return the view's HTML and DOM
  vuAPI.dom = function(fn) {
    if (typeof fn == 'function') {
      domBuilder = fn;
    } else {
      return {
        html: viewHTML,
        dom: viewDOM
      };
    }
  }; // end of vuAPI.dom

  vuAPI.init = function(fn) {
    if (typeof fn == 'function') {
      init = fn;
    }
  }; // end of vuAPI.init

  vuAPI.method = function(name, fn) {
    if (vuAPI[name]) {
      return console.error('vu.method(name): name "' + name + '" already taken');
    }
    if (!vuAPI[name] && typeof fn == 'function') {
      vuAPI[name] = fn;
    }
  };

  vuAPI.set = function(a, b) {
    if (typeof a == 'object') {
      viewData = Object.assign({}, viewData, a);
    } else if (typeof a == 'string') {
      viewData[a] = b;
    }
    try {
      vuAPI.$().data(viewData);
    } catch (err) {
      //console.warn(err);
    }
    return;
  };

  vuAPI.get = function(a) {
    if (typeof a == 'string') {
      return viewData[a];
    } else {
      return viewData;
    }
  };

  vuAPI.val = function(a, b) {
    if (!a) {
      return vuAPI.get();
    } else if (typeof a == 'object') {
      return vuAPI.set(a);
    } else if (typeof a == 'string') {
      if (arguments.length === 1) {
        return vuAPI.get(a);
      } else if (arguments.length === 2) {
        return vuAPI.set(a, b);
      }
    }
  }; // end of vuAPI.val

  // Render this view
  if (typeof render == 'function') {
    render(vuAPI);
  }

  // Build the view
  if (domBuilder) {
    viewDOM = domBuilder(viewData);

    // Add viewId to first-layered elements
    if (viewDOM && viewDOM.length > 0) {
      viewDOM = viewDOM.map(x => {
        if (typeof x == 'object') {
          let keys = Object.keys(x);
          let tag = keys[0];
          if (tag) {
            let n = {};
            n[tag + '*' + viewId] = x[tag];
            return n;
          } else {
            return x;
          }
        } else { 
          return x;
        }
      });
    }

    // Render the initial HTML
    viewHTML = domToHtml(viewDOM, viewId);
    if (viewHTML && obj.sel) {
      $(obj.sel)[obj.method || 'html'](viewHTML);
    }

    if (init) {
      init(viewData);
    }
  }
  return vuAPI;
}; // end of newVu

let newDS = function() {
  let data = {};
  let registry = {};
  let dsAPI = {};
  dsAPI.onChange = function(name, fn) {
    if (typeof name != 'string' 
      || typeof fn != 'function') {
      return;
    }
    if (!registry[name]) {
      registry[name] = [];
    }
    registry[name] = registry[name].concat(fn);
  };

  dsAPI.set = function(a, b) {
    if (typeof a == 'string') {
      data[a] = b;
      if (registry[a] && registry[a].length) {
        registry[a].map(fn => {
          fn(b);
        });
      }
    } else {
      console.error('dsAPI.set(a, b): invalid inputs', a, b);
    } 
  };

  dsAPI.get = function(a) {
    if (typeof a == 'string') {
      return data[a] || null;
    } else {
      return data;
    }
  };

  return dsAPI;
}; // end of newDS

let cope = {};
cope.randId = function(len) {
  if (!len) { len = 5 }
  let id = '';
  let seed = '1234567890-_qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM';
  for (let i = 0; i < len; i++) {
    s = seed.charAt(Math.floor(Math.random() * seed.length));
    id += s;
  }
  return id;
};
cope.send = function(path, params, method) {
  return new Promise((resolve, reject) => {
    let cmd = {};
    cmd.method = method || 'post';
    cmd.url = '/api' + path;
    if (params) { 
      if (typeof params == 'object' && Object.keys(params).length > 0) {
        try {
          params = JSON.stringify(params);
        } catch (err) {
          console.error(err);
        }
      }
      cmd.data = { 'data': params }; 
    }

    $.ajax(cmd).done(res => {
      try {
        res.v = res && res.data && res.data.value || {};
      } catch (err) {
        console.error(err);
      }
      resolve(res);
    }).fail(err => {
      console.error(err);
    });
  });  
}; // end of cope.send

cope.views = function() {
  let V = {};
  let classes = {};
  let ds = newDS();
  
  V.dom = domToHtml;
  
  V.dataStore = function() {
    return ds;
  };

  V.createClass = function(className, fn) {
    if (typeof fn == 'function') {
      classes[className] = fn;
    }
    return;
  };

  V.build = function(className, obj) {
    if (!classes[className]) {
      return console.error('Failed to find class "' + className + '"');
    }

    let classInitFunc = classes[className];
    return newVu(obj, classInitFunc);
  }; // end of V.class

  return V;
}; // end of cope.views

cope.queue = function() {
  let queueAPI = {};
  let funcs = [];
  let running = null;
  let next = function() {
    if (funcs.length > 0) {
      running = funcs[0];
      funcs = funcs.slice(1);
      try {
        running(next);
      } catch (err) {
        console.error(err);
      }
    }
  };
  queueAPI.add = function(fn) {
    if (typeof fn != 'function') {
      throw 'cope.queue().add(fn): fn should be function';
    }
    funcs = funcs.concat(fn);
    if (!running || funcs.length == 1) {
      next();
    }
    return queueAPI;
  };
  return queueAPI;
}; // end of cope.queue

cope.fileLoader = function(onload) {
  if (typeof onload != 'function') {
    console.error(onload);
    throw 'cope.fileLoader(<function>onload): invalid onload';
  }
  let loaderAPI = {};
  loaderAPI.download = function(url, options) {
    try {
      loadImage(url, img => {
        if (img.type == 'error') {
          return;
        }
        if (options && options.maxWidth) {
          img.style.maxWidth = options.maxWidth + 'px';
          img.style.width = '100%';
          img.style.height = 'auto';
        }
        let result = {};
        result.url = url;
        result.image = {};
        result.image.img = img;

        //let c = document.createElement("canvas");
        //let ctx = c.getContext('2d');
        //ctx.drawImage(img, 0, 0);
        //result.image.dataURL = c.toDataURL();
        onload([result]);
      }); 
    } catch (err) {
      console.error(err);
    }
  }; // end of loaderAPI.download

  loaderAPI.upload = function(options) {
    let inputId = '#_tmp_'; //+ cope.randId();
    $('body').append(cope.views().dom([
      { 'div[none]': [
        [ 'input' + inputId + '(type="file")' ]
      ] },
    ]));
    let $fileInput = $(inputId);
    $fileInput.on('change', evt => {
      $fileInput.remove();
      try {
        let files = evt.target.files;
        let resultArr = [];
        let loadedCount = 0;
        if (!options) {
          options = {};
        }
        options.orientation = true;
        for (let i = 0; i < files.length; i++) {
          let result = {};
          result.file = files[i];
          result.filename = files[i].name || 'no-name';
          resultArr[i] = result;

          //let loader = 
          loadImage(files[i], function(img) {
            loadedCount++;
            if (img.type != 'error') {
              let image = {};
              let prefix = options && options.maxWidth ? '_scaled_' + options.maxWidth + '_' : '';
              /*
              result.originalFile = files[0];
              result.img = img; // it should be a canvas
              result.dataURL = img.toDataURL();
              result.blob = dataURItoBlob(img.toDataURL());
              result.blob.name = prefix + filename;
              result.filename = prefix + filename;
              */
              try {
                image.name = prefix + resultArr[i].filename;
                image.img = img; // it should be a canvas
                image.dataURL = img.toDataURL();
                image.blob = dataURItoBlob(img.toDataURL());
                resultArr[i].image = image;
              } catch (err) {
                console.error(err); 
              }
            }
          }, options);
        } // end of for
        let waiting = setInterval(function() {
          if (loadedCount == files.length) {
            onload(resultArr);
            clearInterval(waiting);
          }
        });
      } catch (err) {
        console.error(err);
      }
    }); // end of onchange

    $fileInput
      .prop('multiple', options && options.multi || false)
      .val('');
    $fileInput.click();
  }; // end of loaderAPI.upload
  return loaderAPI;
}; // end of cope.fileLoader

/*
cope.modal = function() {
  let V = cope.views();
  let modalAPI = {};
  let filesOnload = null;
  V.createClass('Cope.Modal', vu => {
    vu.dom(data => [
      { 'div[none]': [
        { 'input@modalFileInput(type="file")': '' },
        { 'button(data-toggle="modal" data-target="#copeModal")@modalBtn': '' }] 
      },
      { '#copeModal.modal.fade(tabindex="-1" role="dialog" aria-labelledby="copeModalLabel" aria-hidden="true")': [
        { '.modal-dialog(role="document")': [
          { '.modal-content': [
            { '.modal-header': [
              { 'h5.modal-title#copeModalLabel@modalTitle': 'Modal Title' },
              { 'button.close(type="button" data-dismiss="modal" aria-label="Close")': [
                { 'span(aria-hidden="true")': '&times;'  }] 
              }] 
            },
            { '.modal-body@modalBody': [
              { 'div': 'Hello.' }] 
            },
            { '.modal-footer@modalFooter': '' }]
              //{ 'button.btn.btn-secondary(type="button" data-dismiss="modal")': 'Close' },
              //{ 'button.btn.btn-primary': 'Save' }] 
            //}] 
          }] 
        }] 
      }
    ]); // end of Cope.Modal.dom

    vu.method('title', title => {
      vu.$('@modalTitle').text(title || '');
      return vu;
    });

    vu.method('body', fn => {
      if (typeof fn == 'function') {
        fn(vu.sel('@modalBody'), vu);
      }
      return vu;
    });

    vu.method('clear', () => {
      filesOnload = null;
      vu.set('options', {});
      vu.$('@modalFileInput')
        .off('change')
        .prop('multiple', false)
        .val('');
      vu.$('@modalTitle').text('');
      vu.$('@modalBody').html('');
      vu.$('@modalFooter').html('');
      return vu;
    }); // end of Cope.Modal.clear

    vu.method('open', () => {
      vu.clear();
      vu.$('@modalBtn').click();
      return vu;
    }); // end of Cope.Modal.open

    vu.method('setUploader', options => {
      vu.clear();
      if (!options) {
        options = {};
      }
      vu.set('options', options);
      if (options['multi']) {
        vu.$('@modalFileInput')
          .prop('multiple', true)
          .val('');
      } 
      return vu;
    }); // end of Cope.Modal.setUploader

    vu.method('getFiles', fn => {
      if (typeof fn == 'function') {
        filesOnload = fn;
        vu.$('@modalFileInput')
          .off('change')
          .on('change', function(evt) {
            try {
              let files = evt.target.files;
              let resultArr = [];
              let loadedCount = 0;
              let options = vu.get('options') || {};
              options.orientation = true;
              for (let i = 0; i < files.length; i++) {
                let loader = loadImage(files[i], function(img) {
                  loadedCount++;
                  if (img.type != 'error') {
                    let prefix = '_scaled_' + (options && options.maxWidth) + '_';
                    let result = {};
                    result.originalFile = files[0];
                    result.img = img; // it should be a canvas
                    result.blob = dataURItoBlob(img.toDataURL());
                    result.blob.name = prefix + files[0].name;
                    resultArr[i] = result;
                  }
                }, options);
              } // end of for
              let waiting = setInterval(function() {
                if (loadedCount == files.length) {
                  fn(resultArr);
                  clearInterval(waiting);
                }
              });
            } catch (err) {
              console.error(err);
            }
          })
      }
      return vu;
    }); // end of Cope.Modal.getFiles

    vu.method('addDismissButton', (btnName, onclick, callback) => {
      let btnComp = '@' + cope.randId();
      vu.$('@modalFooter').append(V.dom([
        [ 'button.btn.btn-secondary(type="button" data-dismiss="modal")' + btnComp, btnName ]
      ], vu.id));
      if (typeof onclick == 'function') {
        vu.$(btnComp).on('click', function(evt) {
          onclick(evt, vu.$(btnComp));
        });
      }
      if (typeof callback == 'function') {
        callback(vu.$(btnComp));
      }
      return vu;
    }); // end of Cope.Modal.addDismissButton

    vu.method('loadImageFromURL', url => {
      try {
        let options = vu.get('options') || {};
        let loader = loadImage(url, img => {
          console.log(img);
          if (img.type == 'error') {
            return vu;
          }
          //let prefix = '_scaled_' + (options && options.maxWidth) + '_';
          //let canvas = document.createElement('canvas');
          //canvas.width = img.width;
          //canvas.height = img.height;
          //let ctx = canvas.getContext('2d');
          //ctx.drawImage(img, 0, 0);
          let result = {};
          result.img = img;
          result.url = url;
          //result.blob = dataURItoBlob(canvas.toDataURL());
          //result.blob.name = prefix + cope.randId();
          filesOnload([result]);
        }); 
      } catch (err) {
        console.error(err);
      }
      return vu;
    });

    vu.method('chooseFromLocal', () => {
      vu.$('@modalFileInput').click();
      return vu;
    });
  }); // end of Cope.Modal

  let modal = V.build('Cope.Modal', {
    sel: 'body',
    method: 'prepend'
  });

  return modal;
}(); // end of cope.modal
*/

return cope;

}(jQuery, undefined);
