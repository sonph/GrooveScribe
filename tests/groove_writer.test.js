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

  test('hi-hat off shows hh_cross as placeholder (not blank / not hh_ride)', () => {
    writer.set_hh_state(0, 'normal');
    writer.set_hh_state(0, 'off');
    expect(document.getElementById('hh_cross0').classList.contains('note-off')).toBe(true);
    expect(document.getElementById('hh_ride0').classList.contains('note-hidden')).toBe(true);
    expect(document.getElementById('hh_open0').classList.contains('note-hidden')).toBe(true);
  });

  test('snare off shows snare_circle as placeholder (not snare_ghost)', () => {
    writer.set_snare_state(0, 'accent');
    writer.set_snare_state(0, 'off');
    expect(document.getElementById('snare_circle0').classList.contains('note-off')).toBe(true);
    expect(document.getElementById('snare_ghost0').classList.contains('note-hidden')).toBe(true);
    expect(document.getElementById('snare_accent0').classList.contains('note-hidden')).toBe(true);
  });

  test('kick off shows kick_circle as placeholder', () => {
    writer.set_kick_state(0, 'normal');
    writer.set_kick_state(0, 'off');
    expect(document.getElementById('kick_circle0').classList.contains('note-off')).toBe(true);
    expect(document.getElementById('kick_splash0').classList.contains('note-hidden')).toBe(true);
  });
});

// Pins the round-trip for every (drum, mode) pair — set_*_state(mode) →
// get_*_state() returns the expected abc + url tab char. This is the safety net
// for refactoring the four _*ModeToNote() switches into a data-driven lookup.
describe('All drum modes round-trip through set/get state', () => {
  let grooveUtils, writer;

  beforeEach(() => {
    jest.resetModules();
    require('../js/groove_utils.js');
    require('../js/groove_writer.js');
    grooveUtils = new GrooveUtils(true);
    grooveUtils.data.fromUrl('TimeSig=4/4&Div=8&Tempo=80&H=|xxxxxxxx|');
    writer = new GrooveWriter(grooveUtils);
    document.body.innerHTML = writer.HTMLforStaffContainer(0, 0);
  });

  test.each([
    ['normal',           '^g',           'x'],
    ['accent',           '!accent!^g',   'X'],
    ['open',             '!open!^g',     'o'],
    ['close',            '!plus!^g',     '+'],
    ['ride',             "^A'",          'r'],
    ['ride_bell',        "^B'",          'b'],
    ['cow_bell',         "^D'",          'm'],
    ['crash',            "^c'",          'c'],
    ['stacker',          "^d'",          's'],
    ['metronome_normal', "^e'",          'n'],
    ['metronome_accent', "^f'",          'N'],
  ])('hi-hat mode "%s" -> abc %s, url %s', (mode, abc, url) => {
    writer.set_hh_state(0, mode);
    const state = writer.get_hh_state(0);
    expect(state.abc).toBe(abc);
    expect(state.url).toBe(url);
  });

  test.each([
    ['normal', 'c',              'o'],
    ['accent', '!accent!c',      'O'],
    ['ghost',  '!(.!!).!c',      'g'],
    ['xstick', '^c',             'x'],
    ['buzz',   '!///!c',         'b'],
    ['flam',   '!accent!{/c}c',  'f'],
    ['drag',   '{//c}c',         'd'],
  ])('snare mode "%s" -> abc %s, url %s', (mode, abc, url) => {
    writer.set_snare_state(0, mode);
    const state = writer.get_snare_state(0);
    expect(state.abc).toBe(abc);
    expect(state.url).toBe(url);
  });

  test.each([
    ['normal',          'F',      'o'],
    ['splash',          '^d,',    'x'],
    ['kick_and_splash', '[F^d,]', 'X'],
  ])('kick mode "%s" -> abc %s, url %s', (mode, abc, url) => {
    writer.set_kick_state(0, mode);
    const state = writer.get_kick_state(0);
    expect(state.abc).toBe(abc);
    expect(state.url).toBe(url);
  });

  test.each([
    ['right', '"R"x',     'R'],
    ['left',  '"L"x',     'L'],
    ['both',  '"R/L"x',   'b'],
    ['count', '"count"x', 'c'],
  ])('sticking mode "%s" -> abc %s, url %s', (mode, abc, url) => {
    writer.set_sticking_state(0, mode);
    const state = writer.get_sticking_state(0);
    expect(state.abc).toBe(abc);
    expect(state.url).toBe(url);
  });

  test('tom1 normal -> abc e, url o', () => {
    writer.set_tom1_state(0, 'normal');
    const state = writer.get_tom_state(0, 1);
    expect(state.abc).toBe('e');
    expect(state.url).toBe('o');
  });

  test('tom4 normal -> abc A, url o', () => {
    writer.set_tom4_state(0, 'normal');
    const state = writer.get_tom_state(0, 4);
    expect(state.abc).toBe('A');
    expect(state.url).toBe('o');
  });

  test.each(['hh', 'snare', 'kick', 'sticking'])(
    '%s unknown mode falls back to off', (drum) => {
    const setters = {
      hh: () => writer.set_hh_state(0, 'nonsense'),
      snare: () => writer.set_snare_state(0, 'nonsense'),
      kick: () => writer.set_kick_state(0, 'nonsense'),
      sticking: () => writer.set_sticking_state(0, 'nonsense'),
    };
    const getters = {
      hh: () => writer.get_hh_state(0),
      snare: () => writer.get_snare_state(0),
      kick: () => writer.get_kick_state(0),
      sticking: () => writer.get_sticking_state(0),
    };
    setters[drum]();
    expect(getters[drum]().abc).toBe(false);
  });

  test('kick with both splash and normal on returns kick_and_splash', () => {
    writer.set_kick_state(0, 'normal');
    writer.set_kick_state(0, 'splash');
    // Setting splash on top of normal replaces it (setDrumNote clears siblings).
    // To exercise the SANDK path, use the explicit kick_and_splash mode.
    writer.set_kick_state(0, 'kick_and_splash');
    const state = writer.get_kick_state(0);
    expect(state.abc).toBe('[F^d,]');
    expect(state.url).toBe('X');
  });

  test('get_kick_state returnType "ABC" returns bare abc string', () => {
    writer.set_kick_state(0, 'normal');
    expect(writer.get_kick_state(0, 'ABC')).toBe('F');
  });

  test('get_kick_state returnType "URL" returns bare url char', () => {
    writer.set_kick_state(0, 'normal');
    expect(writer.get_kick_state(0, 'URL')).toBe('o');
  });

  test('get_sticking_state returnType "ABC" returns bare abc string', () => {
    writer.set_sticking_state(0, 'right');
    expect(writer.get_sticking_state(0, 'ABC')).toBe('"R"x');
  });

  test('get_sticking_state returnType "URL" returns bare url char', () => {
    writer.set_sticking_state(0, 'right');
    expect(writer.get_sticking_state(0, 'URL')).toBe('R');
  });

  test('empty state returns abc=false, url=-', () => {
    // Fresh cell — nothing set.
    expect(writer.get_hh_state(0).abc).toBe(false);
    expect(writer.get_hh_state(0).url).toBe('-');
    expect(writer.get_snare_state(0).abc).toBe(false);
    expect(writer.get_kick_state(0).abc).toBe(false);
    expect(writer.get_tom_state(0, 1).abc).toBe(false);
    expect(writer.get_tom_state(0, 4).abc).toBe(false);
    expect(writer.get_sticking_state(0).abc).toBe(false);
  });
});

describe('Note context menu lifecycle', () => {
  let grooveUtils, writer;

  const CONTEXT_MENU_IDS = ['hhContextMenu', 'snareContextMenu', 'kickContextMenu',
    'stickingContextMenu', 'tom1ContextMenu', 'tom4ContextMenu'];

  const menuMarkup = CONTEXT_MENU_IDS.map(id => `<div id="${id}"></div>`).join('');

  beforeEach(() => {
    jest.resetModules();
    require('../js/groove_utils.js');
    require('../js/groove_writer.js');
    grooveUtils = new GrooveUtils(true);
    grooveUtils.data.fromUrl('TimeSig=4/4&Div=8&Tempo=80&H=|xxxxxxxx|');
    writer = new GrooveWriter(grooveUtils);
    document.body.innerHTML = menuMarkup + writer.HTMLforStaffContainer(0, 0);
    // Avoid real ABC/SVG re-rendering and MIDI playback in UI-focused tests.
    writer.updateSheetMusic = jest.fn();
    writer.playSingleNote = jest.fn();
  });

  const openMenu = (type, id = 0) => {
    const event = { clientX: 10, clientY: 10, preventDefault: () => {} };
    writer.noteRightClick(event, type, id);
  };

  test.each([
    ['hh', 'hhContextMenu'],
    ['snare', 'snareContextMenu'],
    ['kick', 'kickContextMenu'],
    ['sticking', 'stickingContextMenu'],
    ['tom1', 'tom1ContextMenu'],
    ['tom4', 'tom4ContextMenu'],
  ])('noteRightClick(%s) shows %s and remembers id', (type, menuId) => {
    openMenu(type, 3);
    const menu = document.getElementById(menuId);
    expect(menu.style.display).toBe('block');
    expect(writer.insertNoteContextMenu).toBe(menu);
    expect(writer.class_which_index_last_clicked).toBe(3);
    expect(grooveUtils.visible_context_menu).toBe(menu);
  });

  test('notePopupClick applies the setting and closes the menu', () => {
    openMenu('hh', 0);
    writer.notePopupClick('hh', 'open');
    expect(writer.is_hh_on(0)).toBe(true);
    expect(writer.get_hh_state(0).url).toBe('o');
    expect(document.getElementById('hhContextMenu').style.display).toBe('none');
    expect(writer.insertNoteContextMenu).toBeNull();
    expect(grooveUtils.visible_context_menu).toBe(false);
    expect(writer.updateSheetMusic).toHaveBeenCalledTimes(1);
  });

  test('notePopupClick("off") clears the note and closes the menu', () => {
    openMenu('hh', 0);
    writer.notePopupClick('hh', 'off');
    expect(writer.is_hh_on(0)).toBe(false);
    expect(document.getElementById('hhContextMenu').style.display).toBe('none');
  });

  test('opening a second menu closes the first', () => {
    openMenu('hh', 0);
    openMenu('snare', 0);
    expect(document.getElementById('hhContextMenu').style.display).toBe('none');
    expect(document.getElementById('snareContextMenu').style.display).toBe('block');
  });

  test('keyboard shortcut applies setting and closes menu', () => {
    openMenu('hh', 0);
    writer.handlePopUpKeyEventListeners({ key: 'o', preventDefault: () => {} });
    expect(writer.get_hh_state(0).url).toBe('o');
    expect(document.getElementById('hhContextMenu').style.display).toBe('none');
    expect(writer.insertNoteContextMenu).toBeNull();
  });

  test('keyboard shortcut for unrecognized key is a no-op', () => {
    openMenu('hh', 0);
    writer.handlePopUpKeyEventListeners({ key: 'q', preventDefault: () => {} });
    expect(document.getElementById('hhContextMenu').style.display).toBe('block');
    expect(writer.insertNoteContextMenu).not.toBeNull();
  });

  test('closeNoteContextMenu is safe when no menu is open', () => {
    expect(() => writer.closeNoteContextMenu()).not.toThrow();
    expect(writer.insertNoteContextMenu).toBeNull();
  });
});

describe('changeDivision', () => {
  let grooveUtils, writer;

  const SUBDIVISION_IDS = ['subdivision_8ths', 'subdivision_16ths', 'subdivision_32ths',
    'subdivision_12ths', 'subdivision_24ths', 'subdivision_48ths'];

  const subdivisionButtonsHtml = SUBDIVISION_IDS.map(id => `<div id="${id}"></div>`).join('');
  const extrasHtml = subdivisionButtonsHtml +
    '<div id="PermutationOptions"></div>' +
    '<div id="permutationAnchor"></div>' +
    '<div class="kick-container"></div><div class="snare-container"></div>' +
    '<div id="musicalInput"></div>' +
    '<div id="timeSigLabel"></div>';

  const setup = (url) => {
    jest.resetModules();
    require('../js/groove_utils.js');
    require('../js/groove_writer.js');
    grooveUtils = new GrooveUtils(true);
    writer = new GrooveWriter(grooveUtils);
    // GrooveWriter's constructor calls fromUrl(window.location.search), so we
    // parse the intended URL after the writer is built to avoid getting reset.
    grooveUtils.data.fromUrl(url);
    document.body.innerHTML = extrasHtml
      + '<div id="measureContainer">' + writer.HTMLforStaffContainer(1, 0) + '</div>';
    // Populate DOM note-on state from the parsed measure data. changeDivision
    // reads UI state back into measures, so without this the notes look empty.
    writer.applyMeasuresToUI();
    // Mark 8ths as the currently-selected subdivision (matches page init).
    document.getElementById('subdivision_8ths').classList.add('buttonSelected');
    // Avoid ABC/SVG re-rendering in these UI-focused tests.
    writer.updateSheetMusic = jest.fn();
  };

  const isSelected = (id) => document.getElementById(id).classList.contains('buttonSelected');

  test('switching 8 -> 16 highlights only the new button', () => {
    setup('TimeSig=4/4&Div=8&Tempo=80&H=|xxxxxxxx|');
    writer.changeDivision(16);
    expect(isSelected('subdivision_8ths')).toBe(false);
    expect(isSelected('subdivision_16ths')).toBe(true);
    expect(grooveUtils.data.subdivision.value).toBe(16);
  });

  test('switching 8 -> 16 -> 32 leaves only 32 highlighted', () => {
    setup('TimeSig=4/4&Div=8&Tempo=80&H=|xxxxxxxx|');
    writer.changeDivision(16);
    writer.changeDivision(32);
    expect(isSelected('subdivision_8ths')).toBe(false);
    expect(isSelected('subdivision_16ths')).toBe(false);
    expect(isSelected('subdivision_32ths')).toBe(true);
    expect(grooveUtils.data.subdivision.value).toBe(32);
  });

  test('rescaleMeasure scales up (8 -> 16) by spacing notes out', () => {
    setup('TimeSig=4/4&Div=8&Tempo=80&H=|x-x-x-x-|');
    const src = grooveUtils.data.measures[0];
    // Manually build the destination as changeDivision does.
    const dst = new Measure(grooveUtils.data.timeSig, Subdivision.of(16));
    GrooveWriter.rescaleMeasure(src, dst);
    expect(dst.toString(DrumType.HIHAT)).toBe('x---x---x---x---');
  });

  test('rescaleMeasure scales down (16 -> 8) by keeping every other slot', () => {
    setup('TimeSig=4/4&Div=16&Tempo=80&H=|x-x-x-x-x-x-x-x-|');
    const src = grooveUtils.data.measures[0];
    const dst = new Measure(grooveUtils.data.timeSig, Subdivision.of(8));
    GrooveWriter.rescaleMeasure(src, dst);
    // Positions 0,2,4,6,8,10,12,14 in the 16-grid map to 0..7 — all 'x' in this pattern.
    expect(dst.toString(DrumType.HIHAT)).toBe('xxxxxxxx');
  });

  test('refresh_ABC is bound and safe to reassign to window.onresize', () => {
    setup('TimeSig=4/4&Div=8&Tempo=80&H=|xxxxxxxx|');
    window.onresize = writer.refresh_ABC;
    expect(() => window.onresize()).not.toThrow();
    expect(writer.updateSheetMusic).toHaveBeenCalled();
  });
});