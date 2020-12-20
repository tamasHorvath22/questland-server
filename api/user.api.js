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

  app.post("/logout", (req, res) => {
    res.clearCookie("questland_token");
    res.send("LOGGED_OUT")
  })

  /* 
    request: 
    { 
      username: username,
      password: password,
      email: email
      firstname: firstname,
      lastname: lastname
    }
  */
  // app.post("/register", jsonParser, async function (req, res) {
  //   res.send(await UserService.register(req.body, res));
  // });
};
