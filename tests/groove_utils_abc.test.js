describe('tabToABC', () => {
  beforeAll(() => {
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
    require('../js/groove_utils.js');
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
    require('../js/groove_utils.js');
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

describe('noteArraysFromURLData', () => {
  beforeAll(() => {
    require('../js/groove_utils.js');
    utils = new global.GrooveUtils();
  });

  test('should return array from URL data', () => {
    expect(utils.abcNoteArrayFromTabString('H', '|xxxxxxxx|', 8, 1)).toEqual(['^g', '^g', '^g', '^g', '^g', '^g', '^g', '^g']);
  });

  test('should return multi-measure array from URL data', () => {
    const expectedArray =
      ['F', false, false, false, 'F', false, false, false, 'F', false, false, false, 'F', false, false, false, 'F', false, false, false, 'F', false, false, false, 'F', false, false, false, 'F', false, false, false];
    expect(utils.abcNoteArrayFromTabString('K', 'o---o---o---o---o---o---o---o---', 16, 2)).toEqual(expectedArray);
  });
});

describe('arraysToABC', () => {
  beforeAll(() => {
    // Load the GrooveUtils module
    require('../js/groove_utils.js');
    // GrooveUtils is now available as global.GrooveUtils
    utils = new global.GrooveUtils();
  });

  test('should return result', () => {
    utils.getGrooveDataFromUrlString('TimeSig=4/4&Div=8&Tempo=80&Measures=1&H=|xxxxxxxx|&S=|--o---o-|&K=|o---o---|');
    stickings = [false, false, false, false, false, false, false, false,
      false, false, false, false, false, false, false, false,
      false, false, false, false, false, false, false, false,
      false, false, false, false, false, false, false, false];
    hh = ['^g', false, false, false, '^g', false, false, false,
      '^g', false, false, false, '^g', false, false, false,
      '^g', false, false, false, '^g', false, false, false,
      '^g', false, false, false, '^g', false, false, false];
    snare = [false, false, false, false, false, false, false, false,
      'c', false, false, false, false, false, false, false,
      false, false, false, false, false, false, false, false,
      'c', false, false, false, false, false, false, false];
    kick = ['F', false, false, false, false, false, false, false,
      false, false, false, false, false, false, false, false,
      'F', false, false, false, false, false, false, false,
      false, false, false, false, false, false, false, false];
    toms = [];
    post_voice_abc = "|\n";
    const time_division = 8;
    const abc = utils.create_ABC_from_snare_HH_kick_arrays(stickings, hh, snare, kick, toms, post_voice_abc, time_division, 32, true, 4, 4);
    expect(abc).toContain('[^g4F4]^g4 [c4^g4]^g4 [^g4F4]^g4 [c4^g4]^g4 ||');
  });
});