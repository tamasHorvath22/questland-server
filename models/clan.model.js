const mongoose = require('mongoose');
const schemas = require('../constants/schemas');
const Schema = mongoose.Schema;

const clanSchema = new Schema({
  name: { type : String, required: true },
  gloryPoints: { type : Number, required: true },
  level: { type : Number, required: true },
  students: { type : Array, required: true }
}, { timestamps: true });

module.exports = mongoose.model(schemas.CLAN, clanSchema);
