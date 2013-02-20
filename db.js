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
  
  var READ_ONLY = IDBTransaction.READ_ONLY || 'readonly';
  var READ_WRITE = IDBTransaction.READ_WRITE || 'readwrite';
    
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
      request.onupgradeneeded = request.onsuccess;
      
      request.onsuccess = function () {
        removeListeners(request);
        cb(null, new DBWrapper(request.result));    
      };
        
      request.onblocked =
      request.onerror = function (e) {
        removeListeners(request);
        cb(new Error("indexedDB.delete Error: " + e.message));
      };
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
      request.onsuccess = function () {
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
    
      this.db.close()
      request = indexedDB.open(this.db.name, version);
        
      request.onupgradeneeded = function(){
        removeListeners(request);
        self.db = request.result;
        if(!succeeded){
          succeeded = true;
          cb();
        }
      }
      request.onsuccess = function(){
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
      if (this._hasStore(name)){
        cb(null, new ObjectStore(this.db, name));
     } else {
        var _this = this;
        this.incVersion(function(err){
          if(!err){
            var store = _this.db.createObjectStore(name, {}, false);
            store.transaction.oncomplete = function(){
              cb(err, new ObjectStore(_this.db, name));
            }
            store.transaction.onerror = function(e){
              cb(new Error("Error creating object store:" + e.message));
            }
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
    }
    
  }
  
  var ObjectStore = function(db, name){
    this.db = db;
    this.name = name;
  }
  
  ObjectStore.prototype = {
    _transaction: function(type, cb){
      var transaction = 
        this.db.transaction([this.name], type);
      if(cb){
        transaction.oncomplete = function(e){
          cb();
        }
        transaction.onerror = function(e){
          cb(new Error('Error performing transaction:'+e.message));
        }
      }
      return transaction.objectStore(this.name);
    },
    
    setObject : function (key, object, cb) {
      try {
        var objectStore = this._transaction(READ_WRITE, cb);
        objectStore.delete(key);
        objectStore.add(object, key);
      }catch(e){
        cb(e);
      }
    },

    getObject : function (key, cb) {
      var objectStore = this._transaction(READ_ONLY);
      var request = objectStore.get(key);
      request.onsuccess = function () {
        var result = request.result;

        if (result) {
          cb(null, result);
        }else{
          cb(new Error('Object not found'))
        }
      }
      
      request.onerror = function (e) {
        cb(new Error("indexedDB getObject Error: " + e.message));
      };
    },
    
    updateObject : function (key, newObj, cb) {
      try {
        var objectStore = this._transaction(READ_WRITE, cb);
        objectStore.put(newObj, key);
      }catch(e){
        cb(e);
      }
    },
    
    deleteObject : function (key, cb) {
      try{
        var objectStore = this._transaction(READ_WRITE, cb);
        objectStore.delete(key);
      } catch(e){
        cb(e);
      }
    },
    
    getAllObjects : function (cb) {
      var keyRange = IDBKeyRange.lowerBound('');
      this.query(keyRange, cb);
    },
    
    query : function (keyRange, filter, cb) { 
      try{
        var objectStore = this._transaction(READ_ONLY);
        var request = objectStore.openCursor(keyRange);
        var results = {};
            
        if(!cb){
          cb = filter;
          filter = null;
        }

        request.onsuccess = function () {
          var result = request.result;
          if (!result) {
            cb(null, results);
          }else{
            if(!filter || filter(result.value)){
              results[result.key] = result.value;
            }
            result['continue'](); //Hack to shut up IDE equal to result.continue()
          }
        }
        
        request.onerror = function (e) {
          cb(new Error("indexedDB query Error: " + e.message));
        };
      }catch(e){
        cb(e);
      }
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

