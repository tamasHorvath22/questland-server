const bodyParser = require("body-parser");
const jsonParser = bodyParser.json();
const UserService = require("../services/user.service");

module.exports = function (app) {
  /* 
    request: 
    { 
      username: username,
      password: password
    }
  */
  app.post("/login", jsonParser, async (req, res) => {
    const user = await UserService.login(req.body);
    res.send(user);
  });

  /* 
    request: 
    { 
      username: username,
      password: password,
      token: token
    }
  */
  app.post("/register", jsonParser, async function (req, res) {
    res.send(await UserService.register(req.body));
  });
};
