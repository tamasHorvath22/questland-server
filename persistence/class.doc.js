const Class = require('../models/class.model');
const responseMessage = require('../constants/api-response-messages');

module.exports = {
  getById: getById,
  getByname: getByname,
  getAll: getAll
}

async function getById(id) {
  try {
    return await Class.findById(id).exec();
  } catch(err) {
    console.error(err);
    return responseMessage.DATABASE.ERROR;
  }
}

async function getAll() {
  try {
    return await Class.find({}).exec();
  } catch(err) {
    console.error(err);
    return responseMessage.DATABASE.ERROR;
  }
}

async function getByname(username) {
  try {
    return await Class.findOne({ username: username }).exec();
  } catch(err) {
    console.error(err);
    return responseMessage.DATABASE.ERROR;
  }
}
