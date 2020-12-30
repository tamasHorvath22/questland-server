const bodyParser = require("body-parser");
const jsonParser = bodyParser.json();
const RealmService = require("../services/realm.service");

module.exports = function (app) {

  /* 
    request: 
    { 
      realmId: the id of the realm,
      studentId: the id of the student,
      pointType: the type of the value,
      value: data to add the current data,
      isDuel: true if value modification comes from a duel
    }
  */
  app.post("/add-value", jsonParser, async (req, res) => {
    res.send(await RealmService.addValue(req.body, res));
  });


  /* 
    request: 
    {
      realmId: the id of the realm,
      pointType: the type of the value,
      value: data to add the current data
    }
  */
  app.post("/add-value-to-all", jsonParser, async (req, res) => {
    res.send(await RealmService.addValueToAll(req.body, res));
  });

  /* 
    request: 
    {
      realmId: the id of the realm,
      value: data to add the current data
    }
  */
  app.post("/change-xp-modifier", jsonParser, async (req, res) => {
    res.send(await RealmService.changeXpModifier(req.body, res));
  });

  /* 
    request: 
    {
      realmId: the id of the realm,
      value: data to add the current data
    }
  */
  app.post("/change-mana-modifier", jsonParser, async (req, res) => {
    res.send(await RealmService.changeManaModifier(req.body, res));
  });

  /* 
    request: 
    {
      realmName: the name of the realm
    }
  */
  app.post("/create-realm", jsonParser, async (req, res) => {
    res.send(await RealmService.createRealm(req.body.realmName));
  });

  /* 
    request: 
    {
      realmId: the ID of realm
      students: the list of new students
    }
  */
  app.post("/add-students", jsonParser, async (req, res) => {
    res.send(await RealmService.addStudents(req.body.realmId, req.body.students));
  });

  /* 
    request: 
    { 
      realmId: the id of the realm
    }
  */
  app.post("/add-lesson-xp-to-cumulative-xp", jsonParser, async (req, res) => {
    res.send(await RealmService.addLessonXpToSumXp(req.body.realmId));
  });

  app.get("/realms/:realmId", jsonParser, async (req, res) => {
    res.send(await RealmService.getRealm(req.params.realmId));
  });

  app.get("/realms", jsonParser, async (req, res) => {
    res.send(await RealmService.getRealms(res));
  });

  app.get("/classes", jsonParser, async (req, res) => {
    res.send(await RealmService.getClasses());
  });

  // app.post("/sheets", jsonParser, async (req, res) => {
  //   res.send(await SpreadsheetService.createSheet(req.body));
  // });

  // app.delete("/sheets/:sheetId", jsonParser, async (req, res) => {
  //   res.send(await SpreadsheetService.deleteSheet(req.params.sheetId));
  // });
};
