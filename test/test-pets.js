const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../server');
const should = chai.should();
const Pet = require('../models/pet');

const fido =     {
  "name": "Norman",
  "species": "Greyhound",
  "birthday": "2008-11-11",
  "favoriteFood": "Liver",
  "picUrl": "http://www.gpamass.com/s/img/emotionheader713297504.jpg",
  "picUrlSq": "https://www.collinsdictionary.com/images/thumb/greyhound_21701074_250.jpg",
  "avatarUrl": "https://www.collinsdictionary.com/images/thumb/greyhound_21701074_250.jpg",
  "description": "Fido is a dog and he's a good dog who loves to play and hang out with his owners. He also likes to nap and enjoys eating dog food",
  "price": 9.99,
}

chai.use(chaiHttp);

describe('Pets', () => {
  after(() => {
    Pet.deleteMany({ name: { $in: ['Norman', 'Spider'] } }).exec((err, result) => {
      console.log(`Deleted ${result.deletedCount} documents`);
    });
  });

  // TEST INDEX
  it('should index ALL pets on / GET', (done) => {
    chai.request(server)
        .get('/')
        .end((err, res) => {
          res.should.have.status(200);
          res.should.be.html;
          done();
        });
  });

  // TEST NEW
  it('should display new form on /pets/new GET', (done) => {
    chai.request(server)
      .get(`/pets/new`)
        .end((err, res) => {
          res.should.have.status(200);
          res.should.be.html
          done();
        });
  });

  // TEST CREATE
  it('should create a SINGLE pet on /pets POST', (done) => {
    chai.request(server)
      .post('/pets')
      .send(fido)
      .set('Content-Type', 'application/json')
      .end((err, res) => {
        res.should.have.status(200);
        res.should.be.json;
        done();
      });
  });

  // TEST SHOW
  it('should show a SINGLE pet on /pets/<id> GET', (done) => {
    var pet = new Pet(fido);
    pet.save((err, data) => {
      if (err) {
        console.error('Error saving pet:', err);
        done(err);
        return;
      }

      chai.request(server)
        .get(`/pets/${data._id}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.should.be.html;
          done();
        });
    });
  });

  // TEST EDIT
  it('should edit a SINGLE pet on /pets/<id>/edit GET', (done) => {
    var pet = new Pet(fido);
    pet.save((err, data) => {
      if (err) {
        console.error('Error saving pet:', err);
        done(err);
        return;
      }

      chai.request(server)
        .get(`/pets/${data._id}/edit`)
        .end((err, res) => {
          res.should.have.status(200);
          res.should.be.html;
          done();
        });
    });
  });

  // TEST UPDATE
  it('should update a SINGLE pet on /pets/<id> PUT', (done) => {
    var pet = new Pet(fido);
    pet.save((err, data) => {
      if (err) {
        console.error('Error saving pet:', err);
        done(err);
        return;
      }

      chai.request(server)
        .put(`/pets/${data._id}`)
        .send({ 'name': 'Spider' })
        .end((err, res) => {
          res.should.have.status(200);
          res.should.be.html;
          done();
        });
    });
  });

  // TEST DELETE
  it('should delete a SINGLE pet on /pets/<id> DELETE', (done) => {
    var pet = new Pet(fido);
    pet.save((err, data) => {
      if (err) {
        console.error('Error saving pet:', err);
        done(err);
        return;
      }

      chai.request(server)
        .delete(`/pets/${data._id}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.should.be.html;
          done();
        });
    });
  });

  // SEARCH
  it('should search ALL pets by name on /search GET', (done) => {
    chai.request(server)
      .get('/search?term=norman')
      .end((err, res) => {
        res.should.have.status(200);
        res.should.be.html;
        done();
      });
  });

  it('should list ALL pets on /pets GET', function (done) {
    chai.request(server)
      .get('/')
      .set('content-type', 'application/json')
      .end(function (err, res) {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('object');
        done();
      });
  });
});


