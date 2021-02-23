const jwt = require("jsonwebtoken");
const userApi = require("./user.api");
const spreadsheetApi = require("./spreadsheet.api");
const realmApi = require("./realm.api");
const config = require("../config");
const responseMessage = require("../constants/api-response-messages");
const bodyParser = require("body-parser");
const jsonParser = bodyParser.json();

module.exports = function (app, ProtectedRoutes) {
  app.use("/api", ProtectedRoutes);

  ProtectedRoutes.use((req, res, next) => {
    let token = req.headers['authorization'];
    if (token) {
      if (token.startsWith('Bearer ')) {
        token = token.slice(7);
      }
      jwt.verify(token, config.getJwtPrivateKey(), (err, decoded) => {
        if (err) {
          res.send(responseMessage.USER.TOKEN_ERROR);
          return;
        } else {
          req.decoded = decoded;
          next();
        }
      });
    } else {
      res.send(responseMessage.USER.MISSING_TOKEN);
    }
  });

  // ProtectedRoutes.get("/logged-in", jsonParser, async (req, res) => {
  //   res.send({ username: req.decoded.username });
  // });

  userApi(app);
  // spreadsheetApi(ProtectedRoutes);
  realmApi(ProtectedRoutes)
};
