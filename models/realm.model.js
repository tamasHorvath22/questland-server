const mongoose = require('mongoose');
const schemas = require('../constants/schemas');
const Schema = mongoose.Schema;

const realmSchema = new Schema({
  name: { type : String, required: true },
  students: { type : Array, required: true },
  clans: { type : Array, required: true }
}, { timestamps: true });

module.exports = mongoose.model(schemas.REALM, realmSchema);

