"use strict";

const mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  mongoosePaginate = require('mongoose-paginate');

mongoosePaginate.paginate.options = {
  limit: 3 // how many records on each page
};

const PetSchema = new Schema({
  name: { type: String, required: true }
  , birthday: { type: String, required: true }
  , species: { type: String, required: true }
  , picUrl: { type: String }
  , picUrlSq: { type: String }
  , avatarUrl: { type: String, required: true }
  , favoriteFood: { type: String, required: true }
  , description: { type: String, minlength: 40, required: true }
  , price: { type: Number, required: true }
}, {
  timestamps: true
});

PetSchema.index({ name: 'text', species: 'text', favoriteFood: 'text', description: 'text' });

PetSchema.plugin(mongoosePaginate);


module.exports = mongoose.model('Pet', PetSchema);
