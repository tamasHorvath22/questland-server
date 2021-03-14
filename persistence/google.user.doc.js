const GoogleUser = require('../models/google.user.model');
const responseMessage = require('../constants/api-response-messages');

module.exports = {
  getUserById: getUserById
  // getUserByUsername: getUserByUsername,
}

async function getUserById(id) {
  try {
    return await GoogleUser.findById(id).exec();
  } catch(err) {
    console.error(err);
    return responseMessage.DATABASE.ERROR;
  }
}

// async function getUserByUsername(username) {
//   try {
//     return await User.findOne({ username: username }).exec();
//   } catch(err) {
//     console.error(err);
//     return responseMessage.DATABASE.ERROR;
//   }
// }
