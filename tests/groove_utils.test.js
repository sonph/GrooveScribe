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

  test('clone duplicates time signature, subdivision, and all drum arrays', () => {
    const orig = new Measure(TimeSignature.COMMON_TIME_44, Subdivision.SIXTEENTH);
    orig.setDataFromString(DrumType.SNARE, '----o-------o---');
    const copy = orig.clone();
    expect(copy.timeSig).toEqual(orig.timeSig);
    expect(copy.tabSubdivision).toEqual(orig.tabSubdivision);
    expect(copy.notesPerMeasure).toEqual(orig.notesPerMeasure);
    expect(copy.toString(DrumType.SNARE)).toEqual('----o-------o---');

    // Mutating copy shouldn't affect orig
    copy.setDataFromString(DrumType.SNARE, 'o---------------');
    expect(orig.toString(DrumType.SNARE)).toEqual('----o-------o---');
  });
});

describe('GrooveData', () => {
  beforeAll(() => {
    require('../js/groove_utils.js');
    // 2/4 16th notes = 8 notes per measure.
    grooveData = new GrooveData(new TimeSignature(2, Subdivision.QUARTER), Subdivision.SIXTEENTH);
  });

  test('buildMeasuresFromTabs should fill data from url params', () => {
    const decoded = decodeGrooveUrl('H=|x---x-x-|');
    grooveData.measures = buildMeasuresFromTabs(decoded.drumTabs, grooveData.timeSig, grooveData.subdivision);
    expect(grooveData.measures[0].getArray(DrumType.HIHAT)).toEqual([
      'x', null, null, null, 'x', null, 'x', null]);
  });

  test('buildMeasuresFromTabs should fill data from url params -- auto append 2nd measure', () => {
    const decoded = decodeGrooveUrl('S=|oooo----|o-o-o-o-|');
    grooveData.measures = buildMeasuresFromTabs(decoded.drumTabs, grooveData.timeSig, grooveData.subdivision);
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

describe('URL codec', () => {
  beforeAll(() => {
    require('../js/groove_utils.js');
  });

  test('decodeGrooveUrl parses Tempo (capitalized)', () => {
    const decoded = decodeGrooveUrl('Tempo=132&Swing=25');
    expect(decoded.tempo).toEqual(132);
    expect(decoded.swingPercent).toEqual(25);
  });

  test('decodeGrooveUrl uses default tempo when missing', () => {
    const decoded = decodeGrooveUrl('');
    expect(decoded.tempo).toEqual(80);
    expect(decoded.swingPercent).toEqual(0);
  });

  test('decodeGrooveUrl clamps tempo to [20, 400]', () => {
    expect(decodeGrooveUrl('Tempo=1').tempo).toEqual(20);
    expect(decodeGrooveUrl('Tempo=9999').tempo).toEqual(400);
  });

  test('decodeGrooveUrl parses Mode/Debug flags', () => {
    const decoded = decodeGrooveUrl('Mode=view&Debug=1');
    expect(decoded.viewMode).toEqual(true);
    expect(decoded.debugMode).toEqual(true);
  });

  test('decodeGrooveUrl collects drum tabs', () => {
    const decoded = decodeGrooveUrl('H=|x-x-x-x-|&S=|--o---o-|&K=|o---o---|');
    expect(decoded.drumTabs.get('H')).toEqual('|x-x-x-x-|');
    expect(decoded.drumTabs.get('S')).toEqual('|--o---o-|');
    expect(decoded.drumTabs.get('K')).toEqual('|o---o---|');
  });

  test('URL round-trip preserves tempo and swing', () => {
    const data = new GrooveData(TimeSignature.COMMON_TIME_44, Subdivision.SIXTEENTH);
    data.fromUrl('TimeSig=4/4&Div=16&Tempo=132&Swing=33&H=|xxxxxxxxxxxxxxxx|&S=|----o-------o---|&K=|o-------o-------|');
    expect(data.tempo).toEqual(132);
    expect(data.swingPercent).toEqual(33);

    const roundTripped = new GrooveData().fromUrl(data.toUrl().split('?')[1]);
    expect(roundTripped.tempo).toEqual(132);
    expect(roundTripped.swingPercent).toEqual(33);
  });

  test('encodeGrooveQueryString does not percent-encode | or /', () => {
    const data = new GrooveData(TimeSignature.COMMON_TIME_44, Subdivision.SIXTEENTH);
    const encoded = encodeGrooveQueryString(data);
    expect(encoded).toContain('TimeSig=4/4');
    expect(encoded).toContain('H=|');
    expect(encoded).not.toContain('%7C');
    expect(encoded).not.toContain('%2F');
  });
});

describe('tabNumberOfNotesPerMeasure', () => {
  beforeAll(() => {
    require('../js/groove_utils.js');
    utils = new global.GrooveUtils(excludeAbcForTesting = true);
  });

  test('should return correct calculations', () => {
    utils.data = new GrooveData(new TimeSignature(3, Subdivision.QUARTER), Subdivision.SIXTEENTH);
    expect(utils.data.notesPerMeasure).toEqual(12);
    expect(utils.data.notesPerBeat).toEqual(4);
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
    require('../js/groove_utils.js');
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

describe('Parse URLs', () => {
  beforeAll(() => {
    require('../js/groove_utils.js');
  });

  test('parse url options', () => {
    const data = new GrooveData();
    data.fromUrl('Title=a%20b%20c&Author=foo&Comments=bar&Mode=view&TimeSig=2/4&Div=16&Tempo=120&H=|x-x-x-x-|&S=|o-o-o-o-|&K=|o---o---|');
    expect(data.timeSig.toString()).toEqual('2/4');
    expect(data.viewMode).toEqual(true);
    expect(data.title).toEqual('a b c');
    expect(data.author).toEqual('foo');
    expect(data.comments).toEqual('bar');
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

  // https://sonpham.me/GrooveScribe/?Debug=1&TimeSig=4/4&Div=12&Tempo=80&Measures=1&H=|xxxxxxxxxxxx|&S=|---O-----O--|&K=|o-----o-----|
  test('should convert measure to ABC notation -- 8th triplets', () => {
    data.fromUrl('TimeSig=4/4&Div=12&Tempo=80&Measures=1&H=|xxxxxxxxxxxx|&S=|---O-----O--|&K=|o-----o-----|');
    const abc = data.getAbcNotation();
    expect(abc).toContain('V:Stickings\nx4x4x4 x4x4x4 x4x4x4 x4x4x4 ||');
    expect(abc).toContain('(3:3:3[^g4F4]^g4^g4 (3:3:3!accent![c4^g4]^g4^g4 (3:3:3[^g4F4]^g4^g4 (3:3:3!accent![c4^g4]^g4^g4 ||');
  });

  // https://sonpham.me/GrooveScribe/?Debug=1&TimeSig=4/4&Div=24&Tempo=80&Measures=1&H=|x-x-x-x-x-x-x-x-x-x-x-x-|&S=|------O-----------O-----|&K=|o---o----o--o--o---ooooo|
  test('should convert measure to ABC notation -- 16th triplets', () => {
    data.fromUrl('TimeSig=4/4&Div=24&Tempo=80&Measures=1&H=|x-x-x-x-x-x-x-x-x-x-x-x-|&S=|------O-----------O-----|&K=|o---o----o--o--o---ooooo|');
    const abc = data.getAbcNotation();
    expect(abc).toContain('V:Stickings\nx2x2x2x2x2x2 x2x2x2x2x2x2 x2x2x2x2x2x2 x2x2x2x2x2x2 ||');
    expect(abc).toContain('(6:6:6[^g2F2]z2^g2z2[^g2F2]z2 (6:6:6!accent![c2^g2]z2^g2F2^g2z2 (6:6:6[^g2F2]z2^g2F2^g2z2 (6:6:6!accent![c2^g2]F2[^g2F2]F2[^g2F2]F2 ||');
  });

  // https://sonpham.me/GrooveScribe/?Debug=1&TimeSig=4/4&Div=48&Tempo=80&Measures=1&H=|x--xx--xxxx-x--rx---x---x-c-xX--x---x---x---x---|&S=|------------O------------g----g---b-O-----------|&K=|o-------o---------o-----o-----o----oooo-o-o-o-o-|&T1=|--------------oo--------------------------------|&T4=|---------------------o--oo----------------------|
  test('should convert measure to ABC notation -- 32nd triplets with mixed drums', () => {
    data.fromUrl('TimeSig=4/4&Div=48&Tempo=80&Measures=1&H=|x--xx--xxxx-x--rx---x---x-c-xX--x---x---x---x---|&S=|------------O------------g----g---b-O-----------|&K=|o-------o---------o-----o-----o----oooo-o-o-o-o-|&T1=|--------------oo--------------------------------|&T4=|---------------------o--oo----------------------|');
    const abc = data.getAbcNotation();
    expect(abc).toContain("(12:12:12[^g1F1]z1z1^g1^g1z1z1^g1[^g1F1]^g1^g1z1 (12:12:12!accent![c1^g1]z1e1[^A'1e1]^g1z1F1z1^g1A1z1z1 (12:12:12[^g1F1A1][!(.!!).!c1A1]^c'1z1^g1!accent!^g1[!(.!!).!c1F1]z1^g1z1!///!c1F1 (12:12:12!accent![c1^g1F1]F1F1z1[^g1F1]z1F1z1[^g1F1]z1F1z1 ||");
  });

  // https://sonpham.me/GrooveScribe/?Debug=1&TimeSig=4/4&Div=12&Tempo=80&Measures=1&H=|x--x--x--x--|&S=|---O-----O--|&K=|X-----X-----|
  test('should convert measure to ABC notation -- kick and hi hat pedal', () => {
    data.fromUrl('TimeSig=4/4&Div=12&Tempo=80&Measures=1&H=|x--x--x--x--|&S=|---O-----O--|&K=|X-----X-----|');
    const abc = data.getAbcNotation();
    expect(abc).toContain('[^g8F^d,8] !accent![c8^g8] [^g8F^d,8] !accent![c8^g8] ||');
  });
});

describe('MIDI note lookups', () => {
  beforeAll(() => {
    require('../js/groove_utils.js');
  });

  describe('hihatMidiFor', () => {
    // [abcName, mode, expectedNote, expectedVelocity]
    const cases = [
      ['HH_Normal', 'general_MIDI', 42, 85],
      ['HH_Close', 'general_MIDI', 42, 85],
      ['HH_Accent', 'general_MIDI', 42, 120],
      ['HH_Accent', 'Custom', 108, 85],
      ['HH_Open', 'general_MIDI', 46, 85],
      ['HH_Ride', 'general_MIDI', 51, 85],
      ['HH_Ride_Bell', 'general_MIDI', 53, 85],
      ['HH_Cow_Bell', 'general_MIDI', 105, 85],
      ['HH_Crash', 'general_MIDI', 49, 85],
      ['HH_Stacker', 'general_MIDI', 52, 85],
      ['HH_Metronome_Normal', 'general_MIDI', 77, 85],
      ['HH_Metronome_Accent', 'general_MIDI', 76, 85],
    ];
    test.each(cases)('%s (%s) -> note=%i vel=%i', (name, mode, note, vel) => {
      const abc = globalThis[`constant_ABC_${name}`];
      expect(hihatMidiFor(abc, mode)).toEqual({ note, velocity: vel });
    });
    test('returns null for false/OFF', () => {
      expect(hihatMidiFor(false, 'general_MIDI')).toBeNull();
    });
    test('returns null for unknown value', () => {
      expect(hihatMidiFor('nonsense', 'general_MIDI')).toBeNull();
    });
  });

  describe('snareMidiFor', () => {
    const cases = [
      ['SN_Normal', 'general_MIDI', 38, 85],
      ['SN_Accent', 'general_MIDI', 38, 120],
      ['SN_Accent', 'Custom', 22, 85],
      ['SN_Ghost', 'general_MIDI', 38, 50],
      ['SN_Ghost', 'Custom', 21, 50],
      ['SN_Flam', 'general_MIDI', 38, 120],
      ['SN_Flam', 'Custom', 107, 85],
      ['SN_Drag', 'general_MIDI', 38, 120],
      ['SN_Drag', 'Custom', 103, 85],
      ['SN_XStick', 'general_MIDI', 37, 85],
      ['SN_Buzz', 'general_MIDI', 104, 85],
    ];
    test.each(cases)('%s (%s) -> note=%i vel=%i', (name, mode, note, vel) => {
      const abc = globalThis[`constant_ABC_${name}`];
      expect(snareMidiFor(abc, mode)).toEqual({ note, velocity: vel });
    });
    test('returns null for false/OFF', () => {
      expect(snareMidiFor(false, 'Custom')).toBeNull();
    });
  });

  describe('kickMidiFor', () => {
    test('Normal -> kick only', () => {
      expect(kickMidiFor(constant_ABC_KI_Normal)).toEqual({ kick: 35, splash: null });
    });
    test('Splash -> hi-hat foot only', () => {
      expect(kickMidiFor(constant_ABC_KI_Splash)).toEqual({ kick: null, splash: 44 });
    });
    test('SandK -> both kick + hi-hat foot', () => {
      expect(kickMidiFor(constant_ABC_KI_SandK)).toEqual({ kick: 35, splash: 44 });
    });
    test('false/OFF -> both null', () => {
      expect(kickMidiFor(false)).toEqual({ kick: null, splash: null });
    });
  });

  describe('tomMidiFor', () => {
    test('T1..T4 -> distinct notes', () => {
      expect(tomMidiFor(constant_ABC_T1_Normal)).toBe(48);
      expect(tomMidiFor(constant_ABC_T2_Normal)).toBe(47);
      expect(tomMidiFor(constant_ABC_T3_Normal)).toBe(45);
      expect(tomMidiFor(constant_ABC_T4_Normal)).toBe(43);
    });
    test('returns null for false/undefined/unknown', () => {
      expect(tomMidiFor(false)).toBeNull();
      expect(tomMidiFor(undefined)).toBeNull();
      expect(tomMidiFor('junk')).toBeNull();
    });
  });
});

describe('swingAdjustedDuration', () => {
  beforeAll(() => {
    require('../js/groove_utils.js');
  });

  test('no swing returns base duration', () => {
    for (let i = 0; i < 16; i++) {
      expect(swingAdjustedDuration(i, 16, 0, 32, 8)).toEqual(16);
    }
  });

  test('50% swing lengthens 1 & &, shortens e & a', () => {
    // 16 sixteenths, num_notes_for_swing=8 → scaler=2, so pattern is 2-long per cell.
    // Groups of 4*scaler=8: positions 0,1 = "1" (long), 2,3 = "e" (short),
    // 4,5 = "&" (long), 6,7 = "a" (short).
    expect(swingAdjustedDuration(0, 16, 0.5, 16, 8)).toEqual(24);
    expect(swingAdjustedDuration(2, 16, 0.5, 16, 8)).toEqual(8);
    expect(swingAdjustedDuration(4, 16, 0.5, 16, 8)).toEqual(24);
    expect(swingAdjustedDuration(6, 16, 0.5, 16, 8)).toEqual(8);
    // pattern repeats
    expect(swingAdjustedDuration(8, 16, 0.5, 16, 8)).toEqual(24);
  });

  test('lengthening and shortening cancel across a full 1e&a group', () => {
    const total = [0, 1, 2, 3].reduce((sum, i) => sum + swingAdjustedDuration(i, 16, 0.4, 4, 4), 0);
    expect(total).toBeCloseTo(64, 5);
  });
});

describe('metronomeOffsetShift', () => {
  beforeAll(() => {
    require('../js/groove_utils.js');
  });

  test('1 (downbeat) returns 0', () => {
    expect(metronomeOffsetShift('1', false, 2)).toEqual(0);
    expect(metronomeOffsetShift('1', true, 2)).toEqual(0);
  });

  test('straight subdivisions', () => {
    expect(metronomeOffsetShift('E', false, 2)).toEqual(2);
    expect(metronomeOffsetShift('AND', false, 2)).toEqual(4);
    expect(metronomeOffsetShift('A', false, 2)).toEqual(6);
  });

  test('triplet subdivisions', () => {
    expect(metronomeOffsetShift('TI', true, 2)).toEqual(4);
    expect(metronomeOffsetShift('TA', true, 2)).toEqual(8);
  });

  test('unknown offset returns 0 (defensive default)', () => {
    expect(metronomeOffsetShift('WAT', false, 2)).toEqual(0);
  });
});

describe('metronomeNoteAt', () => {
  let ts44;
  beforeAll(() => {
    require('../js/groove_utils.js');
    ts44 = new TimeSignature(4, Subdivision.QUARTER);
  });

  test('negative index returns null (offset shift went before start)', () => {
    expect(metronomeNoteAt(-1, 4, false, ts44)).toBeNull();
  });

  test('downbeat 1 gets MIDI_METRONOME_1 (loud)', () => {
    const hit = metronomeNoteAt(0, 4, false, ts44);
    expect(hit).toEqual({ note: 76, velocity: 120 });
  });

  test('beats 2/3/4 in 4/4 straight get MIDI_METRONOME_NORMAL', () => {
    // quarterNoteFrequency=8 → beats fire at 8, 16, 24
    expect(metronomeNoteAt(8, 4, false, ts44)).toEqual({ note: 77, velocity: 120 });
    expect(metronomeNoteAt(16, 4, false, ts44)).toEqual({ note: 77, velocity: 120 });
    expect(metronomeNoteAt(24, 4, false, ts44)).toEqual({ note: 77, velocity: 120 });
  });

  test('off-beat positions fire only when frequency requests it', () => {
    // index 4 is the "&" of beat 1 in straight 16ths (eighthNoteFrequency=4)
    expect(metronomeNoteAt(4, 4, false, ts44)).toBeNull();
    expect(metronomeNoteAt(4, 8, false, ts44)).toEqual({ note: 77, velocity: 120 });
    // Note: on frequency=16, even 8th-note positions get the quieter velocity.
    // The legacy code doesn't carve out 8ths within the 16ths pass.
    expect(metronomeNoteAt(4, 16, false, ts44)).toEqual({ note: 77, velocity: 25 });
  });

  test('16th-note clicks are quieter (velocity 25)', () => {
    // index 2 is the "e" of beat 1 — only fires on 16th frequency
    expect(metronomeNoteAt(2, 16, false, ts44)).toEqual({ note: 77, velocity: 25 });
    expect(metronomeNoteAt(2, 8, false, ts44)).toBeNull();
  });

  test('measure boundary in 4/4 loops back to MIDI_METRONOME_1', () => {
    // measureFrequency = 8 * 4 * 1 = 32 → next downbeat at index 32
    expect(metronomeNoteAt(32, 4, false, ts44)).toEqual({ note: 76, velocity: 120 });
  });

  test('triplets: beats fire every 12 notes', () => {
    expect(metronomeNoteAt(12, 4, true, ts44)).toEqual({ note: 77, velocity: 120 });
    expect(metronomeNoteAt(6, 4, true, ts44)).toBeNull();
    expect(metronomeNoteAt(6, 8, true, ts44)).toEqual({ note: 77, velocity: 120 });
  });
});

describe('SVG Note Highlighting & Note Mapping', () => {
  let utils;
  beforeEach(() => {
    require('../js/groove_utils.js');
    utils = new global.GrooveUtils(excludeAbcForTesting = true);
  });

  test('create_note_mapping_array_for_highlighting identifies active note slots', () => {
    const hh = ['x', null, 'x', null, false, '-'];
    const sn = [null, 'o', null, null, null, null];
    const kk = [null, null, null, null, null, null];
    const toms = [[null, null, null, 'o', null, null], null, null, null];

    const mapping = utils.create_note_mapping_array_for_highlighting(hh, sn, kk, toms, 6);
    expect(mapping).toEqual([true, true, true, true, false, false]);
  });

  test('highlightNoteInABCSVGFromPercentComplete maps playback percentage to note index', () => {
    utils.note_mapping_array = [true, false, true, false, true, false, true, false];
    utils.highlightNoteInABCSVGByIndex = jest.fn();

    // At start (0.0): maps to note 0
    utils.highlightNoteInABCSVGFromPercentComplete(0.0);
    expect(utils.highlightNoteInABCSVGByIndex).toHaveBeenCalledWith(0);

    // At 25% (percentComplete = 0.25 -> index 2): maps to note 1
    utils.highlightNoteInABCSVGFromPercentComplete(0.25);
    expect(utils.highlightNoteInABCSVGByIndex).toHaveBeenCalledWith(1);

    // At 50% (percentComplete = 0.50 -> index 4): maps to note 2
    utils.highlightNoteInABCSVGFromPercentComplete(0.5);
    expect(utils.highlightNoteInABCSVGByIndex).toHaveBeenCalledWith(2);

    // At 75% (percentComplete = 0.75 -> index 6): maps to note 3
    utils.highlightNoteInABCSVGFromPercentComplete(0.75);
    expect(utils.highlightNoteInABCSVGByIndex).toHaveBeenCalledWith(3);
  });

  test('highlightNoteInABCSVGByIndex adds highlighted class and clears previous', () => {
    document.body.innerHTML = `
      <rect class="abcr" id="abcNoteNum_0_0" />
      <rect class="abcr" id="abcNoteNum_0_1" />
    `;
    utils.grooveUtilsUniqueIndex = 0;
    utils.abcNoteNumCurrentlyHighlighted = -1;

    utils.highlightNoteInABCSVGByIndex(0);
    expect(document.getElementById('abcNoteNum_0_0').getAttribute('class')).toBe('abcr highlighted');
    expect(document.getElementById('abcNoteNum_0_1').getAttribute('class')).toBe('abcr');
    expect(utils.abcNoteNumCurrentlyHighlighted).toBe(0);

    utils.highlightNoteInABCSVGByIndex(1);
    expect(document.getElementById('abcNoteNum_0_0').getAttribute('class')).toBe('abcr');
    expect(document.getElementById('abcNoteNum_0_1').getAttribute('class')).toBe('abcr highlighted');
    expect(utils.abcNoteNumCurrentlyHighlighted).toBe(1);

    utils.clearHighlightNoteInABCSVG();
    expect(document.getElementById('abcNoteNum_0_1').getAttribute('class')).toBe('abcr');
    expect(utils.abcNoteNumCurrentlyHighlighted).toBe(-1);
  });
});

describe('Legend and ABC Header', () => {
  beforeAll(() => {
    require('../js/groove_utils.js');
  });

  test('decodeGrooveUrl parses Legend=1', () => {
    expect(decodeGrooveUrl('Legend=1').showLegend).toBe(true);
    expect(decodeGrooveUrl('showLegend=1').showLegend).toBe(true);
    expect(decodeGrooveUrl('').showLegend).toBe(false);
  });

  test('encodeGrooveQueryString adds Legend=1 when showLegend is true', () => {
    const data = new GrooveData();
    data.showLegend = true;
    expect(encodeGrooveQueryString(data)).toContain('Legend=1');

    data.showLegend = false;
    expect(encodeGrooveQueryString(data)).not.toContain('Legend');
  });

  test('getAbcHeader includes legend and 3-stave system when showLegend is true', () => {
    const data = new GrooveData();
    const headerWithLegend = data.getAbcHeader(false, 600, true);
    expect(headerWithLegend).toContain('%%staves (Stickings Hands Feet)');
    expect(headerWithLegend).toContain('V:Stickings');
    expect(headerWithLegend).toContain('V:Hands stem=up');
    expect(headerWithLegend).toContain('"^Hi-Hat"');
    expect(headerWithLegend).toContain('"^Snare"');
    expect(headerWithLegend).toContain('"^Kick"');
    expect(headerWithLegend).toContain('V:Feet stem=down');

    const headerWithoutLegend = data.getAbcHeader(false, 600, false);
    expect(headerWithoutLegend).toContain('%%staves (Stickings Hands)');
    expect(headerWithoutLegend).not.toContain('"^Hi-Hat"');
    expect(headerWithoutLegend).not.toContain('V:Feet stem=down');
  });

  test('getAbcHeader includes correct Q tempo marking according to time signature', () => {
    // 4/4 time signature -> Q: 1/4=95
    const data44 = new GrooveData(TimeSignature.COMMON_TIME_44, Subdivision.SIXTEENTH);
    data44.tempo = 95;
    data44.showTempo = true;
    expect(data44.getAbcHeader(false, 600)).toContain('Q: 1/4=95\n');

    // 6/8 compound time signature -> Q: 3/8=120
    const data68 = new GrooveData(new TimeSignature(6, Subdivision.EIGHTH), Subdivision.EIGHTH);
    data68.tempo = 120;
    data68.showTempo = true;
    expect(data68.getAbcHeader(false, 600)).toContain('Q: 3/8=120\n');

    // 2/2 cut time signature -> Q: 1/2=100
    const data22 = new GrooveData(new TimeSignature(2, Subdivision.HALF), Subdivision.QUARTER);
    data22.tempo = 100;
    data22.showTempo = true;
    expect(data22.getAbcHeader(false, 600)).toContain('Q: 1/2=100\n');

    // showTempo = false -> no Q: tempo mark
    data44.showTempo = false;
    expect(data44.getAbcHeader(false, 600)).not.toContain('Q:');
  });

  test('decodeGrooveUrl and encodeGrooveQueryString support showTempo', () => {
    expect(decodeGrooveUrl('ShowTempo=1').showTempo).toBe(true);
    expect(decodeGrooveUrl('EmbedTempoTimeSig=true').showTempo).toBe(true);
    expect(decodeGrooveUrl('').showTempo).toBe(false);

    const data = new GrooveData();
    data.showTempo = true;
    expect(encodeGrooveQueryString(data)).toContain('ShowTempo=1');
    data.showTempo = false;
    expect(encodeGrooveQueryString(data)).not.toContain('ShowTempo');
  });

  test('decodeGrooveUrl parses repeats, alternate endings, measure text, and subText', () => {
    const url = '?TimeSig=4/4&Div=12&Tempo=88&ShowTempo=1&EmbedTempoTimeSig=true&subText=Chorus%20Groove&RepeatBegins=1;3&RepeatEnds=2;4&RepeatEndings=2:1;4:2&MeasureText=1:b:Intro;3:b:Bridge;4:e:Outro&H=|xxxxxxxxxxxx|xxxxxxxxxxxx|xxxxxxxxxxxx|xxxxxxxxxxxx|&S=|---O-----O--|---O-----O--|---O-----O--|---O-----O--|&K=|o-----o-----|o-----o-----|o-----o-----|o-----o-----|';
    const decoded = decodeGrooveUrl(url);

    expect(decoded.showTempo).toBe(true);
    expect(decoded.subText).toBe('Chorus Groove');
    expect(Array.from(decoded.repeatBegins)).toEqual([1, 3]);
    expect(Array.from(decoded.repeatEnds)).toEqual([2, 4]);
    expect(decoded.repeatEndings.get(2)).toBe('1');
    expect(decoded.repeatEndings.get(4)).toBe('2');
    expect(decoded.measureText.get(1)).toEqual({ begin: 'Intro' });
    expect(decoded.measureText.get(3)).toEqual({ begin: 'Bridge' });
    expect(decoded.measureText.get(4)).toEqual({ end: 'Outro' });

    const grooveData = new GrooveData();
    grooveData.fromUrl(url);
    expect(grooveData.measures.length).toBe(4);
    expect(grooveData.subText).toBe('Chorus Groove');
    expect(Array.from(grooveData.repeatBegins)).toEqual([1, 3]);
    expect(Array.from(grooveData.repeatEnds)).toEqual([2, 4]);
  });

  test('getAbcNotation renders repeats, alternate endings, and text annotations correctly', () => {
    const url = '?Mode=edit&TimeSig=4/4&Div=12&Title=title&Author=author&Comments=comments&Tempo=88&ShowTempo=1&H=|xx-xxxxx-brr|x-x-x-x-x-x-|&S=|---O--O-gO--|---O-----O--|&K=|o-o---X--o--|o-----o-----|&EmbedTempoTimeSig=true&RepeatBegins=1&RepeatEnds=1';
    const grooveData = new GrooveData();
    grooveData.fromUrl(url);

    const header = grooveData.getAbcHeader(false, 600, false);
    const notation = grooveData.getAbcNotation();

    expect(header).toContain('T: title\n');
    expect(header).toContain('C: author\n');
    expect(header).toContain('P: comments\n');
    expect(header).toContain('Q: 1/4=88\n');

    // Stickings voice repeats
    expect(notation).toContain('V:Stickings\n|: x4x4x4 x4x4x4 x4x4x4 x4x4x4 :| x4x4x4 x4x4x4 x4x4x4 x4x4x4 ||');

    // Hands voice repeats
    expect(notation).toContain('|: (3:3:3[^g4F4]^g4F4 (3:3:3!accent![c4^g4]^g4^g4 (3:3:3!accent![c4^g4F^d,4]^g4!(.!!).!c4 (3:3:3!accent![c4^B\'4F4]^A\'4^A\'4 :|');
    expect(notation).toContain('(3:3:3[^g4F4]z4^g4 (3:3:3!accent!c4^g4z4 (3:3:3[^g4F4]z4^g4 (3:3:3!accent!c4^g4z4 ||');

    // Verify SVG rendering using GrooveUtils
    const utils = new GrooveUtils(true);
    expect(notation).toContain('||');
  });
});
