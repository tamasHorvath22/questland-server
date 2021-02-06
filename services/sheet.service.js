const { GoogleSpreadsheet } = require("google-spreadsheet");
const doc = new GoogleSpreadsheet(process.env.GOOGLE_SPREADSHEET_ID);
const responseMessage = require("../constants/api-response-messages");
const sheetHeaders = require("../constants/sheet.headers");
const sleep = require('util').promisify(setTimeout);

const loadSpreadsheet = async () => {
  try {
    await doc.useServiceAccountAuth({
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n")
    });
    await doc.loadInfo();
    return doc;
  } catch (err) {
    console.log(err);
    return false;
  }
}

const accessSpreadsheet = async (realmName) => {
  await loadSpreadsheet();
  // TODO add sheet name to realm object to DB
  return doc.sheetsByTitle[realmName];
};

module.exports = {
  loadSpreadsheet: loadSpreadsheet,
  accessSpreadsheet: accessSpreadsheet
};
