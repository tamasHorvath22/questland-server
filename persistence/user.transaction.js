const Transaction = require('mongoose-transactions');
const schemas = require('../constants/schemas');

const registerUserDeleteToken = async (googleUser, token) => {
  const transaction = new Transaction(true);
  transaction.insert(schemas.GOOGE_USER, googleUser);
  transaction.remove(schemas.REGISTER_TOKEN, token);
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
  registerUserDeleteToken: registerUserDeleteToken
}
