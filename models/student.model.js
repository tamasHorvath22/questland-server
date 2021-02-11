const mongoose = require('mongoose');
const schemas = require('../constants/schemas');
const Schema = mongoose.Schema;
const StudProp = require('../constants/student.properties');

const studentSchema = new Schema({
  [StudProp.NAME]: { type : String, required: true },
  [StudProp.CLASS]: { type : String, required: true },
  [StudProp.CLAN]: { type : String, required: true },
  [StudProp.LEVEL]: { type : Number, required: true },
  [StudProp.CUMULATIVE_XP]: { type : Number, required: true },
  [StudProp.XP_MODIFIER]: { type : Number, required: true },
  [StudProp.LESSON_XP]: { type : Number, required: true },
  [StudProp.MANA_POINTS]: { type : Number, required: true },
  [StudProp.MANA_MODIFIER]: { type : Number, required: true },
  [StudProp.SKILL_COUNTER]: { type : Number, required: true },
  [StudProp.PET_FOOD]: { type : Number, required: true },
  [StudProp.CURSE_POINTS]: { type : Number, required: true },
  [StudProp.DUEL_COUNT]: { type : Number, required: true },
}, { timestamps: true });

module.exports = mongoose.model(schemas.STUDENT, studentSchema);
