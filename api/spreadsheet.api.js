const bodyParser = require("body-parser");
const jsonParser = bodyParser.json();
const SpreadsheetService = require("../services/spreadsheet.service");

module.exports = function (app) {
  
  /* 
    request: 
    { 
      sheetIndex: the index of the sheet,
      studentId: the index of the row,
      header: the name of the column we looking for,
      value: data to add the current data,
      isDuel: true if value modification comes from a duel
    }
  */
  app.post("/add-value", jsonParser, async (req, res) => {
    res.send(await SpreadsheetService.addValue(req.body, res));
  });


  /* 
    request: 
    { 
      sheetIndex: the index of the sheet,
      header: the name of the column we want to add values,
      value: data to add the current data in that cell
      studentIndexes: the indices of the rows
    }
  */
  app.post("/add-value-to-all", jsonParser, async (req, res) => {
    res.send(await SpreadsheetService.addValueToAll(req.body, res));
  });

  /* 
    request: 
    { 
      sheetIndex: the index of the sheet,
      studentIndexes: the indices of the rows
    }
  */
  app.post("/add-lesson-xp-to-cumulative-xp", jsonParser, async (req, res) => {
    res.send(await SpreadsheetService.addLessonXpToSumXp(req.body.sheetIndex, req.body.studentIndexes));
  });

  app.get("/classes/:sheetIndex", jsonParser, async (req, res) => {
    res.send(await SpreadsheetService.getClass(req.params.sheetIndex));
  });

  app.get("/classes", jsonParser, async (req, res) => {
    res.send(await SpreadsheetService.getClasses(res));
  });

  app.post("/sheets", jsonParser, async (req, res) => {
    res.send(await SpreadsheetService.createSheet(req.body));
  });

  app.delete("/sheets/:sheetId", jsonParser, async (req, res) => {
    res.send(await SpreadsheetService.deleteSheet(req.params.sheetId));
  });
};
