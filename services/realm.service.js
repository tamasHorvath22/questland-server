const responseMessage = require("../constants/api-response-messages");
const RealmDoc = require('../persistence/realm.doc');
const GoogleUserDoc = require('../persistence/google.user.doc');
const Realm = require('../models/realm.model');
const Clan = require('../models/clan.model');
const Student = require('../models/student.model');
const RegisterToken = require('../models/register.token');
// const ClassDoc = require('../persistence/classes.doc');
const BackupDoc = require('../persistence/backup.doc');
const StudProp = require('../constants/student.properties');
const Classes = require('../constants/classes');
const Roles = require('../constants/roles');
const ClanTresholds = require('../constants/clan.tresholds');
const RealmTransaction = require('../persistence/realms.transactions');
const SheetService = require('./sheet.service')
const Backup = require('../models/backup.model');
const validIncomingPointTypes = require('../constants/valid.incoming.point.types');
const ClassesWithTresholds = require('../constants/classes.with.tresholds');


const addValueApi = async (data) => {
  // Typecheck of input data. If pointType, value, isDuel or isWinner not from expected type, the function returns
  const areTypesWrong = areAddValueTypesWrong(data);
  if (areTypesWrong) {
    return responseMessage.COMMON.INVALID_DATA;
  }
  const realm = await RealmDoc.getById(data.realmId);
  if (realm === responseMessage.DATABASE.ERROR) {
    // if no realm found, the function returns with database error.
    // the reason of no realm can be invalid realmId also
    return responseMessage.DATABASE.ERROR;
  }
  const student = findElemById(realm.students, data.studentId);
  if (!student) {
    // if the studentId is invalid and no student found, the function returns with common error
    return responseMessage.COMMON.INVALID_DATA;
  }
  const clanLevel = getStudentClanLevel(student.clan, realm.clans);
  const modifiedStudent = addValue(data, student, clanLevel);
  if (data.isDuel && data.isWinner && student.clan) {
    const gloryPointsForDuelWin = 5;
    const studentClan = findElemById(realm.clans, student.clan);
    manageClanGloryPointsAndLevelUp(studentClan, gloryPointsForDuelWin);
  }
  const result = await RealmTransaction.saveRealm(realm);
  return result ? result : responseMessage.DATABASE.ERROR;
}

const areAddValueTypesWrong = (data) => {
  return (
    !validIncomingPointTypes.includes(data.pointType) ||
    typeof data.value !== 'number' ||
    typeof data.isDuel !== "boolean" ||
    typeof data.isWinner !== "boolean"
  )
}

const addValue = (data, student, clanLevel) => {
  student[data.pointType] = countModifiedValue(
    student,
    data.value,
    data.pointType,
    data.isDuel,
    clanLevel,
    false
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
  }
  return student;
};

const manageClanGloryPointsAndLevelUp = (studentClan, value) => {
  // finds the next level, even if it is an addition or substaction
  // if it is a substaction, the next level is the current level
  const nextClanLevel = studentClan.level + (value > 0 ? 1 : 0);
  studentClan.gloryPoints += value;
  if (value >= 0) {
    // if it is an addition
    if (studentClan.level === 5) {
      return studentClan;
    }
    if (studentClan.gloryPoints >= ClanTresholds[nextClanLevel].treshold) {
      studentClan.level++;
    }
  } else {
    // if it is a substaction
    if (studentClan.gloryPoints < 0) {
      studentClan.gloryPoints = 0;
    }
    if (nextClanLevel === 1) {
      return studentClan;
    }
    if (studentClan.gloryPoints < ClanTresholds[nextClanLevel].treshold) {
      studentClan.level--;
    }
  }
  return studentClan;
}

const getClanXpModifier = (clanLevel, isTest) => {
  let modifier = ClanTresholds[clanLevel].xpModifierIncrease;
  if (isTest) {
    modifier += ClanTresholds[clanLevel].testXpModifierIncrease;
  }
  return modifier;
}

const countModifiedValue = (student, incomingValue, pointType, isDuel, clanLevel, isTest) => {
  if (incomingValue < 0) {
    let newValue = student[pointType] + incomingValue;
    newValue = newValue < 0 ? 0 : newValue;
    return parseFloat(newValue.toFixed(2));
  }
  let modifier = 0;
  if (pointType === StudProp.LESSON_XP) {
    modifier = getClanXpModifier(clanLevel, isTest);
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
  // mana max value is 600, if it is over, it is set to 600
  if (pointType === StudProp.MANA_POINTS && newValue > 600) {
    newValue = 600;
  }
  // newValue = newValue < 0 ? 0 : newValue;
  return parseFloat(newValue.toFixed(2));
}

const addValueToAllApi = async (data) => {
  const areInputWrong = areAddToAllValuesWrong(data);
  if (areInputWrong) {
    return responseMessage.COMMON.INVALID_DATA;
  }
  const realm = await RealmDoc.getById(data.realmId);
  if (realm === responseMessage.DATABASE.ERROR) {
    return responseMessage.DATABASE.ERROR;
  }
  const modifiedRealm = addValueToAll(realm, data);
  const result = await RealmTransaction.saveRealm(modifiedRealm);
  return result ? result : responseMessage.DATABASE.ERROR;
}

const areAddToAllValuesWrong = (data) => {
  return (
    !validIncomingPointTypes.includes(data.pointType) ||
    typeof data.value !== 'number' ||
    !Array.isArray(data.exclude)
  )
}

const addValueToAll = (realm, data) => {
  realm.students.forEach(student => {
    if (data.exclude.includes(student._id.toString())) {
      return;
    }
    const clanLevel = getStudentClanLevel(student.clan, realm.clans);
    student[data.pointType] = countModifiedValue(
      student,
      data.value,
      data.pointType,
      false,
      clanLevel,
      false
    );
  });
  return realm;
}

const getStudentClanLevel = (studentClan, clans) => {
  let clanLevel = 1;
  const clan = findElemById(clans, studentClan);
  if (clan) {
    clanLevel = clan.level;
  }
  return clanLevel;
}

const addLessonXpToSumXpApi = async (realmId) => {
  const realm = await RealmDoc.getById(realmId);
  const backup = await BackupDoc.getBackup();
  
  if (
    realm === responseMessage.DATABASE.ERROR ||
    backup === responseMessage.DATABASE.ERROR
  ) {
    return responseMessage.DATABASE.ERROR;
  }

  addLessonXpToSumXp(realm.students);
  checkStudentLevelUp(realm);

  saveBackup(realm, backup);
  const result = await RealmTransaction.saveRealmAndBackup(realm, backup);
  if (result) {
    SheetService.syncSheet(realm, realm.name, null);
    return result;
  }
  return responseMessage.DATABASE.ERROR;
};

const addLessonXpToSumXp = (students) => {
  students.forEach(student => {
    student[StudProp.CUMULATIVE_XP] += student[StudProp.LESSON_XP];
    student[StudProp.LESSON_XP] = 0;
  });
  return students;
}

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

const checkStudentLevelUp = (realm) => {
  realm.students.forEach(student => {
    if (student.level === 8) {
      return;
    }
    const nextLevel = student.level + 1;
    const treshold = ClassesWithTresholds.tresholds[nextLevel];
    if (student.cumulativeXp >= treshold) {
      const prevLevel = student.level;
      student.level++;
      if (student.clan && prevLevel % 2 === 0) {
        checkAllStudentInClanLevelUp(realm, student);
      }
    }
  });
  return realm;
}

const findElemById = (array, id) => {
  if (!array || !array.length || !id) {
    return null;
  }
  return array.find(e => e._id.toString() === id.toString());
}

const checkAllStudentInClanLevelUp = (realm, refStudent) => {
  // TODO unit tests
  const clan = findElemById(realm.clans, refStudent.clan);
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
  return realm;
}

const getRealm = async (realmId, userId) => {
  const realm = await RealmDoc.getById(realmId);
  if (realm === responseMessage.DATABASE.ERROR) {
    return responseMessage.DATABASE.ERROR;
  }
  const isCollaborator = isUserCollaborator(realm.collaborators, userId);
  if (isCollaborator) {
    return realm;
  }
  // TODO response on frontend
  return responseMessage.REALM.NOT_AUTHORIZED;
}

const isUserCollaborator = (collaborators, userId) => {
  for (const collaborator of collaborators) {
    if (collaborator.toString() === userId.toString()) {
      return true;
    }
  }
  return false;
}

const getBackupData = async (realmId) => {
  const backup = await BackupDoc.getBackup();
  if (backup === responseMessage.DATABASE.ERROR) {
    return responseMessage.DATABASE.ERROR;
  }
  let saveTimeList = [];
  const realmBackup = backup.realms[realmId.toString()];
  if (realmBackup) {
    saveTimeList = realmBackup.list.map(elem => elem.time);
  }
  return saveTimeList;
}

const getRealms = async (userId) => {
  const realms = await RealmDoc.getAll();
  if (realms === responseMessage.DATABASE.ERROR) {
    return responseMessage.DATABASE.ERROR;
  }
  const userRealms = findUserRealms(realms, userId);
  return userRealms;
};

const findUserRealms = (realms, userId) => {
  const list = [];
  realms.forEach(realm => {
    for (const savedId of realm.collaborators) {
      if (savedId.toString() === userId.toString()) {
        list.push({
          id: realm._id,
          title: realm.name
        });
        break;
      }
    }
  });
  return list;
}

const getClasses = () => {
  return ClassesWithTresholds.classes;
};

const createRealm = async (realmName, userId) => {
  if (await SheetService.accessSpreadsheet(realmName)) {
    return responseMessage.REALM.NAME_TAKEN;
  }
  const isSaveToDbSuccess = await createRealmToDb(realmName, userId);
  if (isSaveToDbSuccess) {
    return await getRealms(userId);
  }
  return responseMessage.REALM.CREATE_FAIL;
}

const areStudentsWrong = (realm, students) => {
  if (!students || !students.length) {
    return true;
  }
  const clanList = getRealmClans(realm);
  const classes = Object.values(Classes);

  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    if (
      !student.name ||
      (student.class && !classes.includes(student.class)) ||
      (clanList.length && student.clan && !clanList.includes(student.clan.toString()))
    ) {
      return true;
    }
  }
  return false;
}

const getRealmStudentList = (students) => {
  return students.map((student) => {
    return student.name;
  })
}

const addStudentsApi = async (realmId, students) => {
  const realm = await RealmDoc.getById(realmId);
  if (realm === responseMessage.DATABASE.ERROR) {
    return responseMessage.DATABASE.ERROR;
  }
  const studentsAreInvaild = areStudentsWrong(realm, students);
  if (studentsAreInvaild) {
    return responseMessage.COMMON.INVALID_DATA;
  }
  const result = addStudents(realm, students);
  const freshStudents = result.studentList;
  const registerTokens = createInviteLinkForStudents(freshStudents, realm._id.toString());

  const savedRealm = await RealmTransaction.saveRealmAndRegisterTokens(realm, registerTokens);
  return savedRealm ? savedRealm : responseMessage.DATABASE.ERROR;
}

const createInviteLinkForStudents = (freshStudents, realmId) => {
  const registerTokens = [];
  freshStudents.forEach(student => {
    const regToken = 
    RegisterToken({
      role: Roles.STUDENT,
      studentData: {
        realmId: realmId,
        studentId: student._id.toString()
      }
    });
    registerTokens.push(regToken);
    student.inviteUrl = `${process.env.UI_BASE_URL}register/${regToken._id.toString()}`
  });
  return registerTokens;
}

const addStudents = (realm, students) => {
  const savedStudents = getRealmStudentList(realm.students);
  const studentList = [];
  students.forEach(student => {
    if (savedStudents.includes(student.name)) {
      return;
    }
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
    }));
    savedStudents.push(student.name);
  })
  // another loop is needed because in the firts user has no ID yet
  studentList.forEach(student => {
    if (student.clan) {
      const savedClan = findElemById(realm.clans, student.clan);
      savedClan.students.push(student._id)
    }
  })
  realm.students.push(...studentList);
  // TODO refactor unit tests, return value changed from realm to studentList
  return { realm: realm, studentList: studentList };
}

const createRealmToDb = async (realmName, userId) => {
  const newRealm = Realm({
    name: realmName,
    finishLessonMana: 0,
    xpStep: 0,
    manaStep: 0,
    owner: userId.toString(),
    collaborators: [userId.toString()],
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

const createClansApi = async (realmId, newClans) => {
  const realm = await RealmDoc.getById(realmId);
  if (realm === responseMessage.DATABASE.ERROR) {
    return responseMessage.DATABASE.ERROR;
  }
  if (!Array.isArray(newClans)) {
    return responseMessage.COMMON.INVALID_DATA;
  }
  createClans(realm, newClans);
  const result = await RealmTransaction.saveRealm(realm);
  return result ? result : responseMessage.DATABASE.ERROR;
}

const getClanNames = (clans) => {
  return clans.map(clan => clan.name);
}

const createClans = (realm, newClans) => {
  const clanNames = getClanNames(realm.clans);
  const newClanObjects = [];
  newClans.forEach(clan => {
    if (!clan.name || clanNames.includes(clan.name)) {
      return;
    }
    newClanObjects.push(Clan({
      name: clan.name,
      gloryPoints: 0,
      level: 1,
      students: []
    }));
    clanNames.push(clan.name);
  });
  realm.clans.push(...newClanObjects);
  return realm;
}

const resetRealmApi = async (realmId) => {
  const realm = await RealmDoc.getById(realmId);
  const backup = await BackupDoc.getBackup();
  if (realm === responseMessage.DATABASE.ERROR || backup === responseMessage.DATABASE.ERROR) {
    return responseMessage.DATABASE.ERROR;
  }
  resetRealm(realm);
  const realmBackup = backup.realms[realm._id.toString()];
  realmBackup.list = [];
  const result = await RealmTransaction.saveRealmAndBackup(realm, backup);
  if (result) {
    SheetService.syncSheet(realm, realm.name, null);
    return result;
  }
  return responseMessage.DATABASE.ERROR;
}

const resetRealm = (realm) => {
  realm.finishLessonMana = 0;
  realm.xpStep = 0,
  realm.manaStep = 0,
  realm.clans = [];
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
  return realm;
}

const addTestApi = async (realmId, points) => {
  const realm = await RealmDoc.getById(realmId);
  if (realm === responseMessage.DATABASE.ERROR) {
    return responseMessage.DATABASE.ERROR;
  }
  const studentIds = getStudentIds(realm.students);
  const arePointsNotGood = arePointsWrong(studentIds, points);
  if (arePointsNotGood) {
    return responseMessage.COMMON.INVALID_DATA;
  }
  addTest(realm, points);
  const result = await RealmTransaction.saveRealm(realm);
  return result ? result : responseMessage.DATABASE.ERROR;
}

const getStudentIds = (students) => {
  return students.map(student => student._id.toString());
}

const arePointsWrong = (studentIdList, points) => {
  if (!points || !Array.isArray(points) || !points.length) {
    return true;
  }
  for (let i = 0; i < points.length; i++) {
    const point = points[i]
    if (!point.id || !studentIdList.includes(point.id) || !point.xp) {
      return true;
    }
  }
  return false;
}

const addTest = (realm, points) => {
  points.forEach(test => {
    const student = findElemById(realm.students, test.id);
    const clanLevel = getStudentClanLevel(student.clan, realm.clans);
    if (student.class === Classes.WIZARD) {
      test.xp *= 2;
    }
    student.lessonXp = countModifiedValue(
      student,
      test.xp,
      StudProp.LESSON_XP,
      false,
      clanLevel,
      true
    );
  });
  return realm;
}

const addGloryPoints = async (realmId, clanId, points) => {
  const realm = await RealmDoc.getById(realmId);
  if (realm === responseMessage.DATABASE.ERROR) {
    return responseMessage.DATABASE.ERROR;
  }
  const studentClan = findElemById(realm.clans, clanId);
  if (!studentClan || typeof points !== 'number') {
    return responseMessage.COMMON.INVALID_DATA;
  }
  manageClanGloryPointsAndLevelUp(studentClan, points);
  const result = await RealmTransaction.saveRealm(realm);
  return result ? result : responseMessage.DATABASE.ERROR;
}

const areStepsWrong = (lessonMana, xpStep, manaStep) => {
  return (
    typeof lessonMana !== 'number' ||
    typeof xpStep !== 'number' ||
    typeof manaStep !== 'number'
  )
}

const setRealmDefaultSteps = async (realmId, lessonMana, xpStep, manaStep) => {
  const realm = await RealmDoc.getById(realmId);
  if (realm === responseMessage.DATABASE.ERROR) {
    return responseMessage.DATABASE.ERROR;
  }
  const areStepsNotOk = areStepsWrong(lessonMana, xpStep, manaStep);
  if (areStepsNotOk) {
    return responseMessage.COMMON.INVALID_DATA;
  }
  realm.finishLessonMana = lessonMana;
  realm.xpStep = xpStep;
  realm.manaStep = manaStep;

  const result = await RealmTransaction.saveRealm(realm);
  return result ? result : responseMessage.DATABASE.ERROR;
}

const saveModifiedStudentApi = async (modifiedStudent) => {
  const realm = await RealmDoc.getById(modifiedStudent.realmId);
  if (realm === responseMessage.DATABASE.ERROR) {
    return responseMessage.DATABASE.ERROR;
  }
  const student = findElemById(realm.students, modifiedStudent._id);
  const areTypesWrong = areModifyStudentTypesWrong(realm, modifiedStudent);
  const areStudentClansWrong = areClansWrong(realm, modifiedStudent.clan);
  if (!student || areTypesWrong || areStudentClansWrong) {
    // if the studentId is invalid and no student found, the function returns with common error
    return responseMessage.COMMON.INVALID_DATA;
  }
  setModifiedStudent(student, modifiedStudent);
  setStudentClans(realm, student, modifiedStudent.clan);
  const result = await RealmTransaction.saveRealm(realm);
  return result ? result : responseMessage.DATABASE.ERROR;
}

const setStudentClans = (realm, student, newClan) => {
  if (!newClan) {
    // student had no clan before and was not added this time either
    return realm;
  }
  let prevClan;
  if (student.clan) {
    // try to find previous clan
    prevClan = findElemById(realm.clans, student.clan);
  }
  // find current clan
  const currentClan = findElemById(realm.clans, newClan);
  // if the clan ID not changed, the function returns
  if (prevClan && prevClan._id.toString() === currentClan._id.toString()) {
    return realm;
  }
  // add student to clan students
  currentClan.students.push(student._id);
  // add clan to student
  student.clan = currentClan._id;
  if (!prevClan) {
    // if no previous clan, no more changes
    return realm;
  }
  // if there is a previous clan, student is removed from its students
  for (let i = 0; i < prevClan.students.length; i++) {
    if (prevClan.students[i].toString() === student._id.toString()) {
      prevClan.students.splice(i, 1);
      return realm;
    }
  }
}

const areClansWrong = (realm, newClan) => {
  const clanList = getRealmClans(realm);
  if (!newClan) {
    return false;
  }
  return !clanList.includes(newClan.toString());
}

const getRealmClans = (realm) => {
  const clanList = [];
  realm.clans.forEach(clan => {
    clanList.push(clan._id.toString());
  });
  return clanList;
}

const areModifyStudentTypesWrong = (realm, modifiedStudent) => {
  const clanlist = getRealmClans(realm);
  const classes = Object.values(Classes);
  // input type check
  return (
    !modifiedStudent.name ||
    (modifiedStudent.class && !classes.includes(modifiedStudent.class)) ||
    (clanlist.length && modifiedStudent.clan && !clanlist.includes(modifiedStudent.clan.toString())) ||
    typeof modifiedStudent.xpModifier !== 'number' ||
    typeof modifiedStudent.manaModifier !== 'number' ||
    modifiedStudent.xpModifier < 0 ||
    modifiedStudent.manaModifier < 0
  );
}

const setModifiedStudent = (student, modifiedStudent) => {
  student.name = modifiedStudent.name;
  student.class = modifiedStudent.class;
  student.xpModifier = modifiedStudent.xpModifier;
  student.manaModifier = modifiedStudent.manaModifier;
  return student;
}

const getStudentData = async (userId) => {
  const user = await GoogleUserDoc.getUserById(userId);
  if (user === responseMessage.DATABASE.ERROR || user.role !== Roles.STUDENT) {
    return responseMessage.DATABASE.ERROR;
  }
  const realm = await RealmDoc.getById(user.studentData.realmId);
  if (realm === responseMessage.DATABASE.ERROR) {
    return responseMessage.DATABASE.ERROR;
  }
  const student = findElemById(realm.students, user.studentData.studentId);
  if (!student) {
    return responseMessage.DATABASE.ERROR;
  }
  const studentClan = findElemById(realm.clans, student.clan)
  student.firstName = user.firstName;
  student.lastName = user.lastName;
  student.clan = studentClan;
  return student;
}

module.exports = {
  addLessonXpToSumXpApi: addLessonXpToSumXpApi,
  addLessonXpToSumXp: addLessonXpToSumXp,
  addValueApi: addValueApi,
  getRealm: getRealm,
  getRealms: getRealms,
  addValueToAll: addValueToAll,
  getClasses: getClasses,
  createRealm: createRealm,
  addStudents: addStudents,
  createClans: createClans,
  createClansApi: createClansApi,
  getBackupData: getBackupData,
  resetRealm: resetRealm,
  addTest: addTest,
  addGloryPoints: addGloryPoints,
  setRealmDefaultSteps: setRealmDefaultSteps,
  findElemById: findElemById,
  getStudentClanLevel: getStudentClanLevel,
  countModifiedValue: countModifiedValue,
  addValue: addValue,
  manageClanGloryPointsAndLevelUp: manageClanGloryPointsAndLevelUp,
  addValueToAllApi: addValueToAllApi,
  resetRealmApi: resetRealmApi,
  saveModifiedStudentApi: saveModifiedStudentApi,
  setModifiedStudent: setModifiedStudent,
  areModifyStudentTypesWrong: areModifyStudentTypesWrong,
  areClansWrong: areClansWrong,
  setStudentClans: setStudentClans,
  areAddValueTypesWrong: areAddValueTypesWrong,
  areStudentsWrong: areStudentsWrong,
  addStudentsApi: addStudentsApi,
  areAddToAllValuesWrong: areAddToAllValuesWrong,
  checkStudentLevelUp: checkStudentLevelUp,
  checkAllStudentInClanLevelUp: checkAllStudentInClanLevelUp,
  addTestApi: addTestApi,
  arePointsWrong: arePointsWrong,
  areStepsWrong: areStepsWrong,
  isUserCollaborator: isUserCollaborator,
  findUserRealms: findUserRealms,
  getStudentData: getStudentData
};
