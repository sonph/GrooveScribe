describe('GrooveUtils', () => {
  beforeAll(() => {
    require('../js/groove_utils.js');
    utils = new global.GrooveUtils();
  });

  test('should initialize with default values', () => {
    expect(utils.debugMode).toBe(false);
    expect(utils.viewMode).toBe(true);
    expect(utils.grooveDBAuthoring).toBe(false);
  });
});

describe('tabNumberOfNotesPerMeasure', () => {
  beforeAll(() => {
    require('../js/groove_utils.js');
    utils = new global.GrooveUtils();
  });

  test('should return correct calculations', () => {
    expect(utils.tabNumberOfNotesPerMeasure(Subdivision.EIGHTH, new TimeSignature(4, Subdivision.QUARTER))).toEqual(8);
    expect(utils.tabNumberOfNotesPerMeasure(Subdivision.EIGHTH, new TimeSignature(9, Subdivision.EIGHTH))).toEqual(9);
    expect(utils.tabNumberOfNotesPerMeasure(Subdivision.SIXTEENTH, new TimeSignature(4, Subdivision.EIGHTH))).toEqual(8);
    expect(utils.tabNumberOfNotesPerMeasure(Subdivision.QUARTER, new TimeSignature(8, Subdivision.EIGHTH))).toEqual(4);
    expect(utils.tabNumberOfNotesPerMeasure(Subdivision.EIGHTH_TRIPLET, new TimeSignature(8, Subdivision.EIGHTH))).toEqual(12);
  });
});

describe('parseTimeSigString', () => {
  beforeAll(() => {
    require('../js/groove_utils.js');
    utils = new global.GrooveUtils();
  });

  test('should return result', () => {
    expect(utils.parseTimeSigString('4/4')).toEqual(new TimeSignature(4, Subdivision.QUARTER));
    expect(utils.parseTimeSigString('9/8')).toEqual(new TimeSignature(9, Subdivision.EIGHTH));
  });

  test('should return default 4/4 if malformatted', () => {
    expect(utils.parseTimeSigString('invalid')).toEqual(new TimeSignature(4, Subdivision.QUARTER));
    expect(utils.parseTimeSigString('4/4/4')).toEqual(new TimeSignature(4, Subdivision.QUARTER));
  });

  test('should default to quarter notes if bottom number is not 2 4 8 16', () => {
    expect(utils.parseTimeSigString('4/3')).toEqual(new TimeSignature(4, Subdivision.QUARTER));
    expect(utils.parseTimeSigString('9/5')).toEqual(new TimeSignature(9, Subdivision.QUARTER));
    expect(utils.parseTimeSigString('3/7')).toEqual(new TimeSignature(3, Subdivision.QUARTER));
  });
});

describe('createEmptyArrayOfLength', () => {
  beforeAll(() => {
    require('../js/groove_utils.js');
  });

  test('should return empty array of given length', () => {
    expect(new GrooveData().createEmptyArrayOfLength(8)).toEqual(
      [false, false, false, false, false, false, false, false]);
  });
});


// describe('parseIntSet', () => {
//   let parseIntSet;
//   beforeAll(() => {
//     parseIntSet = global.parseIntSet || require('../js/groove_utils.js').parseIntSet;
//   });

//   test('returns empty set for empty string', () => {
//     expect(parseIntSet("")).toEqual(new Set());
//   });

//   test('parses comma-separated integers', () => {
//     expect(parseIntSet("1,2,3")).toEqual(new Set([1,2,3]));
//   });

//   test('parses with custom delimiter', () => {
//     expect(parseIntSet("4|5|6", "|")).toEqual(new Set([4,5,6]));
//   });
// });

// describe('parseIntMap', () => {
//   let parseIntMap;
//   beforeAll(() => {
//     parseIntMap = global.parseIntMap || require('../js/groove_utils.js').parseIntMap;
//   });

//   test('returns empty map for empty string', () => {
//     expect(parseIntMap("")).toEqual(new Map());
//   });

//   test('parses comma-separated key:value pairs', () => {
//     expect(parseIntMap("1:10,2:20")).toEqual(new Map([[1,10],[2,20]]));
//   });

//   test('parses with custom delimiter', () => {
//     expect(parseIntMap("3:30|4:40", "|")).toEqual(new Map([[3,30],[4,40]]));
//   });
// });