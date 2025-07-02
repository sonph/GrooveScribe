describe('tabToABC', () => {
  beforeAll(() => {
    // Load the GrooveUtils module
    require('../js/groove_utils.js');
    utils = new global.GrooveUtils();
  });

  test('should return corresponding character', () => {
    expect(utils.tablatureToABCNotationPerNote('Stickings', 'b')).toEqual('"R/L"x');
    expect(utils.tablatureToABCNotationPerNote('S', 'g')).toEqual('!(.!!).!c');
    expect(utils.tablatureToABCNotationPerNote('K', 'o')).toEqual('F');
    expect(utils.tablatureToABCNotationPerNote('B', 'x')).toEqual('^d,');
  });

  test('should return null if nothing is found', () => {
    expect(utils.tablatureToABCNotationPerNote('*', 'x')).toEqual(false);
  });
});


describe('ABCtoTab', () => {
  beforeAll(() => {
    // Load the GrooveUtils module
    require('../js/groove_utils.js');
    utils = new global.GrooveUtils();
  });

  test('should return corresponding character', () => {
    expect(utils.abcNotationToTablaturePerNote('', '^d,')).toEqual('x');
    expect(utils.abcNotationToTablaturePerNote('', 'F')).toEqual('o');
  });

  test('should return - if no note is given', () => {
    expect(utils.abcNotationToTablaturePerNote('', false)).toEqual('-');
    expect(utils.abcNotationToTablaturePerNote('Stickings', false)).toEqual('-');
  });
});

describe('mergeDrumTabLines', () => {
  beforeAll(() => {
    // Load the GrooveUtils module
    require('../js/groove_utils.js');
    // GrooveUtils is now available as global.GrooveUtils
    utils = new global.GrooveUtils();
  });

  test('should return merged result', () => {
    expect(utils.mergeDrumTabLines('o---o---', '-xxx-xxx')).toEqual('oxxxoxxx');
  });

  test('should defer to dominate line', () => {
    expect(utils.mergeDrumTabLines('x---o---', 'o---x---')).toEqual('x---o---');
  });

  test('merge unequal lines', () => {
    expect(utils.mergeDrumTabLines('x---x---', '-oo-')).toEqual('xoo-x---');
  });
});

describe('parseTimeSigString', () => {
  beforeAll(() => {
    // Load the GrooveUtils module
    require('../js/groove_utils.js');
    // GrooveUtils is now available as global.GrooveUtils
    utils = new global.GrooveUtils();
  });

  test('should return result', () => {
    expect(utils.parseTimeSigString('4/4')).toEqual([4, 4]);
    expect(utils.parseTimeSigString('9/8')).toEqual([9, 8]);
  });

  test('should return default 4/4 if malformatted', () => {
    expect(utils.parseTimeSigString('invalid')).toEqual([4, 4]);
    expect(utils.parseTimeSigString('4/4/4')).toEqual([4, 4]);
  });

  test('should default to quarter notes if bottom number is not 2 4 8 16', () => {
    expect(utils.parseTimeSigString('4/3')).toEqual([4, 4]);
    expect(utils.parseTimeSigString('9/5')).toEqual([9, 4]);
    expect(utils.parseTimeSigString('3/7')).toEqual([3, 4]);
  });
});