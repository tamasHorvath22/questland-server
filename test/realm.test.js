const assert = require('assert');
const RealmService = require('../services/realm.service');
const MockStudents = require('./mock/students');
const MockClans = require('./mock/clans');
let clans;
let students;

describe('RealmService', () => {
  beforeEach(() => {
    clans = MockClans;
    students = MockStudents
  })
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
});
