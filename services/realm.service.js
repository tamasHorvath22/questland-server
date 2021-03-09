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
const Backup = require('../models/backup.model');

const addValue = async (data) => {
  const realm = await RealmDoc.getById(data.realmId);
  const clanTresholds = await ClanTresholdsDoc.getClanTresholds();
  if (realm === responseMessage.DATABASE.ERROR || clanTresholds === responseMessage.DATABASE.ERROR) {
    return responseMessage.DATABASE.ERROR;
  }
  const student = findElemById(realm.students, data.studentId);
  const clanLevel = getStudentClanLevel(student, realm.clans);
  student[data.pointType] = countModifiedValue(
    student,
    data.value,
    data.pointType,
    data.isDuel,
    clanLevel,
    false,
    clanTresholds
  );
  if (data.pointType === StudProp.MANA_POINTS && data.value < 0) {
    student[StudProp.SKILL_COUNTER]++;
    student[StudProp.PET_FOOD]++;
    if (student.class === Classes.ADVENTURER) {
      student[StudProp.PET_FOOD]++;
    }
  }
  if (data.isDuel) {
    student[StudProp.DUEL_COUNT]++;
    if (data.isWinner) {
      manageGloryPointsAfterDuel(realm, student, clanTresholds);
    }
  }
  const result = await RealmTransaction.saveRealm(realm);
  return result ? result : responseMessage.COMMON.ERROR;
};

const manageGloryPointsAfterDuel = (realm, student, clanTresholds) => {
  if (!student.clan) {
    return;
  }
  const studentClan = findElemById(realm.clans, student.clan);
  const gloryPointsForDuelWin = 5;
  manageClanGloryPointsAndLevelUp(studentClan, gloryPointsForDuelWin, clanTresholds);
}

const manageClanGloryPointsAndLevelUp = (studentClan, value, clanTresholds) => {
  // finds the next level, even if it is an addition or substaction
  // if it is a substaction, the next level is the current level
  const nextClanLevel = studentClan.level + (value > 0 ? 1 : 0);
  studentClan.gloryPoints += value;
  if (value >= 0) {
    // if it is an addition
    if (studentClan.level === 5) {
      return;
    }
    if (studentClan.gloryPoints >= clanTresholds[nextClanLevel].treshold) {
      studentClan.level++;
    }
  } else {
    // if it is a substaction
    if (studentClan.gloryPoints < 0) {
      studentClan.gloryPoints = 0;
    }
    if (nextClanLevel === 1) {
      return;
    }
    if (studentClan.gloryPoints < clanTresholds[nextClanLevel].treshold) {
      studentClan.level--;
    }
  }
}

const getClanXpModifier = (clanLevel, isTest, clanTresholds) => {
  let modifier = clanTresholds[clanLevel].xpModifierIncrease;
  if (isTest) {
    modifier += clanTresholds[clanLevel].testXpModifierIncrease;
  }
  return modifier;
}

const countModifiedValue = (student, incomingValue, pointType, isDuel, clanLevel, isTest, clanTresholds) => {
  if (incomingValue < 0) {
    let newValue = student[pointType] + incomingValue;
    newValue = newValue < 0 ? 0 : newValue;
    return parseFloat(newValue.toFixed(2));
  }
  let modifier = 0;
  if (pointType === StudProp.LESSON_XP) {
    modifier = getClanXpModifier(clanLevel, isTest, clanTresholds);
    modifier += student[StudProp.XP_MODIFIER];
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
  if (isDuel && student.class === Classes.WARRIOR && pointType === StudProp.LESSON_XP) {
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
  const clanTresholds = await ClanTresholdsDoc.getClanTresholds();
  if (realm === responseMessage.DATABASE.ERROR || clanTresholds === responseMessage.DATABASE.ERROR) {
    return responseMessage.DATABASE.ERROR;
  }
  realm.students.forEach(async (student) => {
    if (data.exclude.includes(student._id.toString())) {
      return;
    }
    const clanLevel = getStudentClanLevel(student, realm.clans);
    student[data.pointType] = countModifiedValue(
      student,
      data.value,
      data.pointType,
      false,
      clanLevel,
      false,
      clanTresholds
    );
  })

  const result = await RealmTransaction.saveRealm(realm);
  return result ? result : responseMessage.DATABASE.ERROR;
}

const getStudentClanLevel = (student, clans) => {
  let clanLevel = 1;
  if (student.clan) {
    const clan = findElemById(clans, student.clan);
    clanLevel = clan.level;
  }
  return clanLevel;
}

const addLessonXpToSumXp = async (realmId) => {
  const realm = await RealmDoc.getById(realmId);
  const levelUpResult = await checkStudentLevelUp(realm);
  const backup = await BackupDoc.getBackup();

  if (
    realm === responseMessage.DATABASE.ERROR ||
    levelUpResult === responseMessage.DATABASE.ERROR ||
    backup === responseMessage.DATABASE.ERROR) {
    return responseMessage.DATABASE.ERROR;
  }

  realm.students.forEach(student => {
    student[StudProp.CUMULATIVE_XP] += student[StudProp.LESSON_XP];
    student[StudProp.LESSON_XP] = 0;
  })

  saveBackup(realm, backup);
  const result = await RealmTransaction.saveRealmAndBackup(realm, backup);
  if (result) {
    SheetService.syncSheet(realm, realm.name, null);
    return result;
  }
  return responseMessage.DATABASE.ERROR;
};

const saveBackup = (realm, backup) => {
  const newBackup = Backup({
    data: realm,
    time: new Date().getTime()
  });
  const realmBackup = backup.realms[realm._id.toString()];
  if (realmBackup) {
    realmBackup.list.push(newBackup);
  } else {
    backup.realms[realm._id.toString()] = {
      list: [newBackup]
    }
  }
}

const checkStudentLevelUp = async (realm) => {
  const classesObj = await ClassDoc.getClasses();
  if (classesObj === responseMessage.DATABASE.ERROR) {
    return responseMessage.DATABASE.ERROR;
  }
  realm.students.forEach(student => {
    if (student.level === 8) {
      return;
    }
    const nextLevel = student.level + 1;
    const treshold = classesObj.tresholds[nextLevel];
    if (student.cumulativeXp >= treshold) {
      const prevLevel = student.level;
      student.level++;
      if (student.clan && prevLevel % 2 === 0) {
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
  if (backup === responseMessage.DATABASE.ERROR) {
    return responseMessage.DATABASE.ERROR;
  }
  const saveTimeList = [];
  const realmBackup = backup.realms[realmId.toString()];
  if (realmBackup) {
    realmBackup.list.forEach(elem => {
      saveTimeList.push(elem.time);
    });
  }
  return saveTimeList;
}

const getRealms = async () => {
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
  return savedRealm ? savedRealm : responseMessage.DATABASE.ERROR;
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
  return responseMessage.DATABASE.ERROR;
}

const createRealmToDb = async (realmName) => {
  const newRealm = Realm({
    name: realmName,
    finishLessonMana: 0,
    students: [],
    clans: []
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
  return result ? result : responseMessage.DATABASE.ERROR;
}

const resetRealm = async (realmId) => {
  const realm = await RealmDoc.getById(realmId);
  const backup = await BackupDoc.getBackup();
  if (realm === responseMessage.DATABASE.ERROR || backup === responseMessage.DATABASE.ERROR) {
    return responseMessage.DATABASE.ERROR;
  }
  realm.finishLessonMana = 0;
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
  const realmBackup = backup.realms[realm._id.toString()];
  realmBackup.list = [];

  const result = await RealmTransaction.saveRealmAndBackup(realm, backup);
  if (result) {
    SheetService.syncSheet(realm, realm.name, null);
    return result;
  }
  return responseMessage.DATABASE.ERROR;
}

const addTest = async (realmId, points) => {
  const realm = await RealmDoc.getById(realmId);
  const clanTresholds = await ClanTresholdsDoc.getClanTresholds();
  if (realm === responseMessage.DATABASE.ERROR || clanTresholds === responseMessage.DATABASE.ERROR) {
    return responseMessage.DATABASE.ERROR;
  }
  points.forEach(async (test) => {
    const student = findElemById(realm.students, test.id);
    const clanLevel = getStudentClanLevel(student, realm.clans);
    if (student.class === Classes.WIZARD) {
      test.xp *= 2;
    }
    student.lessonXp = countModifiedValue(
      student,
      test.xp,
      StudProp.LESSON_XP,
      false,
      clanLevel,
      true,
      clanTresholds
    );
  });
  const result = await RealmTransaction.saveRealm(realm);
  return result ? result : responseMessage.DATABASE.ERROR;
}

const addGloryPoints = async (realmId, clanId, points) => {
  const realm = await RealmDoc.getById(realmId);
  const clanTresholds = await ClanTresholdsDoc.getClanTresholds();
  if (realm === responseMessage.DATABASE.ERROR || clanTresholds === responseMessage.DATABASE.ERROR) {
    return responseMessage.DATABASE.ERROR;
  }
  const studentClan = findElemById(realm.clans, clanId);
  manageClanGloryPointsAndLevelUp(studentClan, points, clanTresholds);
  const result = await RealmTransaction.saveRealm(realm);
  return result ? result : responseMessage.COMMON.ERROR;
}

const setLessonMana = async (realmId, lessonMana) => {
  const realm = await RealmDoc.getById(realmId);
  if (realm === responseMessage.DATABASE.ERROR) {
    return responseMessage.DATABASE.ERROR;
  }
  realm.finishLessonMana = lessonMana;
  const result = await RealmTransaction.saveRealm(realm);
  return result ? result : responseMessage.DATABASE.ERROR;
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
  addGloryPoints: addGloryPoints,
  setLessonMana: setLessonMana
};
