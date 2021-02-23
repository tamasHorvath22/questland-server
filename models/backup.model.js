const mongoose = require('mongoose');
const schemas = require('../constants/schemas');
const Schema = mongoose.Schema;

const backupSchema = new Schema({
  data: { type : Object, required: true },
  time: { type : Number, required: true },
}, { timestamps: true });

module.exports = mongoose.model(schemas.BACKUP, backupSchema);
