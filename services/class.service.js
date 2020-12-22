const responseMessage = require("../constants/api-response-messages");
const ClassDoc = require('../persistence/class.doc');
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

const accessSpreadsheet = async () => {
  await loadSpreadsheet();
  // TODO add sheet name to class object to DB
  return googleDoc.sheetsByTitle['Class TEST']
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
    student.skillUsed++;
  }
  if (data.isDuel) {
    student.duels++;
  }
  const isSuccess = await ClassTransaction.saveClass(eClass);
  return isSuccess ? eClass : responseMessage.COMMON.ERROR;
};

const countNewValue = (oldValue, incomingValue, modifier, isMana) => {
  if (modifier) {
    incomingValue *= modifier;
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
  await syncGoogleSheet(eClass.students);
  return isSuccess ? eClass : responseMessage.COMMON.ERROR;
};

const syncGoogleSheet = async (students) => {
  const sheet = await accessSpreadsheet();
  const rows = await sheet.getRows();
  const props = [
    'LESSON_XP',
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
      title: `${c.year}. ${c.name}`
    }
  })
  return mapped;
};

module.exports = {
  addLessonXpToSumXp: addLessonXpToSumXp,
  addValue: addValue,
  getClass: getClass,
  getClasses: getClasses,
  addValueToAll: addValueToAll
};
