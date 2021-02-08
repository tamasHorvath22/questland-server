const mongoose = require('mongoose');
const schemas = require('../constants/schemas');
const Schema = mongoose.Schema;

const backupListSchema = new Schema({
  realms: { type : Object, required: true },
}, { timestamps: true });

module.exports = mongoose.model(schemas.BACKUP_LIST, backupListSchema);
