const Student = require('../models/student.model');
const Realm = require('../models/realm.model');
const Classes = require('../models/classes.model');
const Class = require('../models/class.model');
const ClanTresholds = require('../models/clan.tresholds.model');
const ClassEnum = require('../constants/classes');
const ClanTresholdDoc = require('../persistence/clan.tresholds.doc')
const ClassesDoc = require('../persistence/classes.doc');
const responseMessage = require('../constants/api-response-messages');

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
  const classes = await ClassesDoc.getClasses();
  if (classes === responseMessage.CLASSES.NO_ELEMENT) {
    const classList = []
    const classes = Object.values(ClassEnum);
    classes.forEach(className => {
      classList.push(Class({
        name: className,
        label: capitalize(className)
      }))
    })
    const tresholds = {
      1: 0,
      2: 100,
      3: 250,
      4: 500,
      5: 1000,
      6: 1500,
      7: 2500,
      8: 4000
    }
    const classessObj = Classes({
      classes: classList,
      tresholds: tresholds
    })
    await classessObj.save();
    console.log('classes created');
  }
}

const capitalize = (word) => {
  const first = word.charAt(0).toUpperCase();
  const end = word.substring(1).toLowerCase();
  return `${first}${end}`;
}

const createClanTresholds = async () => {
  const clanTreshold = await ClanTresholdDoc.getClanTresholds();
  if (clanTreshold === responseMessage.CLAN_TRESHOLDS.NO_ELEMENT) {
    const clanTresholds = ClanTresholds({
      1: {
        treshold: 0,
        xpmodifierIncrease: 0
      },
      2: {
        treshold: 50,
        xpmodifierIncrease: 5
      },
      3: {
        treshold: 150,
        xpmodifierIncrease: 10
      },
      4: {
        treshold: 300,
        xpmodifierIncrease: 20
      },
      5: {
        treshold: 500,
        xpmodifierIncrease: 50
      }
    })
    await clanTresholds.save();
    console.log('clan tresholds created');
  }
}

module.exports = {
  createRealm: createRealm,
  createClasses: createClasses,
  createClanTresholds: createClanTresholds
};
