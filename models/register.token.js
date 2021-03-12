const mongoose = require('mongoose');
const schemas = require('../constants/schemas');
const Schema = mongoose.Schema;

let registerTokenSchema = new Schema({
  role: { type : String },
  studentData: { type : Object }
}, { timestamps: true });

module.exports = mongoose.model(schemas.REGISTER_TOKEN, registerTokenSchema);
