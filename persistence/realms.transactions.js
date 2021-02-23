const Transaction = require('mongoose-transactions');
const schemas = require('../constants/schemas');

const saveRealm = async (realm) => {
  const transaction = new Transaction(true);
  realm.markModified('students');
  realm.markModified('clans');
  transaction.insert(schemas.REALM, realm);
  try {
    const result = await transaction.run();
    return result[0];
  } catch (err) {
    console.error(err);
    await transaction.rollback();
    return false;
  }
}

const saveAfterReset = async (realm, backup) => {
  const transaction = new Transaction(true);
  realm.markModified('students');
  realm.markModified('clans');
  backup.markModified('realms');
  transaction.insert(schemas.REALM, realm);
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
  saveRealm: saveRealm,
  saveAfterReset: saveAfterReset
}
