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

  test('should generate expected ABC notation components from GrooveData for a 4/4 Rock Groove', () => {
    // An 8th note rock groove representation
    const urlString = "?TimeSig=4/4&Div=8&Tempo=80&Measures=1&H=|xxxxxxxx|&S=|----O-------O---|&K=|o-------o-------|";
    const grooveData = utils.getGrooveDataFromUrlString(urlString);
    
    // We expect GrooveData to accurately reflect the URL parameters
    expect(grooveData.timeDivision).toBe(8);
    expect(grooveData.numBeats).toBe(4);
    expect(grooveData.noteValue).toBe(4);

    const abcOutput = utils.createABCFromGrooveData(grooveData, 800);
    
    // The generated ABC should include standard staff layout properties
    expect(abcOutput).toContain("%%staves"); 
    expect(abcOutput).toContain("V:Stickings"); // Stickings voice
    expect(abcOutput).toContain("V:Hands"); // Hands voice
    
    // Should include the time signature
    expect(abcOutput).toContain("M:4/4");
  });

  test('should generate expected ABC notation components from GrooveData for a 6/8 Triplet Groove', () => {
    // A triplet 6/8 groove representation
    const urlString = "?TimeSig=6/8&Div=12&Tempo=120&Measures=1&H=|x-xx-xx-xx-x|&S=|-g--g-Og--g-|&K=|o----o-----o|";
    const grooveData = utils.getGrooveDataFromUrlString(urlString);
    
    expect(grooveData.timeDivision).toBe(12);
    expect(grooveData.numBeats).toBe(6);
    expect(grooveData.noteValue).toBe(8);

    const abcOutput = utils.createABCFromGrooveData(grooveData, 800);
    
    expect(abcOutput).toContain("M:6/8");
  });
});
