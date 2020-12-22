const Student = require('../models/student.model');
const Class = require('../models/class.model');

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

  const newClass = Class({
    name: 'bé',
    year: 9,
    students: studentList
  })

  await newClass.save();
}

module.exports = {
  createClass: createClass
};
