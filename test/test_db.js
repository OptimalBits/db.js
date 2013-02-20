define(['db'], function(DBFactory) {
  
  describe('Database', function() {
    var db;
    
    after(function(done){
      DBFactory.deleteDatabase('test', function(err){
        done();
      });
    });
    
    it('Create Database', function(done) {
      DBFactory('test', function(err, database) {
        expect(err).to.not.be.ok();
        expect(database).to.be.an(Object);
        db = database;
        done();
      });
    });
    
    it('Get an object store', function(done) {
      db.getObjectStore('animals', function(err, storage){
        expect(err).to.not.be.ok();
        expect(storage).to.be.an(Object);
        done();
      });
    });

    it('Set data in a object store', function(done) {
      db.getObjectStore('animals', function(err, storage){
        expect(err).to.not.be.ok();
        expect(storage).to.be.an(Object);
        storage.setObject('tiger', {legs: 4}, function(err){
          expect(err).to.not.be.ok();
          done();
        });
      });
    });

    it('Get data from a object store', function(done) {
      db.getObjectStore('animals', function(err, storage){
        storage.setObject('leopard', {legs: 4}, function(err){
          expect(err).to.not.be.ok();
          storage.getObject('leopard', function(err, leopard){
            expect(err).to.not.be.ok();
            expect(leopard).to.be.an(Object);
            expect(leopard.legs).to.be(4);
            done();
          });
        });
      });
    });
    
    it('Query data from a object store', function(done) {
      db.getObjectStore('animals', function(err, storage){
        storage.setObject('leopard', {legs: 4}, function(err){
          expect(err).to.not.be.ok();
          storage.query(IDBKeyRange.only("leopard"), function(err, collection){
            expect(err).to.not.be.ok();
            expect(collection).to.be.an(Object);
            expect(collection.leopard).to.be.ok();
            expect(collection.leopard.legs).to.be(4);
            done();
          });
        });
      });
    });

    it('Update an object in a object store', function(done) {
      db.getObjectStore('animals', function(err, storage){
        storage.setObject('monkey', {legs: 4}, function(err){
          expect(err).to.not.be.ok();
          storage.updateObject('monkey', {legs: 2}, function(err){
            expect(err).to.not.be.ok();
            storage.getObject('monkey', function(err, monkey){
              expect(err).to.not.be.ok();
              expect(monkey).to.be.an(Object);
              expect(monkey.legs).to.be(2);
              done();
            });
          });
        });
      });
    });
    
    it('Delete an object from an object store', function(done) {
      db.getObjectStore('animals', function(err, storage){
        storage.setObject('spider', {legs: 4}, function(err){
          expect(err).to.not.be.ok();
          storage.deleteObject('spider', function(err){
            expect(err).to.not.be.ok();
            storage.getObject('spider', function(err, spider){
              expect(err).to.be.ok();
              expect(spider).to.not.be.ok();
              done();
            });
          });
        });
      });
    });
  });
});

