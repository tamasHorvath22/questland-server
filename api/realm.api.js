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
    res.send(await RealmService.addValueToAllApi(req.body, res));
  });

  /* 
    request: 
    {
      realmName: the name of the realm
    }
  */
  app.post("/create-realm", jsonParser, async (req, res) => {
    res.send(await RealmService.createRealm(req.body.realmName, req.decoded.userId));
  });

  /* 
    request: 
    {
      realmId: the Id of the realm to reset
    }
  */
  app.post("/reset-realm", jsonParser, async (req, res) => {
    res.send(await RealmService.resetRealmApi(req.body.realmId));
  });

  /* 
    request: 
    {
      realmId: the ID of realm
      students: the list of new students -> { name: student name, class: class, clan: clan }
    }
  */
  app.post("/add-students", jsonParser, async (req, res) => {
    res.send(await RealmService.addStudentsApi(req.body.realmId, req.body.students));
  });

  /* 
    request: 
    {
      realmId: the ID of realm
      points: list of points objects { name, id, xp, grade }
    }
  */
  app.post("/add-test", jsonParser, async (req, res) => {
    res.send(await RealmService.addTestApi(req.body.realmId, req.body.points));
  });

  /* 
    request: 
    {
      student: the modified student -> { name, class, clan, xpModifier, manaModifier }
    }
  */
  app.post("/save-modified-student", jsonParser, async (req, res) => {
    res.send(await RealmService.saveModifiedStudentApi(req.body.student));
  });

  /* 
    request: 
    {
      realmId: the ID of realm
      clans: the list of clan names
    }
  */
  app.post("/add-clans", jsonParser, async (req, res) => {
    res.send(await RealmService.createClansApi(req.body.realmId, req.body.clans));
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
      realmId: the ID of the realm,
      lessonMana: the value of mana given after a lesson,
      xpStep: the value of XP added default,
      manaStep: the value of mana added default
    }
  */
  app.post("/set-realm-steps", jsonParser, async (req, res) => {
    res.send(await RealmService.setRealmDefaultSteps(
      req.body.realmId,
      req.body.lessonMana,
      req.body.xpStep,
      req.body.manaStep
    ));
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
    res.send(await RealmService.addLessonXpToSumXpApi(req.body.realmId));
  });

  app.get("/realms/:realmId", jsonParser, async (req, res) => {
    res.send(await RealmService.getRealm(req.params.realmId, req.decoded.userId));
  });

  app.get("/backup/:realmId", jsonParser, async (req, res) => {
    res.send(await RealmService.getBackupData(req.params.realmId));
  });

  app.get("/realms", jsonParser, async (req, res) => {
    res.send(await RealmService.getRealms(req.decoded.userId));
  });

  app.get("/create-teacher-invite", jsonParser, async (req, res) => {
    res.send(await RealmService.createTeacherInvite());
  });

  /* 
    request: 
    { 
      realmId: the id of the realm
    }
  */
  app.post("/get-possible-collaborators", jsonParser, async (req, res) => {
    res.send(await RealmService.getPossibleCollaboratorsApi(req.body.realmId, req.decoded.userId));
  });

  /* 
    request: 
    { 
      realmId: the id of the realm
    }
  */
  app.post("/get-collaborators", jsonParser, async (req, res) => {
    res.send(await RealmService.getCollaboratorsApi(req.body.realmId, req.decoded.userId));
  });

  /* 
    request: 
    { 
      realmId: the id of the realm
      collaborators: user IDs to add or remove
      isAdd: true if add, false if remove
    }
  */
  app.post("/save-collaborators", jsonParser, async (req, res) => {
    res.send(await RealmService.saveCollaboratorsApi(req.decoded.userId, req.body));
  });

  app.get("/student-data", jsonParser, async (req, res) => {
    res.send(await RealmService.getStudentData(req.decoded.userId));
  });

  app.get("/classes", jsonParser, (req, res) => {
    res.send(RealmService.getClasses());
  });

  // app.post("/sheets", jsonParser, async (req, res) => {
  //   res.send(await SpreadsheetService.createSheet(req.body));
  // });

  // app.delete("/sheets/:sheetId", jsonParser, async (req, res) => {
  //   res.send(await SpreadsheetService.deleteSheet(req.params.sheetId));
  // });
};
