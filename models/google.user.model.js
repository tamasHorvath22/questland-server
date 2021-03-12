const mongoose = require('mongoose');
const schemas = require('../constants/schemas');
const Schema = mongoose.Schema;

let googleUserSchema = new Schema({
  nickname: { type : String },
  firstName: { type : String },
  lastName: { type : String },
  role: { type : String },
  studentData: { type : Object }
}, { timestamps: true });

module.exports = mongoose.model(schemas.GOOGE_USER, googleUserSchema);
