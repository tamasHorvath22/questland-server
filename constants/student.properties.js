const keys = require('./sheet.student.keys');

module.exports = Object.freeze({
  [keys.NAME]: 'name',
  [keys.CLAN]: 'clan',
  [keys.CLASS]: 'class',
  [keys.LEVEL]: 'level',
  [keys.CUMULATIVE_XP]: 'cumulativeXp',
  [keys.XP_MODIFIER]: 'xpModifier',
  [keys.LESSON_XP]: 'lessonXp',
  [keys.MANA_POINTS]: 'manaPoints',
  [keys.MANA_MODIFIER]: 'manaModifier',
  [keys.SKILL_COUNTER]: 'skillUsed',
  [keys.PET_FOOD]: 'petFood',
  [keys.CURSE_POINTS]: 'cursePoints',
  [keys.DUEL_COUNT]: 'duelCount',
  [keys.STUDENT_ID]: '_id'
});
