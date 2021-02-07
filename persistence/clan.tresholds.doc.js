const ClanTresholds = require('../models/clan.tresholds.model');
const responseMessage = require('../constants/api-response-messages');

module.exports = {
  getClanTresholds: getClanTresholds
}

async function getClanTresholds() {
  try {
    const elements = await ClanTresholds.find({}).exec();
    if (!elements.length) {
      return responseMessage.CLAN_TRESHOLDS.NO_ELEMENT;
    }
    return elements[0]
  } catch(err) {
    console.error(err);
    return responseMessage.DATABASE.ERROR;
  }
}
