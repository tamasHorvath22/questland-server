const responseMessage = require("../constants/api-response-messages");
const RealmDoc = require('../persistence/realm.doc');
const Realm = require('../models/realm.model');
const Student = require('../models/student.model');
const ClassDoc = require('../persistence/classes.doc');
const StudProp = require('../constants/student.properties');
const SheetHeaders = require('../constants/sheet.headers');
const RealmTransaction = require('../persistence/realms.transactions');
const { GoogleSpreadsheet } = require("google-spreadsheet");
const googleDoc = new GoogleSpreadsheet("149rWP-JRudGvfVKppuMlOmUxv0fWzqiRGeCZTBJfb-g");

const loadSpreadsheet = async () => {
  try {
    await googleDoc.useServiceAccountAuth({
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n")
    });
    await googleDoc.loadInfo();
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
}

const accessSpreadsheet = async (realmName) => {
  await loadSpreadsheet();
  // TODO add sheet name to realm object to DB
  return googleDoc.sheetsByTitle[realmName];
};

const addValue = async (data) => {
  const realm = await RealmDoc.getById(data.realmId);
  if (realm === responseMessage.DATABASE.ERROR) {
    return responseMessage.DATABASE.ERROR;
  }
  const student = realm.students.find(s => s._id.equals(data.studentId));
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
  }
  const isSuccess = await RealmTransaction.saveRealm(realm);
  return isSuccess ? realm : responseMessage.COMMON.ERROR;
};

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

  const isSuccess = await RealmTransaction.saveRealm(realm);
  return isSuccess ? realm : responseMessage.COMMON.ERROR;
}

const addLessonXpToSumXp = async (realmId) => {
  const realm = await RealmDoc.getById(realmId);
  if (realm === responseMessage.DATABASE.ERROR) {
    return responseMessage.DATABASE.ERROR;
  }

  realm.students.forEach(student => {
    student[StudProp.CUMULATIVE_XP] += student[StudProp.LESSON_XP] * student[StudProp.XP_MODIFIER];
    student[StudProp.LESSON_XP] = 0;
  })

  const isSuccess = await RealmTransaction.saveRealm(realm);
  await syncGoogleSheet(realm.students, realm.name);
  return isSuccess ? realm : responseMessage.COMMON.ERROR;
};

const changeXpModifier = async (data) => {
  const realm = await RealmDoc.getById(data.realmId);
  if (realm === responseMessage.DATABASE.ERROR) {
    return responseMessage.DATABASE.ERROR;
  }
  const student = realm.students.find(s => s._id.equals(data.studentId));

  student.XP_MODIFIER = data.XP_MODIFIER;
  const isSuccess = await RealmTransaction.saveRealm(realm);
  return isSuccess ? realm : responseMessage.COMMON.ERROR;
};

const changeManaModifier = async (data) => {
  const realm = await RealmDoc.getById(data.realmId);
  if (realm === responseMessage.DATABASE.ERROR) {
    return responseMessage.DATABASE.ERROR;
  }
  const student = realm.students.find(s => s._id.equals(data.studentId));

  student.MANA_MODIFIER = data.MANA_MODIFIER;
  const isSuccess = await RealmTransaction.saveRealm(realm);
  return isSuccess ? realm : responseMessage.COMMON.ERROR;
};

const syncGoogleSheet = async (students, realmName) => {
  const sheet = await accessSpreadsheet(realmName);
  const rows = await sheet.getRows();
  const props = [
    'CUMULATIVE_XP',
    'MANA_POINTS',
    'PET_FOOD',
    'CURSE_POINTS',
    'MANA_MODIFIER',
    'XP_MODIFIER',
    'SKILL_COUNTER',
    'DUEL_COUNT'
  ];
  students.forEach(student => {
    const row = rows.find(row => row[SheetHeaders.NAME] === student.name);
    if (!row) {
      return;
    }
    props.forEach(async (prop) => {
      row[SheetHeaders[prop]] = student[StudProp[prop]];
      await row.save();
    })
  })
}

const getRealm = async (realmId) => {
  const realm = await RealmDoc.getById(realmId);
  if (realm === responseMessage.DATABASE.ERROR) {
    return responseMessage.DATABASE.ERROR;
  }
  return realm;
};

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
  if (await checkSheetName(realmName)) {
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

const checkSheetName = async (realmName) => {
  await loadSpreadsheet();
  return googleDoc.sheetsByTitle[realmName];
}

const createSheetForNewRealm = async (realmName) => {
  try {
    await loadSpreadsheet();
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

const addStudents = async (realmId, students) => {
  const realm = await RealmDoc.getById(realmId);
  const studentList = [];
  students.forEach(student => {
    studentList.push(Student({
      [StudProp.NAME]: student.name,
      [StudProp.CLASS]: student.class,
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
  const isSaveSuccess = await RealmTransaction.saveRealm(realm);
  if (isSaveSuccess) {
    const areStudentsAddedToSheet = await addStudentsToSheet(realm.name, students);
    if (!areStudentsAddedToSheet) {
      for (let i = 0; i < realm.students.length; i++) {
        const dbStudent = realm.students[i];
        if (students.find(student => student.name === dbStudent.name)) {
          realm.students.splice(i, 1);
        }
      }
      await RealmTransaction.saveRealm(realm);
      return responseMessage.REALM.ADD_STUDENT_FAIL;
    }
    return await getRealm(realmId);
  }
  return responseMessage.REALM.ADD_STUDENT_FAIL;
}

const addStudentsToSheet = async (realmName, students) => {
  const isSheetLoaded = await loadSpreadsheet();
  if (!isSheetLoaded) {
    return false;
  }
  const sheet = googleDoc.sheetsByTitle[realmName];
  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    await sheet.addRow({
      [SheetHeaders.NAME]: student.name,
      [SheetHeaders.CLASS]: student.class,
      [SheetHeaders.LEVEL]: 1
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

module.exports = {
  addLessonXpToSumXp: addLessonXpToSumXp,
  addValue: addValue,
  getRealm: getRealm,
  getRealms: getRealms,
  addValueToAll: addValueToAll,
  getClasses: getClasses,
  createRealm: createRealm,
  addStudents: addStudents,
  changeManaModifier: changeManaModifier,
  changeXpModifier: changeXpModifier
};
