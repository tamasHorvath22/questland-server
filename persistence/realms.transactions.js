const Transaction = require('mongoose-transactions');
const schemas = require('../constants/schemas');

const saveRealm = async (realm) => {
  const transaction = new Transaction(true);
  realm.markModified('students');
  transaction.insert(schemas.REALM, realm);
  try {
    await transaction.run();
    return true
  } catch (err) {
    console.error(err);
    await transaction.rollback();
    return false;
  }
}

module.exports = {
  saveRealm: saveRealm
}
