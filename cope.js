let debug = require('debug')('cope.site:cope');
let MongoClient = require('mongodb').MongoClient;
let ObjectId = require('mongodb').ObjectId;

module.exports = function() {
  let test = 0;
  let MONGODB_URL = 'mongodb://127.0.0.1:27017/testDB';

  // db = <obj>dbAPI: {
  //   - useMongo = (<func>callback) => false
  // } EOF dbAPI
  const db = function() {
    let dbAPI = {};

    dbAPI.useMongo = function(callback) {
      MongoClient.connect(MONGODB_URL, (err, db) => {
        if (!err && db) {
          callback(db);
        } else {
          debug('[ERR] db.useMongo(callback): failed to connect to MongoDB');
          debug('[ERR] db.useMongo(callback): stop calling callback');
          debug('[ERR] db.useMongo(callback): url = ' + MONGODB_URL);
          debug('[ERR]', err);
        }
      });
      return false;
    }; // end of dbAPI.useMongo

    return dbAPI;
  }(); // end of db

  // cope = <obj>copeAPI: {
  //   - util = <obj>utilObj: {
  //     - makeQueue = () => <obj>queueAPI: {
  //       - add = (<func>) => queueAPI
  //       - next = () => queueAPI
  //     }
  //   } EOF utilObj
  //   - G = <obj>graphAPI: {
  //     - createNode = () => <Promise>: {
  //       - then <= <str>nodeId
  //       - catch <= <obj>error
  //     }
  //     - node = (<str>nodeId || <obj>query) => <obj>nodeAPI: {
  //       - nodeId = () => <str>nodeId
  //       - snap = () => <obj>nodeData
  //       - fetch = () => nodeAPI // to fetch "value"
  //       - val = (<obj>newValue) || (<str>, <mixed>) => nodeAPI // to update "value"
  //       - newVal = (<obj>newValue) => nodeAPI // to rewrite "value"
  //       - then = () => nodeAPI
  //       - del = () => <Promise>
  //       - link = (<str>name, <str>anotherNodeId) => nodeAPI
  //       - method = (<str>methodName, <func>method) => nodeAPI
  //     } EOF nodeAPI
  //     - findNodes = (<obj>query) => <Promise>
  //   } EOF graphAPI
  //   - M = <obj>modelAPI: {
  //     - createModel = (<str>modelName, <func>(<= <obj>model)) => false
  //     - model = (<str>modelName) => <obj>modelAPI || null
  //   } EOF modelAPI
  //   - useMongoDb = (<obj>params) => false
  //   - useSocketIO = (<obj>socket) => false
  // } EOF copeAPI
  const cope = {};
  cope.util = {};
  cope.util.makeQueue = function() {
    let queueAPI = {};
    let funcs = [];
    let runningFn = null;

    queueAPI.add = function(fn) {
      funcs = funcs.concat(fn);
      if (!runningFn) {
        queueAPI.next();
      }
      return queueAPI;
    };

    queueAPI.next = function() {
      runningFn = null;
      if (funcs && funcs[0]) {
        runningFn = funcs[0];
        funcs = funcs.slice(1);
        runningFn.apply(null, arguments);
      }
      return queueAPI;
    };
    return queueAPI;
  }; // end of cope.util.makeQueue

  cope.G = function() {
    let graphAPI = {};

    graphAPI.createNode = function() {
      return new Promise((resolve, reject) => {
        db.useMongo(mg => {
          let newNodeData = {};
          newNodeData.updatedAt = new Date().getTime();
          newNodeData.createdAt = newNodeData.updatedAt;
          newNodeData.value = {};
          newNodeData.tags = {};
          newNodeData.scopeWrite = 'ONLY_ME';
          newNodeData.scopeRead = 'PUBLIC';
          mg.collection('nodes').insertOne(newNodeData, (err, result) => {
            if (err) {
              reject(debug('[ERR] graphAPI.createNode()', err));
            } 
            if (result && result.insertedCount === 1) {

              // Update `nodeId` of the node
              let nodeId = result.insertedId.toString();

              db.useMongo(mg => {
                mg.collection('nodes').findOneAndUpdate({ _id: ObjectId(nodeId) }, { 
                  $set: { 'nodeId': nodeId }
                }, (err, result) => {
                  if (err) {
                    reject(debug('[ERR] graphAPI.createNode()', err));
                  } 
                  if (result) {

                    // Resolve with new nodeId
                    resolve(nodeId);
                  } 
                  mg.close();
                }); // end of ... findOneAndUpdate ...
              }); // end of ... useMongo ...
            }
            mg.close();
          }); // end of ... insertOne ...
        }); // end of ... useMongo ...
      }); // end of Promise
    }; // end of graphAPI.createNode

    graphAPI.node = function(a) {
      if (!a) {
        return null;
      }
      let nodeAPI = {};
      let nodeData = {};
      let queue = cope.util.makeQueue();
      let query = null;
      if (typeof a == 'string') {
        nodeData.nodeId = a;
      } else if (typeof a == 'object') {
        query = a;
      } else {
        return null;
      }

      let nodeId = function(callback) {
        if (typeof callback != 'function') {
          return;
        }
        if (nodeData && nodeData.nodeId) {
          callback(nodeData.nodeId);
        } else {
          db.useMongo(mg => {
            mg.collection('nodes').find(query).toArray((err, arr) => {
              let errObj = null;
              let id = null;
              
              if (!err && arr && (arr.length === 1)) {

                // Update `nodeData`
                nodeData = arr[0];

                id = nodeData.nodeId;
              } else {
                // TBD: How to callback with this ERROR???
                errObj = debug('graphAPI.node(a): failed to find the exact node', err, arr);
              }
              callback(errObj, id);
              mg.close();
            });
          });
        }
      }; // end of nodeId

      let setData = function(obj, callback) {
        obj.updatedAt = new Date().getTime();

        db.useMongo(mg => {
          mg.collection('nodes').findOneAndUpdate(query, {
            $set: obj
          }, (err, result) => {
            callback();
          });
        });
      }; // end of setData

      let getData = function(callback) {
        nodeId(id => {
          db.useMongo(mg => {
            mg.collection('nodes').find(query).toArray((err, arr) => {
              if (arr && arr.length === 1) {

                // Update `nodeData`
                nodeData = arr[0];
              } 
              callback();
              mg.close();
            });
          });
        });
      }; // end of getData

      nodeAPI.nodeId = function() {
        return nodeData && nodeData.nodeId;
      }; // end of nodeAPI.nodeId

      nodeAPI.snap = function() {
        return nodeData;
      }; // end of nodeAPI.snap

      nodeAPI.fetch = function() {
        queue.add(() => {
          getData(() => {
            queue.next();
          });
        });
        return nodeAPI;
      };  // end of nodeAPI.fetch

      nodeAPI.newVal = function(a, b) {
        let obj = null;
        if (typeof a == 'string' && arguments.length === 2) {
          obj = {};
          obj[a] = b;
        } else if (arguments.length === 1 && typeof a == 'object') {
          obj = a;
        }

        if (obj) { // write nodeData to db
          queue.add(() => {
            // TBD getData
            setData({ value: obj }, () => { // overwrite `value`
              getData(() => { // update local `nodeData`
                queue.next();
              });
            });
          }); // end of queue.add
        } else { // fetch data from db
          queue.add(() => {
            getData(() => { queue.next(); }); // update local `nodeData`
          }); // end of queue.add
        }
        return nodeAPI;
      }; // end of nodeAPI.newVal

      nodeAPI.val = function(a, b) {
        let obj = null;
        if (typeof a == 'string' && arguments.length === 2) {
          obj = {};
          obj[a] = b;
        } else if (arguments.length === 1 && typeof a == 'object') {
          obj = a;
        }

        if (obj) { // write nodeData to db
          queue.add(() => {
            getData(() => {
              obj = Object.assign({}, nodeData.value, obj);
              setData({ value: obj }, () => {
                nodeData.value = obj;
                queue.next();
              });
            });
          }); // end of queue.add
        } 
        return nodeAPI;
      }; // end of nodeAPI.val

      nodeAPI.then = function(callback) {
        queue.add(() => {
          if (typeof callback == 'function') {
            callback();
          }
        });
        return nodeAPI;
      }; // end of nodeAPI.then

      nodeAPI.del = function() {
        return new Promise((resolve, reject) => {
          db.useMongo(mg => {
            mg.collection('nodes').findOneAndDelete(query, (err, result) => {
              if (!err) {
                nodeData = {};
                resolve();
              } else {
                reject(debug('[ERR] nodeAPI.del', err, result));
              }
            });
          });
        }); // end of Promise
      }; // end of nodeAPI.del

      nodeAPI.link = function() {
        // TBD 
      }; // end of nodeAPI.link

      nodeAPI.method = function(methodName, func) {
        if (!nodeAPI[methodName] && (typeof func == 'function')) {
          nodeAPI[method] = func;
        }
        return nodeAPI;
      }; // end of nodeAPI.method

      return nodeAPI;
    }; // end of graphAPI.node

    return graphAPI;
  }(); // end of cope.G

  cope.M = function() {
    let models = {};
    let modelAPI = {};

    modelAPI.createModel = function(modelName, modelFunc) {
      let model = {};
 
      model.method = function(name, fn) {
        if (!model[name] && (typeof fn == 'function')) {
          model[name] = fn;
        }
      }; // end of model.method

      if (!models[modelName]) {
        try {
          modelFunc(model); // add methods
          models[modelName] = model; // save at store `models`
        } catch (err) {
          debug('[ERR] modelAPI.createModel(modelName, func):', err);
        }
      }
      return false;
    }; // end of modelAPI.createModel

    modelAPI.model = function(modelName) {
      try {
        return models[modelName] || null;
      } catch (err) {
        return null;
      }
    }; // end of modelAPI.model

    return modelAPI;
  }(); // end of cope.M

  cope.useMongoDb = function(params) {
    if (!params) {
      params = {};
    }
    MONGODB_URL = params.url;
    return false;
  }; // end of cope.useMongoDb

  cope.useSocketIO = function(socket) {
    if (!socket) {
      return false;
    }

    socket.on('toServer', obj => {
      let model = cope.G.model(obj.model), // TBD build req models
          method = obj.method,
          data = obj.data; // better be an array
      if (model && model[method]) {
        try {
          // TBD
          // eg
          // let node = cope.model(<name>).node()
          // node[<method>](<obj>)
          // node.then(() => {
          //   debug('-->', node.id());
          // });
          //
          // cope
          //   .model(<modelName>)
          //   .node()[<method>]
          //   .apply(null, { email: 'chops@xmail.com' });
          //   .then(() => {
          //     node
          //     socket.emit({
          //       reqId: obj.reqId,
          //       signal: result.signal,
          //       data: obj.data
          //     });
          //   })
        } catch (err) {
          debug(err);
        }
      }
    });
    return false;
  }; // end of cope.useSocketIO

  return cope;
}();
