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

  test('set_tom1_state("normal") turns tom1 on and set_tom1_state("off") turns tom1 off', () => {
    writer.set_tom1_state(0, 'normal');
    expect(writer.is_tom_on(0, 1)).toBe(true);
    writer.set_tom1_state(0, 'off');
    expect(writer.is_tom_on(0, 1)).toBe(false);
  });

  test('set_tom4_state("normal") turns tom4 on and set_tom4_state("off") turns tom4 off', () => {
    writer.set_tom4_state(0, 'normal');
    expect(writer.is_tom_on(0, 4)).toBe(true);
    writer.set_tom4_state(0, 'off');
    expect(writer.is_tom_on(0, 4)).toBe(false);
  });

  test('set_hh2_state correctly updates state and UI and turns off', () => {
    expect(writer.is_hh2_on(0)).toBe(false);

    writer.set_hh2_state(0, 'ride_bell');
    expect(writer.is_hh2_on(0)).toBe(true);
    expect(writer.get_hh2_state(0).url).toBe('b');

    writer.set_hh2_state(0, 'crash');
    expect(writer.get_hh2_state(0).url).toBe('c');

    writer.set_hh2_state(0, 'off');
    expect(writer.is_hh2_on(0)).toBe(false);
  });

  test('set_sticking_state("right") sets sticking to R', () => {
    writer.set_sticking_state(0, 'right');
    expect(writer.get_sticking_state(0).abc).toBe('"R"x');
    expect(writer.is_sticking_on(0)).toBe(true);
    expect(document.getElementById('sticking_right0').classList.contains('note-on')).toBe(true);
    expect(document.getElementById('sticking_left0').classList.contains('note-hidden')).toBe(true);
    expect(document.getElementById('sticking_both0').classList.contains('note-hidden')).toBe(true);
    expect(document.getElementById('sticking_count0').classList.contains('note-hidden')).toBe(true);
  });

  test('set_sticking_state("left") sets sticking to L', () => {
    writer.set_sticking_state(0, 'left');
    expect(writer.get_sticking_state(0).abc).toBe('"L"x');
    expect(writer.is_sticking_on(0)).toBe(true);
    expect(document.getElementById('sticking_left0').classList.contains('note-on')).toBe(true);
    expect(document.getElementById('sticking_right0').classList.contains('note-hidden')).toBe(true);
  });

  test('sticking off shows sticking_right as placeholder with note-off and others hidden', () => {
    writer.set_sticking_state(0, 'left');
    writer.set_sticking_state(0, 'off');
    expect(writer.is_sticking_on(0)).toBe(false);
    expect(document.getElementById('sticking_right0').classList.contains('note-off')).toBe(true);
    expect(document.getElementById('sticking_left0').classList.contains('note-hidden')).toBe(true);
    expect(document.getElementById('sticking_both0').classList.contains('note-hidden')).toBe(true);
    expect(document.getElementById('sticking_count0').classList.contains('note-hidden')).toBe(true);
  });

  test('sticking_rotate_state rotates from off -> R -> L -> both -> count -> off', () => {
    writer.set_sticking_state(0, 'off');
    expect(writer.is_sticking_on(0)).toBe(false);

    writer.sticking_rotate_state(0);
    expect(writer.get_sticking_state(0).url).toBe('R');
    expect(document.getElementById('sticking_right0').classList.contains('note-on')).toBe(true);

    writer.sticking_rotate_state(0);
    expect(writer.get_sticking_state(0).url).toBe('L');
    expect(document.getElementById('sticking_left0').classList.contains('note-on')).toBe(true);

    writer.sticking_rotate_state(0);
    expect(writer.get_sticking_state(0).url).toBe('b');
    expect(document.getElementById('sticking_both0').classList.contains('note-on')).toBe(true);

    writer.sticking_rotate_state(0);
    expect(writer.get_sticking_state(0).url).toBe('c');
    expect(document.getElementById('sticking_count0').classList.contains('note-on')).toBe(true);

    writer.sticking_rotate_state(0);
    expect(writer.get_sticking_state(0).abc).toBe(false);
    expect(writer.is_sticking_on(0)).toBe(false);
    expect(document.getElementById('sticking_right0').classList.contains('note-off')).toBe(true);
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

  test.each(['hh', 'hh2', 'snare', 'kick', 'sticking', 'tom1', 'tom4'])(
    '%s unknown mode falls back to off', (drum) => {
    const setters = {
      hh: () => writer.set_hh_state(0, 'nonsense'),
      hh2: () => writer.set_hh2_state(0, 'nonsense'),
      snare: () => writer.set_snare_state(0, 'nonsense'),
      kick: () => writer.set_kick_state(0, 'nonsense'),
      sticking: () => writer.set_sticking_state(0, 'nonsense'),
      tom1: () => writer.set_tom1_state(0, 'nonsense'),
      tom4: () => writer.set_tom4_state(0, 'nonsense'),
    };
    const getters = {
      hh: () => writer.get_hh_state(0),
      hh2: () => writer.get_hh2_state(0),
      snare: () => writer.get_snare_state(0),
      kick: () => writer.get_kick_state(0),
      sticking: () => writer.get_sticking_state(0),
      tom1: () => writer.get_tom_state(0, 1),
      tom4: () => writer.get_tom_state(0, 4),
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

  test('getDrumState reads any drum uniformly', () => {
    writer.set_kick_state(0, 'normal');
    expect(writer.getDrumState(0, DrumType.KICK)).toEqual({ abc: 'F', url: 'o' });

    writer.set_sticking_state(0, 'right');
    expect(writer.getDrumState(0, DrumType.STICKINGS)).toEqual({ abc: '"R"x', url: 'R' });

    writer.set_snare_state(0, 'accent');
    expect(writer.getDrumState(0, DrumType.SNARE)).toEqual({ abc: '!accent!c', url: 'O' });

    writer.set_hh2_state(0, 'crash');
    expect(writer.getDrumState(0, DrumType.HIHAT2)).toEqual({ abc: "^c'", url: 'c' });

    writer.set_tom1_state(0, 'normal');
    expect(writer.getDrumState(0, DrumType.TOM1)).toEqual({ abc: 'e', url: 'o' });

    writer.set_tom4_state(0, 'normal');
    expect(writer.getDrumState(0, DrumType.TOM4)).toEqual({ abc: 'A', url: 'o' });
  });

  test('empty state returns abc=false, url=-', () => {
    // Fresh cell — nothing set.
    expect(writer.get_hh_state(0).abc).toBe(false);
    expect(writer.get_hh_state(0).url).toBe('-');
    expect(writer.get_hh2_state(0).abc).toBe(false);
    expect(writer.get_hh2_state(0).url).toBe('-');
    expect(writer.get_snare_state(0).abc).toBe(false);
    expect(writer.get_kick_state(0).abc).toBe(false);
    expect(writer.get_tom_state(0, 1).abc).toBe(false);
    expect(writer.get_tom_state(0, 4).abc).toBe(false);
    expect(writer.get_sticking_state(0).abc).toBe(false);
  });
});

describe('Note context menu and interactive editing lifecycle', () => {
  let grooveUtils, writer;

  const CONTEXT_MENU_IDS = ['hhContextMenu', 'hh2ContextMenu', 'snareContextMenu', 'kickContextMenu',
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
    ['hh2', 'hh2ContextMenu'],
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

  test('noteLeftClick toggles note on and off across drum types', () => {
    ['hh', 'hh2', 'snare', 'kick', 'tom1', 'tom4', 'sticking'].forEach(drum => {
      const isNoteOn = (drum === 'hh2') ? () => writer.is_hh2_on(2) :
                       (drum === 'tom1') ? () => writer.is_tom_on(2, 1) :
                       (drum === 'tom4') ? () => writer.is_tom_on(2, 4) :
                       (drum === 'snare') ? () => writer.is_snare_on(2) :
                       (drum === 'kick') ? () => writer.is_kick_on(2) :
                       (drum === 'sticking') ? () => writer.is_sticking_on(2) :
                       () => writer.is_hh_on(2);

      expect(isNoteOn()).toBe(false);
      writer.noteLeftClick({ preventDefault: () => {} }, drum, 2);
      expect(isNoteOn()).toBe(true);
      if (drum === 'sticking') {
        // Rotating from R through all states back to off
        writer.noteLeftClick({ preventDefault: () => {} }, drum, 2); // -> L
        writer.noteLeftClick({ preventDefault: () => {} }, drum, 2); // -> both
        writer.noteLeftClick({ preventDefault: () => {} }, drum, 2); // -> count
        writer.noteLeftClick({ preventDefault: () => {} }, drum, 2); // -> off
        expect(isNoteOn()).toBe(false);
      } else {
        writer.noteLeftClick({ preventDefault: () => {} }, drum, 2);
        expect(isNoteOn()).toBe(false);
      }
    });
  });

  test('noteLabelPopupClick batch operations on instruments', () => {
    // hh2 batch operations
    writer.noteLabelPopupClick('hh2', 'all_on', 1);
    for (let i = 0; i < 8; i++) {
      expect(writer.is_hh2_on(i)).toBe(true);
    }

    writer.noteLabelPopupClick('hh2', 'all_off', 1);
    for (let i = 0; i < 8; i++) {
      expect(writer.is_hh2_on(i)).toBe(false);
    }

    writer.noteLabelPopupClick('hh2', 'downbeats', 1);
    expect(writer.is_hh2_on(0)).toBe(true);
    expect(writer.is_hh2_on(1)).toBe(false);
    expect(writer.is_hh2_on(2)).toBe(true);
    expect(writer.is_hh2_on(3)).toBe(false);

    writer.noteLabelPopupClick('hh2', 'upbeats', 1);
    expect(writer.is_hh2_on(0)).toBe(false);
    expect(writer.is_hh2_on(1)).toBe(true);
    expect(writer.is_hh2_on(2)).toBe(false);
    expect(writer.is_hh2_on(3)).toBe(true);
  });

  test('muteInstrument toggles mute button and audio state', () => {
    document.body.innerHTML = `
      <div id="unmutehh2Button1" style="display: none;"></div>
      <div id="unmutesnareButton1" style="display: none;"></div>
    `;
    writer.muteInstrument('hh2', 1, true);
    expect(document.getElementById('unmutehh2Button1').style.display).toBe('inline-block');
    expect(writer.isInstrumentMuted('hh2', 1)).toBe(true);

    writer.muteInstrument('hh2', 1, false);
    expect(document.getElementById('unmutehh2Button1').style.display).toBe('none');
    expect(writer.isInstrumentMuted('hh2', 1)).toBe(false);
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

describe('Kick permutation patterns', () => {
  let writer;

  beforeAll(() => {
    require('../js/groove_utils.js');
    require('../js/groove_writer.js');
    const grooveUtils = new GrooveUtils(true);
    grooveUtils.data.fromUrl('TimeSig=4/4&Div=16&Tempo=80&H=|xxxxxxxxxxxxxxxx|');
    writer = new GrooveWriter(grooveUtils);
  });

  // Behavioral snapshot: the new module-level functions must produce the same
  // arrays as the legacy class methods for every section. This lets us safely
  // strip the legacy imperative bodies once these tests pass.

  const SECTIONS = Array.from({ length: 16 }, (_, i) => i);

  describe('kickPermutationStrait matches legacy get_kick16th_strait_permutation_array', () => {
    test.each(SECTIONS)('section %i', (section) => {
      expect(kickPermutationStrait(section))
        .toEqual(writer.get_kick16th_strait_permutation_array(section));
    });
  });

  describe('kickPermutationMinusSomeStrait matches legacy get_kick16th_minus_some_strait_permutation_array', () => {
    test.each(SECTIONS)('section %i', (section) => {
      expect(kickPermutationMinusSomeStrait(section))
        .toEqual(writer.get_kick16th_minus_some_strait_permutation_array(section));
    });
  });

  describe('kickPermutationTriplets matches legacy get_kick16th_triplets_permutation_array', () => {
    // Legacy code logs "bad case" for sections 4, 8, 9, 10, 12, 13, 14, 15 and
    // leaves the array short (pushes nothing for those iterations). Skip those.
    const VALID_TRIPLET_SECTIONS = [0, 1, 2, 3, 5, 6, 7, 11];
    test.each(VALID_TRIPLET_SECTIONS)('section %i', (section) => {
      expect(kickPermutationTriplets(section))
        .toEqual(writer.get_kick16th_triplets_permutation_array(section));
    });
  });

  describe('shape sanity', () => {
    test('strait arrays are 32 long', () => {
      for (const s of SECTIONS) expect(kickPermutationStrait(s)).toHaveLength(32);
    });
    test('triplet arrays are 48 long', () => {
      for (const s of SECTIONS) expect(kickPermutationTriplets(s)).toHaveLength(48);
    });
  });
});

describe('shouldDisplayPermutation', () => {
  beforeAll(() => {
    require('../js/groove_utils.js');
    require('../js/groove_writer.js');
  });

  const allChecked = () => true;
  const allExist = () => true;
  const noneChecked = () => false;
  const checkedSet = (ids) => (id) => ids.has(id);

  test('unknown section is false and logs', () => {
    expect(shouldDisplayPermutation(99, allChecked, allExist, false)).toBe(false);
  });

  test('parent unchecked → section off', () => {
    expect(shouldDisplayPermutation(1, noneChecked, allExist, false)).toBe(false);
  });

  test('parent checked + sub checked → on', () => {
    const on = new Set(['PermuationOptionsSingles', 'PermuationOptionsSingles_sub1']);
    expect(shouldDisplayPermutation(1, checkedSet(on), allExist, false)).toBe(true);
  });

  test('parent checked but sub unchecked → off', () => {
    const on = new Set(['PermuationOptionsSingles']);
    expect(shouldDisplayPermutation(1, checkedSet(on), allExist, false)).toBe(false);
  });

  test('tripletExcluded sections are off in triplet mode even if all checked', () => {
    // Section 4 (Singles sub4) is triplet-excluded.
    expect(shouldDisplayPermutation(4, allChecked, allExist, true)).toBe(false);
    // Non-excluded triplet-safe section still on.
    expect(shouldDisplayPermutation(1, allChecked, allExist, true)).toBe(true);
  });

  test('optional-sub sections stay on if the sub element is missing', () => {
    // Sections 0 (Ostinato), 11 (Triples sub1), 15 (Quads sub1) have optional subs.
    const parentsOnly = new Set(['PermuationOptionsOstinato', 'PermuationOptionsTriples', 'PermuationOptionsQuads']);
    const noSubExists = (id) => !id.includes('sub') && !id.includes('SubOptions');
    expect(shouldDisplayPermutation(0, checkedSet(parentsOnly), noSubExists, false)).toBe(true);
    expect(shouldDisplayPermutation(11, checkedSet(parentsOnly), noSubExists, false)).toBe(true);
    expect(shouldDisplayPermutation(15, checkedSet(parentsOnly), noSubExists, false)).toBe(true);
  });

  test('section 11 uses PermuationSubOptionsTriples1 as its existence gate', () => {
    // If the gate id doesn't exist, we skip the sub check even if _sub1 is off.
    const parentsOnly = new Set(['PermuationOptionsTriples']);
    const gateMissing = (id) => id !== 'PermuationSubOptionsTriples1';
    expect(shouldDisplayPermutation(11, checkedSet(parentsOnly), gateMissing, false)).toBe(true);

    // Once the gate exists, we do check _sub1 — which is unchecked, so off.
    expect(shouldDisplayPermutation(11, checkedSet(parentsOnly), allExist, false)).toBe(false);
  });

  test('non-optional-sub sections require sub checked regardless of existence', () => {
    // Section 1 (Singles sub1) — sub required even if some hypothetical existence check failed.
    const parentsOnly = new Set(['PermuationOptionsSingles']);
    const noSubExists = () => false;
    expect(shouldDisplayPermutation(1, checkedSet(parentsOnly), noSubExists, false)).toBe(false);
  });

  test('all 16 sections have an entry in the section table', () => {
    for (let i = 0; i < 16; i++) expect(PERMUTATION_SECTIONS[i]).toBeDefined();
  });
});

describe('MIDI and Note Mapping in GrooveWriter', () => {
  let grooveUtils, writer;

  beforeEach(() => {
    jest.resetModules();
    require('../js/groove_utils.js');
    require('../js/groove_writer.js');
    grooveUtils = new GrooveUtils(true);
    writer = new GrooveWriter(grooveUtils);
    grooveUtils.data.fromUrl('TimeSig=4/4&Div=8&Tempo=80&H=|xxxxxxxx|&S=|--o---o-|&K=|o---o---|');
    document.body.innerHTML = writer.HTMLforStaffContainer(1, 0);
    writer.applyMeasuresToUI();
  });

  test('createMidiUrlFromClickableUI populates note_mapping_array for playback highlighting', () => {
    // Midi globals for Midi.File and Midi.Track
    global.Midi = {
      File: function() {
        this.addTrack = jest.fn();
        this.toBytes = jest.fn().mockReturnValue('mockMidiBytes');
      },
      Track: function() {
        this.events = [];
        this.setTempo = jest.fn();
        this.setInstrument = jest.fn();
        this.addNoteOn = jest.fn();
        this.addNoteOff = jest.fn();
      }
    };

    writer.createMidiUrlFromClickableUI('our_MIDI');
    expect(grooveUtils.note_mapping_array).not.toBeNull();
    expect(Array.isArray(grooveUtils.note_mapping_array)).toBe(true);
    expect(grooveUtils.note_mapping_array.length).toBeGreaterThan(0);
    // Position 0 has kick and hi-hat -> should be true
    expect(grooveUtils.note_mapping_array[0]).toBe(true);
  });

  test('get32NoteArrayFromClickableUI extracts note arrays for all instruments including HH2 and toms', () => {
    writer.showHideToms(true, true, true);
    writer.set_hh2_state(0, 'ride_bell', false);
    writer.set_tom1_state(0, 'normal', false);
    writer.set_tom4_state(0, 'normal', false);

    const sticking = writer.get_empty_note_array_in_32nds();
    const hh = writer.get_empty_note_array_in_32nds();
    const snare = writer.get_empty_note_array_in_32nds();
    const kick = writer.get_empty_note_array_in_32nds();
    const toms = [
      writer.get_empty_note_array_in_32nds(),
      writer.get_empty_note_array_in_32nds(),
      writer.get_empty_note_array_in_32nds(),
      writer.get_empty_note_array_in_32nds()
    ];
    const hh2 = writer.get_empty_note_array_in_32nds();

    writer.get32NoteArrayFromClickableUI(sticking, hh, snare, kick, toms, 0, hh2);
    expect(hh2[0]).toBe(constant_ABC_HH_Ride_Bell);
    expect(toms[0][0]).toBe(constant_ABC_T1_Normal);
    expect(toms[3][0]).toBe(constant_ABC_T4_Normal);
  });
});

describe('Add and Remove Measure actions', () => {
  let grooveUtils, writer;

  beforeEach(() => {
    jest.resetModules();
    require('../js/groove_utils.js');
    require('../js/groove_writer.js');
    grooveUtils = new GrooveUtils(true);
    writer = new GrooveWriter(grooveUtils);
    grooveUtils.data.fromUrl('TimeSig=4/4&Div=8&Tempo=80&H=|xxxxxxxx|&S=|--o---o-|&K=|o---o---|');
    document.body.innerHTML = `
      <div id="measureContainer">${writer.HTMLforStaffContainer(1, 0)}</div>
      <div id="musicalInput"></div>
      <div id="tuneTitle"></div>
      <div id="tuneAuthor"></div>
      <div id="tuneComments"></div>
    `;
    writer.applyMeasuresToUI();
    writer.updateSheetMusic = jest.fn();
    writer.updateUrl = jest.fn();
  });

  test('addMeasureButtonClick adds a measure and duplicates notes from last measure', () => {
    expect(writer.numberOfMeasures()).toBe(1);

    writer.addMeasureButtonClick({});
    expect(writer.numberOfMeasures()).toBe(2);
    expect(document.getElementById('staff-container1')).not.toBeNull();
    expect(document.getElementById('staff-container2')).not.toBeNull();
    expect(writer.updateSheetMusic).toHaveBeenCalled();
    expect(writer.updateUrl).toHaveBeenCalled();

    // Notes in measure 2 should match measure 1
    const m1Snare = grooveUtils.data.measures[0].toString(DrumType.SNARE);
    const m2Snare = grooveUtils.data.measures[1].toString(DrumType.SNARE);
    expect(m2Snare).toBe(m1Snare);
  });

  test('closeMeasureButtonClick removes measure and updates UI', () => {
    writer.addMeasureButtonClick({});
    expect(writer.numberOfMeasures()).toBe(2);

    writer.closeMeasureButtonClick(2);
    expect(writer.numberOfMeasures()).toBe(1);
    expect(document.getElementById('staff-container1')).not.toBeNull();
    expect(document.getElementById('staff-container2')).toBeNull();
  });

  test('closeMeasureButtonClick ignores removal when only 1 measure remains', () => {
    expect(writer.numberOfMeasures()).toBe(1);
    writer.closeMeasureButtonClick(1);
    expect(writer.numberOfMeasures()).toBe(1);
  });

  test('addMeasure captures interactive UI edits made before clicking add', () => {
    // Modify note 0 in UI (turn snare on beat 1)
    writer.set_snare_state(0, 'normal');
    expect(writer.is_snare_on(0)).toBe(true);

    writer.addMeasure();
    expect(writer.numberOfMeasures()).toBe(2);

    // Both measure 1 and measure 2 should now have snare on position 0
    expect(grooveUtils.data.measures[0].toString(DrumType.SNARE).startsWith('o')).toBe(true);
    expect(grooveUtils.data.measures[1].toString(DrumType.SNARE).startsWith('o')).toBe(true);
  });

  test('removeMeasure with invalid indices returns false and leaves measures intact', () => {
    writer.addMeasure();
    expect(writer.numberOfMeasures()).toBe(2);

    expect(writer.removeMeasure(-1)).toBe(false);
    expect(writer.removeMeasure(5)).toBe(false);
    expect(writer.numberOfMeasures()).toBe(2);
  });

  test('deleting middle measure correctly shifts remaining measures', () => {
    // Create 3 measures: M1 default, M2 all snare, M3 default
    writer.addMeasure(); // M2
    writer.addMeasure(); // M3
    expect(writer.numberOfMeasures()).toBe(3);

    // Distinguish M2
    grooveUtils.data.measures[1].setDataFromString(DrumType.SNARE, 'oooooooo');
    writer.applyMeasuresToUI();

    // Remove measure 2 (index 1)
    writer.removeMeasure(1);
    expect(writer.numberOfMeasures()).toBe(2);
    expect(document.getElementById('staff-container3')).toBeNull();
    expect(document.getElementById('staff-container2')).not.toBeNull();
    // Remaining M2 should be the previous M3 (not the all-snare one)
    expect(grooveUtils.data.measures[1].toString(DrumType.SNARE)).not.toBe('oooooooo');
  });

  test('preserves stickings and toms visibility across add and remove', () => {
    writer.stickingsShowHide(true, true, true);
    writer.showHideToms(true, true, true);

    expect(writer.isStickingsVisible()).toBe(true);
    expect(writer.isTomsVisible()).toBe(true);

    writer.addMeasure();
    expect(writer.isStickingsVisible()).toBe(true);
    expect(writer.isTomsVisible()).toBe(true);

    writer.removeMeasure(1);
    expect(writer.isStickingsVisible()).toBe(true);
    expect(writer.isTomsVisible()).toBe(true);
  });
});

describe('measureContainer Keyboard Navigation and Highlighting', () => {
  let grooveUtils, writer;

  const extrasHtml = `
    <div id="musicalInput">
      <div id="measureContainer" tabindex="0"></div>
    </div>
    <div id="embedTool">
      <input type="text" id="subText" value="" />
      <input type="text" id="repeatBegins" value="" />
    </div>
    <div id="sheetMusicTextFields">
      <input type="text" id="tuneTitle" value="" />
      <input type="text" id="tuneAuthor" value="" />
      <input type="text" id="tuneComments" value="" />
    </div>
    <div id="PermutationOptions"></div>
    <div id="permutationAnchor"></div>
    <div id="timeSigLabel"></div>
    <div id="subdivision_8ths"></div>
    <div id="subdivision_16ths"></div>
    <div class="noteContextMenu">
      <ul id="hhContextMenu" class="list"></ul>
      <ul id="hh2ContextMenu" class="list"></ul>
      <ul id="snareContextMenu" class="list"></ul>
      <ul id="kickContextMenu" class="list"></ul>
      <ul id="stickingContextMenu" class="list"></ul>
      <ul id="tom1ContextMenu" class="list"></ul>
      <ul id="tom4ContextMenu" class="list"></ul>
    </div>
  `;

  beforeEach(() => {
    jest.resetModules();
    require('../js/groove_utils.js');
    require('../js/groove_writer.js');
    grooveUtils = new GrooveUtils(true);
    writer = new GrooveWriter(grooveUtils);
    grooveUtils.data.fromUrl('TimeSig=4/4&Div=16&Tempo=80&H=|----------------|&S=|----------------|&K=|----------------|');
    document.body.innerHTML = extrasHtml;
    writer.setupMeasureContainerNavigation();
    writer.renderMeasureContainer();
    writer.updateSheetMusic = jest.fn();
    writer.playSingleNote = jest.fn();
  });

  test('measureContainer is active and highlights are displayed by default on render', () => {
    expect(writer.isMeasureContainerActive).toBe(true);
    expect(document.getElementById('measureContainer').classList.contains('nav-active')).toBe(true);
    expect(document.getElementById('bg-highlight0').classList.contains('nav-col-highlight')).toBe(true);
    expect(document.getElementById('snare0').classList.contains('nav-note-cursor')).toBe(true);
  });

  test('setMeasureContainerSelected toggles active state while keeping highlights visible', () => {
    writer.selectedInstrument = 'snare';
    writer.selectedNoteIndex = 4;
    writer.setMeasureContainerSelected(true);

    expect(writer.isMeasureContainerActive).toBe(true);
    expect(document.getElementById('measureContainer').classList.contains('nav-active')).toBe(true);
    expect(document.getElementById('bg-highlight4').classList.contains('nav-col-highlight')).toBe(true);
    expect(document.getElementById('snare4').classList.contains('nav-note-cursor')).toBe(true);

    const snareContainer = document.querySelector('#staff-container1 .snare-container');
    expect(snareContainer.classList.contains('nav-row-highlight')).toBe(true);

    writer.setMeasureContainerSelected(false);
    expect(writer.isMeasureContainerActive).toBe(false);
    expect(document.getElementById('measureContainer').classList.contains('nav-active')).toBe(false);
    // Highlights remain visible by default
    expect(document.getElementById('bg-highlight4').classList.contains('nav-col-highlight')).toBe(true);
    expect(document.getElementById('snare4').classList.contains('nav-note-cursor')).toBe(true);
    expect(snareContainer.classList.contains('nav-row-highlight')).toBe(true);
  });

  test('arrow keys navigate left/right across notes and up/down across rows', () => {
    writer.selectedInstrument = 'hh';
    writer.selectedNoteIndex = 0;
    writer.setMeasureContainerSelected(true);

    // Press right until beat 2 (index 4 in 16th notes)
    writer.handleMeasureContainerKeyDown({ key: 'ArrowRight', preventDefault: () => {}, stopPropagation: () => {} });
    expect(writer.selectedNoteIndex).toBe(1);
    writer.handleMeasureContainerKeyDown({ key: 'ArrowRight', preventDefault: () => {}, stopPropagation: () => {} });
    writer.handleMeasureContainerKeyDown({ key: 'ArrowRight', preventDefault: () => {}, stopPropagation: () => {} });
    writer.handleMeasureContainerKeyDown({ key: 'ArrowRight', preventDefault: () => {}, stopPropagation: () => {} });
    expect(writer.selectedNoteIndex).toBe(4);
    expect(document.getElementById('bg-highlight4').classList.contains('nav-col-highlight')).toBe(true);

    // Press down to hh2 (Cymbal 2) row
    writer.handleMeasureContainerKeyDown({ key: 'ArrowDown', preventDefault: () => {}, stopPropagation: () => {} });
    expect(writer.selectedInstrument).toBe('hh2');
    expect(document.getElementById('hi-hat24').classList.contains('nav-note-cursor')).toBe(true);

    // Press down to snare row (when toms hidden, hh -> hh2 -> snare -> kick)
    writer.handleMeasureContainerKeyDown({ key: 'ArrowDown', preventDefault: () => {}, stopPropagation: () => {} });
    expect(writer.selectedInstrument).toBe('snare');
    expect(document.getElementById('snare4').classList.contains('nav-note-cursor')).toBe(true);

    // Press down to kick row
    writer.handleMeasureContainerKeyDown({ key: 'ArrowDown', preventDefault: () => {}, stopPropagation: () => {} });
    expect(writer.selectedInstrument).toBe('kick');
    expect(document.getElementById('kick4').classList.contains('nav-note-cursor')).toBe(true);

    // Press down again at bottom stops at kick
    writer.handleMeasureContainerKeyDown({ key: 'ArrowDown', preventDefault: () => {}, stopPropagation: () => {} });
    expect(writer.selectedInstrument).toBe('kick');

    // Press up back to snare, then hh2, then hh
    writer.handleMeasureContainerKeyDown({ key: 'ArrowUp', preventDefault: () => {}, stopPropagation: () => {} });
    expect(writer.selectedInstrument).toBe('snare');
    writer.handleMeasureContainerKeyDown({ key: 'ArrowUp', preventDefault: () => {}, stopPropagation: () => {} });
    expect(writer.selectedInstrument).toBe('hh2');
    writer.handleMeasureContainerKeyDown({ key: 'ArrowUp', preventDefault: () => {}, stopPropagation: () => {} });
    expect(writer.selectedInstrument).toBe('hh');
    writer.handleMeasureContainerKeyDown({ key: 'ArrowUp', preventDefault: () => {}, stopPropagation: () => {} });
    expect(writer.selectedInstrument).toBe('hh'); // Stops at top
  });

  test('navigation includes toms when toms are visible', () => {
    writer.showHideToms(true, true, true);
    expect(writer.isTomsVisible()).toBe(true);
    expect(writer.getVisibleInstrumentRows()).toEqual(['hh', 'hh2', 'tom1', 'snare', 'tom4', 'kick']);

    writer.selectedInstrument = 'hh';
    writer.setMeasureContainerSelected(true);

    writer.handleMeasureContainerKeyDown({ key: 'ArrowDown', preventDefault: () => {}, stopPropagation: () => {} });
    expect(writer.selectedInstrument).toBe('hh2');
    writer.handleMeasureContainerKeyDown({ key: 'ArrowDown', preventDefault: () => {}, stopPropagation: () => {} });
    expect(writer.selectedInstrument).toBe('tom1');
    writer.handleMeasureContainerKeyDown({ key: 'ArrowDown', preventDefault: () => {}, stopPropagation: () => {} });
    expect(writer.selectedInstrument).toBe('snare');
    writer.handleMeasureContainerKeyDown({ key: 'ArrowDown', preventDefault: () => {}, stopPropagation: () => {} });
    expect(writer.selectedInstrument).toBe('tom4');
    writer.handleMeasureContainerKeyDown({ key: 'ArrowDown', preventDefault: () => {}, stopPropagation: () => {} });
    expect(writer.selectedInstrument).toBe('kick');
  });

  test('setting notes via context menu shortcut keys on highlighted cell', () => {
    writer.selectedInstrument = 'snare';
    writer.selectedNoteIndex = 4;
    writer.setMeasureContainerSelected(true);

    // Press "O" -> sets snare accent
    writer.handleMeasureContainerKeyDown({ key: 'O', preventDefault: () => {}, stopPropagation: () => {} });
    expect(writer.is_snare_on(4)).toBe(true);
    expect(writer.get_snare_state(4).url).toBe('O');

    // Press "Backspace" -> clears note
    writer.handleMeasureContainerKeyDown({ key: 'Backspace', preventDefault: () => {}, stopPropagation: () => {} });
    expect(writer.is_snare_on(4)).toBe(false);

    // Press "o" -> sets snare normal
    writer.handleMeasureContainerKeyDown({ key: 'o', preventDefault: () => {}, stopPropagation: () => {} });
    expect(writer.is_snare_on(4)).toBe(true);
    expect(writer.get_snare_state(4).url).toBe('o');

    // Press "g" -> ghost note
    writer.handleMeasureContainerKeyDown({ key: 'g', preventDefault: () => {}, stopPropagation: () => {} });
    expect(writer.get_snare_state(4).url).toBe('g');

    // Press "x" -> cross stick
    writer.handleMeasureContainerKeyDown({ key: 'x', preventDefault: () => {}, stopPropagation: () => {} });
    expect(writer.get_snare_state(4).url).toBe('x');
  });

  test('setting notes on hi-hat and kick via keys', () => {
    writer.selectedInstrument = 'hh';
    writer.selectedNoteIndex = 0;
    writer.setMeasureContainerSelected(true);

    writer.handleMeasureContainerKeyDown({ key: 'x', preventDefault: () => {}, stopPropagation: () => {} });
    expect(writer.get_hh_state(0).url).toBe('x');

    writer.handleMeasureContainerKeyDown({ key: 'o', preventDefault: () => {}, stopPropagation: () => {} });
    expect(writer.get_hh_state(0).url).toBe('o');

    writer.handleMeasureContainerKeyDown({ key: 'X', preventDefault: () => {}, stopPropagation: () => {} });
    expect(writer.get_hh_state(0).url).toBe('X');

    // Switch to kick
    writer.selectedInstrument = 'kick';
    writer.selectedNoteIndex = 0;
    writer.handleMeasureContainerKeyDown({ key: 'o', preventDefault: () => {}, stopPropagation: () => {} });
    expect(writer.get_kick_state(0).url).toBe('o');

    writer.handleMeasureContainerKeyDown({ key: 'x', preventDefault: () => {}, stopPropagation: () => {} });
    expect(writer.get_kick_state(0).url).toBe('x');

    writer.handleMeasureContainerKeyDown({ key: 'X', preventDefault: () => {}, stopPropagation: () => {} });
    expect(writer.get_kick_state(0).url).toBe('X');
  });

  test('does not intercept keys when typing in notion embed options or text fields', () => {
    writer.setMeasureContainerSelected(true);

    const subTextInput = document.getElementById('subText');
    const intercepted = writer.handleMeasureContainerKeyDown({
      target: subTextInput,
      key: 'o',
      preventDefault: jest.fn(),
      stopPropagation: jest.fn()
    });

    expect(intercepted).toBe(false);

    const titleInput = document.getElementById('tuneTitle');
    const interceptedTitle = writer.handleMeasureContainerKeyDown({
      target: titleInput,
      key: 'ArrowRight',
      preventDefault: jest.fn(),
      stopPropagation: jest.fn()
    });

    expect(interceptedTitle).toBe(false);
  });

  test('does not intercept keys when measureContainer is not selected', () => {
    writer.setMeasureContainerSelected(false);
    expect(writer.isMeasureContainerSelected).toBe(false);

    const intercepted = writer.handleMeasureContainerKeyDown({
      key: 'ArrowRight',
      preventDefault: jest.fn(),
      stopPropagation: jest.fn()
    });

    expect(intercepted).toBe(false);
  });

  test('mouse click on note activates navigation at that note position', () => {
    writer.noteLeftClick({ preventDefault: () => {} }, 'snare', 6);
    expect(writer.isMeasureContainerSelected).toBe(true);
    expect(writer.selectedInstrument).toBe('snare');
    expect(writer.selectedNoteIndex).toBe(6);
    expect(document.getElementById('snare6').classList.contains('nav-note-cursor')).toBe(true);
    expect(document.getElementById('bg-highlight6').classList.contains('nav-col-highlight')).toBe(true);
  });

  test('mouse click on row label activates navigation for that row', () => {
    writer.noteLabelClick({ preventDefault: () => {} }, 'kick', 1);
    expect(writer.isMeasureContainerSelected).toBe(true);
    expect(writer.selectedInstrument).toBe('kick');
  });

  test('multi-measure navigation moves across measure boundaries and highlights correct staff', () => {
    writer.addMeasure();
    expect(writer.numberOfMeasures()).toBe(2);

    writer.selectedInstrument = 'snare';
    writer.selectedNoteIndex = 15; // Last note of Measure 1
    writer.setMeasureContainerSelected(true);

    // Press right -> moves to index 16 (first note of Measure 2)
    writer.handleMeasureContainerKeyDown({ key: 'ArrowRight', preventDefault: () => {}, stopPropagation: () => {} });
    expect(writer.selectedNoteIndex).toBe(16);
    expect(document.getElementById('bg-highlight16').classList.contains('nav-col-highlight')).toBe(true);
    expect(document.getElementById('snare16').classList.contains('nav-note-cursor')).toBe(true);

    // Measure 2 staff container should now have row highlight
    expect(document.querySelector('#staff-container2 .snare-container').classList.contains('nav-row-highlight')).toBe(true);

    // Modify note in Measure 2 via keyboard
    writer.handleMeasureContainerKeyDown({ key: 'O', preventDefault: () => {}, stopPropagation: () => {} });
    expect(writer.get_snare_state(16).url).toBe('O');

    // Press left -> moves back to index 15 in Measure 1
    writer.handleMeasureContainerKeyDown({ key: 'ArrowLeft', preventDefault: () => {}, stopPropagation: () => {} });
    expect(writer.selectedNoteIndex).toBe(15);
  });

  test('stickings row navigation and editing via keyboard shortcuts', () => {
    writer.stickingsShowHide(true, true, true);
    expect(writer.isStickingsVisible()).toBe(true);
    expect(writer.getVisibleInstrumentRows()[0]).toBe('sticking');

    writer.selectedInstrument = 'hh';
    writer.selectedNoteIndex = 0;
    writer.setMeasureContainerSelected(true);

    // Press up to sticking row
    writer.handleMeasureContainerKeyDown({ key: 'ArrowUp', preventDefault: () => {}, stopPropagation: () => {} });
    expect(writer.selectedInstrument).toBe('sticking');
    expect(document.getElementById('sticking0').classList.contains('nav-note-cursor')).toBe(true);

    // Press 'r' -> Right
    writer.handleMeasureContainerKeyDown({ key: 'r', preventDefault: () => {}, stopPropagation: () => {} });
    expect(writer.get_sticking_state(0).url).toBe('R');

    // Press 'l' -> Left
    writer.handleMeasureContainerKeyDown({ key: 'l', preventDefault: () => {}, stopPropagation: () => {} });
    expect(writer.get_sticking_state(0).url).toBe('L');

    // Press 'b' -> Both
    writer.handleMeasureContainerKeyDown({ key: 'b', preventDefault: () => {}, stopPropagation: () => {} });
    expect(writer.get_sticking_state(0).url).toBe('b');

    // Press 'c' -> Count
    writer.handleMeasureContainerKeyDown({ key: 'c', preventDefault: () => {}, stopPropagation: () => {} });
    expect(writer.get_sticking_state(0).url).toBe('c');

    // Press Backspace -> clears sticking
    writer.handleMeasureContainerKeyDown({ key: 'Backspace', preventDefault: () => {}, stopPropagation: () => {} });
    expect(writer.get_sticking_state(0).abc).toBe(false);
  });

  test('tom rows editing via keyboard shortcuts and clearing', () => {
    writer.showHideToms(true, true, true);
    writer.selectedInstrument = 'tom1';
    writer.selectedNoteIndex = 2;
    writer.setMeasureContainerSelected(true);

    writer.handleMeasureContainerKeyDown({ key: 'o', preventDefault: () => {}, stopPropagation: () => {} });
    expect(writer.get_tom_state(2, 1).url).toBe('o');

    writer.handleMeasureContainerKeyDown({ key: 'Delete', preventDefault: () => {}, stopPropagation: () => {} });
    expect(writer.get_tom_state(2, 1).abc).toBe(false);

    writer.selectedInstrument = 'tom4';
    writer.handleMeasureContainerKeyDown({ key: 'x', preventDefault: () => {}, stopPropagation: () => {} });
    expect(writer.get_tom_state(2, 4).url).toBe('o');

    writer.handleMeasureContainerKeyDown({ key: 'Backspace', preventDefault: () => {}, stopPropagation: () => {} });
    expect(writer.get_tom_state(2, 4).abc).toBe(false);
  });

  test('escape key deactivates key interception while keeping highlights visible', () => {
    writer.selectedInstrument = 'snare';
    writer.selectedNoteIndex = 2;
    writer.setMeasureContainerSelected(true);
    expect(writer.isMeasureContainerActive).toBe(true);

    writer.handleMeasureContainerKeyDown({ key: 'Escape', preventDefault: () => {}, stopPropagation: () => {} });
    expect(writer.isMeasureContainerActive).toBe(false);
    expect(document.getElementById('measureContainer').classList.contains('nav-active')).toBe(false);
    expect(document.getElementById('snare2').classList.contains('nav-note-cursor')).toBe(true);
  });

  test('boundary clamping on arrow keys', () => {
    writer.selectedInstrument = 'hh';
    writer.selectedNoteIndex = 0;
    writer.setMeasureContainerSelected(true);

    // ArrowLeft at index 0 stays at 0
    writer.handleMeasureContainerKeyDown({ key: 'ArrowLeft', preventDefault: () => {}, stopPropagation: () => {} });
    expect(writer.selectedNoteIndex).toBe(0);

    // ArrowUp at top row stays at top row
    writer.handleMeasureContainerKeyDown({ key: 'ArrowUp', preventDefault: () => {}, stopPropagation: () => {} });
    expect(writer.selectedInstrument).toBe('hh');

    // Move to end of measure (index 15)
    for (let i = 0; i < 20; i++) {
      writer.handleMeasureContainerKeyDown({ key: 'ArrowRight', preventDefault: () => {}, stopPropagation: () => {} });
    }
    expect(writer.selectedNoteIndex).toBe(15);

    // Move down to bottom row (kick)
    for (let i = 0; i < 10; i++) {
      writer.handleMeasureContainerKeyDown({ key: 'ArrowDown', preventDefault: () => {}, stopPropagation: () => {} });
    }
    expect(writer.selectedInstrument).toBe('kick');
  });

  test('document mousedown outside and focusin inside inputs deselects measureContainer', () => {
    writer.selectedInstrument = 'snare';
    writer.selectedNoteIndex = 0;
    writer.setMeasureContainerSelected(true);
    expect(writer.isMeasureContainerSelected).toBe(true);

    // Mousedown on body (outside measureContainer)
    document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(writer.isMeasureContainerSelected).toBe(false);
    expect(document.getElementById('measureContainer').classList.contains('nav-active')).toBe(false);

    // Select measureContainer again
    writer.setMeasureContainerSelected(true);
    expect(writer.isMeasureContainerSelected).toBe(true);

    // Focus into an input in embedTool
    const subText = document.getElementById('subText');
    subText.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    expect(writer.isMeasureContainerSelected).toBe(false);
  });

  test('changeDivision clamps selectedNoteIndex and refreshes highlights', () => {
    writer.selectedInstrument = 'snare';
    writer.selectedNoteIndex = 14;
    writer.setMeasureContainerSelected(true);

    writer.changeDivision(8); // Now only 8 notes per measure (0..7)
    expect(grooveUtils.data.notesPerMeasure).toBe(8);
    expect(writer.selectedNoteIndex).toBe(7); // Clamped to 7
    expect(document.getElementById('snare7').classList.contains('nav-note-cursor')).toBe(true);
  });

  test('clicking on any element moves highlight directly to that element', () => {
    writer.setMeasureContainerSelected(false);
    expect(writer.isMeasureContainerSelected).toBe(false);

    // 1. Click on hi-hat note 5
    const hh5 = document.getElementById('hi-hat5');
    hh5.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(writer.isMeasureContainerSelected).toBe(true);
    expect(writer.selectedInstrument).toBe('hh');
    expect(writer.selectedNoteIndex).toBe(5);
    expect(document.getElementById('hi-hat5').classList.contains('nav-note-cursor')).toBe(true);
    expect(document.getElementById('bg-highlight5').classList.contains('nav-col-highlight')).toBe(true);

    // 2. Click on background highlight column 10
    const bg10 = document.getElementById('bg-highlight10');
    bg10.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(writer.selectedNoteIndex).toBe(10);
    expect(document.getElementById('bg-highlight10').classList.contains('nav-col-highlight')).toBe(true);

    // 3. Click on Kick label
    const kickLabel = document.querySelector('#staff-container1 .kick-label');
    kickLabel.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(writer.selectedInstrument).toBe('kick');
    expect(document.getElementById('kick10').classList.contains('nav-note-cursor')).toBe(true);

    // 4. Click on Snare row container
    const snareContainer = document.querySelector('#staff-container1 .snare-container');
    snareContainer.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(writer.selectedInstrument).toBe('snare');
    expect(document.getElementById('snare10').classList.contains('nav-note-cursor')).toBe(true);
  });

  test('audio playback temporarily disables navigation highlighting and restores it when stopped', () => {
    writer.selectedInstrument = 'snare';
    writer.selectedNoteIndex = 4;
    writer.setMeasureContainerSelected(true);
    expect(document.getElementById('snare4').classList.contains('nav-note-cursor')).toBe(true);

    // Start playback
    writer.isAudioPlaying = true;
    writer.clearNavHighlights();
    expect(document.getElementById('snare4').classList.contains('nav-note-cursor')).toBe(false);
    expect(document.getElementById('bg-highlight4').classList.contains('nav-col-highlight')).toBe(false);

    // While playing, updateNavHighlights should do nothing
    writer.updateNavHighlights();
    expect(document.getElementById('snare4').classList.contains('nav-note-cursor')).toBe(false);

    // Stop playback
    writer.isAudioPlaying = false;
    writer.updateNavHighlights();
    expect(document.getElementById('snare4').classList.contains('nav-note-cursor')).toBe(true);
    expect(document.getElementById('bg-highlight4').classList.contains('nav-col-highlight')).toBe(true);
  });
});

describe('LeftHandNav and Embedding Options', () => {
  let grooveUtils, writer;

  const leftNavHtml = `
    <div id="LeftHandNav">
      <span id="divisionButtonContainer">
        <span id="logoInSubdivision" class="left-button-content"><img src="images/GScribe_Logo_lone_g.svg"></span>
        <span class="left-button edit-block" id="timeLabel"></span>
        <span class="left-button subdivision edit-block" id="subdivision_8ths"></span>
        <span class="left-button" id="view-edit-switch"></span>

        <div class="nav-separator"></div>

        <span class="left-button edit-block" id="undoButton"></span>
        <span class="left-button edit-block" id="clearAllNotesButton"></span>
        <span class="left-button edit-block" id="showHideTomsButton"></span>
        <span class="left-button grooveDB_hidden" id="stickingsButton"></span>
        <span class="left-button grooveDB_hidden" id="downloadButton"></span>

        <div class="nav-separator"></div>

        <span class="left-button" id="embeddingOptionsButton"></span>
      </span>
    </div>
    <div id="embedTool" style="display: none;"></div>
    <div class="noteContextMenu">
      <ul id="stickingsContextMenu" class="list"></ul>
      <ul id="downloadContextMenu" class="list"></ul>
    </div>
  `;

  beforeEach(() => {
    jest.resetModules();
    require('../js/groove_utils.js');
    require('../js/groove_writer.js');
    grooveUtils = new GrooveUtils(true);
    writer = new GrooveWriter(grooveUtils);
    document.body.innerHTML = leftNavHtml;
  });

  test('toggleEmbedTool toggles embedTool visibility and embeddingOptionsButton selected state', () => {
    const embedTool = document.getElementById('embedTool');
    const embedBtn = document.getElementById('embeddingOptionsButton');

    expect(embedTool.style.display).toBe('none');
    expect(embedBtn.classList.contains('buttonSelected')).toBe(false);

    // First toggle -> shows embedTool
    writer.toggleEmbedTool();
    expect(embedTool.style.display).toBe('block');
    expect(embedBtn.classList.contains('buttonSelected')).toBe(true);

    // Second toggle -> hides embedTool
    writer.toggleEmbedTool();
    expect(embedTool.style.display).toBe('none');
    expect(embedBtn.classList.contains('buttonSelected')).toBe(false);
  });

  test('showHideEmbedTool alias functions identically to toggleEmbedTool', () => {
    const embedTool = document.getElementById('embedTool');
    expect(embedTool.style.display).toBe('none');

    writer.showHideEmbedTool();
    expect(embedTool.style.display).toBe('block');

    writer.showHideEmbedTool();
    expect(embedTool.style.display).toBe('none');
  });

  test('showMenuRightOfAnchor positions menu to the right of anchor and opens context menu', () => {
    const anchor = document.getElementById('stickingsButton');
    const menu = document.getElementById('stickingsContextMenu');

    anchor.getBoundingClientRect = jest.fn(() => ({
      top: 150,
      bottom: 198,
      left: 0,
      right: 70,
      width: 70,
      height: 48
    }));

    writer.showMenuRightOfAnchor('stickingsContextMenu', 'stickingsButton');
    expect(menu.style.top).toBe('150px');
    expect(menu.style.left).toBe('72px');
    expect(grooveUtils.visible_context_menu).toBe(menu);
  });

  test('stickingsAnchorClick and DownloadAnchorClick open menus to the right of their sidebar buttons', () => {
    const stickingsBtn = document.getElementById('stickingsButton');
    stickingsBtn.getBoundingClientRect = jest.fn(() => ({ top: 200, bottom: 248, left: 0, right: 70, width: 70, height: 48 }));

    writer.stickingsAnchorClick();
    expect(document.getElementById('stickingsContextMenu').style.top).toBe('200px');
    expect(document.getElementById('stickingsContextMenu').style.left).toBe('72px');

    const downloadBtn = document.getElementById('downloadButton');
    downloadBtn.getBoundingClientRect = jest.fn(() => ({ top: 250, bottom: 298, left: 0, right: 70, width: 70, height: 48 }));

    writer.DownloadAnchorClick();
    expect(document.getElementById('downloadContextMenu').style.top).toBe('250px');
    expect(document.getElementById('downloadContextMenu').style.left).toBe('72px');
  });

  test('Undo restores notes after clearAllNotes', () => {
    const url = 'TimeSig=4/4&Div=8&Tempo=80&H=|xxxxxxxx|&H2=|r-r-r-r-|&T1=|--o-----|&T4=|------o-|&S=|--o---o-|&K=|o---o---|';
    grooveUtils.data.fromUrl(url);
    document.body.innerHTML = `
      <div id="measureContainer">${writer.HTMLforStaffContainer(1, 0)}</div>
      <div id="musicalInput"></div>
      <div id="tuneTitle"></div>
      <div id="tuneAuthor"></div>
      <div id="tuneComments"></div>
      <input id="ABCsource" type="text" value="" />
      <div id="diverr"></div>
      <div id="svgTarget"></div>
    `;
    writer.applyMeasuresToUI();
    writer.displayNewSVG = jest.fn();

    // Seed the undo stack with initial state
    writer.updateCurrentURL();

    // Initial state: notes are present
    expect(writer.is_hh_on(0)).toBe(true);
    expect(writer.is_hh2_on(0)).toBe(true);
    expect(writer.is_tom_on(2, 1)).toBe(true);
    expect(writer.is_tom_on(6, 4)).toBe(true);
    expect(writer.is_snare_on(2)).toBe(true);
    expect(writer.is_kick_on(0)).toBe(true);

    // Clear all notes
    writer.clearAllNotes();

    // All notes should be off
    expect(writer.is_hh_on(0)).toBe(false);
    expect(writer.is_hh2_on(0)).toBe(false);
    expect(writer.is_tom_on(2, 1)).toBe(false);
    expect(writer.is_tom_on(6, 4)).toBe(false);
    expect(writer.is_snare_on(2)).toBe(false);
    expect(writer.is_kick_on(0)).toBe(false);

    // Perform Undo
    writer.undoCommand();

    // Notes should be restored
    expect(writer.is_hh_on(0)).toBe(true);
    expect(writer.is_hh2_on(0)).toBe(true);
    expect(writer.is_tom_on(2, 1)).toBe(true);
    expect(writer.is_tom_on(6, 4)).toBe(true);
    expect(writer.is_snare_on(2)).toBe(true);
    expect(writer.is_kick_on(0)).toBe(true);
  });

  test('showLegend checkbox modifies ABC to include legend at the top', () => {
    document.body.innerHTML = `
      <input type="checkbox" id="showLegend" />
      <div id="measureContainer">${writer.HTMLforStaffContainer(1, 0)}</div>
      <div id="musicalInput"></div>
      <div id="tuneTitle"></div>
      <div id="tuneAuthor"></div>
      <div id="tuneComments"></div>
      <input id="ABCsource" type="text" value="" />
      <div id="diverr"></div>
      <div id="svgTarget"></div>
    `;
    writer.applyMeasuresToUI();
    writer.displayNewSVG = jest.fn();

    const legendCheckbox = document.getElementById('showLegend');
    expect(writer.isLegendVisible()).toBe(false);
    expect(writer.generate_ABC(600)).not.toContain('%%staves (Stickings Hands Feet)');
    expect(writer.generate_ABC(600)).not.toContain('"^Hi-Hat"');

    // Check the box
    legendCheckbox.checked = true;
    expect(writer.isLegendVisible()).toBe(true);

    // generate_ABC should now include the legend header
    const abcWithLegend = writer.generate_ABC(600);
    expect(abcWithLegend).toContain('%%staves (Stickings Hands Feet)');
    expect(abcWithLegend).toContain('"^Hi-Hat"^g8 "^Open"!open!^g8');
    expect(abcWithLegend).toContain('"^Snare"c8');
    expect(abcWithLegend).toContain('"^Kick"F8');

    // updateSheetMusic updates grooveUtils.isLegendVisible and data.showLegend
    writer.updateSheetMusic();
    expect(grooveUtils.isLegendVisible).toBe(true);
    expect(writer.data.showLegend).toBe(true);
    expect(document.getElementById('ABCsource').value).toContain('"^Hi-Hat"');

    // Uncheck the box
    legendCheckbox.checked = false;
    writer.updateSheetMusic();
    expect(grooveUtils.isLegendVisible).toBe(false);
    expect(writer.data.showLegend).toBe(false);
    expect(document.getElementById('ABCsource').value).not.toContain('"^Hi-Hat"');
  });

  test('set_Default_notes restores showLegend checkbox state from URL', () => {
    document.body.innerHTML = `
      <input type="checkbox" id="showLegend" />
      <div id="measureContainer"></div>
      <div id="musicalInput"></div>
      <input id="tuneTitle" type="text" value="" />
      <input id="tuneAuthor" type="text" value="" />
      <input id="tuneComments" type="text" value="" />
      <input id="ABCsource" type="text" value="" />
      <div id="diverr"></div>
      <div id="svgTarget"></div>
    `;
    writer.displayNewSVG = jest.fn();

    writer.set_Default_notes('TimeSig=4/4&Div=8&Legend=1&H=|xxxxxxxx|&S=|--o---o-|&K=|o---o---|');
    expect(document.getElementById('showLegend').checked).toBe(true);
    expect(writer.data.showLegend).toBe(true);
    expect(grooveUtils.isLegendVisible).toBe(true);
    expect(document.getElementById('ABCsource').value).toContain('"^Hi-Hat"');

    writer.set_Default_notes('TimeSig=4/4&Div=8&H=|xxxxxxxx|&S=|--o---o-|&K=|o---o---|');
    expect(document.getElementById('showLegend').checked).toBe(false);
    expect(writer.data.showLegend).toBe(false);
    expect(grooveUtils.isLegendVisible).toBe(false);
    expect(document.getElementById('ABCsource').value).not.toContain('"^Hi-Hat"');
  });

  test('title, author, and comments sync from input elements into ABC sheet music', () => {
    document.body.innerHTML = `
      <div id="measureContainer">${writer.HTMLforStaffContainer(1, 0)}</div>
      <div id="musicalInput"></div>
      <input id="tuneTitle" type="text" value="Funky Drummer" />
      <input id="tuneAuthor" type="text" value="Clyde Stubblefield" />
      <input id="tuneComments" type="text" value="Count in 1 measure" />
      <textarea id="ABCsource"></textarea>
      <div id="diverr"></div>
      <div id="svgTarget"></div>
    `;
    writer.applyMeasuresToUI();
    writer.displayNewSVG = jest.fn();

    writer.refresh_ABC();

    expect(writer.data.title).toBe('Funky Drummer');
    expect(writer.data.author).toBe('Clyde Stubblefield');
    expect(writer.data.comments).toBe('Count in 1 measure');

    expect(document.getElementById('ABCsource').value).toContain('T: Funky Drummer\n');
    expect(document.getElementById('ABCsource').value).toContain('C: Clyde Stubblefield\n');
    expect(document.getElementById('ABCsource').value).toContain('P: Count in 1 measure\n');
  });

  test('showTempo checkbox displays ABC tempo notation and syncs with tempo changes', () => {
    document.body.innerHTML = `
      <input type="checkbox" id="showTempo" />
      <div id="measureContainer">${writer.HTMLforStaffContainer(1, 0)}</div>
      <div id="musicalInput"></div>
      <input id="tuneTitle" type="text" value="" />
      <input id="tuneAuthor" type="text" value="" />
      <input id="tuneComments" type="text" value="" />
      <textarea id="ABCsource"></textarea>
      <div id="diverr"></div>
      <div id="svgTarget"></div>
    `;
    writer.applyMeasuresToUI();
    writer.displayNewSVG = jest.fn();

    const showTempoCheckbox = document.getElementById('showTempo');
    expect(writer.isShowTempoChecked()).toBe(false);
    expect(writer.generate_ABC(600)).not.toContain('Q:');

    // Check showTempo
    showTempoCheckbox.checked = true;
    writer.refresh_ABC();
    expect(writer.data.showTempo).toBe(true);

    // Initial tempo is 80 -> Q: 1/4=80
    expect(writer.generate_ABC(600)).toContain('Q: 1/4=80\n');
    expect(document.getElementById('ABCsource').value).toContain('Q: 1/4=80\n');

    // Change tempo via tempoChangeCallback
    writer.tempoChangeCallback(112);
    expect(writer.data.tempo).toBe(112);
    expect(writer.generate_ABC(600)).toContain('Q: 1/4=112\n');
    expect(document.getElementById('ABCsource').value).toContain('Q: 1/4=112\n');

    // Uncheck showTempo
    showTempoCheckbox.checked = false;
    writer.refresh_ABC();
    expect(writer.data.showTempo).toBe(false);
    expect(writer.generate_ABC(600)).not.toContain('Q:');
  });

  test('set_Default_notes restores showTempo state from URL', () => {
    document.body.innerHTML = `
      <input type="checkbox" id="showTempo" />
      <div id="measureContainer"></div>
      <div id="musicalInput"></div>
      <input id="tuneTitle" type="text" value="" />
      <input id="tuneAuthor" type="text" value="" />
      <input id="tuneComments" type="text" value="" />
      <textarea id="ABCsource"></textarea>
      <div id="diverr"></div>
      <div id="svgTarget"></div>
    `;
    writer.displayNewSVG = jest.fn();

    writer.set_Default_notes('TimeSig=4/4&Div=8&Tempo=125&ShowTempo=1&H=|xxxxxxxx|&S=|--o---o-|&K=|o---o---|');
    expect(document.getElementById('showTempo').checked).toBe(true);
    expect(writer.data.showTempo).toBe(true);
    expect(document.getElementById('ABCsource').value).toContain('Q: 1/4=125\n');
  });

  test('sheetMusicTextFields is displayed with flex in edit mode and contains title, author, comments, showTempo', () => {
    document.body.innerHTML = `
      <div id="sheetMusicTextFields" class="fullWidthEle edit-block">
        <span class="sheetMusicTextField"><b>Title:</b> <input class="sheetMusicInputField" id="tuneTitle" type="text"></span>
        <span class="sheetMusicTextField"><b>Author:</b> <input class="sheetMusicInputField" id="tuneAuthor" type="text"></span>
        <span class="sheetMusicTextField"><b>Comment:</b> <input class="sheetMusicInputField" id="tuneComments" type="text"></span>
        <span id='TempoButton'><input type="checkbox" class="hiddenCheckbox" id="showTempo"></span>
      </div>
      <div id="musicalInput" class="fullWidthEle edit-block">
        <div id="measureContainer"></div>
      </div>
      <textarea id="ABCsource"></textarea>
      <div id="svgTarget"></div>
      <div id="diverr"></div>
    `;
    writer.displayNewSVG = jest.fn();
    writer.set_Default_notes('Mode=edit&TimeSig=4/4&Div=8&Title=MySong&Author=Drummer&Comments=Practice&ShowTempo=1&H=|xxxxxxxx|');

    const fields = document.getElementById('sheetMusicTextFields');
    expect(fields).not.toBeNull();
    expect(fields.style.display).not.toBe('none');
    expect(document.getElementById('tuneTitle').value).toBe('MySong');
    expect(document.getElementById('tuneAuthor').value).toBe('Drummer');
    expect(document.getElementById('tuneComments').value).toBe('Practice');
    expect(document.getElementById('showTempo').checked).toBe(true);
  });

  test('set_Default_notes loads H2 and Tom notes and preserves them in URL round-trip', () => {
    document.body.innerHTML = '<div id="measureContainer">' + writer.HTMLforStaffContainer(1, 0) + '</div>';
    writer.set_Default_notes('TimeSig=4/4&Div=8&Tempo=80&H=|xxxxxxxx|&H2=|r-------|&T1=|--o-----|&T4=|------o-|&S=|--o---o-|&K=|o---o---|');
    expect(writer.is_hh2_on(0)).toBe(true);
    expect(writer.get_hh2_state(0).url).toBe('r');
    expect(writer.is_tom_on(2, 1)).toBe(true);
    expect(writer.is_tom_on(6, 4)).toBe(true);
    expect(writer.get_FullURLForPage()).toContain('H2=|r-------|');
    expect(writer.get_FullURLForPage()).toContain('T1=|--o-----|');
    expect(writer.get_FullURLForPage()).toContain('T4=|------o-|');

    // Simulate page reload
    const reloadedWriter = new GrooveWriter(new GrooveUtils(true));
    reloadedWriter.set_Default_notes(writer.get_FullURLForPage());
    expect(reloadedWriter.is_hh2_on(0)).toBe(true);
    expect(reloadedWriter.get_hh2_state(0).url).toBe('r');
    expect(reloadedWriter.is_tom_on(2, 1)).toBe(true);
    expect(reloadedWriter.is_tom_on(6, 4)).toBe(true);
  });
});


describe('Notion Embedding Options Measure Table', () => {
  let embed;
  beforeAll(() => {
    require('../js/groove_utils.js');
    embed = require('../js/groove_writer.js');
  });

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="measureContainer"></div>
      <div id="musicalInput"></div>
      <input type="text" id="tuneTitle" value="" />
      <input type="text" id="tuneAuthor" value="" />
      <input type="text" id="tuneComments" value="" />
      <textarea id="ABCsource"></textarea>
      <div id="svgTarget"></div>
      <div id="diverr"></div>
      <div id="embedTool">
        <input type="checkbox" id="showTempo" />
        <input type="checkbox" id="embedShowTempo" />
        <input type="text" id="subText" value="" />
        <div class="embedTableContainer">
          <table id="embedMeasureTable">
            <tbody id="embedMeasureTableBody"></tbody>
          </table>
        </div>
        <input type="hidden" id="repeatBegins" />
        <input type="hidden" id="repeatEnds" />
        <input type="hidden" id="repeatEndings" />
        <input type="hidden" id="measureText" />
        <input type="text" id="convertedUrl" value="" />
        <span id="status"></span>
      </div>
    `;
    writer = new GrooveWriter(new GrooveUtils(true));
    writer.displayNewSVG = jest.fn();
    writer.myGrooveUtils.midiNoteHasChanged = jest.fn();
    window.myGrooveWriter = writer;
    global.myGrooveWriter = writer;
  });

  test('renderEmbedMeasureTable creates expected table rows with checkboxes, dropdowns, and inputs', () => {
    embed.renderEmbedMeasureTable(3);
    const tbody = document.getElementById('embedMeasureTableBody');
    const rows = tbody.querySelectorAll('tr');
    expect(rows.length).toBe(3);

    rows.forEach((row, i) => {
      const m = i + 1;
      expect(row.getAttribute('data-measure')).toBe(String(m));
      expect(row.querySelector('td:first-child').textContent).toBe(`Measure ${m}`);

      const startCb = row.querySelector('.embed-repeat-start');
      expect(startCb).not.toBeNull();
      expect(startCb.type).toBe('checkbox');

      const endCb = row.querySelector('.embed-repeat-end');
      expect(endCb).not.toBeNull();
      expect(endCb.type).toBe('checkbox');

      const altSel = row.querySelector('.embed-alt-ending');
      expect(altSel).not.toBeNull();
      const options = Array.from(altSel.options).map(o => o.value);
      expect(options).toEqual(['', '1', '2', '3', '4']);

      const txtBegin = row.querySelector('.embed-text-begin');
      expect(txtBegin).not.toBeNull();

      const txtEnd = row.querySelector('.embed-text-end');
      expect(txtEnd).not.toBeNull();
    });
  });

  test('embed link generates backward-compatible URL parameters from table data', () => {
    document.getElementById('measureContainer').innerHTML = writer.HTMLforStaffContainer(1, 0);
    writer.set_Default_notes('TimeSig=4/4&Div=8&Tempo=80&H=|xxxxxxxx|');
    writer.showHideToms(true, true, true);
    writer.set_hh2_state(0, 'crash', false);
    writer.set_tom_state(2, 1, 'normal', false);
    writer.set_tom_state(6, 4, 'normal', false);
    writer.syncUIToMeasures();

    embed.renderEmbedMeasureTable(3);
    const tbody = document.getElementById('embedMeasureTableBody');
    const rows = tbody.querySelectorAll('tr');

    // Row 1: Repeat Start, Text Begin = "Intro"
    rows[0].querySelector('.embed-repeat-start').checked = true;
    rows[0].querySelector('.embed-text-begin').value = 'Intro';

    // Row 2: Repeat End, Alternate Ending = "1"
    rows[1].querySelector('.embed-repeat-end').checked = true;
    rows[1].querySelector('.embed-alt-ending').value = '1';

    // Row 3: Repeat End, Alternate Ending = "2", Text End = "Fill"
    rows[2].querySelector('.embed-repeat-end').checked = true;
    rows[2].querySelector('.embed-alt-ending').value = '2';
    rows[2].querySelector('.embed-text-end').value = 'Fill';

    document.getElementById('subText').value = 'Main Verse';
    document.getElementById('showTempo').checked = true;

    writer.updateSheetMusic();

    const convertedUrl = document.getElementById('convertedUrl').value;
    expect(convertedUrl).toContain('https://sonpham.me/GrooveScribe/render.html');
    expect(convertedUrl).toContain('ShowTempo=1');
    expect(convertedUrl).not.toContain('EmbedTempoTimeSig');
    expect(convertedUrl).toContain('Comments=Main%20Verse');
    expect(convertedUrl).not.toContain('subText=');
    expect(convertedUrl).toContain('&RepeatBegins=1');
    expect(convertedUrl).toContain('&RepeatEnds=2;3');
    expect(convertedUrl).toContain('&RepeatEndings=2:1;3:2');
    expect(convertedUrl).toContain('&MeasureText=1:b:Intro;3:e:Fill');
    expect(convertedUrl).toContain('H2=|c-------|');
    expect(convertedUrl).toContain('T1=|--o-----|');
    expect(convertedUrl).toContain('T4=|------o-|');
  });

  test('table changes update myGrooveWriter ABC and sheet music', () => {
    window.myGrooveWriter = writer;
    global.myGrooveWriter = writer;
    writer.displayNewSVG = jest.fn();
    writer.myGrooveUtils.midiNoteHasChanged = jest.fn();

    writer.set_Default_notes('TimeSig=4/4&Div=8&H=|xxxxxxxx|xxxxxxxx|&S=|--o---o-|--o---o-|&K=|o---o---|o---o---|');
    embed.renderEmbedMeasureTable(2);

    const tbody = document.getElementById('embedMeasureTableBody');
    const rows = tbody.querySelectorAll('tr');

    // Enable repeat start on measure 1, repeat end on measure 2, and add intro text
    rows[0].querySelector('.embed-repeat-start').checked = true;
    rows[0].querySelector('.embed-text-begin').value = 'Verse';
    rows[1].querySelector('.embed-repeat-end').checked = true;

    writer.updateSheetMusic();

    // Verify writer.data was updated
    expect(writer.data.repeatBegins.has(1)).toBe(true);
    expect(writer.data.repeatEnds.has(2)).toBe(true);
    expect(writer.data.measureText.get(1)).toEqual({ begin: 'Verse' });

    // Verify ABC source contains repeat signs and measure text
    const abcSource = document.getElementById('ABCsource').value;
    expect(abcSource).toContain('|:');
    expect(abcSource).toContain(':|');
    expect(abcSource).toContain('"Verse"');
  });

  test('copyEmbedLink copies URL to clipboard and selects convertedUrl input', () => {
    embed.renderEmbedMeasureTable(2);
    const convertedUrlInput = document.getElementById('convertedUrl');
    convertedUrlInput.select = jest.fn();

    writer.copyEmbedLink();
    expect(convertedUrlInput.select).toHaveBeenCalledTimes(1);
    expect(convertedUrlInput.value).toContain('https://sonpham.me/GrooveScribe/render.html');
  });

  test('decodeConvertedUrl restores table state from embed URL', () => {
    const testUrl = 'https://sonpham.me/GrooveScribe/render.html?TimeSig=4/4&EmbedTempoTimeSig=true&subText=Chorus&RepeatBegins=1;3&RepeatEnds=2;4&RepeatEndings=2:1;4:2&MeasureText=1:b:Start;4:e:Outro';
    document.getElementById('convertedUrl').value = testUrl;

    embed.decodeConvertedUrl();

    expect(document.getElementById('showTempo').checked).toBe(true);
    expect(document.getElementById('subText').value).toBe('Chorus');

    const tbody = document.getElementById('embedMeasureTableBody');
    const rows = tbody.querySelectorAll('tr');
    expect(rows.length).toBe(4);

    // Measure 1
    expect(rows[0].querySelector('.embed-repeat-start').checked).toBe(true);
    expect(rows[0].querySelector('.embed-repeat-end').checked).toBe(false);
    expect(rows[0].querySelector('.embed-alt-ending').value).toBe('');
    expect(rows[0].querySelector('.embed-text-begin').value).toBe('Start');
    expect(rows[0].querySelector('.embed-text-end').value).toBe('');

    // Measure 2
    expect(rows[1].querySelector('.embed-repeat-start').checked).toBe(false);
    expect(rows[1].querySelector('.embed-repeat-end').checked).toBe(true);
    expect(rows[1].querySelector('.embed-alt-ending').value).toBe('1');

    // Measure 3
    expect(rows[2].querySelector('.embed-repeat-start').checked).toBe(true);
    expect(rows[2].querySelector('.embed-repeat-end').checked).toBe(false);

    // Measure 4
    expect(rows[3].querySelector('.embed-repeat-start').checked).toBe(false);
    expect(rows[3].querySelector('.embed-repeat-end').checked).toBe(true);
    expect(rows[3].querySelector('.embed-alt-ending').value).toBe('2');
    expect(rows[3].querySelector('.embed-text-end').value).toBe('Outro');
  });

  test('populateFromUrl populates embed form directly from search/query string', () => {
    const query = '?subText=Bridge+Groove&RepeatBegins=1&RepeatEnds=2&RepeatEndings=2:1&MeasureText=1:b:Soft;2:e:Loud&EmbedTempoTimeSig=true';
    embed.populateFromUrl(query);

    expect(document.getElementById('subText').value).toBe('Bridge Groove');
    expect(document.getElementById('showTempo').checked).toBe(true);

    const tbody = document.getElementById('embedMeasureTableBody');
    const rows = tbody.querySelectorAll('tr');
    expect(rows.length).toBe(2);
    expect(rows[0].querySelector('.embed-repeat-start').checked).toBe(true);
    expect(rows[0].querySelector('.embed-text-begin').value).toBe('Soft');
    expect(rows[1].querySelector('.embed-repeat-end').checked).toBe(true);
    expect(rows[1].querySelector('.embed-alt-ending').value).toBe('1');
    expect(rows[1].querySelector('.embed-text-end').value).toBe('Loud');
  });

  test('set_Default_notes populates embedding form when loading groove URL with Notion parameters', () => {
    window.populateFromUrl = embed.populateFromUrl;
    window.myGrooveWriter = writer;

    const fullUrl = 'TimeSig=4/4&Div=8&H=|xxxxxxxx|&S=|--o---o-|&K=|o---o---|&subText=Pre-Chorus&RepeatBegins=1&RepeatEnds=1&MeasureText=1:b:Intro';
    writer.set_Default_notes(fullUrl);

    expect(document.getElementById('subText').value).toBe('Pre-Chorus');
    const tbody = document.getElementById('embedMeasureTableBody');
    const rows = tbody.querySelectorAll('tr');
    expect(rows.length).toBe(1);
    expect(rows[0].querySelector('.embed-repeat-start').checked).toBe(true);
    expect(rows[0].querySelector('.embed-repeat-end').checked).toBe(true);
    expect(rows[0].querySelector('.embed-text-begin').value).toBe('Intro');
  });

  test('addMeasureButtonClick and closeMeasureButtonClick update measures and embed table rows', () => {
    document.body.innerHTML = `
      <div id="measureContainer"></div>
      <div id="musicalInput"></div>
      <div id="tuneTitle"></div>
      <div id="tuneAuthor"></div>
      <div id="tuneComments"></div>
      <input id="ABCsource" type="text" value="" />
      <div id="diverr"></div>
      <div id="svgTarget"></div>
      <div id="embedTool">
        <input type="checkbox" id="showTempo" />
        <input type="checkbox" id="embedShowTempo" />
        <input type="text" id="subText" value="" />
        <div class="embedTableContainer">
          <table id="embedMeasureTable">
            <tbody id="embedMeasureTableBody"></tbody>
          </table>
        </div>
        <input type="hidden" id="repeatBegins" />
        <input type="hidden" id="repeatEnds" />
        <input type="hidden" id="repeatEndings" />
        <input type="hidden" id="measureText" />
        <input type="text" id="convertedUrl" value="" />
        <span id="status"></span>
      </div>
    `;

    writer.set_Default_notes('TimeSig=4/4&Div=8&H=|xxxxxxxx|&S=|--o---o-|&K=|o---o---|');
    writer.displayNewSVG = jest.fn();

    // Initial state: 1 measure
    expect(writer.data.numberOfMeasures).toBe(1);
    expect(document.querySelectorAll('#embedMeasureTableBody tr').length).toBe(1);

    // Click "Add measure"
    writer.addMeasureButtonClick();

    expect(writer.data.numberOfMeasures).toBe(2);
    expect(document.getElementById('staff-container1')).not.toBeNull();
    expect(document.getElementById('staff-container2')).not.toBeNull();
    expect(document.querySelectorAll('#embedMeasureTableBody tr').length).toBe(2);

    // Set some options in Measure 1 table row
    const tbody = document.getElementById('embedMeasureTableBody');
    tbody.querySelector('tr[data-measure="1"] .embed-repeat-start').checked = true;
    tbody.querySelector('tr[data-measure="1"] .embed-text-begin').value = 'Verse';

    // Add another measure -> 3 measures
    writer.addMeasureButtonClick();
    expect(writer.data.numberOfMeasures).toBe(3);
    expect(document.querySelectorAll('#embedMeasureTableBody tr').length).toBe(3);
    // Measure 1 row content preserved
    expect(document.querySelector('tr[data-measure="1"] .embed-repeat-start').checked).toBe(true);
    expect(document.querySelector('tr[data-measure="1"] .embed-text-begin').value).toBe('Verse');

    // Remove measure 3 -> 2 measures
    writer.closeMeasureButtonClick(3);
    expect(writer.data.numberOfMeasures).toBe(2);
    expect(document.querySelectorAll('#embedMeasureTableBody tr').length).toBe(2);
    expect(document.getElementById('staff-container3')).toBeNull();
    expect(document.querySelector('tr[data-measure="3"]')).toBeNull();

    // Remove measure 2 -> 1 measure
    writer.closeMeasureButtonClick(2);
    expect(writer.data.numberOfMeasures).toBe(1);
    expect(document.querySelectorAll('#embedMeasureTableBody tr').length).toBe(1);
    expect(document.getElementById('staff-container2')).toBeNull();
    expect(document.querySelector('tr[data-measure="1"] .embed-repeat-start').checked).toBe(true);
  });

  test('toggleEmbedTool populates 1 row when 1 measure exists on page load', () => {
    document.body.innerHTML = `
      <div id="embeddingOptionsButton"></div>
      <div id="embedTool" style="display: none;">
        <table id="embedMeasureTable">
          <tbody id="embedMeasureTableBody"></tbody>
        </table>
      </div>
      <div id="measureContainer"></div>
    `;
    writer.set_Default_notes('TimeSig=4/4&Div=8&H=|xxxxxxxx|');
    expect(writer.data.numberOfMeasures).toBe(1);

    // Toggle embed tool open
    writer.toggleEmbedTool();
    expect(document.getElementById('embedTool').style.display).toBe('block');
    expect(document.querySelectorAll('#embedMeasureTableBody tr').length).toBe(1);
    expect(document.querySelector('#embedMeasureTableBody tr td').textContent).toContain('Measure 1');

    // Add measure updates embed table to 2 rows
    writer.addMeasureButtonClick();
    expect(writer.data.numberOfMeasures).toBe(2);
    expect(document.querySelectorAll('#embedMeasureTableBody tr').length).toBe(2);
  });

  test('set_Default_notes populates default groove when loading URL with empty measures', () => {
    document.body.innerHTML = `
      <div id="measureContainer"></div>
      <div id="musicalInput"></div>
    `;
    const emptyMultiMeasureUrl = 'Mode=edit&TimeSig=4/4&Div=8&Comments=comments&Tempo=86&ShowTempo=1&RepeatBegins=1&RepeatEnds=1;2&RepeatEndings=2:1&MeasureText=1:e:end&H=|--------|--------|--------|&S=|--------|--------|--------|&K=|--------|--------|--------|';
    writer.set_Default_notes(emptyMultiMeasureUrl);
    expect(writer.data.numberOfMeasures).toBe(3);
    for (let m = 0; m < 3; m++) {
      expect(writer.data.measures[m].toString(DrumType.HIHAT)).toBe('xxxxxxxx');
      expect(writer.data.measures[m].toString(DrumType.KICK)).toBe('o---o---');
      expect(writer.data.measures[m].toString(DrumType.SNARE)).toBe('--O---O-');
    }
  });
});