const Classes = require('../models/classes.model');
const Backup = require('../models/backup.list.model');
const BackupDoc = require('../persistence/backup.doc')
const Class = require('../models/class.model');
const ClanTresholds = require('../models/clan.tresholds.model');
const ClassEnum = require('../constants/classes');
const ClanTresholdDoc = require('../persistence/clan.tresholds.doc')
const ClassesDoc = require('../persistence/classes.doc');
const responseMessage = require('../constants/api-response-messages');

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
        xpModifierIncrease: 0,
        testXpModifierIncrease: 0
      },
      2: {
        treshold: 50,
        xpModifierIncrease: 5,
        testXpModifierIncrease: 0
      },
      3: {
        treshold: 150,
        xpModifierIncrease: 10,
        testXpModifierIncrease: 0
      },
      4: {
        treshold: 300,
        xpModifierIncrease: 20,
        testXpModifierIncrease: 2
      },
      5: {
        treshold: 500,
        xpModifierIncrease: 50,
        testXpModifierIncrease: 5
      }
    })
    await clanTresholds.save();
    console.log('clan tresholds created');
  }
}

const createBackup = async () => {
  const backupDb = await BackupDoc.getBackup();
  if (backupDb === responseMessage.BACKUP.NO_ELEMENT) {
    const backup = Backup({
      realms: {
        init: 'init value'
      }
    })
    await backup.save();
    console.log('backup list created');
  }
}

module.exports = {
  createClasses: createClasses,
  createClanTresholds: createClanTresholds,
  createBackup: createBackup
};
