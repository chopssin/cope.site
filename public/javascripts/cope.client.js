window.cope = function(io) {

  // Use socket.io for data transmission
  let socket;
  try { 
    socket = io(); 
  } catch(err) {
    return console.error(err);
  }

  let copeReqs = {}; // store for cope reqs

  // Cope API
  // cope = <obj>: {
  //   - util = <obj>: {
  //     - randId = (<number>len) => <str>rid
  //   }
  //   - req = (<str>apiPath) => <obj>reqAPI: {
  //     - on = (<str>signal, <func>callback) => reqAPI
  //     - once = (<str>signal, <func>callback) => reqAPI
  //     - res = (<str>signal) => <func>callback
  //     - send = (<mixed>data) => reqAPI
  //   }
  // }
  let cope = {};
  cope.util = {};

  cope.util.randId = function(len) {
    len = !isNaN(len) ? len : 5;
    let seeds = 'abcdefghijklmnopqrstuvwxyz0123456789_';
    let rid = '';
    for (let i = 0; i < len; i++) {
      rid = rid + seeds.charAt(Math.floor(Math.random() * seeds.length));
    }
    return rid;
  }; // end of cope.util.randId

  cope.req = function(params) {
    let reqAPI = {};
    let reqId = cope.util.randId();
    let model = params && params.model;
    let method = params && params.method;
    let onCallbacks = {};
    let onceCallbacks = {};

    if (typeof apiPath != 'string') {
      console.error('cope.req(<str>apiPath): invalid apiPath');
      return null;
    }
    
    reqAPI.on = function(signal, callback) {
      if (typeof signal == 'string' && typeof callback == 'function') {
        onCallbacks[signal] = callback;     
      }
      return reqAPI;
    }; // end of reqAPI.on

    reqAPI.once = function() {
      if (typeof signal == 'string' && typeof callback == 'function') {
        onceCallbacks[signal] = callback;     
      }
      return reqAPI;
    }; // end of reqAPI.once

    reqAPI.res = function(signal) {
      return function() {
        if (onceCallbacks[signal]) {
          onceCallbacks[signal].apply(null, arguments);
          delete onceCallbacks[signal];
        }
        if (onCallbacks[signal]) {
          onCallbacks[signal].apply(null, arguments);
        }
      }; // end of return
    }; // end of reqAPI.res

    reqAPI.send = function(data) {
      socket.emit('toServer', {
        reqId: reqId,
        model: model,
        method: method,
        data: data
      });
      return reqAPI;
    }; // end of reqAPI.send

    copeReqs[reqId] = reqAPI;
    return copeReqs[reqId];
  }; // end of cope.req

  // Use socket.io to receive data from the server
  socket.on('toClient', obj => {
    try {
      req = copeReqs[obj.reqId];
      req.res(obj.signal)(obj.data);
    } catch (err) {
      console.error(err);
    }
  });

  return cope;
}(io, undefined);
