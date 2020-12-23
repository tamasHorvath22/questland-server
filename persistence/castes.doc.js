const Castes = require('../models/castes.model');
const responseMessage = require('../constants/api-response-messages');

module.exports = {
  getCastes: getCastes
}

async function getCastes() {
  try {
    const elements = await Castes.find({}).exec();
    if (!elements.length) {
      return responseMessage.DATABASE.ERROR;
    }
    return elements[0]
  } catch(err) {
    console.error(err);
    return responseMessage.DATABASE.ERROR;
  }
}
