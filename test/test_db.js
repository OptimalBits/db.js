define(['db'], function(DBFactory) {

  var text1 = "Lorem Ipsum",
    text2 = "dolor sit amet",
    text3 = "",

    url1 = 'http://localhost:8080/fixtures/lorem.txt',
    url2 = 'http://localhost:8080/fixtures/ipsum.txt',
    url3 = 'http://localhost:8080/fixtures/long.txt',
    url4 = 'http://localhost:8080/fixtures/asdf.txt',
    url5 = 'http://localhost:8080/fixtures/qwer.txt',
    url6 = 'http://localhost:8080/fixtures/dsgbv.txt';

  for (var i = 0; i < 1000; i++) {
    text3 += "a";
  }

  describe('Database', function() {
    var db;
    
    before(function(done){
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
      db.getObjectStore('test1', function(err, storage){
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

