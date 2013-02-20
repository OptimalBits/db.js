db.js
=====

IndexedDB is a powerful technology. Unfortunatelly the API exposed is complex to use and there are some cross browser differences.

db.js is an up to date indexedDB Wrapper that provides an easier to use, cross browser API. Tested on Chrome and Firefox.

Follow [optimalbits](http://twitter.com/optimalbits) for news and updates regarding this library.

##Opening a Database (new or existing one)

Open a database using the factory function, 

__Arguments__
 
    name      {String} Database name. If un-existent it will create a new one.
    version   {Number?} Optional version number for this database.
    callback  {(err?: Error, db?) => void}
    
    DBFactory(name, version, cb) 
    
Example:

    DBFactory("zoo", function(err, db){
      if(!err){
        // db is the open database.
      }
    })

    
##Deleting a Database

A database can be totally deleted using the delete method:

__Arguments__
 
    name      {String} Database name to be deleted.
    callback  {(err?: Error) => void}
    
    DBFactory##deleteDatabase(name, cb) 

##Getting an Object Store

A database is composed of an unlimited number of object stores. An object store is nothing more than a key value store with some simple query capabilities.

__Arguments__
 
    name      {String} Object store name. If un-existent a new one will be created.
    callback  {(err?: Error, store: ObjectStore?) => void}
    
    DBWrapper##getObjectStore(name, cb)

Example

    db.getObjectStore('birds', function(err, store){
      if(!err){
        // store containes our "birds" key value store.
      }
    })

###Set, Get, Update & Delete


An object store supports the common CRUD operations:


Sets an object in the storage associated to the given key. Note, if there is already an object associated to the key it will be overwritten.

__Arguments__
 
    key      {String} The key with the object to store.
    object   {Object} Any object supported by IndexedDB
    callback  {(err?: Error) => void}
    
    ObjectStore##setObject(key, object, cb)

 
Gets the object associated to the given key if any.

__Arguments__
 
    key       {String} The key of the object to retrieve.
    callback  {(err?: Error, object: Object) => void}
    
    ObjectStore##getObject(key, cb)

Updates the object associated to the given key (this only works for plain javascript objects, where the properties of the stored object are *extended* by the properties of the stored object)
    
__Arguments__
 
    key       {String} The key with the object to update.
    newObject {Object} Any object supported by IndexedDB
    callback  {(err?: Error, object: Object) => void}
    
    ObjectStore##updateObject(key, newObject, callback)


###Queries

Simple queries can be performed using the [KeyRange API](https://developer.mozilla.org/en-US/docs/IndexedDB/IDBKeyRange) from indexedDB:

__Arguments__
 
    keyRange  {IDBKeyRange} A key range object specifying the range to get.
    filter    {(obj) => bool} A filter function used to select a subset of the
    matching range.
    callback  {(err?: Error, object: Object) => void} A callback with an 
    object with the query results, as a mapping between keys and objects.
    
    ObjectStore##query(keyRange, filter, callback)



##Unit tests

The unit tests are written using mocha. For running the unit tests you need to use node and a webbrowser with IndexedDB capabilities (only Chrome, IE10 and Firefox at the moment).

Go to the test directory and run the test server:

        node server.js
        
Open a webbrowser pointing to http://localhost:8080

##License 

(The MIT License)

Copyright (c) 2013 Optimal Bits www.optimalbits.com

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

