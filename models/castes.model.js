const mongoose = require('mongoose');
const schemas = require('../constants/schemas');
const Schema = mongoose.Schema;

const castesSchema = new Schema({
  castes: { type : Array, required: true }
}, { timestamps: true });

module.exports = mongoose.model(schemas.CASTES, castesSchema);

