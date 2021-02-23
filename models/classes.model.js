const mongoose = require('mongoose');
const schemas = require('../constants/schemas');
const Schema = mongoose.Schema;

const classesSchema = new Schema({
  classes: { type : Array, required: true },
  tresholds: { type : Object, required: true }
}, { timestamps: true });

module.exports = mongoose.model(schemas.CLASSES, classesSchema);
