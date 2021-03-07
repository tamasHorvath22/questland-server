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
});
