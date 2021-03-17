const express = require("express");
const app = express();
const api = require("./api/api");
const config = require("./config");
const cors = require("cors");
const dbConnection = require("./persistence/database.connection");
const InitService = require('./services/init.service');

app.use(cors());
dbConnection.connectToDatabase(config.getDbConnectionString());

api(app, express.Router());
const port = config.getServerDetails().PORT || 8080;
app.listen(port);
console.log(`server started on port: ${port}`);

(async () => {
  try {
    await InitService.createClasses();
    await InitService.createClanTresholds();
    await InitService.createBackup();
  } catch (e) {
    console.log(e)
}
})();
