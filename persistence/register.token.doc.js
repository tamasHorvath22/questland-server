const RegisterRoken = require('../models/register.token');
const responseMessage = require('../constants/api-response-messages');
const schemas = require('../constants/schemas');
const Transaction = require('mongoose-transactions');

 const getById = async (id) => {
  try {
    return await RegisterRoken.findById(id).exec();
  } catch(err) {
    console.error(err);
    return responseMessage.DATABASE.ERROR;
  }
}

 const getAll = async () => {
  try {
    return await RegisterRoken.find({}).exec();
  } catch(err) {
    console.error(err);
    return responseMessage.DATABASE.ERROR;
  }
}

 const getByRole = async (role) => {
  try {
    return await RegisterRoken.find({ role: role }).exec();
  } catch(err) {
    console.error(err);
    return responseMessage.DATABASE.ERROR;
  }
}

const removeTokens = async (tokens) => {
  const transaction = new Transaction(true);
  tokens.forEach(token => {
    transaction.remove(schemas.REGISTER_TOKEN, token);
  });
  try {
    await transaction.run();
    return true;
  } catch (err) {
    console.error(err);
    await transaction.rollback();
    return false;
  }
}

const saveToken = async (token) => {
  const transaction = new Transaction(true);
  transaction.insert(schemas.REGISTER_TOKEN, token);
  try {
    await transaction.run();
    return true;
  } catch (err) {
    console.error(err);
    await transaction.rollback();
    return false;
  }
}

module.exports = {
  getById: getById,
  getAll: getAll,
  getByRole: getByRole,
  removeTokens: removeTokens,
  saveToken: saveToken
}