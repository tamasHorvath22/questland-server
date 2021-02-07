const responseMessage = require("../constants/api-response-messages");
const RealmDoc = require('../persistence/realm.doc');
const Realm = require('../models/realm.model');
const Clan = require('../models/clan.model');
const Student = require('../models/student.model');
const ClassDoc = require('../persistence/classes.doc');
const ClanTresholdsDoc = require('../persistence/clan.tresholds.doc');
const StudProp = require('../constants/student.properties');
const CommonKeys = require('../constants/sheet.student.keys');
const SheetHeaders = require('../constants/sheet.headers');
const RealmTransaction = require('../persistence/realms.transactions');
const _ = require('underscore');
const SheetService = require('./sheet.service')
const sleep = require('util').promisify(setTimeout);


const addValue = async (data) => {
  const realm = await RealmDoc.getById(data.realmId);
  if (realm === responseMessage.DATABASE.ERROR) {
    return responseMessage.DATABASE.ERROR;
  }
  const student = realm.students.find(s => s._id.toString() === data.studentId.toString());
  let modifier;
  if (data.pointType === StudProp.LESSON_XP) {
    modifier = student[StudProp.XP_MODIFIER];
  } else if (data.pointType === StudProp.MANA_POINTS) {
    modifier = student[StudProp.MANA_MODIFIER];
  }
  student[data.pointType] = countNewValue(
    student[data.pointType],
    data.value,
    modifier,
    data.pointType === StudProp.MANA_POINTS
  );
  if (data.pointType === StudProp.MANA_POINTS && data.value < 0) {
    student[StudProp.SKILL_COUNTER]++;
  }
  if (data.isDuel) {
    student[StudProp.DUEL_COUNT]++;
    if (data.isWinner) {
      await manageGloryPointsAfterDuel(realm, student);
    }
  }
  const result = await RealmTransaction.saveRealm(realm);
  return result ? result : responseMessage.COMMON.ERROR;
};

const manageGloryPointsAfterDuel = async (realm, student) => {
  const studentClan = realm.clans.find(clan => clan._id.toString() === student.clan.toString());
  studentClan.gloryPoints += 5;
  const clanTresholds = await ClanTresholdsDoc.getClanTresholds();
  if (studentClan.level === 5) {
    return;
  }
  if (clanTresholds === responseMessage.DATABASE.ERROR) {
    return responseMessage.DATABASE.ERROR;
  }
  const nextClanLevel = studentClan.level + 1;
  if (studentClan.gloryPoints >= clanTresholds[nextClanLevel].treshold) {
    studentClan.level++;
    increaseXpModifiersAfterClanLevelUp(
      realm.students,
      studentClan.students,
      clanTresholds[nextClanLevel].xpmodifierIncrease
    );
  }
}

const increaseXpModifiersAfterClanLevelUp = async (students, studentIdList, value) => {
  studentIdList.forEach(studentId => {
    const student = students.find(s => s._id.toString() === studentId.toString());
    student[StudProp[CommonKeys.XP_MODIFIER]] += value;
  });

}

const countNewValue = (oldValue, incomingValue, modifier, isMana) => {
  if (modifier) {
    incomingValue *= (100 + modifier) / 100;
  }
  let newValue = oldValue + incomingValue;
  if (isMana && newValue > 600) {
    newValue = 600;
  }
  newValue = newValue < 0 ? 0 : newValue;
  return parseFloat(newValue.toFixed(2));
}

const addValueToAll = async (data) => {
  const realm = await RealmDoc.getById(data.realmId);
  if (realm === responseMessage.DATABASE.ERROR) {
    return responseMessage.DATABASE.ERROR;
  }
  realm.students.forEach(student => {
    student[data.pointType] += data.value
  })

  const result = await RealmTransaction.saveRealm(realm);
  return result ? result : responseMessage.COMMON.ERROR;
}

const addLessonXpToSumXp = async (realmId) => {
  const realm = await RealmDoc.getById(realmId);
  if (realm === responseMessage.DATABASE.ERROR) {
    return responseMessage.DATABASE.ERROR;
  }

  realm.students.forEach(student => {
    student[StudProp.CUMULATIVE_XP] += student[StudProp.LESSON_XP];
    student[StudProp.LESSON_XP] = 0;
  })

  const result = await RealmTransaction.saveRealm(realm);
  if (!result) {
    return responseMessage.COMMON.ERROR;
  }
  await syncSheet(realmId);
  return result;
};

const syncSheet = async (realmId) => {
  const realm = await RealmDoc.getById(realmId);
  if (realm === responseMessage.DATABASE.ERROR) {
    return responseMessage.DATABASE.ERROR;
  }
  const sheet = await SheetService.accessSpreadsheet(realm.name);
  const rows = await sheet.getRows();
  const clansInUse = getClansInUseCount(realm.students)
  const numOfRows = realm.students.length + clansInUse;
  const clanAddedToStudent = isClanAddedToStudent(realm.students, rows);
  
  if (rows.length !== numOfRows || clanAddedToStudent) {
    await sheet.delete();
    const isSheetCreated = await createSheetForNewRealm(realm.name);
    if (!isSheetCreated) {
      return responseMessage.SHEET.SYNC_FAIL;
    }
    sortStudents(realm);
    await addStudentsToSheet(realm._id, realm.name, realm.students);
  }
  await syncStudentData(realm.students, realm.name);
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

const getClansInUseCount = (students) => {
  const clansInUse = new Set();
  students.forEach(student => {
    if (student.clan) {
      clansInUse.add(student.clan);
    }
  });
  return clansInUse.size;
}

const syncStudentData = async (students, realmName) => {
  const sheet = await SheetService.accessSpreadsheet(realmName);
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

const getRealm = async (realmId) => {
  const realm = await RealmDoc.getById(realmId);
  if (realm === responseMessage.DATABASE.ERROR) {
    return responseMessage.DATABASE.ERROR;
  }
  return realm;
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

const getRealms = async () => {
  // TODO refactor the properties
  const realms = await RealmDoc.getAll();
  if (realms === responseMessage.DATABASE.ERROR) {
    return responseMessage.DATABASE.ERROR;
  }
  const mapped = realms.map((c) => {
    return {
      id: c._id,
      title: c.name
    }
  })
  return mapped;
};

const getClasses = async () => {
  const classesObj = await ClassDoc.getClasses();
  if (classesObj === responseMessage.DATABASE.ERROR) {
    return responseMessage.DATABASE.ERROR;
  }
  return classesObj.classes;
};

const createRealm = async (realmName) => {
  if (await SheetService.accessSpreadsheet(realmName)) {
    return responseMessage.REALM.NAME_TAKEN;
  }
  const isSaveToDbSuccess = await createRealmToDb(realmName);
  if (isSaveToDbSuccess) {
    const isSheetCreated = await createSheetForNewRealm(realmName);
    if (!isSheetCreated) {
      RealmDoc.remove(realmName);
      return responseMessage.REALM.CREATE_FAIL;
    }
    return await getRealms();
  }
  return responseMessage.REALM.CREATE_FAIL;
}

const createSheetForNewRealm = async (realmName) => {
  try {
    const googleDoc = await SheetService.loadSpreadsheet();
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

const modifyRealm = async (realm) => {
  const realmDb = await RealmDoc.getById(realm._id);
  if (realmDb === responseMessage.DATABASE.ERROR) {
    return responseMessage.DATABASE.ERROR;
  }
  realmDb.students = realm.students
  realmDb.clans = realm.clans
  const savedRealm = await RealmTransaction.saveRealm(realmDb);
  return savedRealm ? savedRealm : responseMessage.REALM.MODIFICATION_FAIL;
}

const addStudents = async (realmId, students) => {
  const realm = await RealmDoc.getById(realmId);
  if (realm === responseMessage.DATABASE.ERROR) {
    return responseMessage.DATABASE.ERROR;
  }

  const studentList = [];
  students.forEach(student => {
    studentList.push(Student({
      [StudProp.NAME]: student.name,
      [StudProp.CLASS]: student.class,
      [StudProp.CLAN]: student.clan,
      [StudProp.LEVEL]: 1,
      [StudProp.CUMULATIVE_XP]: 0,
      [StudProp.XP_MODIFIER]: 0,
      [StudProp.LESSON_XP]: 0,
      [StudProp.MANA_POINTS]: 0,
      [StudProp.MANA_MODIFIER]: 0,
      [StudProp.SKILL_COUNTER]: 0,
      [StudProp.PET_FOOD]: 0,
      [StudProp.CURSE_POINTS]: 0,
      [StudProp.DUEL_COUNT]: 0,
    }))
  })
  realm.students.push(...studentList);
  const savedRealm = await RealmTransaction.saveRealm(realm);
  if (savedRealm) {
    return savedRealm;
  }
  return responseMessage.REALM.ADD_STUDENT_FAIL;
}

const addStudentsToSheet = async (realmId, realmName, students) => {
  const realm = await RealmDoc.getById(realmId);
  if (realm === responseMessage.DATABASE.ERROR) {
    return responseMessage.DATABASE.ERROR;
  }
  const isSheetLoaded = await SheetService.loadSpreadsheet();
  if (!isSheetLoaded) {
    return false;
  }
  const sheet = await SheetService.accessSpreadsheet(realmName);
  let currentClanId = null;
  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    const currentClan = realm.clans.find(c => c._id.toString() === student[StudProp[CommonKeys.CLAN]].toString());
    const currentClanName = currentClan.name;
    if (currentClanId !== student[StudProp[CommonKeys.CLAN]]) {
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

const createRealmToDb = async (realmName) => {
  const newRealm = Realm({
    name: realmName,
    students: []
  })
  try {
    await newRealm.save();
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
}

const createClans = async (realmId, clans) => {
  const realm = await RealmDoc.getById(realmId);
  if (realm === responseMessage.DATABASE.ERROR) {
    return responseMessage.DATABASE.ERROR;
  }
  const clanList = [];
  clans.forEach(clan => {
    clanList.push(Clan({
      name: clan.name,
      gloryPoints: 0,
      level: 1,
      students: []
    }))
  });
  realm.clans.push(...clanList);
  const result = await RealmTransaction.saveRealm(realm);
  if (result) {
    return result;
  }
  return responseMessage.REALM.CLAN_ADD_FAIL;
}

module.exports = {
  addLessonXpToSumXp: addLessonXpToSumXp,
  addValue: addValue,
  getRealm: getRealm,
  getRealms: getRealms,
  addValueToAll: addValueToAll,
  getClasses: getClasses,
  createRealm: createRealm,
  addStudents: addStudents,
  createClans: createClans,
  modifyRealm: modifyRealm,
  syncSheet: syncSheet
};
