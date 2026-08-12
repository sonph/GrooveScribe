describe('Get note UI state', () => {
  beforeAll(() => {
    require('../js/groove_utils.js');
    require('../js/groove_writer.js');
    document.body.innerHTML = '<div id="test"></div>';
    grooveUtils = new GrooveUtils(excludeAbcForTesting = true);
    grooveUtils.data.fromUrl('TimeSig=4/4&Div=8&Tempo=80&H=|xxxxxxxx|');
    writer = new GrooveWriter(grooveUtils);
  });

  test('setNoteState', () => {
    writer.setNoteState('test', 'on');
    expect(document.getElementById('test').classList.contains('note-on')).toBe(true);
  });

  test('should add UI HTML', () => {
    document.body.innerHTML = writer.HTMLforStaffContainer(0, 0);
    expect(document.getElementById('staff-container0')).not.toBeNull();
    const hihat = document.getElementById('hi-hat0');
    expect(hihat).not.toBeNull();

    const hh_crash = hihat.querySelector('.hh_crash');
    expect(hh_crash).not.toBeNull();
  });

  test('numberOfMeasures and notesPerMeasure', () => {
    expect(writer.numberOfMeasures()).toBe(1);
    expect(writer.notesPerMeasure()).toBe(8);
  });

  test('permutationPopupClick', () => {
    document.body.innerHTML = '<div id="permutationAnchor"></div><div id="PermutationOptions"></div><div class="kick-container"></div><div class="snare-container"></div>';
    writer.updateSheetMusic = jest.fn();
    expect(() => writer.permutationPopupClick('none')).not.toThrow();
    expect(writer.updateSheetMusic).toHaveBeenCalled();
  });
});

describe('State setters and getters', () => {
  let grooveUtils, writer;

  beforeEach(() => {
    require('../js/groove_utils.js');
    require('../js/groove_writer.js');
    grooveUtils = new GrooveUtils(true);
    grooveUtils.data.fromUrl('TimeSig=4/4&Div=8&Tempo=80&H=|xxxxxxxx|');
    writer = new GrooveWriter(grooveUtils);
    // Render enough DOM to support setDrumNote (looks up elements by prefix+id).
    document.body.innerHTML = writer.HTMLforStaffContainer(0, 0);
  });

  test('set_hh_state("normal") turns hi-hat on', () => {
    writer.set_hh_state(0, 'normal');
    expect(writer.is_hh_on(0)).toBe(true);
  });

  test('set_hh_state("off") turns hi-hat off', () => {
    writer.set_hh_state(0, 'normal');
    writer.set_hh_state(0, 'off');
    expect(writer.is_hh_on(0)).toBe(false);
  });

  test('set_snare_state("normal") turns snare on', () => {
    writer.set_snare_state(0, 'normal');
    expect(writer.is_snare_on(0)).toBe(true);
  });

  test('set_snare_state("off") turns snare off', () => {
    writer.set_snare_state(0, 'normal');
    writer.set_snare_state(0, 'off');
    expect(writer.is_snare_on(0)).toBe(false);
  });

  test('set_kick_state("normal") turns kick on', () => {
    writer.set_kick_state(0, 'normal');
    expect(writer.is_kick_on(0)).toBe(true);
  });

  test('set_kick_state("off") turns kick off', () => {
    writer.set_kick_state(0, 'normal');
    writer.set_kick_state(0, 'off');
    expect(writer.is_kick_on(0)).toBe(false);
  });

  test('set_tom1_state("normal") turns tom1 on', () => {
    writer.set_tom1_state(0, 'normal');
    expect(writer.is_tom_on(0, 1)).toBe(true);
  });

  test('set_tom4_state("normal") turns tom4 on', () => {
    writer.set_tom4_state(0, 'normal');
    expect(writer.is_tom_on(0, 4)).toBe(true);
  });

  test('set_sticking_state("right") sets sticking to R', () => {
    writer.set_sticking_state(0, 'right');
    expect(writer.get_sticking_state(0, 'ABC')).toBe('"R"x');
  });

  test('set_sticking_state("left") sets sticking to L', () => {
    writer.set_sticking_state(0, 'left');
    expect(writer.get_sticking_state(0, 'ABC')).toBe('"L"x');
  });

  test('accepts string ids', () => {
    writer.set_hh_state('0', 'normal');
    expect(writer.is_hh_on('0')).toBe(true);
  });
});