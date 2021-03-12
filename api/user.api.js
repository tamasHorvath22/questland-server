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
  // app.post("/login", jsonParser, async (req, res) => {
  //   const user = await UserService.login(req.body);
  //   res.send(user);
  // });

  /* 
    request: 
    { 
      username: username,
      password: password,
      token: token
    }
  */
  // app.post("/register", jsonParser, async function (req, res) {
  //   res.send(await UserService.register(req.body));
  // });

  // /* 
  //   request: TODO
  //   { 
  //     username: username,
  //     password: password,
  //     token: token
  //   }
  // */
  // app.post("/auth", jsonParser, async function (req, res) {
  //   res.send(await UserService.register(req.body));
  // });

  app.post("/auth/google", jsonParser, async (req, res) => {
    res.send(await UserService.handleAuthUser(req.body));
  })

  // app.get("/auth/google/callback", passport.authenticate('google', { failureRedirect: '/' }), (req, res) => {
  //   // console.log(req);
  //   res.send('majd ezt jól küldöm jól')
  // })




};
