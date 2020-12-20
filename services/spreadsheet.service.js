const { GoogleSpreadsheet } = require("google-spreadsheet");
const doc = new GoogleSpreadsheet(
  "149rWP-JRudGvfVKppuMlOmUxv0fWzqiRGeCZTBJfb-g"
);
const responseMessage = require("../constants/api-response-messages");
const sheetHeaders = require("../constants/sheet.headers");
const sleep = require('util').promisify(setTimeout);

async function loadSpreadsheet() {
  try {
    await doc.useServiceAccountAuth({
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n")
    });
    await doc.loadInfo();
  } catch (err) {
    console.log(err);
  }
}

const accessSpreadsheet = async (sheetIndex) => {
  await loadSpreadsheet();
  return doc.sheetsByIndex[sheetIndex];
};

const addValue = async (data) => {
  try {
    const sheet = await accessSpreadsheet(data.sheetIndex);
    const rows = await sheet.getRows();
    const row = rows[data.studentId];
    const saveResult = await saveValue(row, data);
    if (saveResult === responseMessage.COMMON.NOT_NUMBER) {
      return responseMessage.COMMON.NOT_NUMBER;
    }
    await sleep(2000);
    return await getClass(data.sheetIndex);
  } catch (err) {
    console.error(err);
    return responseMessage.CELL.EDIT_FAIL;
  }
};

async function saveValue(row, data) {
  // TODO add XP modifier logic
  const currentValue = row[data.header] ? parseFloat(row[data.header]) : 0;
  if (isNaN(currentValue)) {
      // TODO error handling
    return responseMessage.COMMON.NOT_NUMBER;
  }
  let incomingValue = parseFloat(data.value);
  if (data.header === sheetHeaders.MANA_POINTS && incomingValue < 0) {
    const currentSkillCounter = parseFloat(row[sheetHeaders.SKILL_COUNTER]);
    if (isNaN(currentSkillCounter)) {
      // TODO error handling
      return responseMessage.COMMON.NOT_NUMBER;
    }
    row[sheetHeaders.SKILL_COUNTER] = currentSkillCounter + 1;
  }
  if (data.header === sheetHeaders.LESSON_XP || data.header === sheetHeaders.MANA_POINTS) {
    incomingValue = getModifiedValue(row, incomingValue, data.header);
    if (incomingValue === responseMessage.COMMON.NOT_NUMBER) {
      // TODO error handling
      return responseMessage.COMMON.NOT_NUMBER;
    }
  }
  let value = currentValue + incomingValue;
  if (value < 0) {
    value = 0
  }
  row[data.header] = value.toFixed(2)
  if (data.header === sheetHeaders.MANA_POINTS && value >= 600) {
    row[data.header] = 600;
  }
  if (data.isDuel) {
    let rawValue = row[sheetHeaders.DUEL_COUNT];
    if (rawValue === '' || rawValue === undefined) {
      rawValue = 0;
    } else {
      rawValue = parseFloat(row[sheetHeaders.DUEL_COUNT]);
      if (isNaN(rawValue)) {
        return responseMessage.COMMON.NOT_NUMBER;
      }
    }
    rawValue++;
    row[sheetHeaders.DUEL_COUNT] = rawValue;
  }
  await row.save();
  return row;
}

const getModifiedValue = (row, incomingValue, header) => {
  let modifier;
  const modHeader = header === sheetHeaders.MANA_POINTS ?
    sheetHeaders.MANA_MODIFIER :
    sheetHeaders.XP_MULTIPLIER
  if (row[modHeader] === '') {
    row[modHeader] = 0;
    modifier = 0
  } else {
    modifier = parseFloat(row[modHeader]);
    if (isNaN(modifier)) {
      // TODO error handling
      return responseMessage.COMMON.NOT_NUMBER;
    }
  }
  modifier = (100 + modifier) / 100;
  return incomingValue * modifier;
}

const addValueToAll = async (data) => {
  try {
    const sheet = await accessSpreadsheet(data.sheetIndex);
    const rows = await sheet.getRows();
    data.studentIndexes.forEach(async (index) => {
      await saveValue(rows[index], data);
    })
    // return responseMessage.CELL.EDIT_SUCCESS;
    await sleep(2000);
    return await getClass(data.sheetIndex);
    
  } catch (err) {
    console.error(err);
    return responseMessage.CELL.EDIT_FAIL;
  }
}

const modifyCell = async (data) => {
  try {
    const sheet = await accessSpreadsheet(data.sheetIndex);
    const rows = await sheet.getRows();
    const row = rows[data.studentId];
    row[data.header] = data.cellData;
    await row.save();
    return createStudent(row, data.studentId);
  } catch (err) {
    console.error(err);
    return responseMessage.CELL.EDIT_FAIL;
  }
};

const addLessonXpToSumXp = async (sheetIndex, studentIndexes) => {
  try {
    const sheet = await accessSpreadsheet(sheetIndex);
    const rows = await sheet.getRows();
    studentIndexes.forEach(async (studentIndex) => {
      const row = rows[studentIndex];
      let lessonXp = row[sheetHeaders.LESSON_XP];
      if (!lessonXp || lessonXp === '0') {
        return;
      }
      let cumulativeXp = row[sheetHeaders.CUMULATIVE_XP];
      const sumXp = cumulativeXp ? parseFloat(cumulativeXp) : 0;

      const sessionXp = lessonXp ? parseFloat(lessonXp) : 0;

      const multiplier = parseFloat(row[sheetHeaders.XP_MULTIPLIER]);

      if (isNaN(sumXp) || isNaN(sessionXp)) {
        return responseMessage.COMMON.NOT_NUMBER;
      }
      if (isNaN(multiplier)) {
        row[sheetHeaders.CUMULATIVE_XP] = sumXp + sessionXp;
      } else {
        row[sheetHeaders.CUMULATIVE_XP] = sumXp + sessionXp + sessionXp * multiplier / 100;
      }
      row[sheetHeaders.LESSON_XP] = 0;
      await row.save();
    })
    await sleep(2000);
    return await getClass(sheetIndex);
  } catch (err) {
    console.error(err);
    return responseMessage.CELL.SUM_XP_FAIL;
  }
};

async function createSheet(data) {
  await loadSpreadsheet();
  doc.addSheet();
  return responseMessage.EDIT_SUCCESS;
};

async function deleteSheet(sheetId) {
  await loadSpreadsheet();
  await doc.deleteSheet(sheetId);
  return responseMessage.EDIT_SUCCESS;
}

const getClass = async (sheetIndex) => {
  try {
    const sheet = await accessSpreadsheet(sheetIndex);
    if (!sheet.title.startsWith("Class"))
      return responseMessage.SHEET.NO_SUCH_CLASS;
    const rows = await sheet.getRows();
    return {
      className: sheet.title.substr(6),
      sheetIndex: sheetIndex,
      students: rows.map((row, index) => createStudent(row, index))
        .filter((row) => row.name && !row.not_present)
    }
  } catch (err) {
    console.error(err)
    return responseMessage.SHEET.SHEET_DOES_NOT_EXIST;
  }
};

function createStudent(row, index) {
  return {
    id: index,
    name: row[sheetHeaders.NAME],
    cumulativeXp: row[sheetHeaders.CUMULATIVE_XP],
    lessonXp: row[sheetHeaders.LESSON_XP],
    xpMultiplier: row[sheetHeaders.XP_MULTIPLIER],
    manaPoints: row[sheetHeaders.MANA_POINTS],
    petFood: row[sheetHeaders.PET_FOOD],
    cursePoints: row[sheetHeaders.CURSE_POINTS],
    notPresent: row[sheetHeaders.NOT_PRESENT] !== 'FALSE'
  };
}

const getClasses = async () => {
  try {
    await loadSpreadsheet();
    return doc.sheetsByIndex
      .filter((sheet) => sheet.title.startsWith("Class"))
      .map((sheet) => {
        return {
          id: sheet.sheetId,
          title: sheet.title,
          index: sheet.index,
        };
      });
  } catch (err) {
    return responseMessage.COMMON.ERROR;
  }
};

module.exports = {
  modifyCell: modifyCell,
  addLessonXpToSumXp: addLessonXpToSumXp,
  addValue: addValue,
  createSheet: createSheet,
  deleteSheet,
  getClass: getClass,
  getClasses: getClasses,
  addValueToAll: addValueToAll
};
