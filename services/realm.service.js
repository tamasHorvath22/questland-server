const responseMessage = require("../constants/api-response-messages");
const RealmDoc = require('../persistence/realm.doc');
const Realm = require('../models/realm.model');
const Clan = require('../models/clan.model');
const Student = require('../models/student.model');
const ClassDoc = require('../persistence/classes.doc');
const BackupDoc = require('../persistence/backup.doc');
const ClanTresholdsDoc = require('../persistence/clan.tresholds.doc');
const StudProp = require('../constants/student.properties');
const Classes = require('../constants/classes');
const CommonKeys = require('../constants/sheet.student.keys');
const RealmTransaction = require('../persistence/realms.transactions');
const SheetService = require('./sheet.service')
const BackupService = require('./backup.service')

const addValue = async (data) => {
  const realm = await RealmDoc.getById(data.realmId);
  if (realm === responseMessage.DATABASE.ERROR) {
    return responseMessage.DATABASE.ERROR;
  }
  const student = findElemById(realm.students, data.studentId);
  let modifier = 0;
  if (data.pointType === StudProp.LESSON_XP) {
    modifier = student[StudProp.XP_MODIFIER];
  } else if (data.pointType === StudProp.MANA_POINTS) {
    modifier = student[StudProp.MANA_MODIFIER];
  }
  student[data.pointType] = countNewValue(
    student[data.pointType],
    data.value,
    modifier,
    student.class,
    data.pointType,
    data.isDuel
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
  const studentClan = findElemById(realm.clans, student.clan);
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
    const student = findElemById(students, studentId);
    student[StudProp[CommonKeys.XP_MODIFIER]] += value;
  });

}

const countNewValue = (oldValue, incomingValue, modifier, studentClass, pointType, isDuel) => {
  if (studentClass === Classes.BARD && pointType === StudProp.MANA_POINTS) {
    modifier += 10
  }
  if (modifier) {
    incomingValue *= (100 + modifier) / 100;
  }
  if (studentClass === Classes.ADVENTURER && pointType === StudProp.PET_FOOD) {
    incomingValue *= 2;
  }
  if (studentClass === Classes.WARRIOR && pointType === StudProp.LESSON_XP && isDuel) {
    incomingValue *= 2;
  }
  let newValue = oldValue + incomingValue;
  if (pointType === StudProp.MANA_POINTS && newValue > 600) {
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
    if (data.exclude.includes(student._id.toString())) {
      return;
    }
    if (student.class === Classes.ADVENTURER && data.pointType === StudProp.PET_FOOD) {
      const value = data.value * 2;
      student[data.pointType] += value
    } else if (student.class === Classes.BARD && data.pointType === StudProp.MANA_POINTS) {
      const value = data.value * (110 / 100);
      student[data.pointType] += value
    } else {
      student[data.pointType] += data.value
    }
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

  const levelUpResult = await checkLevelUp(realm);
  if (levelUpResult === responseMessage.DATABASE.ERROR) {
    return responseMessage.DATABASE.ERROR
  }

  const modifiedRealm = await RealmTransaction.saveRealm(realm);
  if (!modifiedRealm) {
    return responseMessage.DATABASE.ERROR;
  }
  await BackupService.saveBackup(modifiedRealm);
  await SheetService.syncSheet(modifiedRealm, modifiedRealm.name);
  return modifiedRealm;
};

const checkLevelUp = async (realm) => {
  const classesObj = await ClassDoc.getClasses();
  if (classesObj === responseMessage.DATABASE.ERROR) {
    return responseMessage.DATABASE.ERROR;
  }
  realm.students.forEach(student => {
    if (student[StudProp[CommonKeys.LEVEL]] === 8) {
      return;
    }
    const nextLevel = student[StudProp[CommonKeys.LEVEL]] + 1;
    const treshold = classesObj.tresholds[nextLevel];
    if (student[StudProp[CommonKeys.CUMULATIVE_XP]] >= treshold) {
      const prevLevel = student[StudProp[CommonKeys.LEVEL]];
      student[StudProp[CommonKeys.LEVEL]]++;
      if (prevLevel % 2 === 0) {
        checkAllStudentInClanLevelUp(realm, student._id);
      }
    }
  });
}

const findElemById = (array, id) => {
  return array.find(e => e._id.toString() === id.toString());
}

const checkAllStudentInClanLevelUp = (realm, studentId) => {
  const refStudent = findElemById(realm.students, studentId);
  const clan = findElemById(realm.clans, refStudent[StudProp[CommonKeys.CLAN]]);
  let levelCounter = 0;
  clan.students.forEach(studId => {
    const student = findElemById(realm.students, studId);
    if (student.level >= refStudent.level) {
      levelCounter++;
    }
  });
  if (clan.students.length === levelCounter) {
    let pointsIncrease;
    if (refStudent.level === 3) {
      pointsIncrease = 30;
    } else if (refStudent.level === 5) {
      pointsIncrease = 50;
    } else if (refStudent.level === 7) {
      pointsIncrease = 100;
    }
    clan.gloryPoints += pointsIncrease;
  }
}

const getRealm = async (realmId) => {
  const realm = await RealmDoc.getById(realmId);
  if (realm === responseMessage.DATABASE.ERROR) {
    return responseMessage.DATABASE.ERROR;
  }
  return realm;
}

const getBackupData = async (realmId) => {
  const backup = await BackupDoc.getBackup();
  const realmBackup = backup.realms[realmId.toString()];
  const saveTimeList = [];
  realmBackup.list.forEach(elem => {
    saveTimeList.push(elem.time);
  });
  return saveTimeList;
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

const resetRealm = async (realmId) => {
  const realm = await RealmDoc.getById(realmId);
  if (realm === responseMessage.DATABASE.ERROR) {
    return responseMessage.DATABASE.ERROR;
  }
  realm.students.forEach(student => {
    student[StudProp.CLASS] = null,
    student[StudProp.CLAN] = null,
    student[StudProp.LEVEL] = 1,
    student[StudProp.CUMULATIVE_XP] = 0,
    student[StudProp.XP_MODIFIER] = 0,
    student[StudProp.LESSON_XP] = 0,
    student[StudProp.MANA_POINTS] = 0,
    student[StudProp.MANA_MODIFIER] = 0,
    student[StudProp.SKILL_COUNTER] = 0,
    student[StudProp.PET_FOOD] = 0,
    student[StudProp.CURSE_POINTS] = 0,
    student[StudProp.DUEL_COUNT] = 0
  });
  realm.clans = [];
  const backup = await BackupService.getBackup();
  const realmBackup = backup.realms[realm._id.toString()];
  realmBackup.list = [];

  // TODO define result
  const result = await RealmTransaction.saveAfterReset(realm, backup);
  await SheetService.syncSheet(realm, realm.name);
  // if (result) {
  //   return result;
  // }
  // return responseMessage.REALM.CLAN_ADD_FAIL;
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
  getBackupData: getBackupData,
  resetRealm: resetRealm
};
