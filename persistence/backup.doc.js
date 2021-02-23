const Backup = require('../models/backup.list.model');
const responseMessage = require('../constants/api-response-messages');

module.exports = {
  getBackup: getBackup
}

async function getBackup() {
  try {
    const elements = await Backup.find({}).exec();
    if (!elements.length) {
      return responseMessage.BACKUP.NO_ELEMENT;
    }
    return elements[0];
  } catch(err) {
    console.error(err);
    return responseMessage.DATABASE.ERROR;
  }
}
