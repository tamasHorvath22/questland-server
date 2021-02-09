const { GoogleSpreadsheet } = require("google-spreadsheet");
const doc = new GoogleSpreadsheet(process.env.GOOGLE_SPREADSHEET_ID);
const responseMessage = require("../constants/api-response-messages");
const RealmDoc = require('../persistence/realm.doc');
const StudProp = require('../constants/student.properties');
const CommonKeys = require('../constants/sheet.student.keys');
const SheetHeaders = require('../constants/sheet.headers');
const BackupService = require('../services/backup.service');
const _ = require('underscore');
const sleep = require('util').promisify(setTimeout);

const loadSpreadsheet = async () => {
  try {
    await doc.useServiceAccountAuth({
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n")
    });
    await doc.loadInfo();
    return doc;
  } catch (err) {
    console.log(err);
    return false;
  }
}

const accessSpreadsheet = async (realmName) => {
  await loadSpreadsheet();
  // TODO add sheet name to realm object to DB
  return doc.sheetsByTitle[realmName];
};

const syncBackup = async (realmId, time) => {
  const backup = await BackupService.getBackup();
  const realmBackups = backup.realms[realmId.toString()];
  const backupRealm = realmBackups.list.find(elem => elem.time === time);
  const sheetName = `${backupRealm.data.name} backup`
  await syncSheet(backupRealm.data, sheetName);
}

const syncSheet = async (realm, sheetName) => {
  let sheet = await accessSpreadsheet(sheetName);
  if (!sheet) {
    await createSheetForNewRealm(sheetName);
    sheet = await accessSpreadsheet(sheetName);
  }
  const rows = await sheet.getRows();
  const clansInUse = getClansInUseCount(realm.students)
  const numOfRows = realm.students.length + clansInUse;
  const clanAddedToStudent = isClanAddedToStudent(realm.students, rows);
  
  if (rows.length !== numOfRows || clanAddedToStudent) {
    await sheet.delete();
    const isSheetCreated = await createSheetForNewRealm(sheetName);
    if (!isSheetCreated) {
      return responseMessage.SHEET.SYNC_FAIL;
    }
    sortStudents(realm);
    await addStudentsToSheet(realm._id, sheetName, realm.students);
  }
  await syncStudentData(realm.students, sheetName);
}

const getClansInUseCount = (students) => {
  const clansInUse = new Set();
  students.forEach(student => {
    if (student.clan) {
      clansInUse.add(student.clan);
    }
  });
  return clansInUse.size;
}

const isClanAddedToStudent = (students, rows) => {
  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    const rowFound = rows.find(row => {
      if (!row[SheetHeaders[CommonKeys.STUDENT_ID]]) {
        return null;
      }
      const rowId = row[SheetHeaders[CommonKeys.STUDENT_ID]].toString();
      const studentId = student[StudProp[CommonKeys.STUDENT_ID]].toString();
      return studentId === rowId;
    });
    if (!rowFound || (!rowFound[SheetHeaders[CommonKeys.CLAN]] && student[StudProp[CommonKeys.CLAN]])) {
      return true;
    }
  }
  return false;
}

const createSheetForNewRealm = async (realmName) => {
  try {
    const googleDoc = await loadSpreadsheet();
    if (!googleDoc) {
      // TODO error handling
      return;
    }
    await googleDoc.addSheet({
      headerValues: Object.values(SheetHeaders),
      title: realmName
    });
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
}

const sortStudents = (realm) => {
  var grouped = _.groupBy(realm.students, 'clan');
  for (let group in grouped) {
    _.sortBy(grouped[group], 'name');
  }
  const result = [];
  Object.keys(grouped).forEach(clan => {
    grouped[clan].forEach(student => {
      result.push(student);
    })
  })
  realm.students = result;
}

const addStudentsToSheet = async (realmId, realmName, students) => {
  const realm = await RealmDoc.getById(realmId);
  if (realm === responseMessage.DATABASE.ERROR) {
    return responseMessage.DATABASE.ERROR;
  }
  const isSheetLoaded = await loadSpreadsheet();
  if (!isSheetLoaded) {
    return false;
  }
  const sheet = await accessSpreadsheet(realmName);
  let currentClanId = null;
  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    const currentClan = findElemById(realm.clans, student[StudProp[CommonKeys.CLAN]]);
    let currentClanName;
    if (currentClan) {
      currentClanName = currentClan.name;
    }
    if (currentClanName && currentClanId !== student[StudProp[CommonKeys.CLAN]]) {
      await sheet.addRow({
        [SheetHeaders[CommonKeys.CLAN]]: currentClanName
      });
      currentClanId = student[StudProp[CommonKeys.CLAN]];
      await sleep(1100);
    }
    await sheet.addRow({
      [SheetHeaders[CommonKeys.NAME]]: student[StudProp[CommonKeys.NAME]],
      [SheetHeaders[CommonKeys.STUDENT_ID]]: student[StudProp[CommonKeys.STUDENT_ID]],
      [SheetHeaders[CommonKeys.CLAN]]: currentClanName
    });
  }
  return true;
}

const findElemById = (array, id) => {
  return array.find(e => e._id.toString() === id.toString());
}

const syncStudentData = async (students, realmName) => {
  const sheet = await accessSpreadsheet(realmName);
  const rows = await sheet.getRows();

  for (let j = 0; j < students.length; j++) {
    const student = students[j];
    const row = rows.find(row => {
      if (!row[SheetHeaders[CommonKeys.STUDENT_ID]]) {
        return null;
      }
      const rowId = row[SheetHeaders[CommonKeys.STUDENT_ID]].toString();
      const studentId = student[StudProp[CommonKeys.STUDENT_ID]].toString();
      return studentId === rowId;
    });
    if (!row) {
      return;
    }
    const keys = Object.values(CommonKeys);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (key === 'CLAN') {
        continue;
      }
      row[SheetHeaders[key]] = student[StudProp[key]];
    }
    await row.save();
    await sleep(1100);
  }
}

module.exports = {
  loadSpreadsheet: loadSpreadsheet,
  accessSpreadsheet: accessSpreadsheet,
  syncBackup: syncBackup,
  syncSheet: syncSheet
};
