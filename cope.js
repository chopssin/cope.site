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
  //       - debug = (<bool>print) => <arr>errLogs
  //       - nodeId = () => <str>nodeId
  //       - snap = <obj>snapAPI: {
  //         - targets = (<str>linkName) => <arr>targetNodeIds
  //         - sources = (<str>linkName) => <arr>sourceNodeIds
  //         - data = () => <obj>nodeData
  //         - value = () => nodeData.value
  //       }
  //       - TBD: REMOVE snap = () => <obj>nodeData.value
  //       - TBD: REMOVE snapData = () => <obj>nodeData
  //       - val = (<obj>newValue) || (<str>, <mixed>) => nodeAPI // to update "value"
  //       - newVal = (<obj>newValue) => nodeAPI // to rewrite "value"
  //       - next = () => nodeAPI
  //       - del = () => <Promise>
  //       - link = (<str>name, <str>anotherNodeId) => nodeAPI
  //       - unlink = (<str>name, <str>anotherNodeId) => nodeAPI
  //       - fetchData = () => nodeAPI // to fetch "data"
  //       - fetchLinks = () => nodeAPI
  //       - fetch = () => nodeAPI // fetch both data and links
  //       - setModel = (<str>modelName) => nodeAPI
  //       - method = (<str>methodName, <func>method) => nodeAPI
  //     } EOF nodeAPI
  //     - findNodes = (<obj>query) => <Promise>: {
  //       - then = (<callback>(<obj>nodeDataObj)) => <Promise>
  //     }
  //     - findLinks = (<obj>query) => <Promise>
  //     - removeLinks = (<obj>query) => <Promise>
  //   } EOF graphAPI
  //   - M = <obj>modelManagerAPI: {
  //     - createModel = (<str>modelName, <func>(<= <obj>model)) => false
  //     - model = (<str>modelName) => null || <obj>modelAPI: {
  //       - createNode
  //       - node
  //       - TBD: findNodes = (<obj>query) => <Promise>
  //       - method
  //     } EOF modelAPI
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

    let validateKey = function(key) {
      let validKey = '__INVALID_KEY__';
      if (typeof key == 'string') {
        if (key.charAt(0) == '$') {
          validKey = key.slice(1);
        } else {
          validKey = 'value.' + key;
        }
      }  
      return validKey;
    };

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

      // Set initial query of the node
      let query = null;
      if (typeof a == 'string') {
        nodeData.nodeId = a;
        query = {};
        query.nodeId = a;
      } else if (typeof a == 'object') {
        query = {};
        for (let key in a) {
          trueKey = validateKey(key);
          query[trueKey] = a[key];
        }
      } else {
        return null;
      }

      // Use $and in query
      if (query) {
        let qs = [];
        for (let key in query) {
          let tmp = {};
          tmp[key] = query[key];
          qs = qs.concat(tmp);
        }
        query = {
          $and: qs
        };
      }

      // Log errors
      let errLogs = [];
      let error = function(methodName, err) {
        errLogs = errLogs.concat({
          method: methodName,
          err: err
        });
      };

      // Fetch the nodeId based on the above query
      // Always callback with the fetched id or null
      let checkId = function(callback) {
        if (typeof callback != 'function') {
          error('checkId(callback)', 'lack of callback');
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
                errObj = { 
                  msg: 'graphAPI.node(a): failed to find the exact node', 
                  query: query, 
                  err: err, 
                  result: '# nodes = ' + (arr && arr.length)
                };
                error('checkId(callback)', errObj);
              }
              callback(id);
              mg.close();
            });
          });
        }
      }; // end of checkId

      let setData = function(obj, callback) {
        obj.updatedAt = new Date().getTime();

        db.useMongo(mg => {
          mg.collection('nodes').findOneAndUpdate(query, {
            $set: obj
          }, (err, result) => {
            if (err) {
              error('setData(obj, callback)', err);
            }
            callback();
            mg.close();
          });
        });
      }; // end of setData

      let getData = function(callback) {
        checkId(id => {
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

      nodeAPI.debug = function(print) {
        if (print) {
          debug('------------------------------------------');
          debug('[node.debug] nodeId = ' + nodeAPI.nodeId());
          debug(errLogs);
          debug('------------------------------------------');
        }
        return errLogs;
      };

      nodeAPI.nodeId = function() {
        return nodeData && nodeData.nodeId;
      }; // end of nodeAPI.nodeId

      //nodeAPI.snapData = function() {
      //  return nodeData;
      //}; // end of nodeAPI.snapData

      //nodeAPI.snap = function() {
      //  return nodeData && nodeData.value || {};
      //}; // end of nodeAPI.snap

      nodeAPI.snap = {};

      nodeAPI.snap.data = function() {
        return nodeData;
      }; // end of nodeAPI.snap.data

      nodeAPI.snap.value = function() {
        return nodeData && nodeData.value || {};
      };

      nodeAPI.snap.targets = function(linkName) {
        let links = nodeAPI.snap.data() && nodeAPI.snap.data().links;
        let nodes = [];
        if (Array.isArray(links)) {
          nodes = links.reduce((arr, link) => {
            if (link.source == nodeAPI.nodeId()) {
              arr = arr.concat(link.target);
            }
            return arr;  
          }, []);  
        }
        return nodes;
      }; // end of nodeAPI.snap.targets

      nodeAPI.snap.sources = function(linkName) {
        let links = nodeAPI.snap.data() && nodeAPI.snap.data().links;
        let nodes = [];
        if (Array.isArray(links)) {
          nodes = links.reduce((arr, link) => {
            if (link.target == nodeAPI.nodeId()) {
              arr = arr.concat(link.source);
            }
            return arr;  
          }, []);  
        }
        return nodes;
      }; // end of nodeAPI.snap.sources

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

      nodeAPI.next = function(callback) {
        queue.add(() => {
          if (typeof callback == 'function') {
            callback();
          }
          queue.next();
        });
        return nodeAPI;
      }; // end of nodeAPI.next

      nodeAPI.del = function() {
        return new Promise((resolve, reject) => {
          checkId(id => {
            if (id) {
              db.useMongo(mg => {
                mg.collection('nodes').findOneAndDelete({ nodeId: id }, (err, result) => {
                  if (err) { 
                    error('node.del', err); 
                    reject('Failed to delete non-existing node, or something just went wrong');
                  } else {
                    nodeData = {};
                    resolve();
                  }
                  
                  // Remove related links
                  cope.G.removeLinks('nodeId').catch(err => {
                    error('node.del', err);
                  })

                  mg.close();
                });
              }); // end of .. useMongo ..
            } else {
              reject('nodeAPI.del(): failed to find the node');
            } // end of else
          }); // end of checkId
        }); // end of Promise
      }; // end of nodeAPI.del

      nodeAPI.link = function(linkName, targetNodeId) {
        queue.add(() => {
          checkId(id => {
            if (typeof linkName == 'string' 
              && typeof targetNodeId == 'string'
              && id) {
              let obj = {};
              obj.source = id;
              obj.target = targetNodeId;
              obj.name = linkName;

              let q = { '$and': [
                { source: id },
                { target: targetNodeId },
                { name: linkName }
              ]};

              db.useMongo(mg => {
                mg.collection('links').find(q).toArray((err, docs) => {
                  if (docs && docs.length > 0) {
                    queue.next(); // already existed
                  } else {
                    mg.collection('links').insertOne(obj, (err, result) => {
                      if (!err) {
                        queue.next();
                      } else {
                        error('node.link', err);
                      }
                      mg.close();
                    }); // end of .. insertOne ..
                  } 
                }); // end of .. findOne ..
              }); // end of .. useMongo ..
            } else {
              error('node.link', obj);
            } // end of else
          }); // end of checkId
        }); // end of queue.add
        return nodeAPI;
      }; // end of nodeAPI.link

      nodeAPI.unlink = function(linkName, targetNodeId) {

        queue.add(() => {
          checkId(id => {
            if (typeof linkName == 'string' 
              && typeof targetNodeId == 'string'
              && id) {
              let obj = {};
              obj.source = id; //nodeAPI.nodeId();
              obj.target = targetNodeId;
              obj.name = linkName;
              let q = { '$and': [
                { source: id },
                { target: targetNodeId },
                { name: linkName }
              ]};
                db.useMongo(mg => {
                  mg.collection('links').findOneAndDelete(q, (err, result) => {
                    queue.next();
                    mg.close();
                  });
                });
            } else {
              error('node.unlink', {
                name: linkName,
                target: targetNodeId,
                source: id
              });
            } // end of else
          }); // end of checkId
        }); // end of queue.add
        return nodeAPI;
      }; // end of nodeAPI.unlink

      nodeAPI.fetchData = function() {
        queue.add(() => {
          getData(() => {
            queue.next();
          });
        });
        return nodeAPI;
      };  // end of nodeAPI.fetchData

      nodeAPI.fetchLinks = function() {
        queue.add(() => {
          checkId(id => {
            if (!id) {
              error('node.fetchLinks', { nodeId: id });
              queue.next();
              return;
            } 
            db.useMongo(mg => {
              mg.collection('links').find({
                '$or': [
                  { target: id },
                  { source: id }
                ]
              }).toArray((err, docs) => {
                nodeData.links = [];
                if (err) { error('node.fetchLinks', err); }
                if (!docs) {
                  docs = [];
                }
                nodeData.links = docs.map(doc => {
                  let name = doc.name;
                  let target = doc.target;
                  let source = doc.source;
                  return {
                    name: name,
                    target: target,
                    source: source
                  };
                });
                queue.next();
                mg.close();
              }); // end of .. toArray ..
            }); // end of .. useMongo ..
          }); // end of checkId
        }); // end of queue.add
        return nodeAPI;
      }; // end of nodeAPI.fetchLnks

      nodeAPI.fetch = function() {
        return nodeAPI.fetchData().fetchLinks();
      }; // end of nodeAPI.fetch

      nodeAPI.setModel = function(modelName) {
        if (typeof modelName == 'string') {
          queue.add(() => {
            let updates = {};
            updates.model = modelName
            setData(updates, () => {
              queue.next();
            });
          });
        }
        return nodeAPI;
      }; // end of nodeAPI.setModel

      nodeAPI.method = function(methodName, func) {
        if (!nodeAPI[methodName] && (typeof func == 'function')) {
          nodeAPI[methodName] = func;
        }
        return nodeAPI;
      }; // end of nodeAPI.method

      return nodeAPI;
    }; // end of graphAPI.node

    graphAPI.findNodes = function(q) {
      let query = null;
      if (Array.isArray(q)) { // array of nodeIds
        query = {
          '$or': q.map(nid => {
            return {
              'nodeId': nid
            };
          })
        };
      } else if (typeof q == 'object') { // normal query
        query = {
          '$and': function(q) {
            let arr = [];
            for (let key in q) {
              let trueKey = validateKey(key);
              let tmp = {};
              tmp[trueKey] = q[key];
              arr = arr.concat(tmp);
            }
            return arr;
          }(q)
        };
      }
      return new Promise((resolve, reject) => {
        if (!query) {
          reject(debug('[ERR] graphAPI.findNodes(query): Invalid query'));
          return;
        } 
        db.useMongo(mg => {
          mg.collection('nodes').find(query).toArray((err, docs) => {
            if (!err) {
              let nodeDataObj = {};
              docs.map(doc => {
                nodeDataObj[doc.nodeId] = doc;
              });
              resolve(nodeDataObj); 
            } else {
              reject(debug('[ERR] graphAPI.findNodes(query)', err));
              return;
            }
            mg.close();
          }); // end of .. toArray ..
        }); // end of db.useMongo ...
      }); // end of Promise
    }; // end of graphAPI.findNodes

    graphAPI.findLinks = function(q) {
      let query = null;
      if (typeof q == 'string') {
        query = {
          '$or': [
            { target: q },
            { source: q }
          ]
        };
      } else if (typeof q == 'object') {
        query = {
          '$and': function(q) {
            let arr = [];
            for (let key in q) { // e.g. q = { $target: <someId> }
              let tmp = {};
              tmp[validateKey(key)] = q[key];
              arr = arr.concat(tmp);
            }
            return arr;
          }(q)
        };
      }
      return new Promise((resolve, reject) => {
        if (!query) {
          reject(debug('[ERR] graphAPI.findLinks(query): Invalid query'));
          return;
        }
        db.useMongo(mg => {
          mg.collection('links').find(query).toArray((err, docs) => {
            if (!err) {
              resolve(docs.map(doc => {
                return {
                  name: doc.name,
                  target: doc.target,
                  source: doc.source
                }
              }));
            } else {
              debug('[ERR] graphAPI.findLinks(query)', err);
              reject(err);
            }
            mg.close();
          });
        });
        return;
      });
    }; // end of graphAPI.findLinks

    graphAPI.removeLinks = function(q) {
      let query = null;
      if (typeof q == 'string') {
        query = {
          '$or': [
            { target: q },
            { source: q }
          ]
        };
      } else if (typeof q == 'object') {
        query = {
          '$and': q
        };
      }
      return new Promise((resolve, reject) => {
        // TBD
        db.useMongo(mg => {
          mg.collection('links').deleteMany(query, (err, result) => {
            if (!err) {
              resolve(result);
            } else {
              reject(err);
            }
            mg.close();
          });
        }); // end of useMongo
      });
    }; // end of graphAPI.removeLinks

    return graphAPI;
  }(); // end of cope.G

  cope.M = function() {
    let models = {};
    let modelManagerAPI = {};

    modelManagerAPI.createModel = function(modelName, modelFunc) {
      let modelAPI = {};

      // TBD: 
      modelAPI.createNode = function() {
        return new Promise((resolve, reject) => {
          cope.G.createNode().then(nodeId => {
            cope.G.node(nodeId)
              .setModel(modelName)
              .next(() => {
                resolve(nodeId);
              });
          });
        });
      }; // end of modelAPI.createNode

      modelAPI.node = function(a) {
        let query = null;
        if (typeof a == 'string') {
          query = {};
          query['$nodeId'] = a;
          query['$model'] = modelName;
        } else if (typeof a == 'object') {
          query = Object.assign({}, a, { '$model': modelName }); 
        }
        return cope.G.node(query);
      }; // end of modelAPI.node

      modelAPI.findNodes = function(q) {
        if (typeof q == 'object') {
          q['$model'] = modelName;
        }
        return cope.G.findNodes(q);
      }; // end of modelAPI.findNodes
 
      modelAPI.method = function(name, fn) {
        if (!modelAPI[name] && (typeof fn == 'function')) {
          modelAPI[name] = fn;
        }
      }; // end of modelAPI.method

      if (!models[modelName]) {
        try {
          if (typeof modelFunc == 'function') {
            modelFunc(modelAPI); // add methods
          }
          models[modelName] = modelAPI; // save at store `models`
        } catch (err) {
          debug('[ERR] modelManagerAPI.createModel(modelName, func):', err);
        }
      }
      return false;
    }; // end of modelManagerAPI.createModel

    modelManagerAPI.model = function(modelName) {
      try {
        return models[modelName] || null;
      } catch (err) {
        return null;
      }
    }; // end of modelManagerAPI.model

    return modelManagerAPI;
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
