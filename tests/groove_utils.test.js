describe('Subdivision', () => {
  beforeAll(() => {
    require('../js/groove_utils.js');
  });

  test('should create Subdivision instances', () => {
    expect(Subdivision.of(1)).toEqual(Subdivision.WHOLE);
    expect(Subdivision.of(2)).toEqual(Subdivision.HALF);
    expect(Subdivision.of(4)).toEqual(Subdivision.QUARTER);
    expect(Subdivision.of(8)).toEqual(Subdivision.EIGHTH);
  });

  test('divideBy', () => {
    expect(Subdivision.HALF.divideBy(Subdivision.SIXTEENTH)).toEqual(8);
  });
});

describe('Measure', () => {
  beforeAll(() => {
    require('../js/groove_utils.js');
    measure = new Measure(TimeSignature.COMMON_TIME_44, Subdivision.SIXTEENTH);
  });

  test('should initialize with default values', () => {
    expect(measure.tabSubdivision.value).toEqual(16);
    expect(measure.notesPerMeasure).toEqual(16);
  });

  test('should create empty array of length 4', () => {
    expect(Measure.createEmptyArrayOfLength(4)).toEqual([null, null, null, null]);
  });

  test('should fill array', () => {
    expect(Measure.fillArray(Measure.createEmptyArrayOfLength(4), 'o', 1, 2)).toEqual([null, 'o', null, 'o']);
  });

  test('should create default hihat groove', () => {
    // Expect to have the hihat filled every 2 notes.
    expect(measure.getArray(DrumType.HIHAT)).toEqual([
      'x', null, 'x', null, 'x', null, 'x', null,
      'x', null, 'x', null, 'x', null, 'x', null]);
  });

  test('should create default snare groove', () => {
    // Expect to have the snare filled on 2 & 4 beat.
    expect(measure.getArray(DrumType.SNARE)).toEqual([
      null, null, null, null, 'O', null, null, null,
      null, null, null, null, 'O', null, null, null]);
  });

  test('should create default kick groove', () => {
    // Expect to have the kick filled on 1 & 3 beat.
    expect(measure.getArray(DrumType.KICK)).toEqual([
      'o', null, null, null, null, null, null, null,
      'o', null, null, null, null, null, null, null]);
  });

  test('should set correct data from url params', () => {
    measure.setDataFromString(DrumType.SNARE, 'ooo-oo--o-------');
    expect(measure.getArray(DrumType.SNARE)).toEqual([
      'o', 'o', 'o', null, 'o', 'o', null, null,
      'o', null, null, null, null, null, null, null]);
  });

  test('should get correct string from array value', () => {
    measure.arrays.set(DrumType.KICK.name, [null, 'o', null, 'o', 'o']);
    expect(measure.toString(DrumType.KICK)).toEqual('-o-oo');
  });

  test('should get correct scaled array', () => {
    measure.arrays[DrumType.KICK.name] = [null, 'o', null, 'o', 'o'];
    expect(measure.getScaledArray(DrumType.KICK, 10)).toEqual([null, null, 'o', null, null, null, 'o', null, 'o', null]);
  });
});

describe('GrooveData', () => {
  beforeAll(() => {
    require('../js/groove_utils.js');
    // 2/4 16th notes = 8 notes per measure.
    grooveData = new GrooveData(new TimeSignature(2, Subdivision.QUARTER), Subdivision.SIXTEENTH);
  });

  test('measuresFromUrl should fill data from url params', () => {
    const url = 'H=|x---x-x-|';
    grooveData.measuresFromUrl(url);
    expect(grooveData.measures[0].getArray(DrumType.HIHAT)).toEqual([
      'x', null, null, null, 'x', null, 'x', null]);
  });

  test('measuresFromUrl should fill data from url params -- auto append 2nd measure', () => {
    const url = 'S=|oooo----|o-o-o-o-|';
    grooveData.measuresFromUrl(url);
    expect(grooveData.measures[0].getArray(DrumType.SNARE)).toEqual([
      'o', 'o', 'o', 'o', null, null, null, null]);
    expect(grooveData.measures[1].getArray(DrumType.SNARE)).toEqual([
      'o', null, 'o', null, 'o', null, 'o', null]);
  });

  test('splitTabIntoMeasureStrings should succeed', () => {
    expect(GrooveData.splitTabIntoMeasureStrings('|x-x-|')).toEqual(['x-x-']);
    expect(GrooveData.splitTabIntoMeasureStrings('|x-x-')).toEqual(['x-x-']);
    expect(GrooveData.splitTabIntoMeasureStrings('x-x-')).toEqual(['x-x-']);
  });

  test('splitTabIntoMeasureStrings should succeed -- multi measures', () => {
    expect(GrooveData.splitTabIntoMeasureStrings('|x-x-|-x-x|')).toEqual(['x-x-', '-x-x']);
    expect(GrooveData.splitTabIntoMeasureStrings('x-x-|-x-x')).toEqual(['x-x-', '-x-x']);
  });

  test('splitTabIntoMeasureStrings should succeed -- empty string', () => {
    expect(GrooveData.splitTabIntoMeasureStrings(null)).toEqual([]);
    expect(GrooveData.splitTabIntoMeasureStrings('')).toEqual([]);
    expect(GrooveData.splitTabIntoMeasureStrings('|')).toEqual([]);
  });

  test('toUrl should encode params', () => {
    expect(grooveData.toUrl()).toContain('TimeSig=2/4&Div=16&Tempo=80&H=|x-x-x-x-|x-x-x-x-|&S=|oooo----|o-o-o-o-|&K=|o-------|o-------|');
  });

  test('toUrl should not encode stickings if not shown', () => {
    grooveData.showStickings = false;
    grooveData.measures[0].arrays.get(DrumType.STICKINGS.name)[0] = 'b';
    expect(grooveData.toUrl()).not.toContain('Stickings');
  });
});

describe('tabNumberOfNotesPerMeasure', () => {
  beforeAll(() => {
    require('../js/groove_utils.js');
    utils = new global.GrooveUtils(excludeAbcForTesting = true);
  });

  test('should return correct calculations', () => {
    expect(utils.tabNumberOfNotesPerMeasure(Subdivision.EIGHTH, new TimeSignature(4, Subdivision.QUARTER))).toEqual(8);
    expect(utils.tabNumberOfNotesPerMeasure(Subdivision.EIGHTH, new TimeSignature(9, Subdivision.EIGHTH))).toEqual(9);
    expect(utils.tabNumberOfNotesPerMeasure(Subdivision.SIXTEENTH, new TimeSignature(4, Subdivision.EIGHTH))).toEqual(8);
    expect(utils.tabNumberOfNotesPerMeasure(Subdivision.QUARTER, new TimeSignature(8, Subdivision.EIGHTH))).toEqual(4);
    expect(utils.tabNumberOfNotesPerMeasure(Subdivision.EIGHTH_TRIPLET, new TimeSignature(8, Subdivision.EIGHTH))).toEqual(12);
  });
});

describe('TimeSignature.fromString', () => {
  beforeAll(() => {
    require('../js/groove_utils.js');
  });

  test('should return result', () => {
    expect(TimeSignature.fromString('4/4')).toEqual(new TimeSignature(4, Subdivision.QUARTER));
    expect(TimeSignature.fromString('9/8')).toEqual(new TimeSignature(9, Subdivision.EIGHTH));
  });

  test('should return default 4/4 if malformatted', () => {
    expect(TimeSignature.fromString('invalid')).toEqual(new TimeSignature(4, Subdivision.QUARTER));
    expect(TimeSignature.fromString('4/4/4')).toEqual(new TimeSignature(4, Subdivision.QUARTER));
  });

  test('should default to quarter notes if bottom number is not 2 4 8 16', () => {
    expect(TimeSignature.fromString('4/3')).toEqual(new TimeSignature(4, Subdivision.QUARTER));
    expect(TimeSignature.fromString('9/5')).toEqual(new TimeSignature(9, Subdivision.QUARTER));
    expect(TimeSignature.fromString('3/7')).toEqual(new TimeSignature(3, Subdivision.QUARTER));
  });
});

describe('ABCtoTab', () => {
  beforeAll(() => {
    require('../tsjs/groove_utils.js');
    utils = new global.GrooveUtils(excludeAbcForTesting = true);
  });

  test('should return empty string if no note is given', () => {
    expect(abcNoteToTabChar(DrumType.STICKINGS, AbcNote.OFF)).toEqual(null);
    expect(abcNoteToTabChar(DrumType.SNARE, AbcNote.OFF)).toEqual(null);
    expect(tabCharToAbcNote(DrumType.SNARE, '')).toEqual(null);
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
    expect(tabCharToAbcNote(DrumType.HIHAT, 'X').note).toEqual('^g');
    expect(tabCharToAbcNote(DrumType.HIHAT, 'M').note).toEqual("^D'");
  });

  test('should return first tab char', () => {
    expect(AbcNote.HH_NORMAL.getFirstTabChar()).toEqual('x');
  });
});

describe('mergeDrumTabLines', () => {
  beforeAll(() => {
    require('../js/groove_utils.js');
    utils = new global.GrooveUtils(excludeAbcForTesting = true);
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

describe('Measure to ABC', () => {
  beforeAll(() => {
    require('../js/groove_utils.js');
    data = new GrooveData();
  });

  test('should convert measure to ABC notation -- basic', () => {
    data.fromUrl('TimeSig=4/4&Div=8&Tempo=80&H=|xxxxxxxx|');
    data.measures[0].arrays.get(DrumType.SNARE.name).fill(null);
    data.measures[0].arrays.get(DrumType.KICK.name).fill(null);
    const abc = data.getAbcNotation();
    expect(abc).toContain('^g1^g1 ^g1^g1 ^g1^g1 ^g1^g1');
  });

  test('should convert measure to ABC notation', () => {
    data.fromUrl('TimeSig=4/4&Div=8&Tempo=80&H=|xxxxxxxx|&S=|--o---o-|&K=|o---o---|');
    const abc = data.getAbcNotation();
    expect(abc).toContain('[^g1F1]^g1 [^g1c1]^g1 [^g1F1]^g1 [^g1c1]^g1');
  });

  // https://sonpham.me/GrooveScribe/?Debug=1&TimeSig=4/4&Div=8&Tempo=80&Measures=1&H=|x-------|&S=|--------|&K=|o--o-oo-|
  test('should convert measure to ABC notation -- with rests', () => {
    data.fromUrl('TimeSig=4/4&Div=8&Tempo=80&H=|x-------|&S=|--------|&K=|o--o-oo-|');
    const abc = data.getAbcNotation();
    expect(abc).toContain('[^g2F2] z1F1 z1F1 F2');
  });

  // https://sonpham.me/GrooveScribe/?Debug=1&TimeSig=4/4&Div=8&Tempo=80&Measures=1&H=|X---X-o-|&S=|--O-O-O-|&K=|o-------|
  test('should convert measure to ABC notation -- multi measures', () => {
    data.fromUrl('TimeSig=4/4&Div=8&Tempo=80&Measures=1&H=|X---X-o-|&S=|--O-O-O-|&K=|o-------|');
    const abc = data.getAbcNotation();
    expect(abc).toContain('!accent![^g2F2] !accent!c2 !accent![^g2c2] !open!!accent![^g2c2]');
  });
});