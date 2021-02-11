
const keys = require('./sheet.student.keys');

module.exports = Object.freeze({
  [keys.NAME]: 'Name',
  [keys.CLAN]: 'Clan',
  [keys.CLASS]: 'Class',
  [keys.LEVEL]: 'Level',
  gloryPoints: 'GloryPoints',
  [keys.CUMULATIVE_XP]: 'CUMULATIVE XP',
  [keys.XP_MODIFIER]: 'XP\nmodifiers',
  [keys.LESSON_XP]: 'LESSON XP',
  [keys.MANA_POINTS]: 'MANA POINTS',
  [keys.MANA_MODIFIER]: 'MANA\nmodifiers',
  [keys.SKILL_COUNTER]: 'Skill uses',
  [keys.PET_FOOD]: 'Pet Food',
  [keys.CURSE_POINTS]: 'CURSE POINTS',
  // NOT_PRESENT: 'Not\npresent',
  [keys.DUEL_COUNT]: 'Duels',
  [keys.STUDENT_ID]: 'studentId'
});
