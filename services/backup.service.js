const BackupDoc = require('../persistence/backup.doc');
const Backup = require('../models/backup.model');
const BackupTransactions = require('../persistence/backup.transactions');

const saveBackup = async (realm) => {
  const backup = await BackupDoc.getBackup();
  const newBackup = Backup({
    data: realm,
    time: new Date().getTime()
  });
  const realmBackup = backup.realms[realm._id.toString()];
  if (realmBackup) {
    realmBackup.list.push(newBackup);
  } else {
    backup.realms[realm._id.toString()] = {
      list: [newBackup]
    }
  }
  await BackupTransactions.saveBackup(backup);
};

const getBackup = async () => {
  return await BackupDoc.getBackup();
}

module.exports = {
  saveBackup: saveBackup,
  getBackup: getBackup
};
