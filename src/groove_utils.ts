/*jslint browser:true devel:true */
/*global Abc, MIDI, Midi */

declare var MIDI: any;
declare var Midi: any;
declare var Abc: any;
declare var Pablo: any;
declare var ShareButton: any;

var global_midiInitialized = false;

// global constants
var constant_MAX_MEASURES = 10;
var constant_DEFAULT_TEMPO = 80;
var constant_NUMBER_OF_TOMS = 4;

var CONSTANT_Midi_play_time_zero = "0:00";

const MIDI_VELOCITY_NORMAL = 85;
const MIDI_VELOCITY_ACCENT = 120;
const MIDI_VELOCITY_GHOST = 50;

const MIDI_METRONOME_1 = 76;
const MIDI_METRONOME_NORMAL = 77;

const MIDI_HIHAT_NORMAL = 42;
const MIDI_HIHAT_OPEN = 46;
const MIDI_HIHAT_ACCENT = 108;
const MIDI_HIHAT_CRASH = 49;
const MIDI_HIHAT_STACKER = 52;
const MIDI_HIHAT_METRONOME_NORMAL = 77;
const MIDI_HIHAT_METRONOME_ACCENT = 76;
const MIDI_HIHAT_RIDE = 51;
const MIDI_HIHAT_RIDE_BELL = 53;
const MIDI_HIHAT_COW_BELL = 105;
const MIDI_HIHAT_FOOT = 44;
const MIDI_SNARE_NORMAL = 38;
const MIDI_SNARE_ACCENT = 22;
const MIDI_SNARE_GHOST = 21;
const MIDI_SNARE_XSTICK = 37;
const MIDI_SNARE_BUZZ = 104;
const MIDI_SNARE_FLAM = 107;
const MIDI_SNARE_DRAG = 103;
const MIDI_KICK_NORMAL = 35;
const MIDI_TOM1_NORMAL = 48;
const MIDI_TOM2_NORMAL = 47;
const MIDI_TOM3_NORMAL = 45;
const MIDI_TOM4_NORMAL = 43;

const constant_ABC_STICK_R = '"R"x';
const constant_ABC_STICK_L = '"L"x';
const constant_ABC_STICK_BOTH = '"R/L"x';
const constant_ABC_STICK_COUNT = '"count"x';
const constant_ABC_STICK_OFF = '""x';
const constant_ABC_HH_Ride = "^A'";
const constant_ABC_HH_Ride_Bell = "^B'";
const constant_ABC_HH_Cow_Bell = "^D'";
const constant_ABC_HH_Crash = "^c'";
const constant_ABC_HH_Stacker = "^d'";
const constant_ABC_HH_Metronome_Normal = "^e'";
const constant_ABC_HH_Metronome_Accent = "^f'";
const constant_ABC_HH_Open = "!open!^g";
const constant_ABC_HH_Close = "!plus!^g";
const constant_ABC_HH_Accent = "!accent!^g";
const constant_ABC_HH_Normal = "^g";
const constant_ABC_SN_Ghost = "!(.!!).!c";
const constant_ABC_SN_Accent = "!accent!c";
const constant_ABC_SN_Normal = "c";
const constant_ABC_SN_XStick = "^c";
const constant_ABC_SN_Buzz = "!///!c";
const constant_ABC_SN_Flam = "!accent!{/c}c";
const constant_ABC_SN_Drag = "{/cc}c";
const constant_ABC_KI_SandK = "[F^d,]";
const constant_ABC_KI_Splash = "^d,";
const constant_ABC_KI_Normal = "F";
const constant_ABC_T1_Normal = "e";
const constant_ABC_T2_Normal = "d";
const constant_ABC_T3_Normal = "B";
const constant_ABC_T4_Normal = "A";
const constant_ABC_OFF = false;

// MIDI note lookup for a hi-hat ABC token. Returns null for OFF/unknown.
// midi_output_type "general_MIDI" collapses variants to the normal note + varied velocity;
// "Custom" uses distinct sample IDs for accent/etc.
function hihatMidiFor(abcVal, midi_output_type: string): { note: number; velocity: number } | null {
  switch (abcVal) {
    case constant_ABC_HH_Normal: case constant_ABC_HH_Close:
      return { note: MIDI_HIHAT_NORMAL, velocity: MIDI_VELOCITY_NORMAL };
    case constant_ABC_HH_Accent:
      return midi_output_type == "general_MIDI"
        ? { note: MIDI_HIHAT_NORMAL, velocity: MIDI_VELOCITY_ACCENT }
        : { note: MIDI_HIHAT_ACCENT, velocity: MIDI_VELOCITY_NORMAL };
    case constant_ABC_HH_Open: return { note: MIDI_HIHAT_OPEN, velocity: MIDI_VELOCITY_NORMAL };
    case constant_ABC_HH_Ride: return { note: MIDI_HIHAT_RIDE, velocity: MIDI_VELOCITY_NORMAL };
    case constant_ABC_HH_Ride_Bell: return { note: MIDI_HIHAT_RIDE_BELL, velocity: MIDI_VELOCITY_NORMAL };
    case constant_ABC_HH_Cow_Bell: return { note: MIDI_HIHAT_COW_BELL, velocity: MIDI_VELOCITY_NORMAL };
    case constant_ABC_HH_Crash: return { note: MIDI_HIHAT_CRASH, velocity: MIDI_VELOCITY_NORMAL };
    case constant_ABC_HH_Stacker: return { note: MIDI_HIHAT_STACKER, velocity: MIDI_VELOCITY_NORMAL };
    case constant_ABC_HH_Metronome_Normal: return { note: MIDI_HIHAT_METRONOME_NORMAL, velocity: MIDI_VELOCITY_NORMAL };
    case constant_ABC_HH_Metronome_Accent: return { note: MIDI_HIHAT_METRONOME_ACCENT, velocity: MIDI_VELOCITY_NORMAL };
    default: return null;
  }
}

// MIDI note lookup for a snare ABC token. See hihatMidiFor() for midi_output_type semantics.
function snareMidiFor(abcVal, midi_output_type: string): { note: number; velocity: number } | null {
  const isGM = midi_output_type == "general_MIDI";
  switch (abcVal) {
    case constant_ABC_SN_Normal: return { note: MIDI_SNARE_NORMAL, velocity: MIDI_VELOCITY_NORMAL };
    case constant_ABC_SN_Flam:
      return isGM ? { note: MIDI_SNARE_NORMAL, velocity: MIDI_VELOCITY_ACCENT }
                  : { note: MIDI_SNARE_FLAM, velocity: MIDI_VELOCITY_NORMAL };
    case constant_ABC_SN_Drag:
      return isGM ? { note: MIDI_SNARE_NORMAL, velocity: MIDI_VELOCITY_ACCENT }
                  : { note: MIDI_SNARE_DRAG, velocity: MIDI_VELOCITY_NORMAL };
    case constant_ABC_SN_Accent:
      return isGM ? { note: MIDI_SNARE_NORMAL, velocity: MIDI_VELOCITY_ACCENT }
                  : { note: MIDI_SNARE_ACCENT, velocity: MIDI_VELOCITY_NORMAL };
    case constant_ABC_SN_Ghost:
      return isGM ? { note: MIDI_SNARE_NORMAL, velocity: MIDI_VELOCITY_GHOST }
                  : { note: MIDI_SNARE_GHOST, velocity: MIDI_VELOCITY_GHOST };
    case constant_ABC_SN_XStick: return { note: MIDI_SNARE_XSTICK, velocity: MIDI_VELOCITY_NORMAL };
    case constant_ABC_SN_Buzz: return { note: MIDI_SNARE_BUZZ, velocity: MIDI_VELOCITY_NORMAL };
    default: return null;
  }
}

// MIDI note lookup for a kick ABC token. `kick` is the bass drum, `splash` is the hi-hat foot;
// SandK ("Splash and Kick") plays both simultaneously.
function kickMidiFor(abcVal): { kick: number | null; splash: number | null } {
  switch (abcVal) {
    case constant_ABC_KI_Splash: return { kick: null, splash: MIDI_HIHAT_FOOT };
    case constant_ABC_KI_SandK: return { kick: MIDI_KICK_NORMAL, splash: MIDI_HIHAT_FOOT };
    case constant_ABC_KI_Normal: return { kick: MIDI_KICK_NORMAL, splash: null };
    default: return { kick: null, splash: null };
  }
}

// MIDI note lookup for a tom ABC token. Returns null for OFF/unknown.
// Adjust a base note duration for swing feel. Swing groups notes in 4s
// (1-e-&-a): the 1 and the & get longer, the e and the a get shorter, so
// the pulse becomes 1--e&--a2--e&--a...
function swingAdjustedDuration(
  i: number,
  baseDuration: number,
  swingPercentage: number,
  numNotes: number,
  numNotesForSwing: number,
): number {
  if (swingPercentage === 0) return baseDuration;
  const scaler = numNotes / numNotesForSwing;
  const val = i % (4 * scaler);
  // Positions 0 (the "1") and 2 (the "&") get lengthened; 1 (the "e") and 3
  // (the "a") get shortened by the same amount.
  const lengthen = val < scaler || (val >= scaler * 2 && val < scaler * 3);
  return baseDuration + (lengthen ? 1 : -1) * baseDuration * swingPercentage;
}

// Return the number of notes to subtract from the metronome index so that
// the click lands on the requested subdivision. '1' means no shift.
function metronomeOffsetShift(
  offsetClickStartBeat: string,
  isTriplets: boolean,
  sixteenthNoteFrequency: number,
): number {
  const straightOnly = offsetClickStartBeat === 'E' || offsetClickStartBeat === 'AND' || offsetClickStartBeat === 'A';
  const tripletOnly = offsetClickStartBeat === 'TI' || offsetClickStartBeat === 'TA';
  if (isTriplets && straightOnly) {
    console.log(`OffsetClickStart error: straight offset '${offsetClickStartBeat}' in triplet context`);
  }
  if (!isTriplets && tripletOnly) {
    console.log(`OffsetClickStart error: triplet offset '${offsetClickStartBeat}' in straight context`);
  }
  switch (offsetClickStartBeat) {
    case '1':   return 0;
    case 'E':   return sixteenthNoteFrequency;
    case 'AND': return 2 * sixteenthNoteFrequency;
    case 'A':   return 3 * sixteenthNoteFrequency;
    case 'TI':  return sixteenthNoteFrequency * 2;
    case 'TA':  return 2 * (sixteenthNoteFrequency * 2);
    default:
      console.log(`bad case in metronomeOffsetShift: ${offsetClickStartBeat}`);
      return 0;
  }
}

// Return which metronome sound (if any) should fire at this note index.
// Downbeat 1 is loudest, other beats are normal-volume clicks; extra
// subdivisions (8ths / 16ths) fire only when metronome_frequency asks for them.
function metronomeNoteAt(
  specificIndex: number,
  metronomeFrequency: number,
  isTriplets: boolean,
  timeSig: TimeSignature,
): { note: number; velocity: number } | null {
  if (specificIndex < 0) return null;
  const quarterNoteFrequency = isTriplets ? 12 : 8;
  const eighthNoteFrequency = isTriplets ? 6 : 4;
  const sixteenthNoteFrequency = 2;
  const measureFrequency = quarterNoteFrequency * timeSig.top * (4 / timeSig.bottom.value);

  if (specificIndex === 0 || specificIndex % measureFrequency === 0) {
    return { note: MIDI_METRONOME_1, velocity: MIDI_VELOCITY_ACCENT };
  }
  if (specificIndex % quarterNoteFrequency === 0) {
    return { note: MIDI_METRONOME_NORMAL, velocity: MIDI_VELOCITY_ACCENT };
  }
  if (metronomeFrequency === 8 && specificIndex % eighthNoteFrequency === 0) {
    return { note: MIDI_METRONOME_NORMAL, velocity: MIDI_VELOCITY_ACCENT };
  }
  if (metronomeFrequency === 16 && specificIndex % sixteenthNoteFrequency === 0) {
    return { note: MIDI_METRONOME_NORMAL, velocity: 25 };
  }
  return null;
}

function tomMidiFor(abcVal): number | null {
  switch (abcVal) {
    case constant_ABC_T1_Normal: return MIDI_TOM1_NORMAL;
    case constant_ABC_T2_Normal: return MIDI_TOM2_NORMAL;
    case constant_ABC_T3_Normal: return MIDI_TOM3_NORMAL;
    case constant_ABC_T4_Normal: return MIDI_TOM4_NORMAL;
    default: return null;
  }
}

// make these global so that they are shared among all the GrooveUtils classes invoked
var global_current_midi_start_time: any = 0;
var global_last_midi_update_time: any = 0;
var global_total_midi_play_time_msecs = 0;
var global_total_midi_notes = 0;
var global_total_midi_repeats = 0;

function setOf<T>(...args: T[]): Set<T> {
  return new Set(args);
}

class DrumType {
  name: string;
  // Alternates are other names that can be used to refer to this drum type.
  // This is to support multiple drum types in existing notations.
  alternates: Set<string>;

  static NONE = new DrumType('None');
  static STICKINGS = new DrumType('Stickings');
  static HIHAT = new DrumType('H', setOf('HH'));
  static SNARE = new DrumType('S');
  static KICK = new DrumType('K', setOf('B', 'BD'));
  static TOM1 = new DrumType('T1');
  // static TOM2 = new DrumType('T2');
  // static TOM3 = new DrumType('T3');
  static TOM4 = new DrumType('T4');

  static ALL = setOf(this.STICKINGS, this.HIHAT, this.SNARE, this.KICK, this.TOM1, this.TOM4);
  static ALL_TOMS = setOf(this.TOM1.name, this.TOM4.name);

  constructor(name: string, alternates: Set<string> = setOf()) {
    this.name = name;
    this.alternates = alternates;
  }

  static of(name: string) {
    return new DrumType(name);
  }

  equals(other: DrumType): boolean {
    return this.name === other.name;
  }

  isTom(): boolean {
    return DrumType.ALL_TOMS.has(this.name);
  }

  toString(): string {
    return `DrumType[${this.name}]`;
  }
}


// takes a character from tablature form and converts it to our ABC Notation form.
// uses drum tab format adapted from wikipedia: http://en.wikipedia.org/wiki/Drum_tablature
//
//  Sticking support:
//		R: right
//    L: left
//
//  HiHat support:
//		x: normal
//		X: accent
//		o: open
//		+: close
//		c: crash
//		r: ride
//		b: ride bell
//		m: (more) cow bell
//    s: stacker
//    n: metroNome normal
//    N: metroNome accent
//		-: off
//
//   Snare support:
//		o: normal
//		O: accent
//		g: ghost
//		x: cross stick
//		f: flam
//		-: off
//
//   Kick support:
//		o: normal
//		x: hi hat splash with foot
//		X: kick & hi hat splash with foot simultaneously
//
//  Kick can be notated either with a "K" or a "B"
interface AbcNoteHtmlAttrs {
  html_id_prefix: string | Set<string>;
  iconClass?: string;
}

function noteAttrs(html_id_prefix: string | Set<string>, iconClass?: string): AbcNoteHtmlAttrs {
  return {
    html_id_prefix: html_id_prefix,
    iconClass: iconClass
  };
}

function getAsSet(value: string | Set<string>): Set<string> {
  if (typeof value === 'string') {
    return setOf(value);
  }
  return value;
}

function getFirstElement<T>(set: Set<T>): T | null;
function getFirstElement<T>(e: T): T | null;
function getFirstElement<T>(v: Set<T> | T): T | null {
  if (v instanceof Set) {
    return v.values().next().value || null;
  }
  return v;
}

class AbcNote {
  drumType: DrumType;
  // ABC notation for the note.
  note: string;
  // Set of tab characters that map to this note.
  tabChar: Set<string>;
  // HTML attributes for the note used in rendering.
  htmlAttrs: AbcNoteHtmlAttrs;
  // Optional modifier for the note, e.g. 'accent', 'open', etc.
  modifier: string | null;
  midiNote: number | null;

  static OFF = new AbcNote(DrumType.NONE, '', setOf('-'), null, noteAttrs(''), null);

  // TODO: Maybe switch note false to ''
  static STICK_R = new AbcNote(DrumType.STICKINGS, '"R"x', setOf('R'), null, noteAttrs('sticking_right'));
  static STICK_L = new AbcNote(DrumType.STICKINGS, '"L"x', setOf('L'), null, noteAttrs('sticking_left'));
  static STICK_BOTH = new AbcNote(DrumType.STICKINGS, '"R/L"x', setOf('b', 'B'), null, noteAttrs('sticking_both'));
  static STICK_COUNT = new AbcNote(DrumType.STICKINGS, '"count"x', setOf('c'), null, noteAttrs('sticking_count'), 39);
  static STICK_OFF = new AbcNote(DrumType.STICKINGS, '""x', setOf('-'));
  static STICKINGS_ALL = [
    this.STICK_R,
    this.STICK_L,
    this.STICK_BOTH,
    this.STICK_COUNT,
  ];

  static HH_RIDE = new AbcNote(DrumType.HIHAT, "^A'", setOf('r'), null, noteAttrs('hh_ride', 'fa-dot-circle-o'), 51);
  static HH_RIDE_BELl = new AbcNote(DrumType.HIHAT, "^B'", setOf('b', 'B'), null, noteAttrs('hh_ride_bell', 'fa-bell-o'), 53);
  static HH_COW_BELL = new AbcNote(DrumType.HIHAT, "^D'", setOf('m', 'M'), null, noteAttrs('hh_cow_bell', 'fa-plus-square-o'), 105);
  static HH_CRASH = new AbcNote(DrumType.HIHAT, "^c'", setOf('c'), null, noteAttrs('hh_crash', 'fa-asterisk'), 49);
  static HH_STACKER = new AbcNote(DrumType.HIHAT, "^d'", setOf('s'), null, noteAttrs('hh_stacker', 'fa-bars'), 52);
  static HH_METRONOME_NORMAL = new AbcNote(DrumType.HIHAT, "^e'", setOf('n'), null, noteAttrs('hh_metronome_normal', 'fa-neuter'), 77);
  static HH_METRONOME_ACCENT = new AbcNote(DrumType.HIHAT, "^f'", setOf('N'), null, noteAttrs('hh_metronome_accent', 'fa-map-pin'), 76);
  static HH_OPEN = new AbcNote(DrumType.HIHAT, "^g", setOf('o'), '!open!', noteAttrs(setOf('hh_cross', 'hh_open'), 'fa-circle-o'), 46);
  static HH_CLOSE = new AbcNote(DrumType.HIHAT, "^g", setOf('+'), '!plus!', noteAttrs(setOf('hh_cross', 'hh_close'), 'fa-plus'), 44);
  static HH_ACCENT = new AbcNote(DrumType.HIHAT, "^g", setOf('X'), '!accent!', noteAttrs(setOf('hh_cross', 'hh_accent'), 'fa-angle-right'), 108);
  static HH_NORMAL = new AbcNote(DrumType.HIHAT, "^g", setOf('x'), null, noteAttrs('hh_cross', 'fa-times'), 42);
  static HH_ALL = [
    this.HH_RIDE,
    this.HH_RIDE_BELl,
    this.HH_COW_BELL,
    this.HH_CRASH,
    this.HH_STACKER,
    this.HH_METRONOME_NORMAL,
    this.HH_METRONOME_ACCENT,
    this.HH_OPEN,
    this.HH_CLOSE,
    this.HH_ACCENT,
    this.HH_NORMAL
  ];

  static SN_GHOST = new AbcNote(DrumType.SNARE, "!(.!!).!c", setOf('g'), null, noteAttrs('snare_ghost', 'fa-circle'), 21);
  // snare_accent must be first, otherwise snare_circle is checked and SN_NORMAL is returned instead.
  static SN_ACCENT = new AbcNote(DrumType.SNARE, "c", setOf('O'), '!accent!', noteAttrs(setOf('snare_accent', 'snare_circle'), 'fa-chevron-right'), 22);
  static SN_NORMAL = new AbcNote(DrumType.SNARE, "c", setOf('o'), null, noteAttrs('snare_circle'), 38);
  static SN_XSTICK = new AbcNote(DrumType.SNARE, "^c", setOf('x'), null, noteAttrs('snare_xstick', 'fa-times'), 37);
  static SN_BUZZ = new AbcNote(DrumType.SNARE, "!///!c", setOf('b'), null, noteAttrs('snare_buzz', 'fa-bars'), 104);
  static SN_FLAM = new AbcNote(DrumType.SNARE, "c", setOf('f'), '!accent!{/c}', noteAttrs('snare_flam'), 107);
  static SN_DRAG = new AbcNote(DrumType.SNARE, "c", setOf('d'), '{//c}', noteAttrs('snare_drag'), 103);
  static SN_IDS = ['snare_circle', 'snare_ghost', 'snare_accent', 'snare_xstick', 'snare_buzz', 'snare_flam', 'snare_drag'];
  static SN_ALL = [
    this.SN_GHOST,
    this.SN_ACCENT,
    this.SN_NORMAL,
    this.SN_XSTICK,
    this.SN_BUZZ,
    this.SN_FLAM,
    this.SN_DRAG
  ]

  static KI_SANDK = new AbcNote(DrumType.KICK, "[F^d,]", setOf('X'), null, noteAttrs(setOf('kick_circle', 'kick_splash')));
  static KI_SPLASH = new AbcNote(DrumType.KICK, "^d,", setOf('x'), null, noteAttrs('kick_splash', 'fa-times'), 36);
  static KI_NORMAL = new AbcNote(DrumType.KICK, "F", setOf('o'), null, noteAttrs('kick_circle'), 35);

  static T1_NORMAL = new AbcNote(DrumType.TOM1, "e", setOf('o'), null, noteAttrs('tom_circle1-'), 48);
  // static T2_NORMAL = new AbcNote(DrumType.TOM2, "d", setOf('o'), null, noteAttrs('tom_circle2-'), 47);
  // static T3_NORMAL = new AbcNote(DrumType.TOM3, "B", setOf('o'), null, noteAttrs('tom_circle3-'), 45);
  static T4_NORMAL = new AbcNote(DrumType.TOM4, "A", setOf('o'), null, noteAttrs('tom_circle4-'), 43);

  static ALL_NOTES = [
    this.STICK_R,
    this.STICK_L,
    this.STICK_BOTH,
    this.STICK_COUNT,
    this.STICK_OFF,
    this.HH_RIDE,
    this.HH_RIDE_BELl,
    this.HH_COW_BELL,
    this.HH_CRASH,
    this.HH_STACKER,
    this.HH_METRONOME_NORMAL,
    this.HH_METRONOME_ACCENT,
    this.HH_OPEN,
    this.HH_CLOSE,
    this.HH_ACCENT,
    this.HH_NORMAL,
    this.SN_GHOST,
    this.SN_ACCENT,
    this.SN_NORMAL,
    this.SN_XSTICK,
    this.SN_BUZZ,
    this.SN_FLAM,
    this.SN_DRAG,
    this.KI_SANDK,
    this.KI_SPLASH,
    this.KI_NORMAL,
    this.T1_NORMAL,
    // this.T2_NORMAL,
    // this.T3_NORMAL,
    this.T4_NORMAL,
  ];

  // Map of drumType to map of tab char to abc note.
  static ABC_NOTE_TO_TAB_CHAR = AbcNote.createAbcNoteToTabCharMap();

  // Map of drumType to map of tab char to abc note.
  static TAB_CHAR_TO_ABC_NOTE = AbcNote.createTabCharToAbcNoteMap();

  constructor(drumType: DrumType, note: string, tabChar: Set<string>, modifier: string | null = null, htmlAttrs: AbcNoteHtmlAttrs | null = null, midiNote: number | null = null) {
    this.drumType = drumType;
    this.note = note;
    this.tabChar = tabChar || new Set();
    this.htmlAttrs = htmlAttrs;
    this.modifier = modifier;
    this.midiNote = midiNote;
  }

  getFirstTabChar() {
    return getFirstElement(this.tabChar);
  }

  getFirstHtmlIdPrefix(): string | null {
    if (this.htmlAttrs?.html_id_prefix instanceof Set) {
      return getFirstElement(this.htmlAttrs.html_id_prefix);
    }
    return this.htmlAttrs?.html_id_prefix || null;
  }

  isOff(): boolean {
    return this.note === AbcNote.OFF.note;
  }

  static createAbcNoteToTabCharMap() {
    const m = new Map();
    for (let abcNote of AbcNote.ALL_NOTES) {
      const drumType = abcNote.drumType.name;
      if (!m.has(drumType)) {
        m.set(drumType, new Map());
      }
      m.get(drumType).set(abcNote.note, abcNote.tabChar);
    }
    return m;
  }

  static createTabCharToAbcNoteMap() {
    const m = new Map();
    for (let abcNote of AbcNote.ALL_NOTES) {
      const drumType = abcNote.drumType.name;
      if (!m.has(drumType)) {
        m.set(drumType, new Map());
      }
      for (let tabChar of abcNote.tabChar) {
        m.get(drumType).set(tabChar, abcNote);
      }
    }
    return m;
  }
}

// DrumType and note string to tab char string.
function abcNoteToTabChar(drumType: DrumType, abcNote: string | AbcNote): string | null {
  if (abcNote instanceof AbcNote) {
    abcNote = abcNote.note;
  }
  return AbcNote.ABC_NOTE_TO_TAB_CHAR.get(drumType.name)?.get(abcNote)?.values().next().value || null;
}

// DrumType and tab char string to AbcNote.
function tabCharToAbcNote(drumType: DrumType, tabChar: string): AbcNote | null {
  return AbcNote.TAB_CHAR_TO_ABC_NOTE.get(drumType.name)?.get(tabChar) || null;
}

class Subdivision {
  // Length of note will be 1/value.
  value: number;

  static NONE = new Subdivision(0);
  static WHOLE = new Subdivision(1);
  static HALF = new Subdivision(2);
  static QUARTER = new Subdivision(4);
  static EIGHTH = new Subdivision(8);
  static EIGHTH_TRIPLET = new Subdivision(12);
  static SIXTEENTH = new Subdivision(16);
  static SIXTEENTH_TRIPLET = new Subdivision(24);
  static S_32ND = new Subdivision(32);
  static S_48TH = new Subdivision(48);

  constructor(number: number) {
    if (typeof number === 'number' && Number.isInteger(number) && number >= 0) {
      this.value = number;
    } else {
      console.log(`Invalid Subdivision value: ${number}, default to QUARTER.`);
      this.value = Subdivision.QUARTER.value;
    }
  }

  isTriplet(): boolean {
    return this.value % 12 == 0;
  }

  // Denominator for ABC's L: header. Triplets fix L:1/32 with note lengths
  // scaled to 48 units per 4/4 measure — abc2svg rejects fractional L: values
  // like 1/12, and (p:q:r triplet markers reconcile the mismatch with M:4/4.
  abcNoteLength(): number {
    return this.isTriplet() ? 32 : this.value;
  }

  // Length (in L: units) of a single grid position at this subdivision.
  abcPositionLength(): number {
    return this.isTriplet() ? 48 / this.value : 1;
  }

  static of(number: number): Subdivision {
    return new Subdivision(number);
  }

  equals(other: Subdivision): boolean {
    return this.value === other.value;
  }

  divideBy(other: Subdivision): number {
    return other.value / this.value;
  }
}

class TimeSignature {
  top: number;
  bottom: Subdivision;

  static COMMON_TIME_44 = new TimeSignature(4, Subdivision.QUARTER);

  constructor(top: number, bottom: Subdivision) {
    if (typeof top !== 'number' || top <= 0 || !Number.isInteger(top)) {
      throw new Error('TimeSignature numbers must be positive integers.');
    }
    if (!(bottom instanceof Subdivision)) {
      throw new Error('TimeSignature bottom must be an instance of Subdivision.');
    }
    this.top = top;
    this.bottom = bottom;
  }

  toString() {
    return `${this.top}/${this.bottom.value}`;
  }

  equals(other: TimeSignature): boolean {
    return this.top === other.top && this.bottom.equals(other.bottom);
  }

  static fromString(timeSigString: string): TimeSignature {
    var split_arr = timeSigString.split("/");
    if (split_arr.length != 2) {
      return TimeSignature.COMMON_TIME_44;
    }

    var timeSigTop = parseInt(split_arr[0]);
    var timeSigBottom = parseInt(split_arr[1]);

    if (timeSigTop < 1 || timeSigTop > 32)
      timeSigTop = 4;
    // only valid if 2,4,8, or 16
    if (timeSigBottom != 2 && timeSigBottom != 4 && timeSigBottom != 8 && timeSigBottom != 16)
      timeSigBottom = 4;
    return new TimeSignature(timeSigTop, Subdivision.of(timeSigBottom));
  };
}

class Measure {
  timeSig: TimeSignature;
  tabSubdivision: Subdivision;
  notesPerMeasure: number;
  arrays: Map<string, Array<string | null> | null>;

  constructor(timeSig: TimeSignature, tabSubdivision: Subdivision) {

    this.timeSig = timeSig;
    this.tabSubdivision = tabSubdivision;
    const notesPerBeat = timeSig.bottom.divideBy(tabSubdivision);
    this.notesPerMeasure = notesPerBeat * timeSig.top;

    // Stores tab note string or `null`. Use getArray(DrumType) instead of accessing this directly.
    this.arrays = new Map<string, Array<string | null>>();
    this.arrays.set(DrumType.STICKINGS.name, Measure.createEmptyArrayOfLength(this.notesPerMeasure));
    this.arrays.set(DrumType.HIHAT.name, Measure.fillArray(
      Measure.createEmptyArrayOfLength(this.notesPerMeasure), AbcNote.HH_NORMAL.getFirstTabChar(), 0, 2));
    this.arrays.set(DrumType.SNARE.name, Measure.fillArray(
      Measure.createEmptyArrayOfLength(this.notesPerMeasure), AbcNote.SN_ACCENT.getFirstTabChar(), notesPerBeat, notesPerBeat * 2));
    this.arrays.set(DrumType.KICK.name, Measure.fillArray(
      Measure.createEmptyArrayOfLength(this.notesPerMeasure), AbcNote.KI_NORMAL.getFirstTabChar(), 0, notesPerBeat * 2));
    this.arrays.set(DrumType.TOM1.name, Measure.createEmptyArrayOfLength(this.notesPerMeasure));
    this.arrays.set(DrumType.TOM4.name, Measure.createEmptyArrayOfLength(this.notesPerMeasure));
  }

  // String should be without the bar separators `|`.
  setDataFromString(drumType: DrumType, string: string) {
    if (string.length !== this.notesPerMeasure) {
      throw new Error(`Expected string of length ${this.notesPerMeasure}, got ${string} of length ${string.length}`);
    }
    const array = Measure.createEmptyArrayOfLength(this.notesPerMeasure);
    for (let i = 0; i < string.length; i++) {
      if (string.charAt(i) !== '-') {
        array[i] = string.charAt(i);
      }
    }
    this.arrays.set(drumType.name, array);
  }

  toString(drumType: DrumType): string {
    if (!this.getArray(drumType)) {
      console.log(`no value for Drum type: ${drumType}`);
      return '';
    }
    return this.getArray(drumType).map((e) => e || '-').join('');
  }

  getArray(drumType: DrumType): Array<string | null> {
    return this.arrays.get(drumType.name) || [];
  }

  static createEmptyArrayOfLength(length: number): Array<string | null> {
    const array = new Array(length);
    array.fill(null);
    return array;
  }

  static fillArray(array: Array<string | null>, note: string, firstPosition: number, distance: number): Array<string | null> {
    for (let i = firstPosition; i < array.length; i += distance) {
      array[i] = note;
    }
    return array;
  }

  getScaledArray(drumType: DrumType, newSize: number): Array<string | null> {
    const array = this.getArray(drumType);
    if (array.length === newSize) {
      return array;
    }

    const newArray = new Array(newSize);
    newArray.fill(null);
    const scaleFactor = Math.floor(newSize / array.length);
    for (let i = 0; i < array.length; i++) {
      const newIndex = i * scaleFactor;
      if (array[i] !== null) {
        newArray[newIndex] = array[i];
      }
    }
    return newArray;
  }
}

interface DecodedGrooveUrl {
  viewMode: boolean;
  debugMode: boolean;
  timeSig: TimeSignature;
  subdivision: Subdivision;
  metronomeFrequency: number;
  title: string;
  author: string;
  comments: string;
  tempo: number;
  swingPercent: number;
  // Raw pipe-delimited tab strings keyed by DrumType.name (e.g. "H", "S", "K").
  drumTabs: Map<string, string>;
}

// Pure parser: URL query string → typed decoded fields. No DOM, no side effects.
function decodeGrooveUrl(paramsString: string): DecodedGrooveUrl {
  const params = new URLSearchParams(paramsString);

  const drumTabs = new Map<string, string>();
  for (const drum of DrumType.ALL) {
    const data = params.get(drum.name);
    if (data) {
      drumTabs.set(drum.name, data);
    }
  }

  return {
    viewMode: params.get('Mode') === 'view',
    debugMode: params.get('Debug') === '1',
    timeSig: params.get('TimeSig') ? TimeSignature.fromString(params.get('TimeSig')) : TimeSignature.COMMON_TIME_44,
    subdivision: params.get('Div') ? Subdivision.of(parseInt(params.get('Div'))) : Subdivision.SIXTEENTH,
    metronomeFrequency: Math.max(parseInt(params.get('MetronomeFreq')) || 0, 0),
    title: params.get('Title') || '',
    author: params.get('Author') || '',
    comments: params.get('Comments') || '',
    tempo: Math.min(Math.max(parseInt(params.get('Tempo')) || constant_DEFAULT_TEMPO, 20), 400),
    swingPercent: Math.min(Math.max(parseInt(params.get('Swing')) || 0, 0), 100),
    drumTabs,
  };
}

function buildMeasuresFromTabs(drumTabs: Map<string, string>, timeSig: TimeSignature, subdivision: Subdivision): Array<Measure> {
  const measures: Array<Measure> = [];
  for (const drum of DrumType.ALL) {
    const data = drumTabs.get(drum.name);
    if (!data) continue;
    const measureData = GrooveData.splitTabIntoMeasureStrings(data);
    for (let i = 0; i < measureData.length; i++) {
      if (measures[i] === undefined) {
        measures.push(new Measure(timeSig, subdivision));
      }
      measures[i].setDataFromString(drum, measureData[i]);
    }
  }
  return measures;
}

// Minimal shape encodeGrooveQueryString needs from GrooveData. Declared as an
// interface so tests can pass plain objects without constructing a full class.
interface EncodableGrooveState {
  debugMode: boolean;
  viewMode: boolean;
  grooveDBAuthoring: boolean;
  timeSig: TimeSignature;
  subdivision: Subdivision;
  title: string;
  author: string;
  comments: string;
  tempo: number;
  swingPercent: number;
  metronomeFrequency: number;
  measures: Array<Measure>;
  showStickings: boolean;
  showToms: boolean;
}

// Build query string manually (not URLSearchParams) so `|` and `/` are preserved
// verbatim in drum tabs and time signatures — percent-encoding breaks the tabs.
function encodeGrooveQueryString(state: EncodableGrooveState): string {
  const parts: string[] = [];
  const add = (key: string, value: string | null | undefined) => {
    if (value) parts.push(`${key}=${value}`);
  };
  add('Debug', state.debugMode ? '1' : '');
  add('Mode', state.viewMode ? 'view' : 'edit');
  add('GDB_Author', state.grooveDBAuthoring ? '1' : '');
  add('TimeSig', state.timeSig.toString());
  add('Div', state.subdivision.value.toString());
  add('Title', encodeURIComponent(state.title));
  add('Author', encodeURIComponent(state.author));
  add('Comments', encodeURIComponent(state.comments));
  add('Tempo', state.tempo.toString());
  add('Swing', state.swingPercent ? state.swingPercent.toString() : '');
  add('MetronomeFreq', state.metronomeFrequency ? state.metronomeFrequency.toString() : '');

  for (const drum of DrumType.ALL) {
    if (!state.showStickings && drum.equals(DrumType.STICKINGS)) continue;
    if (!state.showToms && drum.isTom()) continue;
    const arrays: string[] = [];
    for (const measure of state.measures) {
      const str = measure.toString(drum);
      if (str) arrays.push(str);
    }
    parts.push(`${drum.name}=|${arrays.join('|')}|`);
  }

  return '?' + parts.join('&');
}

class GrooveData {
  timeSig: TimeSignature;
  subdivision: Subdivision;
  measures: Array<Measure>;
  showTempo: false;
  showToms: boolean;
  showStickings: boolean;
  title: string;
  author: string;
  comments: string;
  swingPercent: number;
  tempo: number;
  kickStemsUp: boolean;
  metronomeFrequency: number; // 0, 4, 8, 16
  debugMode: boolean;
  grooveDBAuthoring: boolean;
  viewMode: boolean;

  constructor(timeSig = TimeSignature.COMMON_TIME_44, subdivision = Subdivision.SIXTEENTH, numberOfMeasures = 1) {
    this.timeSig = timeSig;
    this.subdivision = subdivision;

    this.measures = [];
    for (let i = 0; i < numberOfMeasures; i++) {
      this.measures.push(new Measure(this.timeSig, this.subdivision));
    }

    this.showTempo = false;
    this.showToms = false;
    this.showStickings = false;
    this.title = "";
    this.author = "";
    this.comments = "";
    this.swingPercent = 0;
    this.tempo = constant_DEFAULT_TEMPO;
    this.kickStemsUp = true;
    this.metronomeFrequency = 0; // 0, 4, 8, 16
    this.debugMode = true;
    this.grooveDBAuthoring = false;
    this.viewMode = false;
  }

  get numberOfMeasures(): number {
    return this.measures.length;
  }

  get notesPerMeasure(): number {
    return this.timeSig.top * this.timeSig.bottom.divideBy(this.subdivision);
  }

  get notesPerBeat(): number {
    return this.timeSig.bottom.divideBy(this.subdivision);
  }

  fromUrl(paramsString: string): GrooveData {
    const decoded = decodeGrooveUrl(paramsString);
    this.viewMode = decoded.viewMode;
    this.debugMode = decoded.debugMode;
    this.timeSig = decoded.timeSig;
    this.subdivision = decoded.subdivision;
    this.metronomeFrequency = decoded.metronomeFrequency;
    this.title = decoded.title;
    this.author = decoded.author;
    this.comments = decoded.comments;
    this.tempo = decoded.tempo;
    this.swingPercent = decoded.swingPercent;

    const measures = buildMeasuresFromTabs(decoded.drumTabs, this.timeSig, this.subdivision);
    if (measures.length !== 0) {
      this.measures = measures;
    } else {
      // Preserve legacy fallback: URL with no drum data triggers default groove.
      // The recursive call resets TimeSig/Div/etc. to the defaults in the fallback
      // string; callers who want to keep other fields should provide drum data.
      this.fromUrl('TimeSig=4/4&Div=8&H=|xxxxxxxx|&S=|--o---o-|&K=|o---o---|');
    }

    return this;
  }

  toUrl(url_destination: string = ''): string {
    // window.* stays here so the pure encoder can run in tests / Node.
    const base = window.location.protocol + "//" + window.location.host + window.location.pathname;
    return base + encodeGrooveQueryString(this);
  }

  static splitTabIntoMeasureStrings(string: string): Array<string> {
    if (!string) {
      return [];
    }
    var parts = string.split('|');
    if (string.startsWith('|')) {
      if (parts.length === 1) {
        return [];
      }
      parts = parts.slice(1, parts.length);
    }
    if (string.endsWith('|')) {
      parts = parts.slice(0, parts.length - 1);
    }
    return parts;
  }

  static hasNotesAtPosition(i: number, hh_array: Array<string | null>, snare_array: Array<string | null>, kick_array: Array<string | null>, tom1_array: Array<string | null>, tom4_array: Array<string | null>): boolean {
    if (i >= hh_array.length) {
      return false;
    }
    return hh_array[i] !== null || snare_array[i] !== null || kick_array[i] !== null;
  }

  // Returns null if no note at this position, otherwise, a list of AbcNote objects.
  static getNotesAtPosition(i: number, hh_array: Array<string | null>, snare_array: Array<string | null>, kick_array: Array<string | null>, tom1_array: Array<string | null>, tom4_array: Array<string | null>): Array<AbcNote> | null {
    if (i >= hh_array.length) {
      return [];
    }
    const s = [];
    if (hh_array[i] !== null) {
      s.push(tabCharToAbcNote(DrumType.HIHAT, hh_array[i]));
    }
    if (snare_array[i] !== null) {
      s.push(tabCharToAbcNote(DrumType.SNARE, snare_array[i]));
    }
    if (kick_array[i] !== null) {
      s.push(tabCharToAbcNote(DrumType.KICK, kick_array[i]));
    }
    if (tom1_array && tom1_array[i] !== null) {
      s.push(tabCharToAbcNote(DrumType.TOM1, tom1_array[i]));
    }
    if (tom4_array && tom4_array[i] !== null) {
      s.push(tabCharToAbcNote(DrumType.TOM4, tom4_array[i]));
    }
    return s.length > 0 ? s : null;
  }

  // Same as getNotesAtPosition, but with snare BEFORE hi-hat in chord order —
  // matches the legacy triplet output format (e.g. `[c4^g4]`, not `[^g4c4]`).
  static getTripletNotesAtPosition(i: number, hh_array: Array<string | null>, snare_array: Array<string | null>, kick_array: Array<string | null>, tom1_array: Array<string | null>, tom4_array: Array<string | null>): Array<AbcNote> | null {
    if (i >= hh_array.length) {
      return [];
    }
    const s = [];
    if (snare_array[i] !== null) {
      s.push(tabCharToAbcNote(DrumType.SNARE, snare_array[i]));
    }
    if (hh_array[i] !== null) {
      s.push(tabCharToAbcNote(DrumType.HIHAT, hh_array[i]));
    }
    if (kick_array[i] !== null) {
      s.push(tabCharToAbcNote(DrumType.KICK, kick_array[i]));
    }
    if (tom1_array && tom1_array[i] !== null) {
      s.push(tabCharToAbcNote(DrumType.TOM1, tom1_array[i]));
    }
    if (tom4_array && tom4_array[i] !== null) {
      s.push(tabCharToAbcNote(DrumType.TOM4, tom4_array[i]));
    }
    return s.length > 0 ? s : null;
  }

  // If notes is null, interpret as a rest.
  static appendAbcNotes(abcs: Array<string>, notes: Array<AbcNote> | null, length: number): void {
    if (length === 0) {
      return;
    }
    if (notes === null || notes.length === 0) {
      // Append rest.
      abcs.push('z' + length);
      return;
    }
    if (notes.length === 1) {
      abcs.push((notes[0].modifier || '') + notes[0].note + length);
    } else {
      // Multiple notes, use a chord.
      // Accents have to be before and outside of brackets.
      const accents = new Set();
      for (const note of notes) {
        if (note.modifier) {
          accents.add(note.modifier || '');
        }
      }
      abcs.push(Array.from(accents).join('') + '[' + notes.map(n => n.note + length).join('') + ']');
    }
  }

  // Emit ABC for one measure of a non-triplet subdivision. Notes are emitted at
  // their natural length in units of L: (which equals subdivision.value here).
  appendPlainMeasureAbc(line: Array<string>, drumArrays: [Array<string | null>, Array<string | null>, Array<string | null>, Array<string | null>, Array<string | null>]): void {
    const [hh, sn, kk, t1, t4] = drumArrays;
    const numNotesPerBeat = this.timeSig.bottom.divideBy(this.subdivision);
    var currentNotes: Array<AbcNote> | null = null;
    var currentNotesPosition = 0;
    // Scan positions and emit a note (or rest) whenever a new event or beat
    // boundary is reached. Length = distance from the previous emission.
    for (let i = 0; i <= hh.length; i++) {
      const atStartOfBeat = (i % numNotesPerBeat === 0);
      if (i === hh.length) {
        GrooveData.appendAbcNotes(line, currentNotes, i - currentNotesPosition);
        return;
      }
      const hasNote = GrooveData.hasNotesAtPosition(i, hh, sn, kk, t1, t4);
      if (i === 0) {
        if (hasNote) {
          currentNotes = GrooveData.getNotesAtPosition(i, hh, sn, kk, t1, t4);
        }
        continue;
      }
      if (hasNote) {
        GrooveData.appendAbcNotes(line, currentNotes, i - currentNotesPosition);
        currentNotes = GrooveData.getNotesAtPosition(i, hh, sn, kk, t1, t4);
        currentNotesPosition = i;
      } else if (atStartOfBeat) {
        GrooveData.appendAbcNotes(line, currentNotes, i - currentNotesPosition);
        currentNotes = null;
        currentNotesPosition = i;
      }
      // Space before a new beat breaks the beam so notes don't beam across beats.
      if (atStartOfBeat) {
        line.push(' ');
      }
    }
  }

  // Emit ABC for one measure of a triplet subdivision (8th/16th/32nd triplets).
  // Uses L:1/32 with (n:n:n markers (n = notes per beat: 3, 6, or 12) so abc2svg
  // reconciles the n-in-a-beat mismatch with M:4/4. Each grid position emits a
  // note (or rest) of length 48/subdivision.
  appendTripletMeasureAbc(line: Array<string>, drumArrays: [Array<string | null>, Array<string | null>, Array<string | null>, Array<string | null>, Array<string | null>]): void {
    const [hh, sn, kk, t1, t4] = drumArrays;
    const noteLength = this.subdivision.abcPositionLength();
    const notesPerBeat = this.timeSig.bottom.divideBy(this.subdivision);
    const marker = `(${notesPerBeat}:${notesPerBeat}:${notesPerBeat}`;
    for (let beat = 0; beat < hh.length; beat += notesPerBeat) {
      if (beat > 0) {
        line.push(' ');
      }
      line.push(marker);
      for (let k = 0; k < notesPerBeat; k++) {
        const i = beat + k;
        const notes = GrooveData.getTripletNotesAtPosition(i, hh, sn, kk, t1, t4);
        GrooveData.appendAbcNotes(line, notes, noteLength);
      }
    }
  }

  // We use 2 voices, Stickings and Hands. Stickings for stickings. Hands for HH, Snare, Kick and Toms.
  // Note length is a multiple of the subdivision. Subdivision is set with `L:` in the header.
  // For example, `L:1/8` and `f1` means a 1/8 note, `f2` means a 1/4 note.
  getAbcNotation(): string {
    // TODO: add stickings.

    // convert sticking count symbol to the actual count
    // do this right before ABC output so it can't every get encoded into something that gets saved.
    // this.convert_sticking_counts_to_actual_counts(sticking_array, time_division, timeSig);

    var measuresPerLine = 2;
    if (this.subdivision.equals(Subdivision.S_32ND)) {
      measuresPerLine = 1; // 32nd notes are too dense, so we only show one measure per line.
    }
    var lines = [];
    const isTriplet = this.subdivision.isTriplet();
    // Stickings voice is currently just rests. Its total length must match the
    // hands voice — a mismatch causes abc2svg to render staves misaligned.
    var measureRests: string;
    if (isTriplet) {
      // e.g. "x4x4x4" per beat — one rest per grid position, no spaces within a beat.
      const notesPerBeat = this.timeSig.bottom.divideBy(this.subdivision);
      const perBeat = ('x' + this.subdivision.abcPositionLength()).repeat(notesPerBeat);
      measureRests = Array(this.timeSig.top).fill(perBeat).join(' ');
    } else {
      const abcUnitsPerBeat = this.subdivision.abcNoteLength() / this.timeSig.bottom.value;
      const beatRest = 'z' + abcUnitsPerBeat;
      measureRests = Array(this.timeSig.top).fill(beatRest).join(' ');
    }
    const stickings = Array(this.measures.length).fill(measureRests).join(' | ') + ' ||';
    lines.push('V:Stickings\n' + stickings);
    lines.push('V:Hands stem=up\n%%voicemap drum');
    var line = [];
    for (let measureNum = 0; measureNum < this.measures.length; measureNum++) {
      const measure = this.measures[measureNum];
      if ((measureNum + 1) % measuresPerLine === 0) {
        line.push('\\'); // End of line, start a new one.
      }

      const hh_array = measure.getArray(DrumType.HIHAT);
      const snare_array = measure.getArray(DrumType.SNARE);
      const kick_array = measure.getArray(DrumType.KICK);
      const tom1_array = measure.getArray(DrumType.TOM1);
      const tom4_array = measure.getArray(DrumType.TOM4);
      const drumArrays: [Array<string | null>, Array<string | null>, Array<string | null>, Array<string | null>, Array<string | null>] = [hh_array, snare_array, kick_array, tom1_array, tom4_array];
      const lastMeasure = measureNum === this.measures.length - 1;

      if (isTriplet) {
        this.appendTripletMeasureAbc(line, drumArrays);
      } else {
        this.appendPlainMeasureAbc(line, drumArrays);
      }
      // Triplet output uses ` ||` / ` |` with a leading space to match the
      // legacy format the tests pin against; plain output does not.
      const barSep = lastMeasure ? '||' : '|\\';
      line.push(isTriplet ? ' ' + barSep : barSep);
      lines.push(line.join(''));
      line = [];
    }

    return lines.join('\n') + '\n';

    //   this.note_mapping_array = this.create_note_mapping_array_for_highlighting(FullNoteHHArray,
    //     FullNoteSnareArray,
    //     FullNoteKickArray,
    //     FullNoteTomsArray,
    //     FullNoteHHArray.length);
  }

  getAbcHeader(isPermutation: boolean, renderWidth: number): string {
    // 0 is GrooveUtil index if there are multiple instances.
    var fullABC = `%abc\n%%fullsvg _0\nX:6\nM:${this.timeSig.toString()}\n`;
    if (this.title) {
      fullABC += `T: ${this.title}\n`;
    }
    if (this.author) {
      fullABC += `C: ${this.author}\n%%musicspace 20px\n`;
    }

    if (renderWidth < 400)
      renderWidth = 400; // min-width
    if (renderWidth > 3000)
      renderWidth = 3000; // max-width
    // the width of the music is always 25% bigger than what we pass in.   Go figure.
    renderWidth = Math.floor(renderWidth * 0.75);

    fullABC += `L:1/${this.subdivision.abcNoteLength()}\n`;

    if (isPermutation)
      fullABC += "%%stretchlast 0\n";
    else
      fullABC += "%%stretchlast 1\n";

    fullABC += '%%flatbeams 1\n' +
      '%%ornament up\n' +
      `%%pagewidth ${renderWidth}px\n` +
      '%%leftmargin 0cm\n' +
      '%%rightmargin 0cm\n' +
      '%%topspace 10px\n' +
      '%%titlefont calibri 20\n' +
      '%%partsfont calibri 16\n' +
      '%%gchordfont calibri 16\n' +
      '%%annotationfont calibri 16\n' +
      '%%infofont calibri 16\n' +
      '%%textfont calibri 16\n' +
      '%%deco (. 0 a 5 1 1 "@-8,-3("\n' +
      '%%deco ). 0 a 5 1 1 "@4,-3)"\n' +
      '%%beginsvg\n' +
      ' <defs>\n' +
      ' <path id="Xhead" d="m-3,-3 l6,6 m0,-6 l-6,6" class="stroke" style="stroke-width:1.2"/>\n' +
      ' <path id="Trihead" d="m-3,2 l 6,0 l-3,-6 l-3,6 l6,0" class="stroke" style="stroke-width:1.2"/>\n' +
      ' </defs>\n' +
      '%%endsvg\n' +
      '%%map drum ^g heads=Xhead print=g       % Hi-Hat\n' +
      '%%map drum ^c\' heads=Xhead print=c\'   % Crash\n' +
      '%%map drum ^d\' heads=Xhead print=d\'   % Stacker\n' +
      '%%map drum ^e\' heads=Xhead print=e\'   % Metronome click\n' +
      '%%map drum ^f\' heads=Xhead print=f\'   % Metronome beep\n' +
      '%%map drum ^A\' heads=Xhead print=A\'   % Ride\n' +
      '%%map drum ^B\' heads=Trihead print=A\' % Ride Bell\n' +
      '%%map drum ^D\' heads=Trihead print=g   % Cow Bell\n' +
      '%%map drum ^c heads=Xhead print=c  % Cross Stick\n' +
      '%%map drum ^d, heads=Xhead print=d,  % Foot Splash\n';

    // If kick_stems_up is customizable and false, add Feet voice here.
    fullABC += "%%staves (Stickings Hands)\n";

    if (this.comments) {
      fullABC += `P: ${this.comments}\n%%musicspace 20px\n`;
    }

    // the K ends the header;
    fullABC += "K:C clef=perc\n";

    if (this.showTempo) {
      fullABC += `Q: 1/4=${this.tempo}\n`;
    }

    return fullABC;
  }
}

class MidiEventCallback {
  grooveUtils: GrooveUtils;
  noteHasChangedSinceLastDataLoad: boolean;
  myGrooveData: GrooveData;
  midiEventCallbacks: object;
  grooveUtilsUniqueIndex: number;
  playEvent: (root?: any) => void;
  playEventCallback: (() => void) | null;
  create_MIDIURLFromGrooveData: (data: GrooveData) => string;
  loadMIDIFromURL: (url: string) => void;
  getMidiImageLocation: () => string;

  constructor(grooveUtils) {
    this.grooveUtils = grooveUtils;
    this.grooveUtilsUniqueIndex = grooveUtils.grooveUtilsUniqueIndex;
    this.noteHasChangedSinceLastDataLoad = false;

    this.playEvent = function (root) {
      var icon = document.getElementById("midiPlayImage" + this.grooveUtilsUniqueIndex);
      if (icon)
        icon.className = "midiPlayImage Playing";
      if (this.playEventCallback) {
        this.playEventCallback();
      }
    };
  }
  // default loadMIDIDataEvent.  You probably want to override this
  // it will only make changes to the tempo and swing
  // playStarting: boolean that is true on the first time through the midi playback
  loadMidiDataEvent(playStarting) {
    if (this.myGrooveData) {
      this.myGrooveData.tempo = this.myGrooveData.tempo;
      this.myGrooveData.swingPercent = this.myGrooveData.swingPercent;
      var midiURL = this.create_MIDIURLFromGrooveData(this.myGrooveData);
      this.loadMIDIFromURL(midiURL);
      this.noteHasChangedSinceLastDataLoad = false;
    } else {
      console.log("can't load midi song.   myGrooveData is empty");
    }
  }

  doesMidiDataNeedRefresh() {
    return this.noteHasChangedSinceLastDataLoad;
  }

  pauseEvent() {
    var icon = document.getElementById("midiPlayImage" + this.grooveUtilsUniqueIndex);
    if (icon)
      icon.className = "midiPlayImage Paused";
  }

  resumeEvent() { };
  stopEvent() {
    var icon = document.getElementById("midiPlayImage" + this.grooveUtilsUniqueIndex);
    if (icon)
      icon.className = "midiPlayImage Stopped";
  }
  repeatChangeEvent(newValue) {
    if (newValue)
      (document.getElementById("midiRepeatImage" + this.grooveUtilsUniqueIndex) as HTMLImageElement).src = this.getMidiImageLocation() + "repeat.png";
    else
      (document.getElementById("midiRepeatImage" + this.grooveUtilsUniqueIndex) as HTMLImageElement).src = this.getMidiImageLocation() + "grey_repeat.png";
  }
  percentProgress(percent) { };
  notePlaying(note_type?, note_position?) { };

  midiInitialized() {
    var icon = document.getElementById("midiPlayImage" + this.grooveUtilsUniqueIndex);
    if (icon) {
      icon.className = "midiPlayImage Stopped";
      icon.onclick = (event) => {
        this.grooveUtils.startOrStopMIDI_playback();
      }; // enable play button
    }
    this.grooveUtils.setupHotKeys(); // spacebar to play
  }
}

// callback class for abc generator library
// See https://chiselapp.com/user/moinejf/repository/abc2svg/wiki?name=interface-1.
class SVGLibCallback {
  abc_obj: AbcObj;
  abc_svg_output: string;
  abc_error_output: string;
  svg_highlight_y: number;
  svg_highlight_h: number;
  page_format: boolean;
  grooveUtilsUniqueIndex: number;
  abcNoteNumIndex: number;

  constructor() {
    this.abc_obj = null; // will be set by the GrooveUtils constructor
    this.abc_svg_output = "";
    this.abc_error_output = "";
    this.svg_highlight_y = 0;
    this.svg_highlight_h = 44;
    // -- optional attributes
    this.page_format = true; // define the non-page-breakable blocks
    this.grooveUtilsUniqueIndex = 0;
    this.abcNoteNumIndex = 0;
  }

  // include a file (%%abc-include)
  read_file(fn) {
    return "";
  };
  // insert the errors
  errmsg(msg, l, c) {
    this.abc_error_output += msg + "<br/>\n";
  };

  // for possible playback or linkage
  get_abcmodel(tsfirst, voice_tb, music_types) {

    /*
    console.log(tsfirst);
    var next = tsfirst.next;

    while(next) {
    console.log(next);
    next = next.next;
    }
     */
  };

  // annotations
  anno_start(type, start, stop, x, y, w, h) { };
  anno_stop(type, start, stop, x, y, w, h) {

    // create a rectangle
    if (type == "bar") {
      // use the bar as the default y & hack
      this.svg_highlight_y = y + 5;
      this.svg_highlight_h = h + 10;
    }
    if (type == "note" || type == "grace") {
      y = this.svg_highlight_y;
      h = this.svg_highlight_h;
      this.abc_obj.out_svg('<rect class="abcr" id="abcNoteNum_' + this.grooveUtilsUniqueIndex + "_" + this.abcNoteNumIndex + '" x="');
      this.abc_obj.out_sxsy(x, '" y="', y);
      this.abc_obj.out_svg('" width="' + w.toFixed(2) + '" height="' + h.toFixed(2) + '"/>\n');

      //console.log("Type:"+type+ "\t abcNoteNumIndex:"+this.abcNoteNumIndex+ "\t X:"+x+ "\t Y:"+y+ "\t W:"+w+ "\t H:"+h);

      // don't increment on the grace note, since it is attached to the real note
      if (type != "grace")
        this.abcNoteNumIndex++;
    }
  };

  // image output
  img_out(str) {
    this.abc_svg_output += str; // + '\n'
  };

}

// https://chiselapp.com/user/moinejf/repository/abc2svg/wiki?name=interface-1
interface AbcObj {
  new(callback: SVGLibCallback): AbcObj;
  tosvg(file_name: string, ABC_source: string, start_offset?: number, end_offset?: number): any;
  out_svg(text: string): void; // Add text.
  out_sxsy(x_offset: number, separator: string, y_offset: number): void;
}

// GrooveUtils class.   The only one in this file.
class GrooveUtils {
  data: GrooveData;
  grooveData: GrooveData;
  abc_obj: AbcObj;
  metronomeSolo: boolean;
  metronomeOffsetClickStart: string;
  metronomeOffsetClickStartRotation: number;
  abcToSVGCallback: SVGLibCallback;
  abcNoteNumCurrentlyHighlighted: number;
  abcNoteNumIndex: number;
  midiEventCallbacks: MidiEventCallback;
  isMIDIPaused: boolean;
  shouldMIDIRepeat: boolean;
  swingIsEnabled: boolean;
  midiBaseLocation: string;
  visible_context_menu: HTMLElement | false;
  grooveUtilsUniqueIndex: number;
  note_mapping_array: any;
  noteCallback: ((note_type: string, percent_complete?: number) => void) | null;
  playEventCallback: (() => void) | null;
  repeatCallback: (() => void) | null;
  tempoChangeCallback: ((tempo: number) => void) | null;
  lastMidiTimeUpdate: number;
  swingPercent: number;
  myGrooveData: GrooveData;

  constructor(excludeAbcForTesting = false) {
    this.grooveUtilsUniqueIndex = 0;
    this.data = new GrooveData();
    this.grooveData = this.data;

    // array that can be used to map notes to the SVG generated by abc2svg
    this.note_mapping_array = null;

    // metronome options
    this.metronomeSolo = false;
    this.metronomeOffsetClickStart = "1";
    // start with last in the rotation so the next rotation brings it to '1'
    this.metronomeOffsetClickStartRotation = 0;

    // integration with third party components
    this.noteCallback = null;  //function triggered when a note is played
    this.playEventCallback = null;  //triggered when the play button is pressed
    this.repeatCallback = null;  //triggered when a groove is going to be repeated
    this.tempoChangeCallback = null;  //triggered when the tempo changes.  ARG1 is the new Tempo integer (needs to be very fast, it can get called a lot of times from the slider)

    this.visible_context_menu = false; // a single context menu can be visible at a time.

    if (!excludeAbcForTesting) {
      this.abcToSVGCallback = new SVGLibCallback(); // singleton
      this.abc_obj = new Abc(this.abcToSVGCallback);
      this.abcToSVGCallback.abc_obj = this.abc_obj;
    }
    this.abcNoteNumCurrentlyHighlighted = -1;

    // midi state variables
    this.midiEventCallbacks = new MidiEventCallback(this);
    this.isMIDIPaused = false;
    this.shouldMIDIRepeat = true;
    this.swingIsEnabled = false;
    this.midiBaseLocation = ""; // global
  }

  getQueryVariableFromString(variable: string, def_value: string, my_string: string) {
    var query = my_string.substring(1);
    var vars = query.split("&");
    for (var i = 0; i < vars.length; i++) {
      var pair = vars[i].split("=");
      if (pair[0].toLowerCase() == variable.toLowerCase()) {
        return pair[1];
      }
    }
    return (def_value);
  };

  // Get the "?query" values from the page URL
  getQueryVariableFromURL(variable, def_value) {
    return (this.getQueryVariableFromString(variable, def_value, window.location.search));
  };

  // is the browser a touch device.   Usually this means no right click
  is_touch_device(): boolean {
    return (('ontouchstart' in window) || (navigator.maxTouchPoints > 0));
  };

  // every document click passes through here.
  // close a popup if one is up and we click off of it.
  documentOnClickHanderCloseContextMenu = (event) => {
    if (this.visible_context_menu) {
      this.hideContextMenu(this.visible_context_menu as HTMLElement);
    }
  };

  showContextMenu(contextMenu) {
    if (!contextMenu) return;
    // if there is another context menu open, close it
    if (this.visible_context_menu && this.visible_context_menu !== contextMenu) {
      this.hideContextMenu(this.visible_context_menu as HTMLElement);
    }
    contextMenu.style.display = "block";
    this.visible_context_menu = contextMenu;

    // Check for screen visibility of the bottom of the menu
    if (contextMenu.offsetTop + contextMenu.clientHeight > document.documentElement.clientHeight) {
      // the menu has gone off the bottom of the screen
      contextMenu.style.top = document.documentElement.clientHeight - contextMenu.clientHeight + 'px';
    }
    // Defer wiring the outside-click handler so the click that opened the
    // menu doesn't immediately close it. Arrow function preserves `this`.
    setTimeout(() => {
      document.onclick = this.documentOnClickHanderCloseContextMenu;
      document.body.style.cursor = "pointer"; // make document.onclick work on iPad
    }, 100);
  };

  hideContextMenu(contextMenu?: HTMLElement) {
    document.onclick = () => { };
    document.body.style.cursor = "auto"; // make document.onclick work on iPad
    const target = (contextMenu || this.visible_context_menu) as HTMLElement | false;
    if (target) {
      target.style.display = "none";
    }
    this.visible_context_menu = false;
  };

  // figure it out from the division  Division is number of notes per measure 4, 6, 8, 12, 16, 24, 32, etc...
  // Triplets only support 4/4 and 2/4 time signatures for now
  isTripletDivision(subdivision: number): boolean {
    return subdivision % 12 === 0  // we only support 12 & 24 & 48  1/8th, 1/16, & 1/32 note triplets
  }

  // figure out if it is triplets from the number of notes (implied division)
  isTripletDivisionFromNotesPerMeasure(notesPerMeasure: number, timeSig: TimeSignature): boolean {
    return this.isTripletDivision((notesPerMeasure / timeSig.top) * timeSig.bottom.value);
  }

  getMetronomeSolo() {
    return this.metronomeSolo;
  };

  setMetronomeSolo(bool) {
    this.metronomeSolo = bool;
  };

  getMetronomeOffsetClickStart() {
    return this.metronomeOffsetClickStart;
  };

  getMetronomeOffsetClickStartIsRotating() {
    return this.metronomeOffsetClickStart == 'ROTATE';
  };

  setMetronomeOffsetClickStart(value) {
    this.metronomeOffsetClickStart = value;
  };

  // if the Metronome offset click start is set to rotate this
  // will advance the position of the rotation and return TRUE
  // returns FALSE if rotation is OFF
  advanceMetronomeOptionsOffsetClickStartRotation() {
    if (this.getMetronomeOffsetClickStartIsRotating()) {
      this.metronomeOffsetClickStartRotation++;
      return true;
    }
    return false;
  };

  getMetronomeOptionsOffsetClickStartRotation(isTriplets) {
    if (this.getMetronomeOffsetClickStartIsRotating()) {
      // constrain the rotation
      if (isTriplets && this.metronomeOffsetClickStartRotation > 2)
        this.metronomeOffsetClickStartRotation = 0;
      else if (this.metronomeOffsetClickStartRotation > 3)
        this.metronomeOffsetClickStartRotation = 0;

      switch (this.metronomeOffsetClickStartRotation) {
        case 0:
          return '1';
        case 1:
          if (isTriplets)
            return 'TI';
          else
            return 'E';
        case 2:
          if (isTriplets)
            return 'TA';
          else
            return 'AND';
        case 3:
          return 'A';
      }
    } else {
      return this.metronomeOffsetClickStart;
    }
  };

  resetMetronomeOptionsOffsetClickStartRotation(value?) {
    // start with last in the rotation so the next rotation brings it to '1'
    return this.metronomeOffsetClickStartRotation = 0;
  };

  // takes two drum tab lines and merges them.    "-" are blanks so they will get overwritten in a merge.
  // if there are two non "-" positions to merge, the dominateLine takes priority.
  //
  //  Example    |----o-------o---|   (dominate)
  //           + |x-------x---x---|   (subordinate)
  //             |x---o---x---o---|   (result)
  //
  // this is useful to take an accent tab and an "others" tab and creating one tab out of it.
  mergeDrumTabLines(dominateLine, subordinateLine) {
    var newLine = "";
    for (var i = 0; i < Math.max(dominateLine.length, subordinateLine.length); i++) {
      const firstChar = dominateLine.charAt(i);
      const secondChar = subordinateLine.charAt(i) || '-';
      if (firstChar !== '-') {
        newLine += firstChar;
      } else if (secondChar !== '-') {
        newLine += secondChar;
      } else {
        newLine += '-';
      }
    }
    return newLine;
  };


  setupHotKeys() {

    var isCtrl = false;
    document.onkeyup = function (e) {
      if (e.which == 17)
        isCtrl = false;
    };

    document.onkeydown = (e) => {
      if (e.which == 17)
        isCtrl = true;
      /*
      if(e.which == 83 && isCtrl == true) {
      alert('CTRL-S pressed');
      return false;
      }
       */
      // only accept the event if it not going to an INPUT field
      // otherwise we can't use spacebar in text fields :(
      const target = e.target as HTMLInputElement;
      if (e.which == 32 && (target.type == "range" || (target.tagName.toUpperCase() != "INPUT" && target.tagName.toUpperCase() != "TEXTAREA"))) {

        // spacebar
        this.startOrStopMIDI_playback();
        return false;
      }
      if (e.which == 179) {
        // Play button
        this.startOrPauseMIDI_playback();
      }
      if (e.which == 178) {
        // Stop button
        this.stopMIDI_playback();
      }

      return true;
    };
  }

  // looks for modifiers like !accent! or !plus! and moves them outside of the group abc array.
  // Most modifiers (but not all) will not render correctly if they are inside the abc group.
  // returns a string that should be added to the abc_notation if found.
  moveAccentsOrOtherModifiersOutsideOfGroup(abcNoteStrings, modifier_to_look_for) {

    var found_modifier = false;
    var rindex = abcNoteStrings.notes1.lastIndexOf(modifier_to_look_for);
    if (rindex > -1) {
      found_modifier = true;
      abcNoteStrings.notes1 = abcNoteStrings.notes1.replace(modifier_to_look_for, "");
    }
    rindex = abcNoteStrings.notes2.lastIndexOf(modifier_to_look_for);
    if (rindex > -1) {
      found_modifier = true;
      abcNoteStrings.notes2 = abcNoteStrings.notes2.replace(modifier_to_look_for, "");
    }
    rindex = abcNoteStrings.notes3.lastIndexOf(modifier_to_look_for);
    if (rindex > -1) {
      found_modifier = true;
      abcNoteStrings.notes3 = abcNoteStrings.notes3.replace(modifier_to_look_for, "");
    }
    if (found_modifier)
      return modifier_to_look_for;

    return ""; // didn't find it so return nothing
  }

  // take an array of arrays and use a for loop to test to see
  // if all of the arrays are equal to the "test_value" for a given "test_index"
  // returns "true" if they are all equal.
  // returns "false" if any one of them fails
  testArrayOfArraysForEquality(array_of_arrays, test_index, test_value) {

    for (var i = 0; i < array_of_arrays.length; i++) {
      if (array_of_arrays[i][test_index] !== undefined && array_of_arrays[i][test_index] !== test_value)
        return false;
    }

    return true;
  }

  // the note grouping size is how groups of notes within a measure group
  // for 8ths and 16th we group with 4
  // for triplets we group with 3
  // This function is for laying out the HTML
  // see abc_gen_note_grouping_size for the sheet music layout grouping size
  noteGroupingSize(notes_per_measure, timeSig) {
    var note_grouping;
    var usingTriplets = this.isTripletDivisionFromNotesPerMeasure(notes_per_measure, timeSig);

    if (usingTriplets) {
      // triplets  ( we only support 2/4 here )
      if (timeSig.top != 2 && timeSig.bottom.value != 4)
        console.log("Triplets are only supported in 2/4 and 4/4 time");
      note_grouping = notes_per_measure / (timeSig.top * (4 / timeSig.bottom.value));
    } else if (timeSig.top == 3) {
      // 3/4, 3/8, 3/16
      // 3 groups
      // not triplets
      note_grouping = (notes_per_measure) / 3
    } else if (timeSig.top % 6 == 0 && timeSig.bottom.value % 8 == 0) {
      // 6/8, 12/8
      // 2 groups in 6/8 rather than 3 groups
      // 4 groups in 12/8
      // not triplets
      note_grouping = notes_per_measure / (2 * timeSig.top / 6)
    } else {
      // figure it out from the time signature
      // not triplets
      note_grouping = (notes_per_measure / timeSig.top) * (timeSig.bottom.value / 4);
    }
    return note_grouping;
  };

  notesPerMeasureInFullSizeArray(is_triplet_division, timeSig) {
    // a full measure will be defined as 8 * timeSigTop.   (4 = 32, 5 = 40, 6 = 48, etc.)
    // that implies 32nd notes in quarter note beats
    // TODO: should we support triplets here?
    if (is_triplet_division) {
      return 48 * (timeSig.top / timeSig.bottom.value);
    }

    return 32 * (timeSig.top / timeSig.bottom.value);
  }

  // since note values are 16ths or 12ths this corrects for that by multiplying note values
  // timeSigTop is the top number in a time signature (4/4, 5/4, 6/8, 7/4, etc)
  getNoteScaler(notes_per_measure, timeSig) {
    if (!timeSig.top || timeSig.top < 1 || timeSig.top > 36) {
      console.log("Error in getNoteScaler, out of range: " + timeSig.top);
      return 1.0;
    }
    if (this.isTripletDivisionFromNotesPerMeasure(notes_per_measure, timeSig))
      return Math.ceil(this.notesPerMeasureInFullSizeArray(true, timeSig) / notes_per_measure);
    return Math.ceil(this.notesPerMeasureInFullSizeArray(false, timeSig) / notes_per_measure);
  };

  // take any size array and make it larger by padding it with rests in the spaces between
  // For triplets, expands to 48 notes per measure
  // For non Triplets, expands to 32 notes per measure
  scaleNoteArrayToFullSize(note_array, grooveData) {
    const num_measures = grooveData.numberOfMeasures;
    const notes_per_measure = grooveData.notesPerMeasure;
    var scaler = this.getNoteScaler(grooveData.notesPerMeasure, grooveData.timeSig); // fill proportionally
    var retArray = [];
    var i;

    if (scaler == 1)
      return note_array; // no need to expand

    // preset to false (rest) all entries in the expanded array
    for (i = 0; i < num_measures * notes_per_measure * scaler; i++)
      retArray[i] = false;

    // sparsely fill in the return array with data from passed in array
    for (i = 0; i < num_measures * notes_per_measure; i++) {
      var ret_array_index = (i) * scaler;

      retArray[ret_array_index] = note_array[i];
    }

    return retArray;
  }

  // count the number of note positions that are not rests in all the arrays
  // FFFxFFFxF  would be 2
  count_active_notes_in_arrays(array_of_arrays, start_index, how_far_to_measure) {
    var num_active_notes = 0;

    for (var i = start_index; i < start_index + how_far_to_measure; i++) {
      for (var which_array = 0; which_array < array_of_arrays.length; which_array++) {
        if (array_of_arrays[which_array][i] !== false) {
          num_active_notes++;
          which_array = array_of_arrays.length;  // exit this inner for loop immediately
        }
      }
    }

    return num_active_notes;
  }

  // create an array that can be used for note mapping
  // it is just an array of true/false that specifies weather a note can appear at that index
  create_note_mapping_array_for_highlighting(HH_array, snare_array, kick_array, toms_array, num_notes) {
    var mapping_array = new Array(num_notes); // create large empty array

    for (var i = 0; i < num_notes; i++) {
      var hasNote = false;
      if (HH_array && HH_array[i] !== false && HH_array[i] !== null && HH_array[i] !== undefined && HH_array[i] !== '-') {
        hasNote = true;
      }
      if (snare_array && snare_array[i] !== false && snare_array[i] !== null && snare_array[i] !== undefined && snare_array[i] !== '-') {
        hasNote = true;
      }
      if (kick_array && kick_array[i] !== false && kick_array[i] !== null && kick_array[i] !== undefined && kick_array[i] !== '-') {
        hasNote = true;
      }
      if (!hasNote && toms_array) {
        for (var j = 0; j < toms_array.length; j++) {
          if (toms_array[j] && toms_array[j][i] !== undefined && toms_array[j][i] !== false && toms_array[j][i] !== null && toms_array[j][i] !== '-') {
            hasNote = true;
            break;
          }
        }
      }
      mapping_array[i] = hasNote;
    }

    return mapping_array;
  };

  // function to return 1,e,&,a or 2,3,4,5,6, etc...
  figure_out_sticking_count_for_index(index: number, notes_per_measure: number, sub_division: number, time_sig_bottom: number) {

    // figure out the count state by looking at the id and the subdivision
    const note_index = index % notes_per_measure;
    // 4/2 time changes the implied time from 4 up to 8, etc
    // 6/8 time changes the implied time from 8 down to 4
    const implied_sub_division = sub_division * (4 / time_sig_bottom);
    switch (implied_sub_division) {
      case 4:
        return note_index + 1;   // 1,2,3,4,5, etc.
      case 8:
        if (note_index % 2 === 0)
          return Math.floor(note_index / 2) + 1;  // 1,2,3,4,5, etc.
        else
          return "&";
      case 12:  // 8th triplets
        if (note_index % 3 === 0)
          return Math.floor(note_index / 3) + 1;  // 1,2,3,4,5, etc.
        else if (note_index % 3 == 1)
          return "&";
        else
          return "a";
      case 24:  // 16th triplets
        if (note_index % 3 === 0)
          return Math.floor(note_index / 6) + 1;  // 1,2,3,4,5, etc.
        else if (note_index % 3 == 1)
          return "&";
        else
          return "a";
      case 48:  // 32nd triplets
        if (note_index % 3 === 0)
          return Math.floor(note_index / 12) + 1;  // 1,2,3,4,5, etc.
        else if (note_index % 3 == 1)
          return "&";
        else
          return "a";
      case 16:
      case 32:  // fall through
      default:
        var whole_note_interval = implied_sub_division / 4;
        if (note_index % 4 === 0)
          return Math.floor(note_index / whole_note_interval) + 1;  // 1,1,2,2,3,3,4,4,5,5, etc.
        else if (note_index % 4 === 1)
          return "e";
        else if (note_index % 4 === 2)
          return "&";
        else
          return "a";
    }
  };

  // converts the symbol for a sticking count to an actual count based on the time signature
  convert_sticking_counts_to_actual_counts(sticking_array: Array<string>, time_division: number, timeSig: TimeSignature): void {

    var cur_div_of_array = 32;
    if (this.isTripletDivision(time_division))
      cur_div_of_array = 48;

    var actual_notes_per_measure_in_this_array = this.notesPerMeasureInFullSizeArray(cur_div_of_array === 48, timeSig);

    // Time division is 4, 8, 16, 32, 12, 24, or 48
    var notes_per_measure_in_time_division = ((time_division / 4) * timeSig.top) * (4 / timeSig.bottom.value);

    for (var i in sticking_array) {
      if (sticking_array[i] == '"count"x') {
        // convert the COUNT into an actual letter or number
        // convert the index into what it would have been if the array was "notes_per_measure" sized
        var adjusted_index = Math.floor(Number(i) / (actual_notes_per_measure_in_this_array / notes_per_measure_in_time_division));
        var new_count = this.figure_out_sticking_count_for_index(adjusted_index, notes_per_measure_in_time_division, time_division, timeSig.bottom.value);
        var new_count_string = '"' + new_count + '"x';
        sticking_array[i] = new_count_string;
      }
    }
  };

  // converts incoming ABC notation source into an svg image.
  // returns an object with two items.   "svg" and "error_html"
  renderABCtoSVG(abcString: string): { svg: string, error_html: string } {
    this.abcNoteNumIndex = 0;
    this.abcToSVGCallback.abcNoteNumIndex = 0;
    this.abcToSVGCallback.grooveUtilsUniqueIndex = this.grooveUtilsUniqueIndex;
    this.abcToSVGCallback.abc_svg_output = ''; // clear
    this.abcToSVGCallback.abc_error_output = ''; // clear

    // "SOURCE" is the file name, for error messagse only.
    this.abc_obj.tosvg("SOURCE", abcString);
    return {
      svg: this.abcToSVGCallback.abc_svg_output,
      error_html: this.abcToSVGCallback.abc_error_output
    };
  }

  isElementOnScreen(element) {
    var rect = element.getBoundingClientRect();

    return (
      rect.top >= 80 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && /*or $(window).height() */
      rect.right <= (window.innerWidth || document.documentElement.clientWidth) /*or $(window).width() */
    );
  };

  clearHighlightNoteInABCSVG() {

    if (this.abcNoteNumCurrentlyHighlighted > -1) {
      var myElements = document.querySelectorAll("#abcNoteNum_" + this.grooveUtilsUniqueIndex + "_" + this.abcNoteNumCurrentlyHighlighted);
      for (var i = 0; i < myElements.length; i++) {
        var class_name = myElements[i].getAttribute("class") || "";
        myElements[i].setAttribute("class", class_name.replace(new RegExp(' highlighted', 'g'), ""));
        if (this.data && this.data.debugMode && i === 0) {
          if (!this.isElementOnScreen(myElements[i]) && typeof myElements[i].scrollIntoView === 'function') {
            if (this.abcNoteNumCurrentlyHighlighted === 0)
              myElements[i].scrollIntoView({ block: "start", behavior: "smooth" });   // autoscroll if necessary
            else
              myElements[i].scrollIntoView({ block: "end", behavior: "smooth" });   // autoscroll if necessary
          }
        }
      }
      this.abcNoteNumCurrentlyHighlighted = -1;
    }
  };

  // set note to -1 to unhighlight all notes
  highlightNoteInABCSVGByIndex(noteToHighlight) {

    this.clearHighlightNoteInABCSVG();

    if (noteToHighlight < 0) {
      return;
    }

    var myElements = document.querySelectorAll("#abcNoteNum_" + this.grooveUtilsUniqueIndex + "_" + noteToHighlight);
    for (var i = 0; i < myElements.length; i++) {
      var class_name = myElements[i].getAttribute("class") || "";
      if (!class_name.includes("highlighted")) {
        myElements[i].setAttribute("class", class_name + " highlighted");
      }
      this.abcNoteNumCurrentlyHighlighted = noteToHighlight;
    }
  };

  // cross index the percent complete with the myGrooveData note arrays to find the nth note
  // Then highlight the note
  highlightNoteInABCSVGFromPercentComplete(percentComplete) {

    if (this.note_mapping_array !== null && this.note_mapping_array.length > 0) {
      // convert percentComplete to an index
      var curNoteIndex = Math.floor(percentComplete * this.note_mapping_array.length);
      if (curNoteIndex >= this.note_mapping_array.length) {
        curNoteIndex = this.note_mapping_array.length - 1;
      }

      // now count through the array with the possible notes to find the note number as
      // it correlates to the ABC
      var real_note_index = -1;
      for (var i = 0; i <= curNoteIndex && i < this.note_mapping_array.length; i++) {
        if (this.note_mapping_array[i])
          real_note_index++;
      }

      // now the real_note_index should map to the correct abc note, highlight italics
      this.highlightNoteInABCSVGByIndex(real_note_index);
    }
  }

  tempoUpdate(tempo) {
    (document.getElementById('tempoTextField' + this.grooveUtilsUniqueIndex) as HTMLInputElement).value = "" + tempo;

    this.updateRangeSlider('tempoInput' + this.grooveUtilsUniqueIndex);
    this.midiNoteHasChanged();

    if (this.tempoChangeCallback)
      this.tempoChangeCallback(tempo);
  };

  // Arrow function so `this` stays bound when passed to addEventListener.
  tempoUpdateFromTextField = (event) => {
    var newTempo = event.target.value;

    (document.getElementById("tempoInput" + this.grooveUtilsUniqueIndex) as HTMLInputElement).value = newTempo;
    this.tempoUpdate(newTempo);
  };

  // Arrow function so `this` stays bound when passed to addEventListener.
  tempoUpdateFromSlider = (event) => {
    this.tempoUpdate(event.target.value);
  };

  // I love the pun here.  :)
  // nudge the tempo up by 1
  upTempo() {
    var tempo = this.getTempo();

    tempo++;

    this.setTempo(tempo);
  };

  // nudge the tempo down by 1
  downTempo() {
    var tempo = this.getTempo();

    tempo--;

    this.setTempo(tempo);
  };

  getGrooveUtilsBaseLocation() {
    return this.midiBaseLocation;
  };

  getMidiSoundFontLocation() {
    return this.getGrooveUtilsBaseLocation() + "soundfont/";
  };
  getMidiImageLocation() {
    return this.getGrooveUtilsBaseLocation() + "images/";
  };

  // set a URL for midi playback.
  // useful for static content, so you don't have to override the loadMidiDataEvent callback
  setGrooveData(grooveData: GrooveData) {
    this.data = grooveData;
    this.grooveData = grooveData;
  };

  // This is called so that the MIDI player will reload the groove
  // at repeat time.   If not set then the midi player just repeats what is already loaded.
  midiNoteHasChanged() {
    this.midiEventCallbacks.noteHasChangedSinceLastDataLoad = true;
  };
  midiResetNoteHasChanged() {
    this.midiEventCallbacks.noteHasChangedSinceLastDataLoad = false;
  };

  MIDI_build_midi_url_count_in_track(timeSig: TimeSignature) {

    var midiFile = new Midi.File();
    var midiTrack = new Midi.Track();
    midiFile.addTrack(midiTrack);

    midiTrack.setTempo(this.getTempo());
    midiTrack.setInstrument(0, 0x13);

    // start of midi track
    // Some sort of bug in the midi player makes it skip the first note without a blank
    // TODO: Find and fix midi bug
    midiTrack.addNoteOff(9, 60, 1); // add a blank note for spacing

    var noteDelay = 128;  // quarter notes over x/4 time
    if (timeSig.bottom.value == 8)
      noteDelay = 64;  // 8th notes over x/8 time
    else if (timeSig.bottom.value == 16)
      noteDelay = 32;  // 16th notes over x/16 time

    // add count in
    midiTrack.addNoteOn(9, MIDI_METRONOME_1, 0, MIDI_VELOCITY_NORMAL);
    midiTrack.addNoteOff(9, MIDI_METRONOME_1, noteDelay);
    for (var i = 1; i < timeSig.top; i++) {
      midiTrack.addNoteOn(9, MIDI_METRONOME_NORMAL, 0, MIDI_VELOCITY_NORMAL);
      midiTrack.addNoteOff(9, MIDI_METRONOME_NORMAL, noteDelay);
    }

    var midi_url = "data:audio/midi;base64," + btoa(midiFile.toBytes());

    return midi_url;
  };

  /*
   * midi_output_type:  "general_MIDI" or "Custom"
   * num_notes: number of notes in the arrays  (currently expecting 32 notes per measure)
   * metronome_frequency: 0, 4, 8, 16   None, quarter notes, 8th notes, 16ths
   * num_notes_for_swing: how many notes are we using.   Since we need to know where the upstrokes are we need to know
   *                      what the proper division is.   It can change when we are doing permutations, otherwise it is what is the
   *                      class_notes_per_measure
   *
   * The arrays passed in contain the ABC notation for a given note value or false for a rest.
   */
  MIDI_from_HH_Snare_Kick_Arrays(midiTrack, HH_Array, Snare_Array, Kick_Array, Toms_Array, midi_output_type, metronome_frequency, num_notes, num_notes_for_swing, swing_percentage, timeSig) {
    var prev_hh_note: any = 46;  // default to open hi-hat so that the first hi-hat note also mutes any previous hh open.
    var midi_channel = 9;  // percussion

    if (swing_percentage < 0 || swing_percentage > 0.99) {
      console.log("Swing percentage out of range in GrooveUtils.MIDI_from_HH_Snare_Kick_Arrays");
      swing_percentage = 0;
    }

    // start of midi track
    // Some sort of bug in the midi player makes it skip the first note without a blank
    // TODO: Find and fix midi bug
    if (midiTrack.events.length < 4) {
      midiTrack.addNoteOff(midi_channel, 60, 1); // add a blank note for spacing
    }

    var isTriplets = this.isTripletDivisionFromNotesPerMeasure(num_notes, timeSig);
    var offsetClickStartBeat = this.getMetronomeOptionsOffsetClickStartRotation(isTriplets);
    var delay_for_next_note = 0;

    for (var i = 0; i < num_notes; i++) {

      // 16 ticks per 32nd note in straight, 10.666 per 48th in triplets.
      const baseDuration = isTriplets ? 10.666 : 16;
      const duration = swingAdjustedDuration(i, baseDuration, swing_percentage, num_notes, num_notes_for_swing);

      if (metronome_frequency > 0) {
        const sixteenthNoteFrequency = 2;
        const metronome_specific_index = i - metronomeOffsetShift(offsetClickStartBeat, isTriplets, sixteenthNoteFrequency);
        const metronomeHit = metronomeNoteAt(metronome_specific_index, metronome_frequency, isTriplets, timeSig);
        if (metronomeHit !== null) {
          midiTrack.addNoteOn(midi_channel, metronomeHit.note, delay_for_next_note, metronomeHit.velocity);
          delay_for_next_note = 0;
        }
      }

      if (!this.metronomeSolo) { // midiSolo means to play just the metronome
        const hhLookup = hihatMidiFor(HH_Array[i], midi_output_type);
        const hh_note: any = hhLookup ? hhLookup.note : false;
        const hh_velocity = hhLookup ? hhLookup.velocity : MIDI_VELOCITY_NORMAL;

        if (hh_note !== false) {
          // need to end hi-hat open notes else the hh open sounds horrible
          if (prev_hh_note !== false) {
            midiTrack.addNoteOff(midi_channel, prev_hh_note, delay_for_next_note);
            prev_hh_note = false;
            delay_for_next_note = 0; // zero the delay
          }
          midiTrack.addNoteOn(midi_channel, hh_note, delay_for_next_note, hh_velocity);
          delay_for_next_note = 0; // zero the delay

          // this if means that only the open hi-hat will get stopped on the next note
          if (HH_Array[i] == constant_ABC_HH_Open)
            prev_hh_note = hh_note;
        }

        const snLookup = snareMidiFor(Snare_Array[i], midi_output_type);
        const snare_note: any = snLookup ? snLookup.note : false;
        const snare_velocity = snLookup ? snLookup.velocity : MIDI_VELOCITY_NORMAL;

        if (snare_note !== false) {
          //if(prev_snare_note != false)
          //	midiTrack.addNoteOff(midi_channel, prev_snare_note, 0);
          midiTrack.addNoteOn(midi_channel, snare_note, delay_for_next_note, snare_velocity);
          delay_for_next_note = 0; // zero the delay
          //prev_snare_note = snare_note;
        }

        const kickLookup = kickMidiFor(Kick_Array[i]);
        const kick_note: any = kickLookup.kick !== null ? kickLookup.kick : false;
        const kick_splash_note: any = kickLookup.splash !== null ? kickLookup.splash : false;
        if (kick_note !== false) {
          //if(prev_kick_note != false)
          //	midiTrack.addNoteOff(midi_channel, prev_kick_note, 0);
          midiTrack.addNoteOn(midi_channel, kick_note, delay_for_next_note, MIDI_VELOCITY_NORMAL);
          delay_for_next_note = 0; // zero the delay
          //prev_kick_note = kick_note;
        }
        if (kick_splash_note !== false) {
          if (prev_hh_note !== false) {
            midiTrack.addNoteOff(midi_channel, prev_hh_note, delay_for_next_note);
            prev_hh_note = false;
            delay_for_next_note = 0; // zero the delay
          }
          //if(prev_kick_splash_note != false)
          //	midiTrack.addNoteOff(midi_channel, prev_kick_splash_note, 0);
          midiTrack.addNoteOn(midi_channel, kick_splash_note, delay_for_next_note, MIDI_VELOCITY_NORMAL);
          delay_for_next_note = 0; // zero the delay
          //prev_kick_splash_note = kick_splash_note;
        }

        if (Toms_Array) {
          for (var which_array = 0; which_array < constant_NUMBER_OF_TOMS; which_array++) {
            const tomLookup = tomMidiFor(Toms_Array[which_array]?.[i]);
            if (tomLookup !== null) {
              midiTrack.addNoteOn(midi_channel, tomLookup, delay_for_next_note, MIDI_VELOCITY_NORMAL);
              delay_for_next_note = 0;
            }
          }
        }

      } // end metronomeSolo

      delay_for_next_note += duration;
    }

    if (delay_for_next_note)
      midiTrack.addNoteOff(0, 60, delay_for_next_note - 1); // add a blank note for spacing

  }; // end of function

  // returns a URL that is a MIDI track
  create_MIDIURLFromGrooveData(myGrooveData, MIDI_type) {

    var midiFile = new Midi.File();
    var midiTrack = new Midi.Track();
    midiFile.addTrack(midiTrack);

    midiTrack.setTempo(myGrooveData.tempo);
    midiTrack.setInstrument(0, 0x13);

    var swing_percentage = myGrooveData.swingPercent / 100;

    // the midi converter expects all the arrays to be 32 or 48 notes long.
    // Expand them
    var FullNoteHHArray = this.scaleNoteArrayToFullSize(myGrooveData.hh_array, myGrooveData);
    var FullNoteSnareArray = this.scaleNoteArrayToFullSize(myGrooveData.snare_array, myGrooveData);
    var FullNoteKickArray = this.scaleNoteArrayToFullSize(myGrooveData.kick_array, myGrooveData);

    // the midi functions expect just one measure at a time to work correctly
    // call once for each measure
    var measure_notes = FullNoteHHArray.length / myGrooveData.numberOfMeasures;
    for (var measureIndex = 0; measureIndex < myGrooveData.numberOfMeasures; measureIndex++) {

      var FullNoteTomsArray = [];
      for (var i = 0; i < constant_NUMBER_OF_TOMS; i++) {
        var orig_measure_notes = myGrooveData.notesPerMeasure;
        FullNoteTomsArray[i] = this.scaleNoteArrayToFullSize(myGrooveData.toms_array[i].slice(orig_measure_notes * measureIndex, orig_measure_notes * (measureIndex + 1)), myGrooveData);
      }

      this.MIDI_from_HH_Snare_Kick_Arrays(midiTrack,
        FullNoteHHArray.slice(measure_notes * measureIndex, measure_notes * (measureIndex + 1)),
        FullNoteSnareArray.slice(measure_notes * measureIndex, measure_notes * (measureIndex + 1)),
        FullNoteKickArray.slice(measure_notes * measureIndex, measure_notes * (measureIndex + 1)),
        FullNoteTomsArray,
        MIDI_type,
        myGrooveData.metronomeFrequency,
        measure_notes,
        myGrooveData.timeDivision,
        swing_percentage,
        myGrooveData.timeSig);
    }

    var allTomsScaled = [];
    if (myGrooveData.toms_array) {
      for (var i = 0; i < constant_NUMBER_OF_TOMS; i++) {
        if (myGrooveData.toms_array[i]) {
          allTomsScaled[i] = this.scaleNoteArrayToFullSize(myGrooveData.toms_array[i], myGrooveData);
        }
      }
    }
    this.note_mapping_array = this.create_note_mapping_array_for_highlighting(
      FullNoteHHArray,
      FullNoteSnareArray,
      FullNoteKickArray,
      allTomsScaled.length > 0 ? allTomsScaled : null,
      FullNoteHHArray.length
    );

    var midi_url = "data:audio/midi;base64," + btoa(midiFile.toBytes());

    return midi_url;
  };

  loadMIDIFromURL(midiURL) {

    MIDI.Player.timeWarp = 1; // speed the song is played back
    MIDI.Player.BPM = this.getTempo();
    MIDI.Player.loadFile(midiURL, this.midiLoaderCallback());
  };

  MIDISaveAs(midiURL) {

    // save as
    document.location = midiURL;
  };

  pauseMIDI_playback() {
    if (this.isMIDIPaused === false) {
      this.isMIDIPaused = true;
      this.midiEventCallbacks.pauseEvent();
      MIDI.Player.pause();
      this.midiEventCallbacks.notePlaying("clear", -1);
      this.clearHighlightNoteInABCSVG();
    }
  };

  // play button or keypress
  startMIDI_playback() {
    if (MIDI.Player.playing) {
      return;
    } else if (this.isMIDIPaused && false === this.midiEventCallbacks.doesMidiDataNeedRefresh()) {
      global_current_midi_start_time = new Date();
      global_last_midi_update_time = 0;
      MIDI.Player.resume();
    } else {
      MIDI.Player.ctx.resume();
      global_current_midi_start_time = new Date();
      global_last_midi_update_time = 0;
      this.midiEventCallbacks.loadMidiDataEvent(true);
      MIDI.Player.stop();
      MIDI.Player.loop(this.shouldMIDIRepeat); // set the loop parameter
      MIDI.Player.start();
    }
    this.midiEventCallbacks.playEvent();
    this.isMIDIPaused = false;
  };

  // stop button or keypress
  stopMIDI_playback() {
    if (MIDI.Player.playing || this.isMIDIPaused) {
      this.isMIDIPaused = false;
      MIDI.Player.stop();
      this.midiEventCallbacks.stopEvent();
      this.midiEventCallbacks.notePlaying("clear", -1);
      this.clearHighlightNoteInABCSVG();
      this.resetMetronomeOptionsOffsetClickStartRotation()
    }
  };

  // modal play/stop button
  startOrStopMIDI_playback() {

    if (MIDI.Player.playing) {
      this.stopMIDI_playback();
    } else {
      this.startMIDI_playback();
    }
  };

  // modal play/pause button
  startOrPauseMIDI_playback() {

    if (MIDI.Player.playing) {
      this.pauseMIDI_playback();
    } else {
      this.startMIDI_playback();
    }
  };

  isPlaying() {
    return MIDI.Player.playing;
  };

  // Arrow function so `this` stays bound when passed to addEventListener.
  repeatMIDI_playback = () => {
    if (this.shouldMIDIRepeat === false) {
      this.shouldMIDIRepeat = true;
      MIDI.Player.loop(true);
    } else {
      this.shouldMIDIRepeat = false;
      MIDI.Player.loop(false);
    }
    this.midiEventCallbacks.repeatChangeEvent(this.shouldMIDIRepeat);
  };

  oneTimeInitializeMidi() {
    if (global_midiInitialized) {
      this.midiEventCallbacks.midiInitialized();
      return;
    }

    global_midiInitialized = true;
    console.log("Midi soundfont location: " + this.getMidiSoundFontLocation());
    var root = this;
    MIDI.loadPlugin({
      soundfontUrl: this.getMidiSoundFontLocation(),
      instruments: ["gunshot"],
      callback: function () {
        MIDI.programChange(9, 127); // use "Gunshot" instrument because I don't know how to create new ones
        root.midiEventCallbacks.midiInitialized();
      }
    });
  };

  getMidiStartTime() {
    return global_current_midi_start_time;
  };

  // calculate how long the midi has been playing total (since the last play/pause press
  // this is computationally expensive
  getMidiPlayTime() {
    var time_now = new Date();
    var play_time_diff = new Date(time_now.getTime() - global_current_midi_start_time.getTime());

    var TotalPlayTime = document.getElementById("totalPlayTime");
    if (TotalPlayTime) {
      if (global_last_midi_update_time === 0)
        global_last_midi_update_time = global_current_midi_start_time;
      var delta_time_diff = new Date(time_now.getTime() - (global_last_midi_update_time as any));
      global_total_midi_play_time_msecs += delta_time_diff.getTime();
      var totalTime = new Date(global_total_midi_play_time_msecs);
      var time_string = "";
      if (totalTime.getUTCHours() > 0)
        time_string = totalTime.getUTCHours() + ":" + (totalTime.getUTCMinutes() < 10 ? "0" : "");
      time_string += totalTime.getUTCMinutes() + ":" + (totalTime.getSeconds() < 10 ? "0" : "") + totalTime.getSeconds();
      TotalPlayTime.innerHTML = 'Total Play Time: <span class="totalTimeNum">' + time_string + '</span> notes: <span class="totalTimeNum">' + global_total_midi_notes + '</span> repetitions: <span class="totalTimeNum">' + global_total_midi_repeats + '</span>';
    }

    global_last_midi_update_time = time_now;

    return play_time_diff; // a time struct that represents the total time played so far since the last play button push
  };

  // update the midi play timer on the player.
  // Keeps track of how long we have been playing.
  updateMidiPlayTime() {
    var totalTime = this.getMidiPlayTime();
    var time_string = totalTime.getUTCMinutes() + ":" + (totalTime.getSeconds() < 10 ? "0" : "") + totalTime.getSeconds();

    var MidiPlayTime = document.getElementById("MIDIPlayTime" + this.grooveUtilsUniqueIndex);
    if (MidiPlayTime)
      MidiPlayTime.innerHTML = time_string;
  };

  //var class_midi_note_num = 0;  // global, but only used in this function
  // This is the function that the 3rd party midi library calls to give us events.
  // This is different from the callbacks that we use for the midi code in this library to
  // do events.   (Double chaining)
  ourMIDICallback(data) {
    var percentComplete = (data.now / data.end);
    this.midiEventCallbacks.percentProgress(percentComplete * 100);

    if (this.lastMidiTimeUpdate && this.lastMidiTimeUpdate < (data.now + 800)) {
      this.updateMidiPlayTime();
      this.lastMidiTimeUpdate = data.now;
    }

    if (data.now < 16) {
      // this is considered the start.   It doesn't come in at zero for some reason
      // The second note should always be at least 16 ms behind the first
      //class_midi_note_num = 0;
      this.lastMidiTimeUpdate = -1;
    }
    if (data.now == data.end) {

      // at the end of a song
      this.midiEventCallbacks.notePlaying("complete", 1);

      if (this.shouldMIDIRepeat) {

        global_total_midi_repeats++;

        // regenerate the MIDI if the data needs refreshing or the OffsetClick is rotating every time
        // advanceMetronomeOptionsOffsetClickStartRotation will return false if not rotating
        if (this.advanceMetronomeOptionsOffsetClickStartRotation() || this.midiEventCallbacks.doesMidiDataNeedRefresh()) {
          MIDI.Player.stop();
          this.midiEventCallbacks.loadMidiDataEvent(false);
          MIDI.Player.start();
          //  } else {
          // let midi.loop handle the repeat for us
          //MIDI.Player.stop();
          //MIDI.Player.start();
        }
        if (this.repeatCallback) {
          this.repeatCallback();
        }
      } else {
        // not repeating, so stopping
        MIDI.Player.stop();
        this.midiEventCallbacks.percentProgress(100);
        this.midiEventCallbacks.stopEvent();
      }
    }

    // note on
    var note_type: any = false;
    if (data.message == 144) {
      if (data.note == MIDI_METRONOME_1 || data.note == MIDI_METRONOME_NORMAL) {
        note_type = "metronome";
      } else if (data.note == MIDI_HIHAT_NORMAL || data.note == MIDI_HIHAT_OPEN ||
        data.note == MIDI_HIHAT_ACCENT || data.note == MIDI_HIHAT_CRASH ||
        data.note == MIDI_HIHAT_RIDE || data.note == MIDI_HIHAT_STACKER ||
        data.note == MIDI_HIHAT_RIDE_BELL || data.note == MIDI_HIHAT_COW_BELL ||
        data.note == MIDI_HIHAT_METRONOME_NORMAL || data.note == MIDI_HIHAT_METRONOME_NORMAL) {
        note_type = "hi-hat";
      } else if (data.note == MIDI_SNARE_NORMAL || data.note == MIDI_SNARE_ACCENT ||
        data.note == MIDI_SNARE_GHOST || data.note == MIDI_SNARE_XSTICK ||
        data.note == MIDI_SNARE_FLAM || data.note == MIDI_SNARE_DRAG ||
        data.note == MIDI_SNARE_BUZZ) {
        note_type = "snare";
      } else if (data.note == MIDI_KICK_NORMAL || data.note == MIDI_HIHAT_FOOT) {
        note_type = "kick";
      } else if (data.note == MIDI_TOM1_NORMAL || data.note == MIDI_TOM2_NORMAL || data.note == MIDI_TOM3_NORMAL || data.note == MIDI_TOM4_NORMAL) {
        note_type = "tom";
      }
      if (note_type) {
        global_total_midi_notes++;
        this.midiEventCallbacks.notePlaying(note_type, percentComplete);
        this.highlightNoteInABCSVGFromPercentComplete(percentComplete);
        if (this.noteCallback) {
          this.noteCallback(note_type);
        }
      }
    }

    // this used to work when we used note 60 as a spacer between chords
    //if(data.note == 60)
    //	class_midi_note_num++;
    /*
    if (0 && data.message == 144) {
    debug_note_count++;
    // my debugging code for midi
    var newHTML = "";
    if (data.note != 60)
    newHTML += "<b>";

    newHTML += note_type + " total notes: " + debug_note_count + " - count#: " + class_midi_note_num +
    " now: " + data.now +
    " note: " + data.note +
    " message: " + data.message +
    " channel: " + data.channel +
    " velocity: " + data.velocity +
    "<br>";

    if (data.note != 60)
    newHTML += "</b>";

    document.getElementById("midiTextOutput").innerHTML += newHTML;
    }
     */
  }

  midiLoaderCallback() {
    MIDI.Player.addListener((data) => this.ourMIDICallback(data));
  }

  getTempo() {
    var tempoInput = document.getElementById("tempoInput" + this.grooveUtilsUniqueIndex) as HTMLInputElement;
    var tempo = constant_DEFAULT_TEMPO;

    if (tempoInput) {
      tempo = parseInt(tempoInput.value, 10);
      if (tempo < 19 && tempo > 281)
        tempo = constant_DEFAULT_TEMPO;
    }

    return tempo;
  };

  // we need code to make the range slider colors update properly
  updateRangeSlider(sliderID) {

    var slider = document.getElementById(sliderID) as HTMLInputElement;
    var programaticCSSRules = document.getElementById(sliderID + "CSSRules");
    if (!programaticCSSRules) {
      // create a new one.
      programaticCSSRules = document.createElement('style');
      programaticCSSRules.id = sliderID + "CSSRules";
      document.body.appendChild(programaticCSSRules);
    }

    var style_before = document.defaultView.getComputedStyle(slider, ":before");
    var style_after = document.defaultView.getComputedStyle(slider, ":after");
    var before_color = style_before.getPropertyValue('color');
    var after_color = style_after.getPropertyValue('color');

    // change the before and after colors of the slider using a gradiant
    var percent = Math.ceil(((Number(slider.value) - Number(slider.min)) / (Number(slider.max) - Number(slider.min))) * 100);

    var new_style_str = '#' + sliderID + '::-moz-range-track' + '{ background: -moz-linear-gradient(left, ' + before_color + ' ' + percent + '%, ' + after_color + ' ' + percent + '%)}\n';
    new_style_str += '#' + sliderID + '::-webkit-slider-runnable-track' + '{ background: -webkit-linear-gradient(left, ' + before_color + ' ' + '0%, ' + before_color + ' ' + percent + '%, ' + after_color + ' ' + percent + '%)}\n';
    programaticCSSRules.textContent = new_style_str;

  }

  // update the tempo string display
  // called by the oninput handler everytime the range slider changes
  setSwingSlider(newSetting) {
    (document.getElementById("swingInput" + this.grooveUtilsUniqueIndex) as HTMLInputElement).value = newSetting;
    this.updateRangeSlider('swingInput' + this.grooveUtilsUniqueIndex);
  };

  swingEnabled(trueElseFalse) {
    this.swingIsEnabled = trueElseFalse;
    if (this.swingIsEnabled === false) {
      this.setSwing(0);
    } else {
      this.swingUpdateText(this.getSwing()); // remove N/A label
    }
  };

  getSwing() {
    var swing = 0;

    if (this.swingIsEnabled) {
      var swingInput = document.getElementById("swingInput" + this.grooveUtilsUniqueIndex) as HTMLInputElement;

      if (swingInput) {
        swing = parseInt(swingInput.value, 10);
        if (swing < 0 || swing > 60)
          swing = 0;
      }
    }

    return (swing);
  };

  // used to update the on screen swing display
  // also the onClick handler for the swing slider
  swingUpdateText(swingAmount) {

    if (this.swingIsEnabled === false) {
      document.getElementById('swingOutput' + this.grooveUtilsUniqueIndex).innerHTML = "N/A";
    } else {
      document.getElementById('swingOutput' + this.grooveUtilsUniqueIndex).innerHTML = "" + swingAmount + "%";
      this.swingPercent = swingAmount;
      this.midiNoteHasChanged();
    }

  };

  setSwing(swingAmount) {
    if (this.swingIsEnabled === false)
      swingAmount = 0;
    this.setSwingSlider(swingAmount);
    this.swingUpdateText(swingAmount);  // update the output
  };

  // Arrow function so `this` stays bound when passed to addEventListener.
  swingUpdateEvent = (event) => {
    if (this.swingIsEnabled === false) {
      this.setSwingSlider(0);
    } else {
      this.swingUpdateText(event.target.value);
      this.updateRangeSlider('swingInput' + this.grooveUtilsUniqueIndex);
    }
  };

  // Stub: pre-refactor code called this to toggle count-in on the metronome.
  // No corresponding logic exists yet; treat as no-op to preserve UI state on caller side.
  setMetronomeCountIn(enabled: boolean) {
    // intentional no-op
  }

  setMetronomeFrequencyDisplay(newFrequency) {
    var mm = document.getElementById('midiMetronomeMenu' + this.grooveUtilsUniqueIndex);

    if (mm) {
      mm.className = mm.className.replace(" selected", "");

      if (newFrequency > 0) {
        mm.className += " selected";
      }
    }
  };

  // open a new tab with GrooveScribe with the current groove
  // Arrow function so `this` stays bound when passed to addEventListener.
  loadFullScreenGrooveScribe = () => {
    var fullURL = (this as any).getUrlStringFromGrooveData(this.myGrooveData, 'fullGrooveScribe')

    var win = window.open(fullURL, '_blank');
    win.focus();
  };


  // turn the metronome on and off
  // Arrow function so `this` stays bound when passed to addEventListener.
  metronomeMiniMenuClick = () => {
    if (this.myGrooveData.metronomeFrequency > 0)
      this.myGrooveData.metronomeFrequency = 0;
    else
      this.myGrooveData.metronomeFrequency = 4;

    this.setMetronomeFrequencyDisplay(this.myGrooveData.metronomeFrequency);
    this.midiNoteHasChanged();
  };

  expandOrRetractMIDI_playback(force, expandElseContract) {

    var playerControlElement = document.getElementById('playerControl' + this.grooveUtilsUniqueIndex);
    var playerControlRowElement = document.getElementById('playerControlsRow' + this.grooveUtilsUniqueIndex);
    var tempoAndProgressElement = document.getElementById('tempoAndProgress' + this.grooveUtilsUniqueIndex);
    var midiMetronomeMenuElement = document.getElementById('midiMetronomeMenu' + this.grooveUtilsUniqueIndex);
    var gsLogoLoadFullGSElement = document.getElementById('midiGSLogo' + this.grooveUtilsUniqueIndex);
    var midiExpandImageElement = document.getElementById('midiExpandImage' + this.grooveUtilsUniqueIndex);
    var midiPlayTime = document.getElementById('MIDIPlayTime' + this.grooveUtilsUniqueIndex);

    if (playerControlElement.className.indexOf("small") > -1 || (force && expandElseContract)) {
      // make large
      playerControlElement.className = playerControlElement.className.replace(" small", "") + " large";
      playerControlRowElement.className = playerControlRowElement.className.replace(" small", "") + " large";
      tempoAndProgressElement.className = tempoAndProgressElement.className.replace(" small", "") + " large";
      midiMetronomeMenuElement.className = midiMetronomeMenuElement.className.replace(" small", "") + " large";
      gsLogoLoadFullGSElement.className = gsLogoLoadFullGSElement.className.replace(" small", "") + " large";
      midiExpandImageElement.className = midiExpandImageElement.className.replace(" small", "") + " large";
      midiPlayTime.className = midiPlayTime.className.replace(" small", "") + " large";
    } else {
      // make small
      playerControlElement.className = playerControlElement.className.replace(" large", "") + " small";
      playerControlRowElement.className = playerControlRowElement.className.replace(" large", "") + " small";
      midiMetronomeMenuElement.className = midiMetronomeMenuElement.className.replace(" large", "") + " small";
      tempoAndProgressElement.className = tempoAndProgressElement.className.replace(" large", "") + " small";
      gsLogoLoadFullGSElement.className = gsLogoLoadFullGSElement.className.replace(" large", "") + " small";
      midiExpandImageElement.className = midiExpandImageElement.className.replace(" large", "") + " small";
      midiPlayTime.className = midiPlayTime.className.replace(" large", "") + " small";
    }

  };

  addInlineMetronomeSVG() {
    return '<svg class="midiMetronomeImage" version="1.1" width="30" height="30"' +
      'xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 100 100" enable-background="new 0 0 100 100" ' +
      'xml:space="preserve"><path d="M86.945,10.635c-0.863-0.494-1.964-0.19-2.455,0.673l-8.31,14.591l-2.891-1.745l-1.769,9.447l0.205,0.123' +
      'l-1.303,2.286L63.111,6.819c-0.25-1-1.299-1.819-2.33-1.819H37.608c-1.031,0-2.082,0.818-2.334,1.818L13.454,93.182' +
      'c-0.253,1,0.385,1.818,1.416,1.818h68.459c1.031,0,1.67-0.818,1.42-1.818L71.69,41.061l3.117-5.475l0.152,0.092l7.559-5.951' +
      'l-3.257-1.966l8.355-14.67C88.11,12.226,87.81,11.127,86.945,10.635z M71.58,70.625H54.855l12.946-22.737l5.197,20.789' +
      'C73.25,69.678,72.61,70.625,71.58,70.625z M50.714,70.625H26.57c-1.031,0-1.669-0.994-1.416-1.994L39.59,11.5' +
      'c0.253-1,1.303-1.812,2.334-1.812h14.431c1.032,0,2.081,0.725,2.331,1.725l7.854,31.421L50.714,70.625z"></path></svg>'
  }

  addInLineGScribeLogoLoneGSVG() {
    return '<?xml version="1.0"?><svg width="20" heigth="30" viewBox="0 0 60 90" xmlns="http://www.w3.org/2000/svg" xmlns:svg="http://www.w3.org/2000/svg">' +
      ' <g>' +
      '  <title>Layer 1</title>' +
      '  <g id="svg_15">' +
      '   <path fill="#000000" d="m27.467991,47.742001c-12.28299,0 -22.276001,-9.997009 -22.276001,-22.284c0,-12.27402 9.99402,-22.272 ' +
      '22.276001,-22.272c12.278019,0 22.269009,9.99799 22.269009,22.272c-0.001011,12.286991 -9.992001,22.284 -22.269009,22.284zm0,-37.078001c-8.159,0 ' +
      '-14.794981,6.644011 -14.794981,14.79801c0,8.162979 6.63599,14.791981 14.794981,14.791981c8.157009,0 14.803009,-6.629002 14.803009,-14.791981c0,-8.153999 ' +
      '-6.646,-14.79801 -14.803009,-14.79801z" id="svg_16"/>' +
      '   <path fill="#F7941E" d="m27.467991,33.90799c-4.665991,0 -8.445011,-3.786989 -8.445011,-8.446009c0,-4.653992 3.77902,-8.440981 8.445011,-8.440981c4.64999,0 ' +
      '8.444,3.786989 8.444,8.440981c0.001007,4.659029 -3.792999,8.446009 -8.444,8.446009z" id="svg_17"/>' +
      '   <g id="svg_18">' +
      '	<path fill="#000000" d="m28.13699,85.571991c-5.79599,0 -24.746,-1.138 -24.746,-15.771004c0,-0.921997 0.125,-1.834976 0.39099,-2.791977l0.09399,-0.292999l9.21902,0l-0.151,0.517967c-0.198,0.701019 ' +
      '-0.311,1.417999 -0.311,2.137024c0,6.332001 7.898991,8.583977 15.29199,8.583977c3.610991,0 15.394989,-0.626007 15.394989,-8.687988c0,-4.349014 -3.515987,-6.41901 -11.064968,-6.52301c-6.87302,0 ' +
      '-11.539001,-0.159 -15.027012,-0.983002c-3.431,-0.807007 -4.132019,-1.12698 -6.926999,-2.752987c-3.63602,-2.385014 -5.39401,-5.328003 -5.39401,-8.99802c0,-3.687992 1.854,-6.860981 ' +
      '5.668,-9.716003c0.72501,-0.502987 1.51801,-0.750977 2.37802,-0.750977c1.92099,0 3.824981,1.311977 4.16199,2.865997c0.22501,1.028992 0.48801,0.685001 -0.84,1.881992c-0.85501,0.766968 -3.64001,2.702 ' +
      '-3.64001,5.167988c0,5.662041 10.78802,5.662041 17.235021,5.662041c16.113977,0 22.693998,4.063999 22.693998,14.03598c-0.00198,14.282013 -15.29599,16.415009 ' +
      '-24.427,16.415009l-0.00001,0.000031l0,-0.000031l0,0l0,-0.000008z" id="svg_19"/>' +
      '   </g>' +
      '   <g id="svg_20">' +
      '	<path fill="#000000" d="m46.504002,15.08499c-0.225983,0 -0.423,-0.101009 -4.70599,-2.934999c-2.208023,-1.46399 -4.708023,-3.121 -5.758003,-3.72501l-1.31601,-0.75101l20.405003,0l0,5.715l-8.224003,1.370999c-0.006989,0.01501 ' +
      '-0.006989,0.03802 -0.01498,0.05801l-0.104,0.263l-0.282009,0.004l-0.000019,0.00001l0.000011,0z" id="svg_21"/>' +
      '   </g>' +
      '  </g>' +
      ' </g>' +
      '</svg>';
  }

  HTMLForMidiPlayer(expandable) {
    var newHTML = '' +
      '<div id="playerControl' + this.grooveUtilsUniqueIndex + '" class="playerControl">' +
      '	<div class="playerControlsRow" id="playerControlsRow' + this.grooveUtilsUniqueIndex + '">' +
      '		<span title="Play/Pause" class="midiPlayImage Stopped" id="midiPlayImage' + this.grooveUtilsUniqueIndex + '"></span>' +
      '       <span class="MIDIPlayTime" id="MIDIPlayTime' + this.grooveUtilsUniqueIndex + '">' + CONSTANT_Midi_play_time_zero + '</span>';

    if (expandable)
      newHTML += '' +
        '       <span title="Metronome controls" class="midiMetronomeMenu" id="midiMetronomeMenu' + this.grooveUtilsUniqueIndex + '">' +
        this.addInlineMetronomeSVG() +
        '       </span>'


    newHTML += '<span class="tempoAndProgress" id="tempoAndProgress' + this.grooveUtilsUniqueIndex + '">' +
      '			<div class="tempoRow">' +
      '				<span class="tempoLabel">BPM</span>' +
      '				<input type="text" for="tempo" class="tempoTextField" pattern="\\d+" id="tempoTextField' + this.grooveUtilsUniqueIndex + '" value="80"></input>' +
      '				<input type=range min=30 max=300 value=90 class="tempoInput' + (this.is_touch_device() ? ' touch' : '') + '" id="tempoInput' + this.grooveUtilsUniqueIndex + '" list="tempoSettings">' +
      '			</div>' +
      '			<div class="swingRow">' +
      '				<span class="swingLabel">SWING</span>' +
      '				<span for="swingAmount" class="swingOutput" id="swingOutput' + this.grooveUtilsUniqueIndex + '">0% swing</span>' +
      '				<input type=range min=0 max=50 value=0 class="swingInput' + (this.is_touch_device() ? ' touch' : '') + '" id="swingInput' + this.grooveUtilsUniqueIndex + '" list="swingSettings" step=5 >' +
      '			</div>' +
      '       </span>';

    if (expandable)
      newHTML +=
        '       <span title="Expand full screen in GrooveScribe" class="midiGSLogo" id="midiGSLogo' + this.grooveUtilsUniqueIndex + '">' +
        this.addInLineGScribeLogoLoneGSVG() +
        '       </span>' +
        '		<span title="Expand/Retract player" class="midiExpandImage" id="midiExpandImage' + this.grooveUtilsUniqueIndex + '"></span>';

    newHTML += '</div>';

    return newHTML;
  };

  // pass in a tag ID.  (not a class)
  // HTML will be put within the tag replacing whatever else was there
  AddMidiPlayerToPage(HTML_Id_to_attach_to, division, expandable) {
    var html_element = document.getElementById(HTML_Id_to_attach_to);
    if (html_element)
      html_element.innerHTML = this.HTMLForMidiPlayer(expandable);

    var browserInfo = this.getBrowserInfo();
    var isIE10 = false;
    if (browserInfo.browser == "MSIE" && parseInt(browserInfo.version, 10) < 12)
      isIE10 = true;

    // now attach the onclicks
    html_element = document.getElementById("tempoInput" + this.grooveUtilsUniqueIndex);
    if (html_element) {
      if (isIE10)
        html_element.addEventListener("click", this.tempoUpdateFromSlider, false);
      else
        html_element.addEventListener("input", this.tempoUpdateFromSlider, false);
    }

    html_element = document.getElementById("tempoTextField" + this.grooveUtilsUniqueIndex);
    if (html_element) {
      html_element.addEventListener("change", this.tempoUpdateFromTextField, false);
    }

    html_element = document.getElementById("swingInput" + this.grooveUtilsUniqueIndex);
    if (html_element) {
      if (isIE10)
        html_element.addEventListener("click", this.swingUpdateEvent, false);
      else
        html_element.addEventListener("input", this.swingUpdateEvent, false);
    }

    html_element = document.getElementById("midiRepeatImage" + this.grooveUtilsUniqueIndex);
    if (html_element) {
      html_element.addEventListener("click", this.repeatMIDI_playback, false);
    }

    html_element = document.getElementById("midiExpandImage" + this.grooveUtilsUniqueIndex);
    if (html_element) {
      html_element.addEventListener("click", () => this.expandOrRetractMIDI_playback(undefined, undefined), false);
    }

    html_element = document.getElementById("midiGSLogo" + this.grooveUtilsUniqueIndex);
    if (html_element) {
      html_element.addEventListener("click", this.loadFullScreenGrooveScribe, false);
    }

    html_element = document.getElementById("midiMetronomeMenu" + this.grooveUtilsUniqueIndex);
    if (html_element) {
      html_element.addEventListener("click", this.metronomeMiniMenuClick, false);
    }

    // enable or disable swing
    this.swingEnabled(this.doesDivisionSupportSwing(division));
  }

  getBrowserInfo() {
    var browser = navigator.appName;
    var useragent = navigator.userAgent;
    var version: string;
    switch (browser) {
      case 'Microsoft Internet Explorer':
        browser = "MSIE";
        version = useragent.substr(useragent.lastIndexOf('MSIE') + 5, 3);
        break;
      case 'Netscape':
        if (useragent.lastIndexOf('Edge/') > 0) {
          browser = "Edge";
          version = useragent.substr(useragent.lastIndexOf('Edge/') + 5, 4);
        } else if (useragent.lastIndexOf('Chrome/') > 0) {
          browser = "Chrome";
          version = useragent.substr(useragent.lastIndexOf('Chrome/') + 7, 4);
        } else if (useragent.lastIndexOf('Firefox/') > 0) {
          browser = "Firefox";
          version = useragent.substr(useragent.lastIndexOf('Firefox/') + 8, 5);
        } else if (useragent.lastIndexOf('Safari/') > 0) {
          browser = "Safari";
          version = useragent.substr(useragent.lastIndexOf('Safari/') + 7, 6);
        } else if (useragent.lastIndexOf('Trident/') > 0) {
          browser = "MSIE";
          version = useragent.substr(useragent.lastIndexOf('rv:') + 3, 4);
        } else {
          console.log("undefined browser");
        }
        break;
      case 'Opera':
        version = useragent.substr(useragent.lastIndexOf('Version/') + 8, 5);
        break;
    }
    var platform = "windows";
    if (useragent.lastIndexOf('iPhone') > 0) {
      platform = "iOS";
    } else if (useragent.lastIndexOf('iPad') > 0) {
      platform = "iOS";
    } else if (useragent.lastIndexOf('Android') > 0) {
      platform = "android";
    } else if (useragent.lastIndexOf('Macintosh') > 0) {
      platform = "mac";
    }

    return {
      "browser": browser,
      "version": version,
      "platform": platform,
      "uastring": useragent
    };
  }

  setTempo(newTempo: number) {
    if (newTempo < 19 && newTempo > 281)
      return;

    (document.getElementById("tempoInput" + this.grooveUtilsUniqueIndex) as HTMLInputElement).value = "" + newTempo;
    this.tempoUpdate(newTempo);
  };

  doesDivisionSupportSwing(division) {

    if (this.isTripletDivision(division) || division == 4)
      return false;

    return true;
  };
}

(globalThis as any).GrooveUtils = GrooveUtils;
(globalThis as any).Subdivision = Subdivision;
(globalThis as any).GrooveData = GrooveData;
(globalThis as any).TimeSignature = TimeSignature;
(globalThis as any).AbcNote = AbcNote;
(globalThis as any).DrumType = DrumType;
(globalThis as any).Measure = Measure;
globalThis.abcNoteToTabChar = abcNoteToTabChar;
globalThis.tabCharToAbcNote = tabCharToAbcNote;
(globalThis as any).getAsSet = getAsSet;
(globalThis as any).hihatMidiFor = hihatMidiFor;
(globalThis as any).snareMidiFor = snareMidiFor;
(globalThis as any).kickMidiFor = kickMidiFor;
(globalThis as any).tomMidiFor = tomMidiFor;
(globalThis as any).swingAdjustedDuration = swingAdjustedDuration;
(globalThis as any).metronomeOffsetShift = metronomeOffsetShift;
(globalThis as any).metronomeNoteAt = metronomeNoteAt;
(globalThis as any).decodeGrooveUrl = decodeGrooveUrl;
(globalThis as any).encodeGrooveQueryString = encodeGrooveQueryString;
(globalThis as any).buildMeasuresFromTabs = buildMeasuresFromTabs;
// Re-export ABC constants for tests
(globalThis as any).constant_ABC_HH_Normal = constant_ABC_HH_Normal;
(globalThis as any).constant_ABC_HH_Accent = constant_ABC_HH_Accent;
(globalThis as any).constant_ABC_HH_Open = constant_ABC_HH_Open;
(globalThis as any).constant_ABC_HH_Close = constant_ABC_HH_Close;
(globalThis as any).constant_ABC_HH_Ride = constant_ABC_HH_Ride;
(globalThis as any).constant_ABC_HH_Ride_Bell = constant_ABC_HH_Ride_Bell;
(globalThis as any).constant_ABC_HH_Cow_Bell = constant_ABC_HH_Cow_Bell;
(globalThis as any).constant_ABC_HH_Crash = constant_ABC_HH_Crash;
(globalThis as any).constant_ABC_HH_Stacker = constant_ABC_HH_Stacker;
(globalThis as any).constant_ABC_HH_Metronome_Normal = constant_ABC_HH_Metronome_Normal;
(globalThis as any).constant_ABC_HH_Metronome_Accent = constant_ABC_HH_Metronome_Accent;
(globalThis as any).constant_ABC_SN_Normal = constant_ABC_SN_Normal;
(globalThis as any).constant_ABC_SN_Accent = constant_ABC_SN_Accent;
(globalThis as any).constant_ABC_SN_Ghost = constant_ABC_SN_Ghost;
(globalThis as any).constant_ABC_SN_Flam = constant_ABC_SN_Flam;
(globalThis as any).constant_ABC_SN_Drag = constant_ABC_SN_Drag;
(globalThis as any).constant_ABC_SN_XStick = constant_ABC_SN_XStick;
(globalThis as any).constant_ABC_SN_Buzz = constant_ABC_SN_Buzz;
(globalThis as any).constant_ABC_KI_Normal = constant_ABC_KI_Normal;
(globalThis as any).constant_ABC_KI_Splash = constant_ABC_KI_Splash;
(globalThis as any).constant_ABC_KI_SandK = constant_ABC_KI_SandK;
(globalThis as any).constant_ABC_T1_Normal = constant_ABC_T1_Normal;
(globalThis as any).constant_ABC_T2_Normal = constant_ABC_T2_Normal;
(globalThis as any).constant_ABC_T3_Normal = constant_ABC_T3_Normal;
(globalThis as any).constant_ABC_T4_Normal = constant_ABC_T4_Normal;
