const Transaction = require('mongoose-transactions');
const schemas = require('../constants/schemas');

const saveBackup = async (backup) => {
  const transaction = new Transaction(true);
  backup.markModified('realms');
  transaction.insert(schemas.BACKUP_LIST, backup);
  try {
    const result = await transaction.run();
    return result[0];
  } catch (err) {
    console.error(err);
    await transaction.rollback();
    return false;
  }
}

module.exports = {
  saveBackup: saveBackup
}
