const express = require("express");
const app = express();
const api = require("./api/api");
const config = require("./config");
const cors = require("cors");
const dbConnection = require("./persistence/database.connection");
const ClassService = require('./services/class.service');
const InitService = require('./services/init.service');
const StudProp = require('./constants/student.properties');

app.use(cors());
dbConnection.connectToDatabase(config.getDbConnectionString());

api(app, express.Router());
app.listen(config.getServerDetails().PORT || 8080);
console.log("server started!");

const data = {
  classId: '5fdcec98b3b3da94d42fc3b5',
  studentId: '5fdcec98b3b3da94d42fc3b0',
  pointType: StudProp.LESSON_XP,
  value: 10,
  isDuel: false
}

const data2 = {
  classId: '5fdcec98b3b3da94d42fc3b5',
  pointType: StudProp.LESSON_XP,
  value: 20
}
// InitService.saveStudent();

// ClassService.addLessonXpToSumXp(data2.classId);
// ClassService.getClass('5fdca45777334750c176538c');
