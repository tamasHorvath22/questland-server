const responseMessage = require("../constants/api-response-messages");
const ClassDoc = require('../persistence/class.doc');
const Class = require('../models/class.model');
const Student = require('../models/student.model');
const CasteDoc = require('../persistence/castes.doc');
const StudProp = require('../constants/student.properties');
const SheetHeaders = require('../constants/sheet.headers');
const ClassTransaction = require('../persistence/class.transactions');
const { GoogleSpreadsheet } = require("google-spreadsheet");
const googleDoc = new GoogleSpreadsheet("149rWP-JRudGvfVKppuMlOmUxv0fWzqiRGeCZTBJfb-g");

const loadSpreadsheet = async () => {
  try {
    await googleDoc.useServiceAccountAuth({
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n")
    });
    await googleDoc.loadInfo();
  } catch (err) {
    console.log(err);
  }
}

const accessSpreadsheet = async (className) => {
  await loadSpreadsheet();
  // TODO add sheet name to class object to DB
  return googleDoc.sheetsByTitle[className];
};

const addValue = async (data) => {
  const eClass = await ClassDoc.getById(data.classId);
  if (eClass === responseMessage.DATABASE.ERROR) {
    return responseMessage.DATABASE.ERROR;
  }
  const student = eClass.students.find(s => s._id.equals(data.studentId));
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
  const isSuccess = await ClassTransaction.saveClass(eClass);
  return isSuccess ? eClass : responseMessage.COMMON.ERROR;
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
  const eClass = await ClassDoc.getById(data.classId);
  if (eClass === responseMessage.DATABASE.ERROR) {
    return responseMessage.DATABASE.ERROR;
  }
  eClass.students.forEach(student => {
    student[data.pointType] += data.value
  })

  const isSuccess = await ClassTransaction.saveClass(eClass);
  return isSuccess ? eClass : responseMessage.COMMON.ERROR;
}

const addLessonXpToSumXp = async (classId) => {
  const eClass = await ClassDoc.getById(classId);
  if (eClass === responseMessage.DATABASE.ERROR) {
    return responseMessage.DATABASE.ERROR;
  }

  eClass.students.forEach(student => {
    student[StudProp.CUMULATIVE_XP] += student[StudProp.LESSON_XP] * student[StudProp.XP_MODIFIER];
    student[StudProp.LESSON_XP] = 0;
  })

  const isSuccess = await ClassTransaction.saveClass(eClass);
  await syncGoogleSheet(eClass.students, eClass.name);
  return isSuccess ? eClass : responseMessage.COMMON.ERROR;
};

const syncGoogleSheet = async (students, className) => {
  const sheet = await accessSpreadsheet(className);
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

const getClass = async (classId) => {
  const eClass = await ClassDoc.getById(classId);
  if (eClass === responseMessage.DATABASE.ERROR) {
    return responseMessage.DATABASE.ERROR;
  }
  return eClass;
};

const getClasses = async () => {
  // TODO refactor the properties
  const classes = await ClassDoc.getAll();
  if (classes === responseMessage.DATABASE.ERROR) {
    return responseMessage.DATABASE.ERROR;
  }
  const mapped = classes.map((c) => {
    return {
      id: c._id,
      title: c.name
    }
  })
  return mapped;
};

const getCastes = async () => {
  const castesObj = await CasteDoc.getCastes();
  if (castesObj === responseMessage.DATABASE.ERROR) {
    return responseMessage.DATABASE.ERROR;
  }
  return castesObj.castes;
};

const createClass = async (className, students) => {
  const isSaveToDbSuccess = await createClassToDb(className, students);
  if (isSaveToDbSuccess) {
    await createSheetForNewClass(className, students);
    return responseMessage.CLASS.CREATE_SUCCESS;
  }
  return responseMessage.CLASS.CREATE_FAIL;
}

const createSheetForNewClass = async (className, students) => {
  await loadSpreadsheet();
  await googleDoc.addSheet({
    headerValues: Object.values(SheetHeaders),
    title: className,
  });
  const sheet = googleDoc.sheetsByTitle[className];
  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    await sheet.addRow({
      [SheetHeaders.NAME]: student.name,
      [SheetHeaders.CLASS]: student.caste,
      [SheetHeaders.LEVEL]: 1
    });
  }
}

const createClassToDb = async (className, students) => {
  const studentList = [];
  students.forEach(student => {
    studentList.push(Student({
      [StudProp.NAME]: student.name,
      [StudProp.CASTE]: student.caste,
      [StudProp.LEVEL]: 1,
      [StudProp.CUMULATIVE_XP]: 0,
      [StudProp.XP_MODIFIER]: 1,
      [StudProp.LESSON_XP]: 0,
      [StudProp.MANA_POINTS]: 0,
      [StudProp.MANA_MODIFIER]: 1,
      [StudProp.SKILL_COUNTER]: 0,
      [StudProp.PET_FOOD]: 0,
      [StudProp.CURSE_POINTS]: 0,
      [StudProp.DUEL_COUNT]: 0,
    }))
  })
  const newClass = Class({
    name: className,
    students: studentList
  })
  try {
    await newClass.save();
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
}

module.exports = {
  addLessonXpToSumXp: addLessonXpToSumXp,
  addValue: addValue,
  getClass: getClass,
  getClasses: getClasses,
  addValueToAll: addValueToAll,
  getCastes: getCastes,
  createClass: createClass
};
