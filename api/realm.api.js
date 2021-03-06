const bodyParser = require("body-parser");
const jsonParser = bodyParser.json();
const RealmService = require("../services/realm.service");
const SheetService = require("../services/sheet.service");

module.exports = function (app) {

  /* 
    request: 
    { 
      realmId: the id of the realm,
      studentId: the id of the student,
      pointType: the type of the value,
      value: data to add the current data,
      isDuel: true if value modification comes from a duel
      isWinner: if that was a duel, defines who the winner was
    }
  */
  app.post("/add-value", jsonParser, async (req, res) => {
    res.send(await RealmService.addValueApi(req.body));
  });

  /* 
    request: 
    {
      realmId: the id of the realm,
      pointType: the type of the value,
      value: data to add the current data
      exclude: array of student Id strings, these students don't get points
    }
  */
  app.post("/add-value-to-all", jsonParser, async (req, res) => {
    res.send(await RealmService.addValueToAll(req.body, res));
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
      realmId: the Id of the realm to reset
    }
  */
  app.post("/reset-realm", jsonParser, async (req, res) => {
    res.send(await RealmService.resetRealm(req.body.realmId));
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
      realmId: the ID of realm
      points: list of points objects { name, id, xp, grade }
    }
  */
  app.post("/add-test", jsonParser, async (req, res) => {
    res.send(await RealmService.addTest(req.body.realmId, req.body.points));
  });

  /* 
    request: 
    {
      realm: the modified realm
    }
  */
  app.post("/modify-realm", jsonParser, async (req, res) => {
    res.send(await RealmService.modifyRealm(req.body.realm));
  });

  /* 
    request: 
    {
      realmId: the ID of realm
      clans: the list of clan names
    }
  */
  app.post("/add-clans", jsonParser, async (req, res) => {
    res.send(await RealmService.createClans(req.body.realmId, req.body.clans));
  });

  /* 
    request: 
    {
      realmId: the ID of realm
      clanId: the ID of clan,
      points: the points to add
    }
  */
  app.post("/add-glory-points", jsonParser, async (req, res) => {
    res.send(await RealmService.addGloryPoints(
      req.body.realmId,
      req.body.clanId,
      req.body.points
    ));
  });

  /* 
    request: 
    {
      lessonMana: the value of mana given after a lesson
    }
  */
  app.post("/set-lesson-mana", jsonParser, async (req, res) => {
    res.send(await RealmService.setLessonMana(req.body.realmId, req.body.lessonMana));
  });

  /* 
    request: 
    {
      realmId: the ID of realm
      time: the timestamp of backup
    }
  */
  app.post("/sync-backup", jsonParser, async (req, res) => {
    res.send(await SheetService.syncBackup(req.body.realmId, req.body.time));
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

  app.get("/backup/:realmId", jsonParser, async (req, res) => {
    res.send(await RealmService.getBackupData(req.params.realmId));
  });

  app.get("/realms", jsonParser, async (req, res) => {
    res.send(await RealmService.getRealms());
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
