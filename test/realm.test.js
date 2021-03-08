const assert = require('assert');
const RealmService = require('../services/realm.service');
const MockStudents = require('./mock/students');
const MockClans = require('./mock/clans');
const MockRealm = require('./mock/realm');
const StudProp = require('../constants/student.properties');
let clans;
let students;
let realm;

describe('RealmService', () => {
  beforeEach(() => {
    students = MockStudents
    clans = MockClans;
    realm = MockRealm;
  });
  describe('findElementById tests', () => {
    it('should return null if array is null', () => {
      const result = RealmService.findElemById(null, '602b961f21ae205a2cdb9b61');
      assert.strictEqual(result, null);
    });
    it('should return null if array is empty', () => {
      const result = RealmService.findElemById([], '602b961f21ae205a2cdb9b61');
      assert.strictEqual(result, null);
    });
    it('should return null if there is no ID', () => {
      const result = RealmService.findElemById(students, null);
      assert.strictEqual(result, null);
    });
    it('should return Cartman', () => {
      const result = RealmService.findElemById(students, '602b961f21ae205a2cdb9b61');
      assert.strictEqual(result.name, 'Cartman');
    });
    it('should undefined if there is no match', () => {
      const result = RealmService.findElemById(students, 'not existing ID');
      assert.strictEqual(result, undefined);
    });
  });

  describe('getStudentClanLevel tests', () => {
    it('should return 1 if no studentClan', () => {
      const result = RealmService.getStudentClanLevel(null, clans);
      assert.strictEqual(result, 1);
    });
    it('should return 1 if no clans', () => {
      const result = RealmService.getStudentClanLevel('603f3b5fb70c640024be589e', null);
      assert.strictEqual(result, 1);
    });
    it('should return 1 if clan list is empty', () => {
      const result = RealmService.getStudentClanLevel(null, []);
      assert.strictEqual(result, 1);
    });
    it('should return 2', () => {
      const result = RealmService.getStudentClanLevel('603f3b5fb70c640024be589e', clans);
      assert.strictEqual(result, 2);
    });
  });

  describe('getStudentClanLevel tests', () => {
    it('should return 1 if no studentClan', () => {
      const result = RealmService.getStudentClanLevel(null, clans);
      assert.strictEqual(result, 1);
    });
    it('should return 1 if no clans', () => {
      const result = RealmService.getStudentClanLevel('603f3b5fb70c640024be589e', null);
      assert.strictEqual(result, 1);
    });
    it('should return 1 if clan list is empty', () => {
      const result = RealmService.getStudentClanLevel(null, []);
      assert.strictEqual(result, 1);
    });
    it('should return 2', () => {
      const result = RealmService.getStudentClanLevel('603f3b5fb70c640024be589e', clans);
      assert.strictEqual(result, 2);
    });
  });

  describe('countModifiedValue tests', () => {
    describe('negative values', () => {
      it('should return 10 mana when -60 is added', () => {
        const result = RealmService.countModifiedValue(students[2], -60, StudProp.MANA_POINTS, false, 1, false);
        assert.strictEqual(result, 10);
      });
      it('should return 0 mana when -80 is added, and goes below 0', () => {
        const result = RealmService.countModifiedValue(students[2], -80, StudProp.MANA_POINTS, false, 1, false);
        assert.strictEqual(result, 0);
      });
      it('should return 0 XP when -80 is added, and goes below 0', () => {
        const result = RealmService.countModifiedValue(students[2], -80, StudProp.LESSON_XP, false, 1, false);
        assert.strictEqual(result, 0);
      });
      it('should return 21.5 XP when -10 is added, no modifier when the value is negative', () => {
        const result = RealmService.countModifiedValue(students[2], -10, StudProp.LESSON_XP, false, 1, false);
        assert.strictEqual(result, 21.5);
      });
    });
    describe('mana points', () => {
      it('should return 100 mana points when 30 is added', () => {
        const result = RealmService.countModifiedValue(students[3], 30, StudProp.MANA_POINTS, false, 1, false);
        assert.strictEqual(result, 100);
      });
      it('should return 600 mana points when it wolud be over 600', () => {
        const result = RealmService.countModifiedValue(students[3], 2000, StudProp.MANA_POINTS, false, 1, false);
        assert.strictEqual(result, 600);
      });
      it('should return 120 mana points when 100 added, and there is 20% modifier', () => {
        const result = RealmService.countModifiedValue(students[4], 100, StudProp.MANA_POINTS, false, 1, false);
        assert.strictEqual(result, 120);
      });
    });
    describe('XP modifiers', () => {
      it('should return 36.5 floating point number when 5 is added', () => {
        const result = RealmService.countModifiedValue(students[2], 5, StudProp.LESSON_XP, false, 1, false);
        assert.strictEqual(result, 36.5);
      });
      it('should return 10 mana points - no own modifier, no clan modifier', () => {
        const result = RealmService.countModifiedValue(students[0], 10, StudProp.LESSON_XP, false, 1, false);
        assert.strictEqual(result, 10);
      });
      it('should return 10.5 mana points - no own modifier, 5% clan modifier', () => {
        const result = RealmService.countModifiedValue(students[0], 10, StudProp.LESSON_XP, false, 2, false);
        assert.strictEqual(result, 10.5);
      });
      it('should return 12 mana points - 20% own modifier, no clan modifier', () => {
        const result = RealmService.countModifiedValue(students[5], 10, StudProp.LESSON_XP, false, 1, false);
        assert.strictEqual(result, 12);
      });
      it('should return 12.5 mana points - 20% own modifier, 5% clan modifier', () => {
        const result = RealmService.countModifiedValue(students[5], 10, StudProp.LESSON_XP, false, 2, false);
        assert.strictEqual(result, 12.5);
      });  
    });
    describe('class specific modifiers', () => {
      it('should return 33 mana points - bard has 10% default modifier', () => {
        const result = RealmService.countModifiedValue(students[5], 30, StudProp.MANA_POINTS, false, 1, false);
        assert.strictEqual(result, 33);
      });
      it('should return 7 pet food - adventurer x2 default modifier', () => {
        const result = RealmService.countModifiedValue(students[0], 1, StudProp.PET_FOOD, false, 1, false);
        assert.strictEqual(result, 7);
      });
      it('should return 41.5 XP - warrior x2 default test modifier', () => {
        const result = RealmService.countModifiedValue(students[2], 5, StudProp.LESSON_XP, true, 1, false);
        assert.strictEqual(result, 41.5);
      });
      it('should return 42 XP - warrior x2 default test modifier + 2nd clan level 5%', () => {
        const result = RealmService.countModifiedValue(students[2], 5, StudProp.LESSON_XP, true, 2, false);
        assert.strictEqual(result, 42);
      });
    });
    describe('test specific modifiers', () => {
      it('should return 77.5 XP - clan level 5 50% + 5% modifiers', () => {
        const result = RealmService.countModifiedValue(students[0], 50, StudProp.LESSON_XP, false, 5, true);
        assert.strictEqual(result, 77.5);
      });
      it('should return 77.5 XP - clan level 5 50% + 5% modifiers + 20% own modifier', () => {
        const result = RealmService.countModifiedValue(students[1], 50, StudProp.LESSON_XP, false, 5, true);
        assert.strictEqual(result, 87.5);
      });
    });
  });

  describe('addValue tests', () => {
    it('should return 1 as skill used', () => {
      const data = {
        realmId: 'not needed',
        studentId: 'not needed',
        pointType: StudProp.MANA_POINTS,
        value: -50,
        isDuel: false,
        isWinner: false
      };
      const result = RealmService.addValue(data, students[0], 1);
      assert.strictEqual(result[StudProp.SKILL_COUNTER], 1);
    });
    it('should return 2 as duel count', () => {
      const data = {
        realmId: 'not needed',
        studentId: 'not needed',
        pointType: StudProp.LESSON_XP,
        value: 5,
        isDuel: true,
        isWinner: false
      };
      const result = RealmService.addValue(data, students[0], 1);
      assert.strictEqual(result[StudProp.DUEL_COUNT], 2);
    });
  });

  describe('manageClanGloryPointsAndLevelUp tests', () => {
    it('should return 5th level clan, no level up', () => {
      const result = RealmService.manageClanGloryPointsAndLevelUp(JSON.parse(JSON.stringify(clans[2])), 30);
      assert.strictEqual(result.level, 5);
    });
    it('should return 530 glory points', () => {
      const result = RealmService.manageClanGloryPointsAndLevelUp(JSON.parse(JSON.stringify(clans[2])), 30);
      assert.strictEqual(result.gloryPoints, 530);
    });
    it('should return 175 glory points', () => {
      const result = RealmService.manageClanGloryPointsAndLevelUp(JSON.parse(JSON.stringify(clans[3])), 30);
      assert.strictEqual(result.gloryPoints, 175);
    });
    it('should return level 3', () => {
      const result = RealmService.manageClanGloryPointsAndLevelUp(JSON.parse(JSON.stringify(clans[3])), 30);
      assert.strictEqual(result.level, 3);
    });
    it('should return 0 glory points if it goes under 0', () => {
      const result = RealmService.manageClanGloryPointsAndLevelUp(JSON.parse(JSON.stringify(clans[0])), -100);
      assert.strictEqual(result.gloryPoints, 0);
    });
    it('should return level 1 after substracting 50 points', () => {
      const result = RealmService.manageClanGloryPointsAndLevelUp(JSON.parse(JSON.stringify(clans[0])), -50);
      assert.strictEqual(result.level, 1);
    });
  });

  describe('addValueToAll tests', () => {
    it('should return 0 XP, student was not present', () => {
      data = {
        realmId: 'not needed',
        pointType: StudProp.LESSON_XP,
        value: 5,
        exclude: ['603df26d9dbb783a48d60096']
      }
      const result = RealmService.addValueToAll(JSON.parse(JSON.stringify(realm)), data);
      assert.strictEqual(result.students[0][StudProp.LESSON_XP], 0);
    });
    it('should return 5 XP, student was present', () => {
      data = {
        realmId: 'not needed',
        pointType: StudProp.LESSON_XP,
        value: 5,
        exclude: ['603df26d9dbb783a48d60096']
      }
      const result = RealmService.addValueToAll(JSON.parse(JSON.stringify(realm)), data);
      assert.strictEqual(result.students[1][StudProp.LESSON_XP], 5);
    });
  });

  describe('resetRealm tests', () => {
    it('should return 0 finishLessonMana', () => {
      const result = RealmService.resetRealm(JSON.parse(JSON.stringify(realm)));
      assert.strictEqual(result.finishLessonMana, 0);
    });
    it('should return null as class', () => {
      const result = RealmService.resetRealm(JSON.parse(JSON.stringify(realm)));
      assert.strictEqual(result.students[0].class, null);
    });
    it('should return null as class', () => {
      const result = RealmService.resetRealm(JSON.parse(JSON.stringify(realm)));
      assert.strictEqual(result.students[0].clan, null);
    });
    it('should return 1 as level', () => {
      const result = RealmService.resetRealm(JSON.parse(JSON.stringify(realm)));
      assert.strictEqual(result.students[0].level, 1);
    });
    it('should return 0 as cumulativeXp', () => {
      const result = RealmService.resetRealm(JSON.parse(JSON.stringify(realm)));
      assert.strictEqual(result.students[0].cumulativeXp, 0);
    });
    it('should return 0 as xpModifier', () => {
      const result = RealmService.resetRealm(JSON.parse(JSON.stringify(realm)));
      assert.strictEqual(result.students[0].xpModifier, 0);
    });
    it('should return 0 as lessonXp', () => {
      const result = RealmService.resetRealm(JSON.parse(JSON.stringify(realm)));
      assert.strictEqual(result.students[0].lessonXp, 0);
    });
    it('should return 0 as manaPoints', () => {
      const result = RealmService.resetRealm(JSON.parse(JSON.stringify(realm)));
      assert.strictEqual(result.students[0].manaPoints, 0);
    });
    it('should return 0 as manaModifier', () => {
      const result = RealmService.resetRealm(JSON.parse(JSON.stringify(realm)));
      assert.strictEqual(result.students[0].manaModifier, 0);
    });
    it('should return 0 as skillUsed', () => {
      const result = RealmService.resetRealm(JSON.parse(JSON.stringify(realm)));
      assert.strictEqual(result.students[0].skillUsed, 0);
    });
    it('should return 0 as petFood', () => {
      const result = RealmService.resetRealm(JSON.parse(JSON.stringify(realm)));
      assert.strictEqual(result.students[0].petFood, 0);
    });
    it('should return 0 as cursePoints', () => {
      const result = RealmService.resetRealm(JSON.parse(JSON.stringify(realm)));
      assert.strictEqual(result.students[0].cursePoints, 0);
    });
    it('should return 0 as duelCount', () => {
      const result = RealmService.resetRealm(JSON.parse(JSON.stringify(realm)));
      assert.strictEqual(result.students[0].duelCount, 0);
    });
    it('should return 0 as clan list length', () => {
      const result = RealmService.resetRealm(JSON.parse(JSON.stringify(realm)));
      assert.strictEqual(result.clans.length, 0);
    });
  });

  describe('setModifiedStudent tests', () => {
    it('should return newName as name', () => {
      const modifiedStud = {
        name: 'newName',
        class: '',
        clan: '',
        xpModifier: 0,
        manaModifier: 0
      }
      const result = RealmService.setModifiedStudent(JSON.parse(JSON.stringify(students[0])), modifiedStud);
      assert.strictEqual(result.name, 'newName');
    });
    it('should return WIZARD as class', () => {
      const modifiedStud = {
        name: 'newName',
        class: 'WIZARD',
        clan: '',
        xpModifier: 0,
        manaModifier: 0
      }
      const result = RealmService.setModifiedStudent(JSON.parse(JSON.stringify(students[0])), modifiedStud);
      assert.strictEqual(result.class, 'WIZARD');
    });
    it('should return 10 as xpModifier', () => {
      const modifiedStud = {
        name: 'newName',
        class: 'WIZARD',
        clan: '603f3b5fb70c640024be589f',
        xpModifier: 10,
        manaModifier: 0
      }
      const result = RealmService.setModifiedStudent(JSON.parse(JSON.stringify(students[0])), modifiedStud);
      assert.strictEqual(result.xpModifier, 10);
    });
    it('should return 10 as manaModifier', () => {
      const modifiedStud = {
        name: 'newName',
        class: 'WIZARD',
        clan: '603f3b5fb70c640024be589f',
        xpModifier: 10,
        manaModifier: 10
      }
      const result = RealmService.setModifiedStudent(JSON.parse(JSON.stringify(students[0])), modifiedStud);
      assert.strictEqual(result.manaModifier, 10);
    });
  });

  describe('areModifyStudentTypesWrong tests', () => {
    it('should return true if name is empty string', () => {
      const modifiedStud = {
        name: '',
        class: 'WARSMITH',
        clan: '603f3b5fb70c640024be589f',
        xpModifier: 10,
        manaModifier: 10
      }
      const result = RealmService.areModifyStudentTypesWrong(JSON.parse(JSON.stringify(realm)), modifiedStud);
      assert.strictEqual(result, true);
    });
    it('should return true if class is not valid', () => {
      const modifiedStud = {
        name: 'newName',
        class: 'WARSMITH-',
        clan: '603f3b5fb70c640024be589f',
        xpModifier: 10,
        manaModifier: 10
      }
      const result = RealmService.areModifyStudentTypesWrong(JSON.parse(JSON.stringify(realm)), modifiedStud);
      assert.strictEqual(result, true);
    });
    it('should return false if class is null, others are valid', () => {
      const modifiedStud = {
        name: 'newName',
        class: null,
        clan: '603f3b5fb70c640024be589f',
        xpModifier: 10,
        manaModifier: 10
      }
      const result = RealmService.areModifyStudentTypesWrong(JSON.parse(JSON.stringify(realm)), modifiedStud);
      assert.strictEqual(result, false);
    });
    it('should return true if clan is not valid', () => {
      const modifiedStud = {
        name: 'newName',
        class: 'WARSMITH',
        clan: '603f3b5fb70c640024be589f-',
        xpModifier: 10,
        manaModifier: 10
      }
      const result = RealmService.areModifyStudentTypesWrong(JSON.parse(JSON.stringify(realm)), modifiedStud);
      assert.strictEqual(result, true);
    });
    it('should return false if clan is null, others are valid', () => {
      const modifiedStud = {
        name: 'newName',
        class: 'WARSMITH',
        clan: null,
        xpModifier: 10,
        manaModifier: 10
      }
      const result = RealmService.areModifyStudentTypesWrong(JSON.parse(JSON.stringify(realm)), modifiedStud);
      assert.strictEqual(result, false);
    });
    it('should return true if xpModifier is not number', () => {
      const modifiedStud = {
        name: 'newName',
        class: 'WARSMITH',
        clan: '603f3b5fb70c640024be589f',
        xpModifier: 'l',
        manaModifier: 10
      }
      const result = RealmService.areModifyStudentTypesWrong(JSON.parse(JSON.stringify(realm)), modifiedStud);
      assert.strictEqual(result, true);
    });
    it('should return true if xpModifier is less than 0', () => {
      const modifiedStud = {
        name: 'newName',
        class: 'WARSMITH',
        clan: '603f3b5fb70c640024be589f',
        xpModifier: -1,
        manaModifier: 10
      }
      const result = RealmService.areModifyStudentTypesWrong(JSON.parse(JSON.stringify(realm)), modifiedStud);
      assert.strictEqual(result, true);
    });
    it('should return true if manaModifier is not number', () => {
      const modifiedStud = {
        name: 'newName',
        class: 'WARSMITH',
        clan: '603f3b5fb70c640024be589f',
        xpModifier: 10,
        manaModifier: 't'
      }
      const result = RealmService.areModifyStudentTypesWrong(JSON.parse(JSON.stringify(realm)), modifiedStud);
      assert.strictEqual(result, true);
    });
    it('should return true if manaModifier is less than 0', () => {
      const modifiedStud = {
        name: 'newName',
        class: 'WARSMITH',
        clan: '603f3b5fb70c640024be589f',
        xpModifier: 10,
        manaModifier: -10
      }
      const result = RealmService.areModifyStudentTypesWrong(JSON.parse(JSON.stringify(realm)), modifiedStud);
      assert.strictEqual(result, true);
    });
  });

  describe('areClansWrong tests', () => {
    it('should return false when clan is null', () => {
      const studentClan = null;
      const result = RealmService.areClansWrong(JSON.parse(JSON.stringify(realm)), studentClan);
      assert.strictEqual(result, false);
    });
    it('should return false when clan is valid', () => {
      const studentClan = '603f3b5fb70c640024be589e';
      const result = RealmService.areClansWrong(JSON.parse(JSON.stringify(realm)), studentClan);
      assert.strictEqual(result, false);
    });
    it('should return true when clan is invalid', () => {
      const studentClan = '603f3b5fb70c640024be589e--';
      const result = RealmService.areClansWrong(JSON.parse(JSON.stringify(realm)), studentClan);
      assert.strictEqual(result, true);
    });
  });

  describe('setStudentClans tests', () => {
    it('should return with no changes if mewClan is null', () => {
      const newClan = null;
      const student = JSON.parse(JSON.stringify(realm.students[0]));
      const result = RealmService.setStudentClans(JSON.parse(JSON.stringify(realm)), student, newClan);
      const modifiedStudent = result.students.find(s => s._id.toString() === student._id.toString());
      assert.strictEqual(modifiedStudent.clan, '603f3b5fb70c640024be589f');
    });
    it('should return with the same clan ID when no changes', () => {
      const newClan = '603f3b5fb70c640024be589f';
      const student = JSON.parse(JSON.stringify(realm.students[0]));
      const result = RealmService.setStudentClans(JSON.parse(JSON.stringify(realm)), student, newClan);
      const modifiedStudent = result.students.find(s => s._id.toString() === student._id.toString());
      assert.strictEqual(modifiedStudent.clan, '603f3b5fb70c640024be589f');
    });
    it('should return new clan ID, added to new clan, removed from previous clan', () => {
      const newClan = '603f3b5fb70c640024be589e';
      const student = JSON.parse(JSON.stringify(realm.students[0]));
      const result = RealmService.setStudentClans(JSON.parse(JSON.stringify(realm)), student, newClan);
      const modifiedStudent = result.students.find(s => s._id.toString() === student._id.toString());
      const prevClan = result.clans.find(c => c._id.toString() === '603f3b5fb70c640024be589f');
      const newStudentClan = result.clans.find(c => c._id.toString() === '603f3b5fb70c640024be589e');
      assert.strictEqual(modifiedStudent.clan, '603f3b5fb70c640024be589f');
      assert.strictEqual(prevClan.students.indexOf('603df26d9dbb783a48d60096'), -1);
      assert.strictEqual(newStudentClan.students.includes('603df26d9dbb783a48d60096'), true);
    });
  });

});
