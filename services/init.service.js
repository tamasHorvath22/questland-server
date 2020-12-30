const Student = require('../models/student.model');
const Realm = require('../models/realm.model');
const Classes = require('../models/classes.model');
const Class = require('../models/class.model');
const ClassEnum = require('../constants/classes');

const createRealm = async () => {
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

  const newRealm = Realm({
    name: 'Class TEST',
    students: studentList
  })

  await newRealm.save();
}

const createClasses = async () => {
  const classList = []
  const classes = Object.values(ClassEnum);
  classes.forEach(className => {
    classList.push(Class({
      name: className,
      label: capitalize(className)
    }))
  })

  const classessObj = Classes({
    classes: classList
  })
  await classessObj.save();
}

const capitalize = (word) => {
  const first = word.charAt(0).toUpperCase();
  const end = word.substring(1).toLowerCase();
  return `${first}${end}`;
}

module.exports = {
  createRealm: createRealm,
  createClasses: createClasses
};
