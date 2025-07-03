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

  test('should return empty string if no note is given', () => {
    expect(abcNoteToTabChar(DrumType.STICKINGS, AbcNote.OFF)).toEqual('');
    expect(tabCharToAbcNote(DrumType.STICKINGS, '').note).toEqual('""x');
    expect(abcNoteToTabChar(DrumType.SNARE, AbcNote.OFF)).toEqual('');
    expect(tabCharToAbcNote(DrumType.SNARE, '')).toEqual(AbcNote.OFF);
  });

  test('should return corresponding tab character', () => {
    expect(abcNoteToTabChar(DrumType.STICKINGS, AbcNote.STICK_R)).toEqual('R');
    expect(abcNoteToTabChar(DrumType.HIHAT, AbcNote.HH_RIDE)).toEqual('r');
    expect(abcNoteToTabChar(DrumType.SNARE, AbcNote.SN_GHOST)).toEqual('g');
    expect(abcNoteToTabChar(DrumType.KICK, AbcNote.KI_NORMAL)).toEqual('o');
  });

  test('should return corresponding abc note', () => {
    expect(tabCharToAbcNote(DrumType.KICK, 'o').note).toEqual('F');
    expect(tabCharToAbcNote(DrumType.TOM1, 'o').note).toEqual('e');
    expect(tabCharToAbcNote(DrumType.HIHAT, 'X').note).toEqual('!accent!^g');
    expect(tabCharToAbcNote(DrumType.HIHAT, 'M').note).toEqual("^D'");
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

describe('tabLineFromAbcNoteArray', () => {
  beforeAll(() => {
    require('../js/groove_utils.js');
    utils = new global.GrooveUtils();
  });

  test('should return valid tab line', () => {
    const noteArray = [AbcNote.HH_NORMAL.note, false, AbcNote.HH_NORMAL.note, false, AbcNote.HH_NORMAL.note, false, AbcNote.HH_NORMAL.note, false];
    expect(utils.tabLineFromAbcNoteArray('H', noteArray, false, noteArray.length, 8)).toEqual('x-x-x-x-|');
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
    const abc = utils.create_ABC_from_snare_HH_kick_arrays(stickings, hh, snare, kick, toms, post_voice_abc, time_division, 32, true, TimeSignature.COMMON_TIME_44);
    expect(abc).toContain('[^g4F4]^g4 [c4^g4]^g4 [^g4F4]^g4 [c4^g4]^g4 ||');
  });
});