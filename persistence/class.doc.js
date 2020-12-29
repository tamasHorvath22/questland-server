const Class = require('../models/class.model');
const responseMessage = require('../constants/api-response-messages');

module.exports = {
  getById: getById,
  getAll: getAll,
  remove: remove
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

async function remove(className) {
  try {
    const eClass = Class.findOne({ name: className })
    await eClass.remove().exec();
  } catch(err) {
    console.error(err);
    return responseMessage.DATABASE.ERROR;
  }
}
