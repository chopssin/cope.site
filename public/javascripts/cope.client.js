window.cope = function($) {

if (!jQuery) {
  return console.error('require jQuery');
}

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
    
    ['absolute', 'relatvie', 'fixed'].map(s => {
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

cope.send = function(path, params, method) {
  return new Promise((resolve, reject) => {
    let cmd = {};
    cmd.method = method || 'post';
    cmd.url = '/api' + path;
    if (params) { 
      cmd.data = params; 
    }
    $.ajax(cmd).done(res => {
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
};

return cope;

}(jQuery, undefined);
