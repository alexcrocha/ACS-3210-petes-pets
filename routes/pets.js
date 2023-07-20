// MODELS
const Pet = require('../models/pet');

const mailer = require('../utils/mailer');

// UPLOADING TO AWS S3
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const Upload = require('s3-uploader');

const client = new Upload(process.env.S3_BUCKET, {
  aws: {
    path: 'pets/avatar',
    region: process.env.S3_REGION,
    acl: 'public-read',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  },
  cleanup: {
    versions: true,
    original: true
  },
  versions: [{
    maxWidth: 400,
    aspect: '16:10',
    suffix: '-standard'
  }, {
    maxWidth: 300,
    aspect: '1:1',
    suffix: '-square'
  }]
});

// PET ROUTES
module.exports = (app) => {

  // INDEX PET => index.js

  // NEW PET
  app.get('/pets/new', (req, res) => {
    res.render('pets-new');
  });

  // CREATE PET
  app.post('/pets', upload.single('avatar'), (req, res, next) => {
    var pet = new Pet(req.body);
    pet.save(function (err) {
      if (req.file) {
        // Upload the images
        client.upload(req.file.path, {}, function (err, versions, meta) {
          if (err) { return res.status(400).send({ err: err }) };

          // Pop off the -square and -standard and just use the one URL to grab the image
          versions.forEach(function (image) {
            var urlArray = image.url.split('-');
            urlArray.pop();
            var url = urlArray.join('-');
            pet.avatarUrl = url;
            pet.save();
          });

          res.send({ pet: pet });
        });
      } else {
        res.send({ pet: pet });
      }
    })
  })

  // SHOW PET
  app.get('/pets/:id', (req, res) => {
    Pet.findById(req.params.id).exec((err, pet) => {
      res.render('pets-show', { pet: pet });
    });
  });

  // EDIT PET
  app.get('/pets/:id/edit', (req, res) => {
    Pet.findById(req.params.id).exec((err, pet) => {
      res.render('pets-edit', { pet: pet });
    });
  });

  // UPDATE PET
  app.put('/pets/:id', (req, res) => {
    Pet.findByIdAndUpdate(req.params.id, req.body)
      .then((pet) => {
        res.redirect(`/pets/${pet._id}`)
      })
      .catch((err) => {
        // Handle Errors
      });
  });

  // DELETE PET
  app.delete('/pets/:id', (req, res) => {
    Pet.findByIdAndRemove(req.params.id).exec((err, pet) => {
      return res.redirect('/')
    });
  });

  // SEARCH PET
  app.get('/search', (req, res) => {
    const term = req.query.term;
    const page = req.query.page || 1;

    Pet.paginate(
      { $text: { $search: term } },
      {
        page: page,
        limit: 20,
        sort: { score: { $meta: "textScore" } },
        score: { $meta: "textScore" }
      }
    ).then((results) => {
      if (results.docs && results.docs.length) {
        // If results are found using text search
        if (req.header('Content-Type') == 'application/json') {
          return res.json({ pets: results.docs, pagesCount: results.pages, currentPage: page });
        } else {
          return res.render('pets-index', { pets: results.docs, pagesCount: results.pages, currentPage: page, term: term });
        }
      } else {
        // Fallback to the regex search method if no results are found using text search
        const regexTerm = new RegExp(term, 'i');
        Pet.paginate(
          {
            $or: [
              { 'name': regexTerm },
              { 'species': regexTerm }
            ]
          },
          { page: page, limit: 20 }
        ).then((regexResults) => {
          res.render('pets-index', { pets: regexResults.docs, pagesCount: regexResults.pages, currentPage: page, term: term });
        });
      }
    }).catch((err) => {
      return res.status(400).send(err);
    });
  });
}

// PURCHASE
app.post('/pets/:id/purchase', (req, res) => {
  console.log(req.body);

  const stripe = require("stripe")(process.env.PRIVATE_STRIPE_API_KEY);
  // Token is created using Checkout or Elements!
  // Get the payment token ID submitted by the form:
  const token = req.body.stripeToken; // Using Express
  // req.body.petId can become null through seeding,
  // this way we'll insure we use a non-null value
  let petId = req.body.petId || req.params.id;
  Pet.findById(petId).exec((err, pet) => {
    if (err) {
      console.log('Error: ' + err);
      res.redirect(`/pets/${req.params.id}`);
    }
    const charge = stripe.charges.create({
      amount: pet.price * 100,
      currency: 'usd',
      description: `Purchased ${pet.name}, ${pet.species}`,
      source: token,
    }).then((chg) => {
      // Convert the amount back to dollars for ease in displaying in the template
      const user = {
        email: req.body.stripeEmail,
        amount: chg.amount / 100,
        petName: pet.name
      };
      // Call our mail handler to manage sending emails
      mailer.sendMail(user, req, res);
    })
      .catch(err => {
        console.log('Error: ' + err);
      });
  })
});
