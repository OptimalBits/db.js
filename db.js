/**
  db.js (c) OptimalBits 2012.
  
  A lightweight wrapper for the IndexedDB API.
  
  authors: manuel@optimalbits.com
           
  Licensed as MIT.
  
  TODO:
  
  Support for queryUsageAndQuota and requestQuota.
  
  https://developers.google.com/chrome/whitepapers/storage
*/

(function() {

/**
    Abstraction of IndexedDB into an easier to use API that follows 
    nodejs conventions as much as possible.
*/ 

  var indexedDB = 
    window.indexedDB || 
    window.webkitIndexedDB || 
    window.mozIndexedDB || 
    window.msIndexedDB || 
    window.oIndexedDB;

  IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction,
  IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange;
  
  IDBTransaction.READ_ONLY = IDBTransaction.READ_ONLY || 'readonly';
  IDBTransaction.READ_WRITE = IDBTransaction.READ_WRITE || 'readwrite';
  
  var supportUpgrade = false;
  
  var DBFactory = function (name, version, cb) {
    var request;
    if(typeof version === 'function'){
      cb = version;
      version = undefined;
      request = indexedDB.open(name);
    }else{
      request = indexedDB.open(name, version);
    }
    
    try{
      request.onsuccess = function (e) {
        removeListeners(request);
        cb(null, new DBWrapper(e.target.result));    
      };
        
      request.onblocked =
      request.onerror = function (e) {
        removeListeners(request);
        cb(new Error("indexedDB.delete Error: " + e.message));
      };
            
      if(request.hasOwnProperty('onupgradeneeded')){
        request.onupgradeneeded = request.onsuccess;
        supportUpgrade = true;
      }
    }catch(e){
      DBFactory.deleteDatabase(name, function(err){
        if(!err){
          open(name, cb);
        }else{
          cb(err);
        }
      });
    }
  }
  
  DBFactory.deleteDatabase = function(name, cb) {
    var request = indexedDB.deleteDatabase(name);
    
    try{
      request.onsuccess = function (e) {
        removeListeners(request);
        cb();
      }
      
      request.onblocked =
      request.onerror = function (e) {
        removeListeners(request);
        cb(new Error("indexedDB.delete Error: " + e.message));
      }      
    }catch(e){
      cb(e)
    } 
  }

  var DBWrapper = function (db) {
    this.db = db;
  }

  DBWrapper.prototype = {
    incVersion : function(cb){
      var 
        self = this,
        request, 
        succeeded = false,
        version = parseFloat(self.db.version);

      version = version === '' ? 0 : version + 1;
    
      if(!supportUpgrade){
        request = self.db.setVersion(version);
      }else{
        self.db.close()
        request = indexedDB.open(self.db.name, version);
        
        request.onupgradeneeded = function(e){
          removeListeners(request);
          self.db = e.target.result;
          if(!succeeded){
            succeeded = true;
            cb();
          }
        }
      }
      request.onsuccess = function(e){
        removeListeners(request);
        if(!succeeded){
          succeeded = true;
          cb();
        }
      }
      request.onblocked = 
      request.onerror = function (e) {
        removeListeners(request);
        cb(new Error("indexedDB upgrading Error: " + e.message));
      }
    },

    getObjectStore : function (name, cb) {
      var transactionType =  IDBTransaction.READ_WRITE;
      var self = this;
      if (self._hasStore(name)){
        self._getStore(name, transactionType, function(store){
          cb(null, new ObjectStore(store));
        })
      } else {
        self.incVersion(function(err){
          if(!err){
            var store = self.db.createObjectStore(name, {}, false);
            cb(err, new ObjectStore(store));
          }else{
            cb(err);
          }
        })
      }
    },

    deleteObjectStore : function (name, cb) {
      var self = this;

      if (self.db.objectStoreNames.contains(name)) {
        self.incVersion(function(err){
          if(!err){
            self.db.deleteObjectStore(name);
          }
          cb(err);
        })
      } else {
        cb(new Error('Store not found'));
      }
    },

    // Returns an object upfilling keyValue = {key:value}
    // For faster queries create indexes on the required keys.
    getObjectWhere : function (storeName, keyPath, value, cb) {
      // TODO: Implement
    },
    
    _hasStore : function(name){
      return this.db.objectStoreNames.contains(name);
    },
  
    _getStore : function (name, transactionType, cb) {
      if(this._hasStore(name)){
        var transaction = this.db.transaction([name], transactionType);
        cb(transaction.objectStore(name));
      }else{
        cb();
      }
    },
  }
  
  var ObjectStore = function(store){
    this.store = store;
  }
  
  ObjectStore.prototype = {
    setObject : function (key, object, cb) {
      var request = this.store.put(object, key);
      
      request.onsuccess = function (e) {
        cb();
      };

      request.onerror = function (e) {
        cb(e);
      }; 
    },

    getObject : function (key, cb) {
      var
        keyRange = IDBKeyRange.only(key),
        request = this.store.openCursor(keyRange);

      request.onsuccess = function (e) {
        var result = e.target.result;

        if (result) {
          cb(null, result.value);
        }else{
          cb(new Error('Object not found'))
        }
      }
      
      request.onerror = function (err) {
        cb(err);
      };
    },

    updateObject : function (key, newObj, cb) {
      var self = this;

      // To guarantee atomicity, we should use db.version here.
      self.getObject(key, function (err, obj) {
        if (obj) {
          for(var prop in newObj){
            if(newObj.hasOwnProperty(prop)){
              obj[prop] = newObj[prop];
            }
          }
          self.setObject(key, obj, function(err){
            cb(err, obj);
          });
        }else{
          cb(err);
        }
      });
    },
    
    deleteObject : function (key, cb) {
      var request = this.store.delete(key);

      request.onsuccess = function (e) {
        cb()
      };

      request.onerror = function (e) {
        cb(e)
      };
    },
    
    getAllObjects : function (cb) {
      var keyRange = IDBKeyRange.lowerBound('');
      this.query(keyRange, cb);
    },
    
    query : function (keyRange, filter, cb) { 
      var 
        cursorRequest = this.store.openCursor(keyRange),
        results = {};
      
      if(!cb){
        cb = filter;
        filter = null;
      }

      cursorRequest.onsuccess = function (e) {
        var result = e.target.result;
        if (!result) {
          cb(null, results);
        }else{
          if (filter) {
            if (filter(result.value)) {
              results[result.key] = result.value;
            }
          } else {
            results[result.key] = result.value;
          }
          result['continue'](); //Hack to shut up IDE equal to result.continue()
        }
      };

      cursorRequest.onerror = function (err) {
        cb(err);
      };
    }
  }
  
  function removeListeners(request){
    request.onerror = 
    request.onblocked = 
    request.onsuccess = 
    request.onupgradeneeded = null;
  }
  
  // AMD define happens at the end for compatibility with AMD loaders
  // that don't enforce next-turn semantics on modules.
  if (typeof define === 'function' && define.amd) {
    define(function() {
      return DBFactory;
    });
  }else{
    this.DBFactory = DBFactory;
  }
  
}).call(this);

