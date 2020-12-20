const Transaction = require('mongoose-transactions');
const schemas = require('../constants/schemas');

const saveClass = async (eClass) => {
  const transaction = new Transaction(true);
  eClass.markModified('students');
  transaction.insert(schemas.CLASS, eClass);
  try {
    await transaction.run();
    return true
  } catch (err) {
    console.error(err);
    transaction.rollback();
    return false;
  }
}

module.exports = {
  saveClass: saveClass
}
