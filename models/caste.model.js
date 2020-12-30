const mongoose = require('mongoose');
const schemas = require('../constants/schemas');
const Schema = mongoose.Schema;

const casteSchema = new Schema({
  name: { type : String, required: true },
  label: { type : String, required: true }
}, { timestamps: true });

module.exports = mongoose.model(schemas.CASTE, casteSchema);
