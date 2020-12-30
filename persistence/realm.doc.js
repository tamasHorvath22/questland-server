const Realm = require('../models/realm.model');
const responseMessage = require('../constants/api-response-messages');

module.exports = {
  getById: getById,
  getAll: getAll,
  remove: remove
}

async function getById(id) {
  try {
    return await Realm.findById(id).exec();
  } catch(err) {
    console.error(err);
    return responseMessage.DATABASE.ERROR;
  }
}

async function getAll() {
  try {
    return await Realm.find({}).exec();
  } catch(err) {
    console.error(err);
    return responseMessage.DATABASE.ERROR;
  }
}

async function remove(realmName) {
  try {
    const realm = Realm.findOne({ name: realmName })
    await realm.remove().exec();
  } catch(err) {
    console.error(err);
    return responseMessage.DATABASE.ERROR;
  }
}
