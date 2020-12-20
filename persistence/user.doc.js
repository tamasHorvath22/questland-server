const User = require('../models/user.model');
const responseMessage = require('../constants/api-response-messages');

module.exports = {
  getUserById: getUserById,
  getUserByUsername: getUserByUsername,
  getUserByEmail: getUserByEmail,
  getAllUsers: getAllUsers
}

async function getUserById(id) {
  try {
    return await User.findById(id).exec();
  } catch(err) {
    console.error(err);
    return responseMessage.DATABASE.ERROR;
  }
}

async function getUserByUsername(username) {
  try {
    return await User.findOne({ username: username }).exec();
  } catch(err) {
    console.error(err);
    return responseMessage.DATABASE.ERROR;
  }
}

async function getUserByEmail(email) {
  try {
    return await User.findOne({ email: email }).exec();
  } catch(err) {
    console.error(err);
    return responseMessage.DATABASE.ERROR;
  }
}

async function getAllUsers() {
  try {
    return await User.find({}).exec();
  } catch(err) {
    console.error(err);
    return responseMessage.DATABASE.ERROR;
  }
}
