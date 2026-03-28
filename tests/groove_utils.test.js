import { GrooveUtils } from '../js/groove_utils.js';

describe('GrooveUtils', () => {
  let utils;

  beforeEach(() => {
    utils = new GrooveUtils();
  });

  test('should calculate notes per measure correctly for 4/4', () => {
    // division=16, time_sig_top=4, time_sig_bottom=4
    const result = utils.calc_notes_per_measure(16, 4, 4);
    expect(result).toBe(16);
  });

  test('should calculate notes per measure correctly for 6/8', () => {
    // division=8, time_sig_top=6, time_sig_bottom=8
    const result = utils.calc_notes_per_measure(8, 6, 8);
    expect(result).toBe(6);
  });

  test('should identify triplet division correctly', () => {
    expect(utils.isTripletDivision(12)).toBe(true);
    expect(utils.isTripletDivision(24)).toBe(true);
    expect(utils.isTripletDivision(16)).toBe(false);
  });

  test('should merge drum tab lines correctly', () => {
    // mergeDrumTabLines(dominateLine, subordinateLine)
    // subordinate: |x-------x---x---|
    // dominate:    |----o-------o---|
    // result:      |x---o---x---o---|
    const dominate = "|----o-------o---|";
    const sub = "|x-------x---x---|";
    const merged = utils.mergeDrumTabLines(dominate, sub);
    expect(merged).toBe("|x---o---x---o---|");
  });
});
