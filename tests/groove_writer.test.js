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
    expect(writer.get_sticking_state(0).abc).toBe('"R"x');
  });

  test('set_sticking_state("left") sets sticking to L', () => {
    writer.set_sticking_state(0, 'left');
    expect(writer.get_sticking_state(0).abc).toBe('"L"x');
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

  test('getDrumState reads any drum uniformly', () => {
    writer.set_kick_state(0, 'normal');
    expect(writer.getDrumState(0, DrumType.KICK)).toEqual({ abc: 'F', url: 'o' });

    writer.set_sticking_state(0, 'right');
    expect(writer.getDrumState(0, DrumType.STICKINGS)).toEqual({ abc: '"R"x', url: 'R' });

    writer.set_snare_state(0, 'accent');
    expect(writer.getDrumState(0, DrumType.SNARE)).toEqual({ abc: '!accent!c', url: 'O' });
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
});