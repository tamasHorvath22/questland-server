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
const BackupService = require('./backup.service');

const addValue = async (data) => {
  const realm = await RealmDoc.getById(data.realmId);
  if (realm === responseMessage.DATABASE.ERROR) {
    return responseMessage.DATABASE.ERROR;
  }
  const student = findElemById(realm.students, data.studentId);
  student[data.pointType] = countModifiedValue(student, data.value, data.pointType, data.isDuel);
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
  if (!student.clan) {
    return;
  }
  const studentClan = findElemById(realm.clans, student.clan);
  studentClan.gloryPoints += 5;
  if (studentClan.level === 5) {
    return;
  }
  await checkClanLevelUp(realm, studentClan);
}

const checkClanLevelUp = async (realm, studentClan) => {
  const clanTresholds = await ClanTresholdsDoc.getClanTresholds();
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

const increaseXpModifiersAfterClanLevelUp = (students, studentIdList, value) => {
  studentIdList.forEach(studentId => {
    const student = findElemById(students, studentId);
    student[StudProp[CommonKeys.XP_MODIFIER]] += value;
  });
}

const countModifiedValue = (student, incomingValue, pointType, isDuel) => {
  let modifier = 0;
  if (pointType === StudProp.LESSON_XP) {
    modifier = student[StudProp.XP_MODIFIER];
  } else if (pointType === StudProp.MANA_POINTS) {
    modifier = student[StudProp.MANA_MODIFIER];
  }

  if (student.class === Classes.BARD && pointType === StudProp.MANA_POINTS) {
    modifier += 10
  }
  if (modifier) {
    incomingValue *= (100 + modifier) / 100;
  }
  if (student.class === Classes.ADVENTURER && pointType === StudProp.PET_FOOD) {
    incomingValue *= 2;
  }
  if (student.class === Classes.WARRIOR && pointType === StudProp.LESSON_XP && isDuel) {
    incomingValue *= 2;
  }
  let newValue = student[pointType] + incomingValue;
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

    let points = data.value;
    if (student.class === Classes.ADVENTURER && data.pointType === StudProp.PET_FOOD) {
      points = data.value * 2;
    } else if (student.class === Classes.BARD && data.pointType === StudProp.MANA_POINTS) {
      points = data.value * (110 / 100);
    }

    points = countModifiedValue(student, points, data.pointType, false);
    student[data.pointType] = points;
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

  const levelUpResult = await checkStudentLevelUp(realm);
  if (levelUpResult === responseMessage.DATABASE.ERROR) {
    return responseMessage.DATABASE.ERROR
  }

  const modifiedRealm = await RealmTransaction.saveRealm(realm);
  if (!modifiedRealm) {
    return responseMessage.DATABASE.ERROR;
  }
  await BackupService.saveBackup(modifiedRealm);
  await SheetService.syncSheet(modifiedRealm, modifiedRealm.name, null);
  return modifiedRealm;
};

const checkStudentLevelUp = async (realm) => {
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
  const saveTimeList = [];
  const realmBackup = backup.realms[realmId.toString()];
  if (!realmBackup) {
    return saveTimeList;
  }
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
    const isSheetCreated = await SheetService.createSheetForNewRealm(realmName);
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

  studentList.forEach(student => {
    if (student.clan) {
      const savedClan = findElemById(realm.clans, student.clan);
      savedClan.students.push(student._id)
    }
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
  await SheetService.syncSheet(realm, realm.name, null);
  // if (result) {
  //   return result;
  // }
  // return responseMessage.REALM.CLAN_ADD_FAIL;
}

const addTest = async (realmId, points) => {
  const realm = await RealmDoc.getById(realmId);
  if (realm === responseMessage.DATABASE.ERROR) {
    return responseMessage.DATABASE.ERROR;
  }
  points.forEach(test => {
    const student = findElemById(realm.students, test.id);
    let xp = test.xp;
    if (student.class === Classes.WIZARD) {
      xp *= 2;
    }
    xp *= (100 + student.xpModifier) / 100;
    const floatValue = parseFloat(xp.toFixed(2));
    student.lessonXp += floatValue;
  });
  const result = await RealmTransaction.saveRealm(realm);
  return result ? result : responseMessage.COMMON.ERROR;
}

const addGloryPoints = async (realmId, clanId, points) => {
  const realm = await RealmDoc.getById(realmId);
  if (realm === responseMessage.DATABASE.ERROR) {
    return responseMessage.DATABASE.ERROR;
  }
  const studentClan = findElemById(realm.clans, clanId);
  studentClan.gloryPoints += points;
  if (studentClan.level < 5) {
    await checkClanLevelUp(realm, studentClan);
  }
  const result = await RealmTransaction.saveRealm(realm);
  return result ? result : responseMessage.COMMON.ERROR;
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
  resetRealm: resetRealm,
  addTest: addTest,
  addGloryPoints: addGloryPoints
};
