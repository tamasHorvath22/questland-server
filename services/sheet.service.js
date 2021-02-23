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
  await syncSheet(backupRealm.data, sheetName, time);
}

const syncSheet = async (realm, sheetName, time) => {
  let sheet = await accessSpreadsheet(sheetName);
  if (!sheet) {
    await createSheetForNewRealm(sheetName);
    sheet = await accessSpreadsheet(sheetName);
  }
  const rows = await sheet.getRows();
  sortStudents(realm);
  const clansInUse = getClansInUseCount(realm.students)
  const numOfRows = realm.students.length + clansInUse;
  const studentClanChanged = isStudentClanChanged(realm.students, rows, realm.clans);

  if (rows.length !== numOfRows || studentClanChanged) {
    await sheet.delete();
    const isSheetCreated = await createSheetForNewRealm(sheetName);
    if (!isSheetCreated) {
      return responseMessage.SHEET.SYNC_FAIL;
    }
    await addStudentsToSheet(realm._id, sheetName, realm.students, time);
  }
  await syncStudentData(realm.students, sheetName);
  await syncClansData(realm.clans, sheetName);
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

const isStudentClanChanged = (students, rows, clans) => {
  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    const rowFound = rows.find(row => {
      if (!row[SheetHeaders.STUDENT_ID]) {
        return null;
      }
      const rowId = row[SheetHeaders.STUDENT_ID].toString();
      const studentId = student[StudProp.STUDENT_ID].toString();
      return studentId === rowId;
    });
    let studentClanName;
    if (student[StudProp.CLAN]) {
      const clan = findElemById(clans, student[StudProp.CLAN]);
      studentClanName = clan.name;
    }
    if (
      !rowFound ||
      (!rowFound[SheetHeaders.CLAN] && student[StudProp.CLAN]) ||
      rowFound[SheetHeaders.CLAN] && rowFound[SheetHeaders.CLAN] !== studentClanName
    ) {
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
    // if there are students with no clans, they are pushed to the end
    if (clan === 'null') {
      return;
    }
    grouped[clan].forEach(student => {
      result.push(student);
    })
  })
  // if there are students with no clans, they are handeled here
  if (grouped.null) {
    grouped.null.forEach(student => {
      result.push(student);
    })
  }
  realm.students = result;
}

const addStudentsToSheet = async (realmId, realmName, students, time) => {
  const realm = await RealmDoc.getById(realmId);
  if (realm === responseMessage.DATABASE.ERROR) {
    return responseMessage.DATABASE.ERROR;
  }
  const isSheetLoaded = await loadSpreadsheet();
  if (!isSheetLoaded) {
    return false;
  }
  const sheet = await accessSpreadsheet(realmName);

  let currentClan;
  let prevClanName;
  let currentClanName;

  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    if (student[StudProp[CommonKeys.CLAN]]) {
      currentClan = findElemById(realm.clans, student[StudProp[CommonKeys.CLAN]]);
      if (currentClan) {
        currentClanName = currentClan.name;
      }
    } else {
      currentClanName = null
    }
    // if the clan does not exist on the sheet yet
    if (currentClanName && currentClanName !== prevClanName) {
      await sheet.addRow({
        [SheetHeaders.clanName]: currentClanName,
        [SheetHeaders.clanLevel]: currentClan.level,
        [SheetHeaders.gloryPoints]: currentClan.gloryPoints
      });
      prevClanName = currentClanName;
      await sleep(1100);
    }
    // student base data added to sheet
    await sheet.addRow({
      [SheetHeaders[CommonKeys.NAME]]: student[StudProp[CommonKeys.NAME]],
      [SheetHeaders[CommonKeys.STUDENT_ID]]: student[StudProp[CommonKeys.STUDENT_ID]],
      [SheetHeaders[CommonKeys.CLAN]]: currentClanName
    });
    await sleep(1100);
  }
  // if it is a backup sync, the backup save date is added to sheet
  if (time) {
    const dateString = getDateString(time);
    await sheet.addRow({
      [SheetHeaders[CommonKeys.NAME]]: dateString
    });
  }
  return true;
}

const getDateString = (timestamp) => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = twoDigits(date.getMonth() + 1);
  const day = twoDigits(date.getDate());
  const hour = twoDigits(date.getHours());
  const min = twoDigits(date.getMinutes());
  return `${year}. ${month}. ${day}. ${hour}:${min}`;
}

const twoDigits = (num) => {
  return num >= 0 && num < 10 ? `0${num}` : num.toString()
}

const findElemById = (array, id) => {
  return array.find(e => e._id.toString() === id.toString());
}

const syncClansData = async (clans, sheetName) => {
  const sheet = await accessSpreadsheet(sheetName);
  const rows = await sheet.getRows();
  for (let i = 0; i < clans.length; i++) {
    const clan = clans[i];
    const row = rows.find(row => {
      const rowName = row[SheetHeaders.clanName].toString();
      const clanName = clan.name.toString();
      return rowName === clanName;
    });
    if (!row) {
      continue;
    }
    row[SheetHeaders.clanLevel] = clan.level,
    row[SheetHeaders.gloryPoints] = clan.gloryPoints
    await row.save();
    await sleep(1100);
  }
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
      continue;
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
  accessSpreadsheet: accessSpreadsheet,
  syncBackup: syncBackup,
  syncSheet: syncSheet,
  createSheetForNewRealm: createSheetForNewRealm
};
