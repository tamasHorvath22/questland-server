const Student = require('../models/student.model');
const Class = require('../models/class.model');
const Castes = require('../models/castes.model');
const Caste = require('../models/caste.model');
const CasteEnum = require('../constants/castes');

const createClass = async () => {
  const studentList = [];
  studentList.push(Student({
    name: `Józsi`,
    level: 'level 1',
    cumulativeXp: 666,
    xpModifier: 1.2,
    lessonXp: 0,
    manaPoints: 500,
    manaModifier: 1.5,
    skillUsed: 0,
    petFood: 0,
    cursePoints: 0,
    duelCount: 0
  }));

  studentList.push(Student({
    name: `Béla`,
    level: 'level 1',
    cumulativeXp: 666,
    xpModifier: 1.2,
    lessonXp: 0,
    manaPoints: 500,
    manaModifier: 1.5,
    skillUsed: 0,
    petFood: 0,
    cursePoints: 0,
    duelCount: 0
  }));
  
  studentList.push(Student({
    name: `Andrea`,
    level: 'level 1',
    cumulativeXp: 666,
    xpModifier: 1.2,
    lessonXp: 0,
    manaPoints: 500,
    manaModifier: 1.5,
    skillUsed: 0,
    petFood: 0,
    cursePoints: 0,
    duelCount: 0
  }));
  
  studentList.push(Student({
    name: `Enikő`,
    level: 'level 1',
    cumulativeXp: 666,
    xpModifier: 1.2,
    lessonXp: 0,
    manaPoints: 500,
    manaModifier: 1.5,
    skillUsed: 0,
    petFood: 0,
    cursePoints: 0,
    duelCount: 0
  }));
  
  studentList.push(Student({
    name: `Ádám`,
    level: 'level 1',
    cumulativeXp: 666,
    xpModifier: 1.2,
    lessonXp: 0,
    manaPoints: 500,
    manaModifier: 1.5,
    skillUsed: 0,
    petFood: 0,
    cursePoints: 0,
    duelCount: 0
  }));

  studentList.push(Student({
    name: `Horváth Andreasz`,
    level: 'level 1',
    cumulativeXp: 666,
    xpModifier: 1.2,
    lessonXp: 0,
    manaPoints: 500,
    manaModifier: 1.5,
    skillUsed: 0,
    petFood: 0,
    cursePoints: 0,
    duelCount: 0
  }));

  studentList.push(Student({
    name: `Norberta`,
    level: 'level 1',
    cumulativeXp: 666,
    xpModifier: 1.2,
    lessonXp: 0,
    manaPoints: 500,
    manaModifier: 1.5,
    skillUsed: 0,
    petFood: 0,
    cursePoints: 0,
    duelCount: 0
  }));

  studentList.push(Student({
    name: `L. Dávid`,
    level: 'level 1',
    cumulativeXp: 666,
    xpModifier: 1.2,
    lessonXp: 0,
    manaPoints: 500,
    manaModifier: 1.5,
    skillUsed: 0,
    petFood: 0,
    cursePoints: 0,
    duelCount: 0
  }));

  const newClass = Class({
    name: 'Class TEST',
    students: studentList
  })

  await newClass.save();
}

const createCastes = async () => {
  const casteList = []
  const castes = Object.values(CasteEnum);
  castes.forEach(caste => {
    casteList.push(Caste({
      name: caste,
      label: capitalize(caste)
    }))
  })

  const castesObj = Castes({
    castes: casteList
  })
  await castesObj.save();
}

const capitalize = (word) => {
  const first = word.charAt(0).toUpperCase();
  const end = word.substring(1).toLowerCase();
  return `${first}${end}`;
}

module.exports = {
  createClass: createClass,
  createCastes: createCastes
};
