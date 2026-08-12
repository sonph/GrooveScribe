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