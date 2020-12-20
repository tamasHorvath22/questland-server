const Student = require('../models/student.model');
const Class = require('../models/class.model');

const saveStudent = async () => {
  const studentList = [];
  for(let i = 0; i < 5; i++) {
    studentList.push(Student({
      name: `Student ${i + 1}`,
      level: 'level 1',
      cumulativeXp: 666,
      xpModifier: 1.2,
      lessonXp: 0,
      manaPoints: 500,
      manaModifier: 1.5,
      skillUsed: 0,
      petFood: 0,
      cursePoints: 0,
      duels: 0
    }));
  }

  const newClass = Class({
    name: 'First class',
    students: studentList
  })

  await newClass.save();
}

module.exports = {
  saveStudent: saveStudent
};
