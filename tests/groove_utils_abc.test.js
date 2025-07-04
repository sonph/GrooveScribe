describe('ABCtoTab', () => {
  beforeAll(() => {
    require('../js/groove_utils.js');
    utils = new global.GrooveUtils();
  });

  test('should return empty string if no note is given', () => {
    expect(abcNoteToTabChar(DrumType.STICKINGS, AbcNote.OFF)).toEqual(null);
    expect(abcNoteToTabChar(DrumType.SNARE, AbcNote.OFF)).toEqual(null);
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

  test('should return first tab char', () => {
    expect(AbcNote.HH_NORMAL.getFirstTabChar()).toEqual('x');
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
