const bodyParser = require("body-parser");
const jsonParser = bodyParser.json();
const ClassService = require("../services/class.service");

module.exports = function (app) {

  /* 
    request: 
    { 
      classId: the id of the class,
      studentId: the id of the student,
      pointType: the type of the value,
      value: data to add the current data,
      isDuel: true if value modification comes from a duel
    }
  */
  app.post("/add-value", jsonParser, async (req, res) => {
    res.send(await ClassService.addValue(req.body, res));
  });


  /* 
    request: 
    {
      classId: the id of the class,
      pointType: the type of the value,
      value: data to add the current data
    }
  */
  app.post("/add-value-to-all", jsonParser, async (req, res) => {
    res.send(await ClassService.addValueToAll(req.body, res));
  });

  /* 
    request: 
    {
      className: the name of the class
      students: array of students
    }
  */
  app.post("/create-class", jsonParser, async (req, res) => {
    res.send(await ClassService.createClass(req.body.className, req.body.students));
  });

  /* 
    request: 
    { 
      classId: the id of the class
    }
  */
  app.post("/add-lesson-xp-to-cumulative-xp", jsonParser, async (req, res) => {
    res.send(await ClassService.addLessonXpToSumXp(req.body.classId));
  });

  app.get("/classes/:classId", jsonParser, async (req, res) => {
    res.send(await ClassService.getClass(req.params.classId));
  });

  app.get("/classes", jsonParser, async (req, res) => {
    res.send(await ClassService.getClasses(res));
  });

  app.get("/castes", jsonParser, async (req, res) => {
    res.send(await ClassService.getCastes());
  });

  // app.post("/sheets", jsonParser, async (req, res) => {
  //   res.send(await SpreadsheetService.createSheet(req.body));
  // });

  // app.delete("/sheets/:sheetId", jsonParser, async (req, res) => {
  //   res.send(await SpreadsheetService.deleteSheet(req.params.sheetId));
  // });
};
