const Classes = require('../models/classes.model');
const responseMessage = require('../constants/api-response-messages');

module.exports = {
  getClasses: getClasses
}

async function getClasses() {
  try {
    const elements = await Classes.find({}).exec();
    if (!elements.length) {
      return responseMessage.CLASSES.NO_ELEMENT;
    }
    return elements[0]
  } catch(err) {
    console.error(err);
    return responseMessage.DATABASE.ERROR;
  }
}
