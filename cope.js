let debug = require('debug')('cope.site:cope');
let MongoClient = require('mongodb').MongoClient;
let ObjectId = require('mongodb').ObjectId;

module.exports = function() {

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
          debug('[ERR] db.useMongo(callback): url = ' + url);
          debug('[ERR]', err);
        }
      });
      return false;
    }; // end of dbAPI.useMongo

    return dbAPI;
  }(); // end of db

  // cope = <obj>copeAPI: {
  //   - graph = () => <obj>graphAPI: {
  //     - node = () => <obj>nodeAPI: {
  //       - nodeId = () => <str>nodeId
  //       - create = () => <obj>nodeData
  //       - fetch = () => nodeAPI
  //       - data = () => <obj>nodeData
  //       - val = (<obj>newValue) => nodeAPI
  //       - update = (<obj>newValue) => nodeAPI
  //       - then = () => nodeAPI
  //       - del = (<bool>true) => null
  //       - link = (<str>name, <obj>anotherNode) => nodeAPI
  //     } EOF nodeAPI
  //     - findNodes = (<obj>query: {
  //       - ? model: <str>modelName
  //       - ? tags: [ <str>tagNameSyntax ]
  //     }) => <promise>: {
  //       - then <= ([ <obj>nodes ])
  //     } EOF <promise>
  //     - createModel = (<str>modelName, (<obj>node) => (<obj>node))
  //   } EOF graphAPI
  //   - useMongoDB = (<obj>params) => false
  //   - useSocketIO = (<obj>socket) => false
  // } EOF copeAPI
  const cope = {};
  cope.graph = function() {

    let graphAPI = {};

    graphAPI.node = function(nodeId) {

      let nodeAPI = {},
          nodeData = {},
          queue = cope.util.makeQueue();

      nodeData.nodeId = typeof nodeId == 'string'
        ? nodeId
        : null;

      nodeAPI.nodeId = function() { return nodeData.nodeId; };

      nodeAPI.create = function(options) {
        if (nodeId) {
          debug('[ERR] nodeAPI.create(): nodeId already been created');
          return nodeAPI;
        }
        queue.add(() => {
          db.useMongo(mg => {

            let newNodeData = {};
            newNodeData.updatedAt = new Date().getTime();
            newNodeData.createdAt = newNodeData.updatedAt;
            newNodeData.val = {};
            newNodeData.tags = {};
            newNodeData.scopeWrite = 'ONLY_ME';
            newNodeData.scopeRead = 'PUBLIC';
            if (typeof (options && options.model) == 'string') {
              newNodeData.model = options.model;
              // TBD: graphAPI.useModel('<modelName>', <initVal>)
              // newNodeData.val
            }

            // Insert new node as new doc in MongoDB
            mg.collection('nodes').insertOne(newNodeData, (err, result) => {
              if (err) { debug('[ERR] nodeAPI.create(options)', err); }
              if (result && result.insertedCount === 1) {
                try {
                  let newNodeId = result.insertedId.toString();

                  // Update stringified `nodeId`
                  mg.collection('nodes').findOneAndUpdate({
                    _id: ObjectId(newNodeId)
                  }, { 
                    $set: { nodeId: newNodeId } 
                  }, (err, result) => {
                    if (!err && result) {
                      nodeData = Object.assign({}, newNodeData, { nodeId: newNodeId });
                      mg.close();
                      queue.next();
                    } else {
                      debug('[ERR] nodeAPI.create(options):', err);
                    }
                  }); // end of mg ... findOneAndUpdate( ...
                } catch (err) {
                  debug('[ERR] nodeAPI.create(options):', err);
                }
              } else {
                debug('[ERR] nodeAPI.create(options): failed to create node');
              }
            }); // end of mg ... insertOne( ...
          }); // end of db.useMongo( ... 
        }); // end of queue.add( ...
      }; // end of nodeAPI.create

      nodeAPI.fetch = function() { 
        queue.add(() => {
          db.useMongo(mg => {
            mg.collection('nodes').find({
              _id: ObjectId(nodeAPI.nodeId())
            }).toArray((err, docs) => {
              if (!err && docs && docs.length === 1) {
                nodeData = docs[0];
              } else {
                debug('[ERR] nodeAPI.fetch():', err); 
              }
              mg.close();
              queue.next();
            }); // end of mg ... find( ...
          }); // end of db.useMongo( ...
        }); // end of queue.add( ...
        return nodeAPI; 
      }; // end of nodeAPI.fetch

      nodeAPI.data = function() { 
        return Object.assign({}, nodeData);
      }; // end of nodeAPI.data

      nodeAPI.val = function(newDataVal) {
        if (!nodeData.hasOwnProperty('val')) {
          nodeData.val = {};
        }
        return nodeAPI;
      }; // end of nodeAPI.val

      nodeAPI.update = function(dataValUpdates) {
        if (!nodeData.hasOwnProperty('val')) {
          nodeData.val = {};
        }
        return nodeAPI;
      }; // end of nodeAPI.update

      nodeAPI.then = function() {
        return nodeAPI;
      }; // end of nodeAPI.then

      nodeAPI.del = function() {
        return null; 
      }; // end of nodeAPI.del

      nodeAPI.link = function() {
        return nodeAPI;
      };// end of nodeAPI.link
        
      return nodeAPI;
    }; // end of graphAPI.node

    graphAPI.findNodes = function() {
        
    }; // end of graphAPI.findNodes

    graphAPI.createModel = function() {
    
    }; // end of graphAPI.createModel

    return graphAPI;
  }; // end of cope.graph

  cope.useMongoDB = function(params) {
    if (!params) {
      params = {};
    }
    MONGODB_URL = params.url;
    return false;
  }; // end of cope.useMongoDB

  cope.useSocketIO = function(socket) {
    if (!socket) {
      return false;
    }

    // TBD

    return false;
  }; // end of cope.useSocketIO

  return cope;
}();
