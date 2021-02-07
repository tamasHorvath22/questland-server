const mongoose = require('mongoose');
const schemas = require('../constants/schemas');
const Schema = mongoose.Schema;

const clanTresholdsSchema = new Schema({
  1: { type : Object, required: true },
  2: { type : Object, required: true },
  3: { type : Object, required: true },
  4: { type : Object, required: true },
  5: { type : Object, required: true }
}, { timestamps: true });

module.exports = mongoose.model(schemas.CLAN_TRESHOLDS, clanTresholdsSchema);
