/*jshint multistr: true */
/*jslint browser:true devel:true */

/*global GrooveUtils, Midi, Share */
/*global MIDI, constant_MAX_MEASURES, constant_DEFAULT_TEMPO, constant_ABC_STICK_R, constant_ABC_STICK_L, constant_ABC_STICK_BOTH, constant_ABC_STICK_OFF, constant_ABC_STICK_COUNT, constant_ABC_HH_Ride, constant_ABC_HH_Ride_Bell, constant_ABC_HH_Cow_Bell, constant_ABC_HH_Crash, constant_ABC_HH_Stacker, constant_ABC_HH_Open, constant_ABC_HH_Close, constant_ABC_HH_Accent, constant_ABC_HH_Normal, constant_ABC_SN_Ghost, constant_ABC_SN_Accent, constant_ABC_SN_Normal, constant_ABC_SN_XStick, constant_ABC_SN_Buzz, constant_ABC_SN_Flam, constant_ABC_SN_Drag, constant_ABC_KI_SandK, constant_ABC_KI_Splash, constant_ABC_KI_Normal, constant_ABC_T1_Normal, constant_ABC_T2_Normal, constant_ABC_T3_Normal, constant_ABC_T4_Normal, constant_NUMBER_OF_TOMS, constant_ABC_OFF, MIDI_VELOCITY_NORMAL, MIDI_VELOCITY_ACCENT, MIDI_VELOCITY_GHOST, constant_OUR_MIDI_METRONOME_1, constant_OUR_MIDI_METRONOME_NORMAL, constant_OUR_MIDI_HIHAT_NORMAL, constant_OUR_MIDI_HIHAT_OPEN, constant_OUR_MIDI_HIHAT_ACCENT, constant_OUR_MIDI_HIHAT_CRASH, constant_OUR_MIDI_HIHAT_STACKER, constant_OUR_MIDI_HIHAT_RIDE, constant_OUR_MIDI_HIHAT_FOOT, constant_OUR_MIDI_SNARE_NORMAL, constant_OUR_MIDI_SNARE_ACCENT, constant_OUR_MIDI_SNARE_GHOST, constant_OUR_MIDI_SNARE_XSTICK, constant_OUR_MIDI_SNARE_XSTICK, constant_OUR_MIDI_SNARE_FLAM, onstant_OUR_MIDI_SNARE_DRAG, constant_OUR_MIDI_KICK_NORMAL, constant_OUR_MIDI_TOM1_NORMAL, constant_OUR_MIDI_TOM2_NORMAL, constant_OUR_MIDI_TOM4_NORMAL, constant_OUR_MIDI_TOM4_NORMAL */

interface EmbedTableData {
  repeatBegins: string;
  repeatEnds: string;
  repeatEndings: string;
  measureText: string;
}

interface EmbedMeasureRowState {
  repeatStart: boolean;
  repeatEnd: boolean;
  altEnding: string;
  textBegin: string;
  textEnd: string;
  lyrics?: string;
}

function setEmbedStatus(status: string): void {
  const statusE = document.getElementById("status");
  if (!statusE) return;
  statusE.innerHTML = "<b>" + status + "</b>";
  setTimeout(function () {
    statusE.innerHTML = "";
  }, 4000 /* ms */);
}

function encodeAfterLastColon(str: string, encode: boolean): string {
  if (!str) return "";
  return str.split(";").map(e => {
    const parts = e.trim().split(":");
    if (parts.length < 2) return e;
    var convertedPart: string;
    if (encode) {
      convertedPart = encodeURIComponent(parts[parts.length - 1]);
    } else {
      convertedPart = decodeURIComponent(parts[parts.length - 1]);
    }
    return parts.slice(0, parts.length - 1).concat([convertedPart]).join(":");
  }).join(";");
}

function parseQuery(queryString: string): Record<string, string> {
  var query: Record<string, string> = {};
  if (!queryString) return query;
  var pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
  for (var i = 0; i < pairs.length; i++) {
    if (!pairs[i]) continue;
    var pair = pairs[i].split('=');
    query[decodeURIComponent(pair[0])] = decodeURIComponent((pair[1] || '').replace(/\+/g, ' '));
  }
  return query;
}

type KeyShortcutMapping = Map<string, { type: string, note_mapping: Map<string, string> }>;

const UNDO_STACK_MAX_SIZE = 40;

const POPUP_KEY_SHORTCUT_MAPPING: KeyShortcutMapping = new Map([
  ["stickingContextMenu", {
    type: "sticking",
    note_mapping: new Map([
      ["Escape", "off"],
      ["-", "off"],
      ["r", "right"],
      ["R", "right"],
      ["l", "left"],
      ["L", "left"],
      ["b", "both"],
      ["B", "both"],
      ["c", "count"],
      ["C", "count"]])
  }],
  ["hhContextMenu", {
    type: "hh",
    note_mapping: new Map([
      ["Escape", "off"],
      ["-", "off"],
      ["x", "normal"],
      ["o", "open"],
      ["O", "open"],
      ["X", "accent"],
      ["c", "crash"],
      ["C", "crash"],
      ["r", "ride"],
      ["R", "ride"],
      ["b", "ride_bell"],
      ["B", "ride_bell"],
      ["m", "cow_bell"],
      ["M", "cow_bell"],
      ["s", "stacker"],
      ["S", "stacker"],
      ["k", "metronome_normal"],
      ["K", "metronome_accent"],
    ])
  }],
  ["hh2ContextMenu", {
    type: "hh2",
    note_mapping: new Map([
      ["Escape", "off"],
      ["-", "off"],
      ["x", "normal"],
      ["o", "open"],
      ["O", "open"],
      ["X", "accent"],
      ["c", "crash"],
      ["C", "crash"],
      ["r", "ride"],
      ["R", "ride"],
      ["b", "ride_bell"],
      ["B", "ride_bell"],
      ["m", "cow_bell"],
      ["M", "cow_bell"],
      ["s", "stacker"],
      ["S", "stacker"],
      ["k", "metronome_normal"],
      ["K", "metronome_accent"],
    ])
  }],
  ["snareContextMenu", {
    type: "snare",
    note_mapping: new Map([
      ["Escape", "off"],
      ["-", "off"],
      ["o", "normal"],
      ["O", "accent"],
      ["g", "ghost"],
      ["G", "ghost"],
      ["x", "xstick"],
      ["X", "xstick"],
      ["d", "buzz"],
      ["D", "buzz"],
      ["f", "flam"],
      ["F", "flam"]])
  }],
  ["kickContextMenu", {
    type: "kick",
    note_mapping: new Map([
      ["Escape", "off"],
      ["-", "off"],
      ["o", "normal"],
      ["O", "normal"],
      ["x", "splash"],
      ["X", "kick_and_splash"]])
  }],
  ["tom1ContextMenu", {
    type: "tom1",
    note_mapping: new Map([
      ["Escape", "off"],
      ["-", "off"],
      ["o", "normal"],
      ["O", "normal"],
      ["x", "normal"],
      ["X", "normal"],
      ["t", "normal"],
      ["T", "normal"],
      ["1", "normal"],
    ])
  }],
  ["tom4ContextMenu", {
    type: "tom4",
    note_mapping: new Map([
      ["Escape", "off"],
      ["-", "off"],
      ["o", "normal"],
      ["O", "normal"],
      ["x", "normal"],
      ["X", "normal"],
      ["t", "normal"],
      ["T", "normal"],
      ["4", "normal"],
    ])
  }]]);

// Mode name -> AbcNote per drum. Any mode not listed here (including "off")
// falls back to AbcNote.OFF via modeToNote().
const MODE_TO_NOTE: Map<string, Map<string, AbcNote>> = new Map([
  [DrumType.HIHAT.name, new Map<string, AbcNote>([
    ['normal', AbcNote.HH_NORMAL],
    ['accent', AbcNote.HH_ACCENT],
    ['open', AbcNote.HH_OPEN],
    ['close', AbcNote.HH_CLOSE],
    ['ride', AbcNote.HH_RIDE],
    ['ride_bell', AbcNote.HH_RIDE_BELl],
    ['cow_bell', AbcNote.HH_COW_BELL],
    ['crash', AbcNote.HH_CRASH],
    ['stacker', AbcNote.HH_STACKER],
    ['metronome_normal', AbcNote.HH_METRONOME_NORMAL],
    ['metronome_accent', AbcNote.HH_METRONOME_ACCENT],
  ])],
  [DrumType.HIHAT2.name, new Map<string, AbcNote>([
    ['normal', AbcNote.HH_NORMAL],
    ['accent', AbcNote.HH_ACCENT],
    ['open', AbcNote.HH_OPEN],
    ['close', AbcNote.HH_CLOSE],
    ['ride', AbcNote.HH_RIDE],
    ['ride_bell', AbcNote.HH_RIDE_BELl],
    ['cow_bell', AbcNote.HH_COW_BELL],
    ['crash', AbcNote.HH_CRASH],
    ['stacker', AbcNote.HH_STACKER],
    ['metronome_normal', AbcNote.HH_METRONOME_NORMAL],
    ['metronome_accent', AbcNote.HH_METRONOME_ACCENT],
  ])],
  [DrumType.SNARE.name, new Map<string, AbcNote>([
    ['normal', AbcNote.SN_NORMAL],
    ['accent', AbcNote.SN_ACCENT],
    ['ghost', AbcNote.SN_GHOST],
    ['xstick', AbcNote.SN_XSTICK],
    ['buzz', AbcNote.SN_BUZZ],
    ['flam', AbcNote.SN_FLAM],
    ['drag', AbcNote.SN_DRAG],
  ])],
  [DrumType.KICK.name, new Map<string, AbcNote>([
    ['normal', AbcNote.KI_NORMAL],
    ['splash', AbcNote.KI_SPLASH],
    ['kick_and_splash', AbcNote.KI_SANDK],
  ])],
  [DrumType.STICKINGS.name, new Map<string, AbcNote>([
    ['right', AbcNote.STICK_R],
    ['left', AbcNote.STICK_L],
    ['both', AbcNote.STICK_BOTH],
    ['count', AbcNote.STICK_COUNT],
  ])],
]);

function modeToNote(drumType: DrumType, mode: string): AbcNote {
  return MODE_TO_NOTE.get(drumType.name)?.get(mode) ?? AbcNote.OFF;
}

// All AbcNotes for a given drum, iteration-order preserved. Used by
// get_*_state() to find the currently-on note. HIHAT and SNARE variants that
// share html_id_prefixes must be checked in the order defined on AbcNote so
// multi-prefix notes (e.g. HH_OPEN = {hh_cross, hh_open}) resolve before their
// single-prefix bases (HH_NORMAL = {hh_cross}).
const NOTES_FOR_DRUM: Map<string, ReadonlyArray<AbcNote>> = new Map([
  [DrumType.HIHAT.name, AbcNote.HH_ALL],
  [DrumType.HIHAT2.name, AbcNote.HH_ALL],
  [DrumType.SNARE.name, AbcNote.SN_ALL],
  [DrumType.STICKINGS.name, AbcNote.STICKINGS_ALL],
  [DrumType.TOM1.name, [AbcNote.T1_NORMAL]],
  [DrumType.TOM4.name, [AbcNote.T4_NORMAL]],
]);

// ---------------------------------------------------------------------------
// Kick permutation patterns
//
// Each preset section (0..15) describes which positions in a 32-note (16th) or
// 48-note (triplet) measure get a kick ("F"). "Strait" is the vanilla preset
// bank; "minus-some-strait" is a variant that omits the very first kick when
// the pattern would otherwise start on beat 1 (used by the permutation
// generator to avoid a downbeat collision with the ostinato).
//
// Patterns are represented as { onPositions, cycleLen }: onPositions repeats
// every cycleLen indices across the array. `expandKickPattern` builds the
// final array from that description.
// ---------------------------------------------------------------------------

type KickPattern = { onPositions: number[]; cycleLen: number };

function expandKickPattern(pattern: KickPattern, length: number): Array<false | 'F'> {
  const on = new Set(pattern.onPositions);
  const out: Array<false | 'F'> = new Array(length);
  for (let i = 0; i < length; i++) {
    out[i] = on.has(i % pattern.cycleLen) ? 'F' : false;
  }
  return out;
}

// 16 preset sections for the 32-note ("straight 16ths") permutation generator.
const KICK_PATTERNS_STRAIT: ReadonlyArray<KickPattern> = [
  { onPositions: [], cycleLen: 8 },                    // 0: no notes
  { onPositions: [0], cycleLen: 8 },                   // 1: every 0
  { onPositions: [2], cycleLen: 8 },                   // 2: every 2
  { onPositions: [4], cycleLen: 8 },                   // 3: every 4
  { onPositions: [6], cycleLen: 8 },                   // 4: every 6
  { onPositions: [0, 2], cycleLen: 8 },                // 5
  { onPositions: [2, 4], cycleLen: 8 },                // 6
  { onPositions: [4, 6], cycleLen: 8 },                // 7
  { onPositions: [0, 6], cycleLen: 8 },                // 8
  { onPositions: [0], cycleLen: 4 },                   // 9: downbeats
  { onPositions: [2], cycleLen: 4 },                   // 10: upbeats
  { onPositions: [0, 2, 4], cycleLen: 8 },             // 11
  { onPositions: [2, 4, 6], cycleLen: 8 },             // 12
  { onPositions: [0, 4, 6], cycleLen: 8 },             // 13
  { onPositions: [0, 2, 6], cycleLen: 8 },             // 14
  { onPositions: [0], cycleLen: 2 },                   // 15/default: quads
];

// "Minus some" variant: sections 8, 13, and 14 skip the first kick when it
// falls on beat 1 (index 0). Everything else is identical to strait.
const MINUS_SOME_SKIP_FIRST_SECTIONS: ReadonlySet<number> = new Set([8, 13, 14]);
// Section 14 additionally skips the second kick (index 2).
const MINUS_SOME_SKIP_SECOND_SECTIONS: ReadonlySet<number> = new Set([14]);

// 48-note triplet permutation patterns. Fewer meaningful sections; unsupported
// sections fall through to the default (every 4th note).
const KICK_PATTERNS_TRIPLETS: ReadonlyMap<number, KickPattern> = new Map([
  [0, { onPositions: [], cycleLen: 12 }],
  [1, { onPositions: [0], cycleLen: 12 }],
  [2, { onPositions: [4], cycleLen: 12 }],
  [3, { onPositions: [8], cycleLen: 12 }],
  [5, { onPositions: [0, 4], cycleLen: 12 }],
  [6, { onPositions: [4, 8], cycleLen: 12 }],
  [7, { onPositions: [0, 8], cycleLen: 12 }],
]);
const KICK_PATTERN_TRIPLETS_DEFAULT: KickPattern = { onPositions: [0], cycleLen: 4 };

const KICK_STRAIT_LENGTH = 32;
const KICK_TRIPLETS_LENGTH = 48;

// Public: build the strait-16ths kick permutation array for `section`.
function kickPermutationStrait(section: number): Array<false | 'F'> {
  const pattern = KICK_PATTERNS_STRAIT[section] ?? KICK_PATTERNS_STRAIT[15];
  return expandKickPattern(pattern, KICK_STRAIT_LENGTH);
}

// Public: build the minus-some strait-16ths kick permutation array for `section`.
// Same as `kickPermutationStrait` except for sections that skip the first
// (and, for section 14, the second) kick.
function kickPermutationMinusSomeStrait(section: number): Array<false | 'F'> {
  const arr = kickPermutationStrait(section);
  if (MINUS_SOME_SKIP_FIRST_SECTIONS.has(section)) arr[0] = false;
  if (MINUS_SOME_SKIP_SECOND_SECTIONS.has(section)) arr[2] = false;
  return arr;
}

// Public: build the triplet kick permutation array for `section`.
// Permutation grid: which drum-pattern section each row represents, and which
// UI checkbox(es) gate its display. Ordered by section number 0-15.
type PermutationSection = {
  parentId: string;
  subId: string | null;
  // If set, presence of *this* id gates the subId check (case 11 uses a
  // different id for existence than for the checkbox lookup — an original
  // quirk we preserve as-is).
  subExistsId?: string;
  tripletExcluded?: boolean;
};

const PERMUTATION_SECTIONS: ReadonlyArray<PermutationSection> = [
  /*  0 Ostinato        */ { parentId: 'PermuationOptionsOstinato',  subId: 'PermuationOptionsOstinato_sub1' },
  /*  1 Singles sub1    */ { parentId: 'PermuationOptionsSingles',   subId: 'PermuationOptionsSingles_sub1' },
  /*  2 Singles sub2    */ { parentId: 'PermuationOptionsSingles',   subId: 'PermuationOptionsSingles_sub2' },
  /*  3 Singles sub3    */ { parentId: 'PermuationOptionsSingles',   subId: 'PermuationOptionsSingles_sub3' },
  /*  4 Singles sub4    */ { parentId: 'PermuationOptionsSingles',   subId: 'PermuationOptionsSingles_sub4', tripletExcluded: true },
  /*  5 Doubles sub1    */ { parentId: 'PermuationOptionsDoubles',   subId: 'PermuationOptionsDoubles_sub1' },
  /*  6 Doubles sub2    */ { parentId: 'PermuationOptionsDoubles',   subId: 'PermuationOptionsDoubles_sub2' },
  /*  7 Doubles sub3    */ { parentId: 'PermuationOptionsDoubles',   subId: 'PermuationOptionsDoubles_sub3' },
  /*  8 Doubles sub4    */ { parentId: 'PermuationOptionsDoubles',   subId: 'PermuationOptionsDoubles_sub4', tripletExcluded: true },
  /*  9 UpsDowns sub1   */ { parentId: 'PermuationOptionsUpsDowns',  subId: 'PermuationOptionsUpsDowns_sub1', tripletExcluded: true },
  /* 10 UpsDowns sub2   */ { parentId: 'PermuationOptionsUpsDowns',  subId: 'PermuationOptionsUpsDowns_sub2', tripletExcluded: true },
  /* 11 Triples sub1    */ { parentId: 'PermuationOptionsTriples',   subId: 'PermuationOptionsTriples_sub1', subExistsId: 'PermuationSubOptionsTriples1' },
  /* 12 Triples sub2    */ { parentId: 'PermuationOptionsTriples',   subId: 'PermuationOptionsTriples_sub2', tripletExcluded: true },
  /* 13 Triples sub3    */ { parentId: 'PermuationOptionsTriples',   subId: 'PermuationOptionsTriples_sub3', tripletExcluded: true },
  /* 14 Triples sub4    */ { parentId: 'PermuationOptionsTriples',   subId: 'PermuationOptionsTriples_sub4', tripletExcluded: true },
  /* 15 Quads sub1      */ { parentId: 'PermuationOptionsQuads',     subId: 'PermuationOptionsQuads_sub1', tripletExcluded: true },
];

// Cases 0, 11, and 15 originally used an "existence-optional" pattern:
// if the sub-checkbox element wasn't present in the DOM, the section was
// still enabled purely on the parent's checked state. Preserve that.
const SECTIONS_WITH_OPTIONAL_SUB: ReadonlySet<number> = new Set([0, 11, 15]);

// Pure predicate: does the given permutation section render, based only
// on checkbox state and whether we're in triplet mode? Testable without a DOM.
function shouldDisplayPermutation(
  section: number,
  isChecked: (id: string) => boolean,
  exists: (id: string) => boolean,
  isTriplets: boolean,
): boolean {
  const s = PERMUTATION_SECTIONS[section];
  if (!s) {
    console.log(`bad section in shouldDisplayPermutation: ${section}`);
    return false;
  }
  if (s.tripletExcluded && isTriplets) return false;
  if (!isChecked(s.parentId)) return false;
  if (s.subId === null) return true;

  const gateId = s.subExistsId ?? s.subId;
  if (SECTIONS_WITH_OPTIONAL_SUB.has(section) && !exists(gateId)) return true;
  return isChecked(s.subId);
}

function kickPermutationTriplets(section: number): Array<false | 'F'> {
  const pattern = KICK_PATTERNS_TRIPLETS.get(section) ?? KICK_PATTERN_TRIPLETS_DEFAULT;
  return expandKickPattern(pattern, KICK_TRIPLETS_LENGTH);
}

const PERMUTATION_PRE_ABC: ReadonlyArray<string> = [
  "P:Ostinato\n%\n%\n%Just the Ositnato\n",
  "T: \nP: Singles\n%\n%\n% singles on the \"1\"\n%\n",
  "%\n%\n% singles on the \"e\"\n%\n",
  "%\n%\n% singles on the \"&\"\n%\n",
  "%\n%\n% singles on the \"a\"\n%\n",
  "T: \nP: Doubles\n%\n%\n% doubles on the \"1\"\n%\n",
  "%\n%\n% doubles on the \"e\"\n%\n",
  "%\n%\n% doubles on the \"&\"\n%\n",
  "%\n%\n% doubles on the \"a\"\n%\n",
  "T: \nP: Down/Up Beats\n%\n%\n% upbeats on the \"1\"\n%\n",
  "%\n%\n% downbeats on the \"e\"\n%\n",
  "T: \nP: Triples\n%\n%\n% triples on the \"1\"\n%\n",
  "%\n%\n% triples on the \"e\"\n%\n",
  "%\n%\n% triples on the \"&\"\n%\n",
  "%\n%\n% triples on the \"a\"\n%\n",
  "T: \nP: Quads\n%\n%\n% quads\n%\n",
];

const PERMUTATION_POST_ABC: ReadonlyArray<string> = [
  "|\n", "\\\n", "\n", "\\\n",
  "|\n", "\\\n", "\n", "\\\n",
  "|\n", "\\\n", "|\n", "\\\n",
  "\n", "\\\n", "|\n", "|\n",
];

class GrooveWriter {
  myGrooveUtils: GrooveUtils;
  data: GrooveData;
  global_tempoChangeCallbackTimeout: number | null = null;
  class_metronome_frequency: number = 0;
  class_metronome_auto_speed_up_active: boolean = false;
  class_metronome_count_in_active: boolean = false;
  class_metronome_count_in_is_playing: boolean = false;
  class_permutation_type: string = "";
  class_advancedEditIsOn: boolean = false;
  class_cur_hh_highlight_id: number = 0;
  class_cur_tom1_highlight_id: number = 0;
  class_cur_tom4_highlight_id: number = 0;
  class_cur_snare_highlight_id: number = 0;
  class_cur_kick_highlight_id: number = 0;
  class_cur_all_notes_highlight_id: number = 0;
  insertNoteContextMenu: HTMLElement | null = null;
  class_which_index_last_clicked: number = 0;
  class_undo_stack: Array<string> = [];
  class_redo_stack: Array<string> = [];
  class_our_midi_start_time: any | null = null;
  class_our_midi_start_tempo: number = 0;
  class_our_last_midi_tempo_increase_time: any | null = null;
  class_our_last_midi_tempo_increase_remainder: number = 0;
  have_shown_mixed_division_message: boolean = false;
  class_app_title: string = "Groove Scribe";
  class_measure_for_note_label_click: number = 0;
  isMeasureContainerActive: boolean = true;
  isAudioPlaying: boolean = false;
  get isMeasureContainerSelected(): boolean {
    return this.isMeasureContainerActive;
  }
  set isMeasureContainerSelected(val: boolean) {
    this.isMeasureContainerActive = val;
  }
  selectedNoteIndex: number = 0;
  selectedInstrument: string = "snare";
  isConverting: boolean = false;
  isInitializing: boolean = false;

  constructor(grooveUtilsForTesting: GrooveUtils | null = null) {
    this.myGrooveUtils = grooveUtilsForTesting || new GrooveUtils();
    this.data = this.myGrooveUtils.data;
    if (typeof window !== "undefined" && window.location) {
      this.data.fromUrl(window.location.search);
      (window as any).myGrooveWriter = this;
    }
  }

  usingTriplets(): boolean {
    return this.data.subdivision.isTriplet();
  }

  removeClass(element: HTMLElement, cssClass: string): void {
    element.classList.remove(cssClass);
  }

  addClass(element: HTMLElement | null, cssClass: string, addElseRemove: boolean = true): boolean {
    if (!element) return false;
    if (addElseRemove) {
      element.classList.add(cssClass);
      return true;
    }
    if (element.classList.contains(cssClass)) {
      element.classList.remove(cssClass);
      return true;
    }
    return false;
  }

  addClassById(elementId: string, cssClass: string, addElseRemove: boolean = true): boolean {
    const element = document.getElementById(elementId);
    if (!element) {
      console.log("addClassById: element not found for id: ", elementId);
      return false;
    }
    return this.addClass(element, cssClass, addElseRemove);
  }

  numberOfMeasures(): number {
    return this.data.numberOfMeasures;
  }

  notesPerMeasure(): number {
    return this.data.notesPerMeasure;
  }

  setNoteState(elementId: string, state: "on" | "off" | "hidden"): void {
    const element = document.getElementById(elementId);
    if (!element) {
      return;
    }
    element.classList.remove("note-on");
    element.classList.remove("note-off");
    element.classList.remove("note-hidden");
    element.classList.add("note-" + state);
  }

  isNoteOn(id: string): boolean {
    const element = document.getElementById(id);
    if (!element) return false;
    return element.classList.contains("note-on");
  }

  getNoteState(id: string): "on" | "off" | "hidden" {
    const element = document.getElementById(id);
    if (!element) {
      return "off";
    }
    if (element.classList.contains("note-on")) {
      return "on";
    }
    if (element.classList.contains("note-off")) {
      return "off";
    }
    if (element.classList.contains("note-hidden")) {
      return "hidden";
    }
    return "off";
  }

  selectButton(element: HTMLElement): void {
    this.addClass(element, "buttonSelected", true);
  }

  unselectButton(element: HTMLElement): void {
    this.addClass(element, "buttonSelected", false);
  }

  playSingleNote(note_val: number): void {
    if (typeof MIDI !== "undefined" && MIDI) {
      if (MIDI.WebAudio) {
        MIDI.WebAudio.noteOn(9, note_val, MIDI_VELOCITY_NORMAL, 0);
      } else if (MIDI.AudioTag) {
        MIDI.AudioTag.noteOn(9, note_val, MIDI_VELOCITY_NORMAL, 0);
      }
    }
  }

  getDrumNote(idNum: number, drumType: DrumType): AbcNote | null {
    const id = idNum.toString();
    switch (drumType.name) {
      case DrumType.KICK.name:
        // Kick line can contain both bass drum and hi-hat foot splash simultaneously.
        const splashOn = this.isNoteOn(AbcNote.KI_SPLASH.getFirstHtmlIdPrefix() + id);
        const kickOn = this.isNoteOn(AbcNote.KI_NORMAL.getFirstHtmlIdPrefix() + id);
        if (splashOn && kickOn) return AbcNote.KI_SANDK;
        if (splashOn) return AbcNote.KI_SPLASH;
        if (kickOn) return AbcNote.KI_NORMAL;
        return null;
      case DrumType.SNARE.name:
        for (const note of AbcNote.SN_ALL) {
          if (this.isNoteOn(note.getFirstHtmlIdPrefix() + id)) return note;
        }
        return null;
      case DrumType.TOM1.name:
        return this.isNoteOn(AbcNote.T1_NORMAL.getFirstHtmlIdPrefix() + id) ? AbcNote.T1_NORMAL : null;
      case DrumType.TOM4.name:
        return this.isNoteOn(AbcNote.T4_NORMAL.getFirstHtmlIdPrefix() + id) ? AbcNote.T4_NORMAL : null;
      case DrumType.HIHAT.name:
        for (const note of NOTES_FOR_DRUM.get(DrumType.HIHAT.name) || AbcNote.HH_ALL) {
          if (this._isAbcNoteOn(note, id, false)) return note;
        }
        return null;
      case DrumType.HIHAT2.name:
        for (const note of NOTES_FOR_DRUM.get(DrumType.HIHAT.name) || AbcNote.HH_ALL) {
          if (this._isAbcNoteOn(note, id, true)) return note;
        }
        return null;
      case DrumType.STICKINGS.name:
        for (const note of AbcNote.STICKINGS_ALL) {
          if (this.isNoteOn(note.getFirstHtmlIdPrefix() + id)) return note;
        }
        return null;
    }
    return null;
  }

  private static DRUM_TYPE_NOTES = {
    [DrumType.KICK.name]:      { all: [AbcNote.KI_NORMAL, AbcNote.KI_SPLASH],                       placeholder: AbcNote.KI_NORMAL },
    [DrumType.SNARE.name]:     { all: AbcNote.SN_ALL,                                               placeholder: AbcNote.SN_NORMAL },
    [DrumType.TOM1.name]:      { all: [AbcNote.T1_NORMAL],                                          placeholder: AbcNote.T1_NORMAL },
    [DrumType.TOM4.name]:      { all: [AbcNote.T4_NORMAL],                                          placeholder: AbcNote.T4_NORMAL },
    [DrumType.HIHAT.name]:     { all: AbcNote.HH_ALL,                                               placeholder: AbcNote.HH_NORMAL },
    [DrumType.HIHAT2.name]:    { all: AbcNote.HH_ALL,                                               placeholder: AbcNote.HH_NORMAL },
    [DrumType.STICKINGS.name]: { all: [AbcNote.STICK_R, AbcNote.STICK_L, AbcNote.STICK_BOTH, AbcNote.STICK_COUNT], placeholder: AbcNote.STICK_R },
  };

  setDrumNote(id: number, note: AbcNote, makeSound: boolean = false, offDrumType: DrumType | null = null): void {
    const isHH2Target = offDrumType ? (offDrumType.name === DrumType.HIHAT2.name || offDrumType.equals(DrumType.HIHAT2)) : false;
    const drumType = isHH2Target ? DrumType.HIHAT2 : (note.drumType === DrumType.NONE ? offDrumType : note.drumType);
    const isHH2 = isHH2Target || (drumType ? (drumType.name === DrumType.HIHAT2.name || drumType.equals(DrumType.HIHAT2)) : false);
    const { all: notes, placeholder } = GrooveWriter.DRUM_TYPE_NOTES[drumType.name];

    for (const n of notes) {
      for (const rawPrefix of getAsSet(n.htmlAttrs.html_id_prefix)) {
        const prefix = isHH2 ? rawPrefix.replace('hh_', 'hh2_') : rawPrefix;
        const element = document.getElementById(prefix + id);
        if (!element) continue;
        element.classList.remove("note-on", "note-off");
        element.classList.add("note-hidden");
      }
    }

    if (makeSound && note?.midiNote) {
      this.playSingleNote(note.midiNote);
    }

    const target = note.isOff() ? placeholder : note;
    const stateClass = note.isOff() ? "note-off" : "note-on";
    for (const rawPrefix of getAsSet(target.htmlAttrs.html_id_prefix)) {
      const prefix = isHH2 ? rawPrefix.replace('hh_', 'hh2_') : rawPrefix;
      const element = document.getElementById(prefix + id);
      if (!element) continue;
      element.classList.remove("note-hidden");
      element.classList.add(stateClass);
    }
  }

  sticking_rotate_state(id: number): void {
    const sticking_state = this.getDrumNote(id, DrumType.STICKINGS);
    const key = sticking_state ? sticking_state.note : AbcNote.STICK_OFF.note;
    const newState = {
      [AbcNote.STICK_OFF.note]: AbcNote.STICK_R,
      [AbcNote.STICK_R.note]: AbcNote.STICK_L,
      [AbcNote.STICK_L.note]: AbcNote.STICK_BOTH,
      [AbcNote.STICK_BOTH.note]: AbcNote.STICK_COUNT,
      [AbcNote.STICK_COUNT.note]: AbcNote.STICK_OFF,
    }[key] || AbcNote.STICK_R;
    this.setDrumNote(id, newState, true, DrumType.STICKINGS);
  }


  hilight_all_notes_on_same_beat(instrument: string, id: number): void {
    id = Math.floor(id);
    if (id < 0 || id >= this.data.notesPerMeasure * this.data.numberOfMeasures)
      return;

    if (this.class_cur_all_notes_highlight_id === id)
      return;

    if (this.class_cur_all_notes_highlight_id !== -1) {
      var bg_ele = document.getElementById("bg-highlight" + this.class_cur_all_notes_highlight_id);
      if (bg_ele) {
        bg_ele.style.background = "transparent";
      }
    }

    this.class_cur_all_notes_highlight_id = id;
    var new_bg_ele = document.getElementById("bg-highlight" + this.class_cur_all_notes_highlight_id);
    if (new_bg_ele) {
      new_bg_ele.style.background = "rgba(50, 126, 173, 0.2)";
    }
  }

  hilight_note(instrument: string, percent_complete: number): void {
    if (percent_complete < 0) {
      this.clear_all_highlights("clear");
      return;
    }

    if (this.class_permutation_type != "none")
      percent_complete = (percent_complete * this.get_numberOfActivePermutationSections()) % 1.0;

    var note_id_in_32 = Math.floor(percent_complete * notesPerMeasureInFullSizeArray(this.usingTriplets(), this.data.timeSig) * this.data.numberOfMeasures);
    var real_note_id = (note_id_in_32 / getNoteScaler(this.data.notesPerMeasure, this.data.timeSig));

    this.hilight_all_notes_on_same_beat(instrument, real_note_id);
  }

  clear_all_highlights(instrument: string): void {
    var clearBorder = function(id) {
      var el = document.getElementById(id);
      if (el) el.style.borderColor = "transparent";
    };

    if (this.class_cur_hh_highlight_id !== -1) {
      clearBorder("hi-hat" + this.class_cur_hh_highlight_id);
      this.class_cur_hh_highlight_id = -1;
    }
    if (this.class_cur_tom1_highlight_id !== -1) {
      clearBorder("tom1-" + this.class_cur_tom1_highlight_id);
      this.class_cur_tom1_highlight_id = -1;
    }
    if (this.class_cur_tom4_highlight_id !== -1) {
      clearBorder("tom4-" + this.class_cur_tom4_highlight_id);
      this.class_cur_tom4_highlight_id = -1;
    }
    if (this.class_cur_snare_highlight_id !== -1) {
      clearBorder("snare" + this.class_cur_snare_highlight_id);
      this.class_cur_snare_highlight_id = -1;
    }
    if (this.class_cur_kick_highlight_id !== -1) {
      clearBorder("kick" + this.class_cur_kick_highlight_id);
      this.class_cur_kick_highlight_id = -1;
    }

    if (this.class_cur_all_notes_highlight_id !== -1) {
      var bg_ele = document.getElementById("bg-highlight" + this.class_cur_all_notes_highlight_id);
      if (bg_ele) {
        bg_ele.style.background = "transparent";
      }
      this.class_cur_all_notes_highlight_id = -1;
    }
  }

  getTagPosition(tag: HTMLElement | null): { x: number, y: number } {
    var xVal = 0,
      yVal = 0;
    while (tag) {
      xVal += (tag.offsetLeft - tag.scrollLeft + tag.clientLeft);
      yVal += (tag.offsetTop - tag.scrollTop + tag.clientTop);
      tag = tag.offsetParent as HTMLElement | null;
    }
    return {
      x: xVal,
      y: yVal
    };
  }

  // Position a context menu below an anchor element (right-aligned via rightOffset)
  showMenuBelowAnchor(menuId: string, anchorId: string, rightOffset: number): void {
    const menu = document.getElementById(menuId);
    if (!menu) return;
    const anchor = document.getElementById(anchorId);
    if (anchor) {
      const pos = this.getTagPosition(anchor);
      menu.style.top = pos.y + anchor.offsetHeight + "px";
      menu.style.left = pos.x + anchor.offsetWidth - rightOffset + "px";
    }
    this.myGrooveUtils.showContextMenu(menu);
  }

  // Position a context menu to the right of an anchor element
  showMenuRightOfAnchor(menuId: string, anchorId: string): void {
    const menu = document.getElementById(menuId);
    if (!menu) return;
    const anchor = document.getElementById(anchorId);
    if (anchor) {
      const rect = anchor.getBoundingClientRect();
      menu.style.top = rect.top + "px";
      menu.style.left = (rect.right + 2) + "px";
    }
    this.myGrooveUtils.showContextMenu(menu);
  }

  // Position a context menu at the event's click point (offset by dx/dy)
  showMenuAtEvent(menuId: string, event: MouseEvent | null, dx: number, dy: number): void {
    const menu = document.getElementById(menuId);
    if (!menu) return;
    if (!event) event = window.event as MouseEvent | null;
    if (event && (event.clientX || event.clientY)) {
      menu.style.top = event.clientY + dy + "px";
      menu.style.left = event.clientX + dx + "px";
    }
    this.myGrooveUtils.showContextMenu(menu);
  }

  tempoChangeCallback = (newTempo: number): void => {
    this.data.tempo = newTempo;
    if (this.data.showTempo) {
      this.updateSheetMusic();
    }
    if (this.global_tempoChangeCallbackTimeout != null)
      window.clearTimeout(this.global_tempoChangeCallbackTimeout);

    this.global_tempoChangeCallbackTimeout = window.setTimeout(() => {
      this.global_tempoChangeCallbackTimeout = null;
      this.updateCurrentURL();
    }, 300);
  }

  setMetronomeButton(metronomeInterval: number): void {
    var id = "";
    switch (metronomeInterval) {
      case 4:
        id = "metronome4ths";
        break;
      case 8:
        id = "metronome8ths";
        break;
      case 16:
        id = "metronome16ths";
        break;
      case 0:
      default:
        id = "metronomeOff";
        if (this.myGrooveUtils.getMetronomeSolo()) {
          this.metronomeOptionsMenuPopupClick("Solo");
        }
        break;
    }

    var myElements = document.querySelectorAll(".metronomeButton");
    for (var i = 0; i < myElements.length; i++) {
      var thisButton = myElements[i] as HTMLElement;
      this.unselectButton(thisButton);
    }
    this.selectButton(document.getElementById(id));
    this.myGrooveUtils.midiNoteHasChanged();
  };

  getMetronomeFrequency(): number {
    return this.class_metronome_frequency;
  }

  setMetronomeFrequency(newFrequency: number): void {
    this.class_metronome_frequency = newFrequency;
    this.setMetronomeButton(newFrequency);
    this.updateUrl();
  };

  metronomeOptionsAnchorClick = (event: MouseEvent): void => {
    this.showMenuBelowAnchor("metronomeOptionsContextMenu", "metronomeOptionsAnchor", 150);
  };

  permutationAnchorClick = (event: MouseEvent): void => {
    if (this.data.timeSig.equals(TimeSignature.COMMON_TIME_44)) {
      return;
    }
    this.showMenuBelowAnchor("permutationContextMenu", "permutationAnchor", 150);
  };

  helpAnchorClick = (event: MouseEvent): void => {
    this.showMenuBelowAnchor("helpContextMenu", "helpAnchor", 150);
  };

  stickingsAnchorClick = (event?: MouseEvent): void => {
    this.showMenuRightOfAnchor("stickingsContextMenu", "stickingsButton");
  };

  DownloadAnchorClick = (event?: MouseEvent): void => {
    this.showMenuRightOfAnchor("downloadContextMenu", "downloadButton");
  };

  metronomeOptionsMenuSetSelectedState(): void {
    if (this.myGrooveUtils.getMetronomeSolo() ||
      this.class_metronome_auto_speed_up_active ||
      this.myGrooveUtils.getMetronomeOffsetClickStart() != "1") {
      this.addClassById("metronomeOptionsAnchor", "selected", true);
    } else {
      this.addClassById("metronomeOptionsAnchor", "selected", false);
    }
  };

  metronomeOptionsMenuPopupClick(option_type: string): void {
    switch (option_type) {
      case "Solo":
        var current = this.myGrooveUtils.getMetronomeSolo();
        if (!current) {
          this.myGrooveUtils.setMetronomeSolo(true);
          this.addClassById("metronomeOptionsContextMenuSolo", "menuChecked", true);
          if (this.getMetronomeFrequency() === 0)
            this.setMetronomeFrequency(4);
        } else {
          this.myGrooveUtils.setMetronomeSolo(false);
          this.addClassById("metronomeOptionsContextMenuSolo", "menuChecked", false);
        }
        this.myGrooveUtils.midiNoteHasChanged();
        break;

      case "SpeedUp":
        if (this.class_metronome_auto_speed_up_active) {
          this.class_metronome_auto_speed_up_active = false;
          this.addClassById("metronomeOptionsContextMenuSpeedUp", "menuChecked", false);
        } else {
          this.class_metronome_auto_speed_up_active = true;
          this.addClassById("metronomeOptionsContextMenuSpeedUp", "menuChecked", true);
          this.show_MetronomeAutoSpeedupConfiguration();
        }
        break;

      case "CountIn":
        if (this.class_metronome_count_in_active) {
          this.class_metronome_count_in_active = false;
          this.addClassById("metronomeOptionsContextMenuCountIn", "menuChecked", false);
          this.myGrooveUtils.setMetronomeCountIn(false);
        } else {
          this.class_metronome_count_in_active = true;
          this.addClassById("metronomeOptionsContextMenuCountIn", "menuChecked", true);
          this.myGrooveUtils.setMetronomeCountIn(true);
        }
        break;

      case "OffTheOne":
        const offTheOneMenuId = this.data.subdivision.isTriplet()
          ? "metronomeOptionsOffsetClickForTripletsContextMenu"
          : "metronomeOptionsOffsetClickContextMenu";
        this.showMenuBelowAnchor(offTheOneMenuId, "metronomeOptionsContextMenuOffTheOne", 150);
        break;
      case "Dropper":
        break;
      default:
        console.log("bad case in metronomeOptionsMenuPopupClick()");
        break;
    }

    this.metronomeOptionsMenuSetSelectedState();
  };

  metronomeOptionsMenuOffsetClickPopupClick = (option_type: string): void => {
    this.myGrooveUtils.setMetronomeOffsetClickStart(option_type);

    var myElements = document.querySelectorAll(".metronomeOptionsOffsetClickContextMenuItem");
    for (var i = 0; i < myElements.length; i++) {
      var thisItem = myElements[i] as HTMLElement;
      this.addClass(thisItem, "menuChecked", false);
    }

    this.addClassById("metronomeOptionsOffsetClickContextMenuOnThe" + option_type, "menuChecked", true);

    if (option_type != "1") {
      this.addClassById("metronomeOptionsContextMenuOffTheOne", "menuChecked", true);
    } else {
      this.addClassById("metronomeOptionsContextMenuOffTheOne", "menuChecked", false);
    }

    this.myGrooveUtils.midiNoteHasChanged();
    this.metronomeOptionsMenuSetSelectedState();
  };

  resetMetronomeOptionsMenuOffsetClick(): void {
    this.metronomeOptionsMenuOffsetClickPopupClick("1");
  }

  setupPermutationMenu(): void {
    if (this.data.timeSig.equals(TimeSignature.COMMON_TIME_44)) {
      this.addClassById("permutationAnchor", "enabled");
      this.addClassById("permutationAnchor", "enabled", false);
      this.permutationPopupClick("none");
    }
  }

  permutationPopupClick(perm_type: string): void {
    if (this.class_permutation_type == perm_type)
      return;

    this.class_permutation_type = perm_type;

    switch (perm_type) {
      case "kick_16ths":
        this.showHideCSS_ClassVisibility(".kick-container", true, false);
        this.showHideCSS_ClassVisibility(".snare-container", true, true);
        while (this.data.numberOfMeasures > 1) {
          this.closeMeasureButtonClick(2);
        }
        this.selectButton(document.getElementById("permutationAnchor"));
        document.getElementById("PermutationOptions").innerHTML = this.HTMLforPermutationOptions();
        document.getElementById("PermutationOptions").className += " displayed";
        break;

      case "snare_16ths":
        this.showHideCSS_ClassVisibility(".kick-container", true, true);
        this.showHideCSS_ClassVisibility(".snare-container", true, false);
        while (this.data.numberOfMeasures > 1) {
          this.closeMeasureButtonClick(2);
        }
        this.selectButton(document.getElementById("permutationAnchor"));
        document.getElementById("PermutationOptions").innerHTML = this.HTMLforPermutationOptions();
        document.getElementById("PermutationOptions").className += " displayed";
        break;

      case "none":
      default:
        this.showHideCSS_ClassVisibility(".kick-container", true, true);
        this.showHideCSS_ClassVisibility(".snare-container", true, true);
        this.class_permutation_type = "none";

        this.unselectButton(document.getElementById("permutationAnchor"));
        document.getElementById("PermutationOptions").innerHTML = this.HTMLforPermutationOptions();
        this.addClassById("PermutationOptions", "displayed", false);
        break;
    }

    this.updateSheetMusic();
  };

  muteInstrument(instrument: string, measure: number, muteElseUnmute: boolean): void {
    var buttonName = "unmute" + instrument + "Button" + measure;
    var button = document.getElementById(buttonName);
    if (button) {
      if (muteElseUnmute)
        button.style.display = "inline-block";
      else
        button.style.display = "none";
    }

    this.myGrooveUtils.midiNoteHasChanged();
  }

  isInstrumentMuted(instrument: string, measure: number): boolean {
    var buttonName = "unmute" + instrument + "Button" + measure;
    var button = document.getElementById(buttonName);
    return !!button && button.style.display === "inline-block";
  }

  helpMenuPopupClick(help_type: string): void {
    var win;

    switch (help_type) {
      case "help":
        win = window.open("./gscribe_help.html", '_blank');
        win.focus();
        break;

      case "about":
        win = window.open("./gscribe_about.html", '_blank');
        win.focus();
        break;

      case "undo":
        this.undoCommand();
        break;

      case "redo":
        this.redoCommand();
        break;

      default:
        console.log("bad case in helpMenuPopupClick()");
        break;
    }
  };

  toggleAdvancedEdit(): void {
    this.class_advancedEditIsOn = !this.class_advancedEditIsOn;
    const btn = document.getElementById("advancedEditAnchor");
    if (btn) {
      if (this.class_advancedEditIsOn) this.selectButton(btn);
      else this.unselectButton(btn);
    }
  }

  noteLabelClick(event: MouseEvent | null, instrument: string, measure: number): boolean {
    this.selectedInstrument = instrument === "stickings" ? "sticking" : instrument;
    this.setMeasureContainerSelected(true);
    this.class_measure_for_note_label_click = measure;
    const contextMenu = document.getElementById(instrument + "LabelContextMenu");
    if (contextMenu) {
      if (!event) event = window.event as MouseEvent | null;
      if (event && (event.clientX || event.clientY)) {
        contextMenu.style.top = event.clientY - 30 + "px";
        contextMenu.style.left = event.clientX - 35 + "px";
      }
      this.myGrooveUtils.showContextMenu(contextMenu);
    }
    return false;
  }

  noteLabelPopupClick(instrument: string, action: string, measure?: number): boolean {
    if (measure !== undefined) {
      this.class_measure_for_note_label_click = measure;
    }
    if (!this.class_measure_for_note_label_click) {
      this.class_measure_for_note_label_click = 1;
    }

    var setFunction: ((i: number, mode: string, makeSound: boolean) => void) | null = null;

    switch (instrument) {
      case "stickings":
        setFunction = (i, m, s) => this.set_sticking_state(i, m, s);
        break;
      case "hh":
        setFunction = (i, m, s) => this.set_hh_state(i, m, s);
        break;
      case "hh2":
        setFunction = (i, m, s) => this.set_hh2_state(i, m, s);
        break;
      case "tom1":
        setFunction = (i, m, s) => this.set_tom1_state(i, m, s);
        break;
      case "tom4":
        setFunction = (i, m, s) => this.set_tom4_state(i, m, s);
        break;
      case "snare":
        setFunction = (i, m, s) => this.set_snare_state(i, m, s);
        break;
      case "kick":
        setFunction = (i, m, s) => this.set_kick_state(i, m, s);
        break;
      default:
        console.log("bad case in noteLabelPopupClick");
        return false;
    }

    if (action == "mute") {
      this.muteInstrument(instrument, this.class_measure_for_note_label_click, true);
      return false;
    }

    var startIndex = this.data.notesPerMeasure * (this.class_measure_for_note_label_click - 1);
    for (var i = startIndex; i - startIndex < this.data.notesPerMeasure; i++) {
      if (action == "all_off") {
        setFunction(i, "off", i == startIndex);

      } else if (instrument == "stickings") {
        switch (action) {
          case "all_right":
            this.set_sticking_state(i, "right", i == startIndex);
            break;
          case "all_left":
            this.set_sticking_state(i, "left", i == startIndex);
            break;
          case "alternate":
            this.set_sticking_state(i, (i % 2 === 0 ? "right" : "left"), i == startIndex);
            break;
          case "all_count":
            this.set_sticking_state(i, "count", i == startIndex);
            break;
          default:
            console.log("Bad sticking case in noteLabelPopupClick");
            break;
        }
      } else if ((instrument == "hh" || instrument == "hh2") && action == "downbeats") {
        const fn = instrument == "hh2" ? (idx: number, m: string, s: boolean) => this.set_hh2_state(idx, m, s) : (idx: number, m: string, s: boolean) => this.set_hh_state(idx, m, s);
        fn(i, (i % 2 === 0 ? "normal" : "off"), i == startIndex);

      } else if ((instrument == "hh" || instrument == "hh2") && action == "upbeats") {
        const fn = instrument == "hh2" ? (idx: number, m: string, s: boolean) => this.set_hh2_state(idx, m, s) : (idx: number, m: string, s: boolean) => this.set_hh_state(idx, m, s);
        fn(i, (i % 2 === 0 ? "off" : "normal"), i == (startIndex + 1));

      } else if (instrument == "snare" && action == "all_on") {
        this.set_snare_state(i, "accent", i == startIndex);

      } else if (instrument == "snare" && action == "all_on_normal") {
        this.set_snare_state(i, "normal", i == startIndex);

      } else if (instrument == "snare" && action == "all_on_ghost") {
        this.set_snare_state(i, "ghost", i == startIndex);

      } else if (instrument == "kick" && action == "hh_foot_nums_on") {
        const num_notes_per_count = this.data.notesPerBeat;
        var cur_state = this.get_kick_state(i).abc;
        var kick_is_on = false;
        if (cur_state == constant_ABC_KI_SandK || cur_state == constant_ABC_KI_Normal)
          kick_is_on = true;
        this.set_kick_state(i, (i % num_notes_per_count === 0 ? (kick_is_on ? "kick_and_splash" : "splash") : (kick_is_on ? "normal" : "off")), i == (startIndex));

      } else if (instrument == "kick" && action == "hh_foot_ands_on") {
        const num_notes_per_count = this.data.notesPerBeat;
        var cur_state = this.get_kick_state(i).abc;
        var kick_is_on = false;
        if (cur_state == constant_ABC_KI_SandK || cur_state == constant_ABC_KI_Normal)
          kick_is_on = true;

        this.set_kick_state(i, (i % num_notes_per_count === (num_notes_per_count / 2) ? (kick_is_on ? "kick_and_splash" : "splash") : (kick_is_on ? "normal" : "off")), i == (startIndex + num_notes_per_count / 2));

      } else if (action == "all_on") {
        setFunction(i, "normal", i == startIndex);

      } else if (action == "cancel") {
        continue;

      } else {
        console.log("Bad IF case in noteLabelPopupClick");
      }
    }

    this.class_measure_for_note_label_click = 0;
    this.updateSheetMusic();
    return false;
  };

  noteRightClick(event: MouseEvent | null, type: string, id: number): boolean {
    this.selectedInstrument = type;
    this.selectedNoteIndex = id;
    this.setMeasureContainerSelected(true);
    this.class_which_index_last_clicked = id;
    this.insertNoteContextMenu = document.getElementById(type + "ContextMenu");

    if (this.insertNoteContextMenu) {
      if (!event) event = window.event as MouseEvent | null;
      if (event && (event.clientX || event.clientY)) {
        this.insertNoteContextMenu.style.top = event.clientY - 30 + "px";
        this.insertNoteContextMenu.style.left = event.clientX - 75 + "px";
      }
      this.myGrooveUtils.showContextMenu(this.insertNoteContextMenu);
      this.removeAllPopUpKeyEventListeners();
      this.registerPopUpKeyEventListeners();
    } else {
      return true;
    }
    return false;
  }

  removeAllPopUpKeyEventListeners(): void {
    document.removeEventListener("keydown", this.handlePopUpKeyEventListeners);
  }

  registerPopUpKeyEventListeners(): void {
    console.log("Adding listeners for " + this.insertNoteContextMenu.id);
    if (this.insertNoteContextMenu) {
      document.addEventListener("keydown", this.handlePopUpKeyEventListeners);
    }
  }

  handlePopUpKeyEventListeners = (event: KeyboardEvent): void => {
    if (!this.insertNoteContextMenu) return;
    const mapForType = POPUP_KEY_SHORTCUT_MAPPING.get(this.insertNoteContextMenu.id);
    const new_setting = mapForType?.note_mapping.get(event.key);
    if (new_setting) {
      event.preventDefault();
      this.notePopupClick(mapForType.type, new_setting);
    }
  };

  noteLeftClick = (event: MouseEvent, type: string, id: number): void => {
    this.selectedInstrument = type;
    this.selectedNoteIndex = id;
    this.setMeasureContainerSelected(true);
    if (this.class_advancedEditIsOn === true) {
      this.noteRightClick(event, type, id);
    } else {
      switch (type) {
        case "hh":
          this.set_hh_state(id, this.is_hh_on(id) ? "off" : "normal", true);
          break;
        case "hh2":
          this.set_hh2_state(id, this.is_hh2_on(id) ? "off" : "normal", true);
          break;
        case "snare":
          this.set_snare_state(id, this.is_snare_on(id) ? "off" : "accent", true);
          break;
        case "tom1":
          this.set_tom_state(id, 1, this.is_tom_on(id, 1) ? "off" : "normal", true);
          break;
        case "tom4":
          this.set_tom_state(id, 4, this.is_tom_on(id, 4) ? "off" : "normal", true);
          break;
        case "kick":
          this.set_kick_state(id, this.is_kick_on(id) ? "off" : "normal", true);
          break;
        case "sticking":
          this.sticking_rotate_state(id);
          break;
        default:
          console.log("Bad case in noteLeftClick: " + type);
          break;
      }
      this.updateSheetMusic();
    }
  };

  private _setDrumStateByType(type: string, id: number, new_setting: string): void {
    switch (type) {
      case "sticking": this.set_sticking_state(id, new_setting, true); break;
      case "hh":       this.set_hh_state(id, new_setting, true); break;
      case "hh2":      this.set_hh2_state(id, new_setting, true); break;
      case "tom1":     this.set_tom1_state(id, new_setting, true); break;
      case "tom4":     this.set_tom4_state(id, new_setting, true); break;
      case "snare":    this.set_snare_state(id, new_setting, true); break;
      case "kick":     this.set_kick_state(id, new_setting, true); break;
      default:
        console.log("Bad case in _setDrumStateByType: " + type);
    }
  }

  notePopupClick(type: string, new_setting: string): void {
    this._setDrumStateByType(type, this.class_which_index_last_clicked, new_setting);
    this.closeNoteContextMenu();
    this.updateSheetMusic();
  };

  closeNoteContextMenu(): void {
    if (this.insertNoteContextMenu) {
      this.myGrooveUtils.hideContextMenu(this.insertNoteContextMenu);
    }
    this.removeAllPopUpKeyEventListeners();
    this.insertNoteContextMenu = null;
  }

  noteOnMouseEnter(event: MouseEvent, instrument: string, id: number): boolean {
    var action = "";
    if (event.ctrlKey)
      action = "on";
    if (event.altKey)
      action = "off";

    if (action) {
      switch (instrument) {
        case "hh":
          this.set_hh_state(id, action == "off" ? "off" : "normal", true);
          break;
        case "snare":
          this.set_snare_state(id, action == "off" ? "off" : "accent", true);
          break;
        case "kick":
          this.set_kick_state(id, action == "off" ? "off" : "normal", true);
          break;
        default:
          console.log("Bad case in noteOnMouseEnter");
          break;
      }
      this.updateSheetMusic();
    }
    return false;
  }

  get_permutation_pre_ABC(section: number): string {
    return PERMUTATION_PRE_ABC[section] ?? "\nT: Error: No index passed\n";
  }

  get_permutation_post_ABC(section: number): string {
    if (this.usingTriplets() && (section === 3 || section === 7 || section === 11)) {
      return "|\n";
    }
    return PERMUTATION_POST_ABC[section] ?? "\nT: Error: No index passed\n";
  }

  // 16th note permutation array expressed in 32nd notes
  get_kick16th_minus_some_strait_permutation_array(section: number): Array<boolean | string> {
    return kickPermutationMinusSomeStrait(section);
  }

  get_kick16th_strait_permutation_array(section: number): Array<boolean | string> {
    return kickPermutationStrait(section);
  }

  get_kick16th_triplets_permutation_array(section: number): Array<boolean | string> {
    return kickPermutationTriplets(section);
  }

  _abcFor(note: AbcNote | null): string | false {
    if (!note) return false;
    return (note.modifier || '') + note.note;
  }

  // A note is on iff all of its html_id_prefixes are on. Variants that share
  // a prefix (HH_OPEN/CLOSE/ACCENT/NORMAL all use hh_cross) are distinguished
  // by a secondary prefix.
  _isAbcNoteOn(note: AbcNote, id: number | string, isHH2: boolean = false): boolean {
    const prefixes = getAsSet(note.htmlAttrs.html_id_prefix);
    if (prefixes.size === 0) return false;
    for (const rawPrefix of prefixes) {
      const prefix = isHH2 ? rawPrefix.replace('hh_', 'hh2_') : rawPrefix;
      if (!this.isNoteOn(prefix + id)) return false;
    }
    return true;
  }

  private _getOnNote(drumType: DrumType, id: number | string): AbcNote | null {
    if (drumType === DrumType.KICK) {
      const splashOn = this._isAbcNoteOn(AbcNote.KI_SPLASH, id);
      const kickOn = this._isAbcNoteOn(AbcNote.KI_NORMAL, id);
      if (splashOn && kickOn) return AbcNote.KI_SANDK;
      if (splashOn) return AbcNote.KI_SPLASH;
      if (kickOn) return AbcNote.KI_NORMAL;
      return null;
    }
    const isHH2 = drumType ? (drumType.name === DrumType.HIHAT2.name || drumType.equals(DrumType.HIHAT2)) : false;
    const lookupType = isHH2 ? DrumType.HIHAT : drumType;
    const notes = NOTES_FOR_DRUM.get(lookupType.name) || [];
    for (const note of notes) {
      if (this._isAbcNoteOn(note, id, isHH2)) return note;
    }
    return null;
  }

  private _stateFor(note: AbcNote | null): { abc: string | false, url: string } {
    if (!note) return { abc: false, url: '-' };
    return { abc: this._abcFor(note) as string, url: note.getFirstTabChar() };
  }

  getDrumState(id: number | string, drumType: DrumType): { abc: string | false, url: string } {
    return this._stateFor(this._getOnNote(drumType, id));
  }

  get_hh_state(id: number | string): { abc: string | false, url: string } {
    return this.getDrumState(id, DrumType.HIHAT);
  }

  get_hh2_state(id: number | string): { abc: string | false, url: string } {
    return this.getDrumState(id, DrumType.HIHAT2);
  }

  get_snare_state(id: number | string): { abc: string | false, url: string } {
    return this.getDrumState(id, DrumType.SNARE);
  }

  get_kick_state(id: number | string): { abc: string | false, url: string } {
    return this.getDrumState(id, DrumType.KICK);
  }

  get_tom_state(id: number | string, tom_num: number): { abc: string | false, url: string } {
    return this.getDrumState(id, tom_num === 1 ? DrumType.TOM1 : DrumType.TOM4);
  }

  get_sticking_state(id: number | string): { abc: string | false, url: string } {
    return this.getDrumState(id, DrumType.STICKINGS);
  }

  is_hh_on(id: number | string): boolean {
    return this.get_hh_state(id).abc !== false;
  }
  is_hh2_on(id: number | string): boolean {
    return this.get_hh2_state(id).abc !== false;
  }
  is_snare_on(id: number | string): boolean {
    return this.get_snare_state(id).abc !== false;
  }
  is_kick_on(id: number | string): boolean {
    return this.get_kick_state(id).abc !== false;
  }
  is_tom_on(id: number | string, tom_num: number): boolean {
    return this.get_tom_state(id, tom_num).abc !== false;
  }
  is_sticking_on(id: number | string): boolean {
    return this.get_sticking_state(id).abc !== false;
  }

  set_hh_state(id: number | string, mode: string, makeSound: boolean = false): void {
    this.setDrumNote(Number(id), modeToNote(DrumType.HIHAT, mode), makeSound, DrumType.HIHAT);
  }
  set_hh2_state(id: number | string, mode: string, makeSound: boolean = false): void {
    this.setDrumNote(Number(id), modeToNote(DrumType.HIHAT2, mode), makeSound, DrumType.HIHAT2);
  }
  set_snare_state(id: number | string, mode: string, makeSound: boolean = false): void {
    this.setDrumNote(Number(id), modeToNote(DrumType.SNARE, mode), makeSound, DrumType.SNARE);
  }
  set_kick_state(id: number | string, mode: string, makeSound: boolean = false): void {
    this.setDrumNote(Number(id), modeToNote(DrumType.KICK, mode), makeSound, DrumType.KICK);
  }
  set_tom_state(id: number | string, tom_num: number, mode: string, makeSound: boolean = false): void {
    const drumType = tom_num === 1 ? DrumType.TOM1 : DrumType.TOM4;
    const note = mode === 'normal'
      ? (tom_num === 1 ? AbcNote.T1_NORMAL : AbcNote.T4_NORMAL)
      : AbcNote.OFF;
    this.setDrumNote(Number(id), note, makeSound, drumType);
  }
  set_tom1_state(id: number | string, mode: string, makeSound: boolean = false): void {
    this.set_tom_state(id, 1, mode, makeSound);
  }
  set_tom4_state(id: number | string, mode: string, makeSound: boolean = false): void {
    this.set_tom_state(id, 4, mode, makeSound);
  }
  set_sticking_state(id: number | string, mode: string, makeSound: boolean = false): void {
    this.setDrumNote(Number(id), modeToNote(DrumType.STICKINGS, mode), makeSound, DrumType.STICKINGS);
  }

  // Creates an empty note array prefilled with false (32 notes for straight 4/4, 48 for triplets)
  get_empty_note_array_in_32nds(): Array<string | false> {
    const notesPer4Beats = this.usingTriplets() ? 48 : 32;
    const num_notes = (this.data.timeSig.top * notesPer4Beats) / this.data.timeSig.bottom.value;
    return new Array(num_notes).fill(false);
  }

  get_kick16th_permutation_array(section: number): Array<boolean | string> {
    if (this.usingTriplets()) {
      return this.get_kick16th_triplets_permutation_array(section);
    }
    return this.get_kick16th_strait_permutation_array(section);
  }

  get_kick16th_permutation_array_minus_some(section: number): Array<boolean | string> {
    if (this.usingTriplets()) {
      return this.get_kick16th_permutation_array(section);
    }
    return this.get_kick16th_minus_some_strait_permutation_array(section);
  }

  get_snare_permutation_array(section: number): Array<boolean | string> {
    var snare_array = this.get_kick16th_permutation_array(section);
    for (var i = 0; i < snare_array.length; i++) {
      if (snare_array[i] !== false)
        snare_array[i] = AbcNote.SN_NORMAL.getFirstTabChar();
    }
    return snare_array;
  }

  // Snare permutation where accent moves across 16th notes and other notes are ghosted
  get_snare_accent_permutation_array(section: number): Array<boolean | string> {
    var snare_array = this.get_kick16th_permutation_array(section);

    if (section > 0) {
      for (var i = 0; i < snare_array.length; i++) {
        if (snare_array[i] !== false)
          snare_array[i] = AbcNote.SN_ACCENT.getFirstTabChar();
        else if ((i % 2) === 0)
          snare_array[i] = AbcNote.SN_GHOST.getFirstTabChar();
      }
    }
    return snare_array;
  }

  // Snare permutation where accented notes are singles and non-accents are diddled
  get_snare_accent_with_diddle_permutation_array(section: number): Array<boolean | string> {
    var snare_array = this.get_kick16th_permutation_array(section);

    if (section > 0) {
      for (var i = 0; i < snare_array.length; i++) {
        if (snare_array[i] !== false) {
          snare_array[i] = AbcNote.SN_BUZZ.getFirstTabChar();
          i++;
        } else {
          snare_array[i] = AbcNote.SN_GHOST.getFirstTabChar();
        }
      }
    }

    return snare_array;
  }

  get_numSectionsFor_permutation_array(): number {
    return 16;
  }

  shouldDisplayPermutationForSection(sectionNum: number): boolean {
    const isChecked = (id: string) => {
      const el = document.getElementById(id) as HTMLInputElement | null;
      return !!el && el.checked;
    };
    const exists = (id: string) => document.getElementById(id) !== null;
    return shouldDisplayPermutation(sectionNum, isChecked, exists, this.usingTriplets());
  }

  get_numberOfActivePermutationSections(): number {
    var max_num = this.get_numSectionsFor_permutation_array();
    var total_on = 0;

    for (var i = 0; i < max_num; i++) {
      if (this.shouldDisplayPermutationForSection(i))
        total_on++;
    }

    return total_on;
  }

  // Extracts note array of a single measure from the clickable UI and scales it to 32 (or 48) elements.
  get32NoteArrayFromClickableUI(Sticking_Array: Array<any>, HH_Array: Array<any>, Snare_Array: Array<any>, Kick_Array: Array<any>, Toms_Array: Array<Array<any>>, startIndexForClickableUI: number, HH2_Array?: Array<any>): number {
    var scaler = getNoteScaler(this.data.notesPerMeasure, this.data.timeSig);

    for (var i = 0; i < this.data.notesPerMeasure; i++) {
      var array_index = (i) * scaler;

      if (this.isStickingsVisible())
        Sticking_Array[array_index] = this.get_sticking_state(i + startIndexForClickableUI).abc;

      HH_Array[array_index] = this.get_hh_state(i + startIndexForClickableUI).abc;
      if (HH2_Array) {
        HH2_Array[array_index] = this.get_hh2_state(i + startIndexForClickableUI).abc;
      }

      if (this.isTomsVisible()) {
        Toms_Array[0][array_index] = this.get_tom_state(i + startIndexForClickableUI, 1).abc;
        Toms_Array[3][array_index] = this.get_tom_state(i + startIndexForClickableUI, 4).abc;
      }

      Snare_Array[array_index] = this.get_snare_state(i + startIndexForClickableUI).abc;
      Kick_Array[array_index] = this.get_kick_state(i + startIndexForClickableUI).abc;
    }

    return Snare_Array.length;
  }

  muteArrayFromClickableUI(Sticking_Array: Array<any>, HH_Array: Array<any>, Snare_Array: Array<any>, Kick_Array: Array<any>, Toms_Array: Array<Array<any>>, measureIndex: number, HH2_Array?: Array<any>): void {
    if (this.isInstrumentMuted("hh", measureIndex + 1))
      HH_Array.fill(false);
    if (HH2_Array && this.isInstrumentMuted("hh2", measureIndex + 1))
      HH2_Array.fill(false);
    if (this.isInstrumentMuted("snare", measureIndex + 1))
      Snare_Array.fill(false);
    if (this.isInstrumentMuted("kick", measureIndex + 1))
      Kick_Array.fill(false);
    for (var i = 0; i < Toms_Array.length; i++) {
      if (this.isInstrumentMuted("tom" + (i + 1), measureIndex + 1))
        Toms_Array[i].fill(false);
    }
  }

  filter_kick_array_for_permutation(old_kick_array) {
    return old_kick_array.map((note) =>
      note === constant_ABC_KI_Splash || note === constant_ABC_KI_SandK
        ? constant_ABC_KI_Splash
        : false
    );
  }

  merge_kick_arrays(primary_kick_array: Array<any>, secondary_kick_array: Array<any>): Array<any> {
    return primary_kick_array.map((primary, i) => {
      const secondary = secondary_kick_array[i];
      if (primary === false) return secondary;
      if (primary === constant_ABC_KI_SandK) return constant_ABC_KI_SandK;
      if (primary === constant_ABC_KI_Normal) {
        return (secondary === constant_ABC_KI_SandK || secondary === constant_ABC_KI_Splash)
          ? constant_ABC_KI_SandK
          : constant_ABC_KI_Normal;
      }
      if (primary === constant_ABC_KI_Splash) {
        return (secondary === constant_ABC_KI_Normal || secondary === constant_ABC_KI_SandK)
          ? constant_ABC_KI_SandK
          : constant_ABC_KI_Splash;
      }
      return primary;
    });
  }

  createMidiUrlFromClickableUI(MIDI_type: string): string {
    var Sticking_Array = this.get_empty_note_array_in_32nds();
    var HH_Array = this.get_empty_note_array_in_32nds();
    var HH2_Array = this.get_empty_note_array_in_32nds();
    var Snare_Array = this.get_empty_note_array_in_32nds();
    var Kick_Array = this.get_empty_note_array_in_32nds();
    var Toms_Array = [this.get_empty_note_array_in_32nds(), this.get_empty_note_array_in_32nds(), this.get_empty_note_array_in_32nds(), this.get_empty_note_array_in_32nds()];

    var i: number,
      new_snare_array: Array<boolean | string>,
      num_notes_for_swing = 16;

    var metronomeFrequency = this.getMetronomeFrequency();

    var num_notes = this.get32NoteArrayFromClickableUI(Sticking_Array, HH_Array, Snare_Array, Kick_Array, Toms_Array, 0, HH2_Array);
    this.muteArrayFromClickableUI(Sticking_Array, HH_Array, Snare_Array, Kick_Array, Toms_Array, 0, HH2_Array);

    var midiFile = new Midi.File();
    var midiTrack = new Midi.Track();
    midiFile.addTrack(midiTrack);

    midiTrack.setTempo(this.myGrooveUtils.getTempo());
    midiTrack.setInstrument(0, 0x13);

    var swing_percentage = this.myGrooveUtils.getSwing() / 100;

    this.myGrooveUtils.note_mapping_array = [];

    switch (this.class_permutation_type) {
      case "kick_16ths":
        var numSections = this.get_numSectionsFor_permutation_array();

        for (i = 0; i < numSections; i++) {
          if (this.shouldDisplayPermutationForSection(i)) {
            var new_kick_array: Array<any>;

            if ((document.getElementById("PermuationOptionsSkipSomeFirstNotes") && document.getElementById("PermuationOptionsSkipSomeFirstNotes") as HTMLInputElement).checked)
              new_kick_array = this.get_kick16th_permutation_array_minus_some(i);
            else
              new_kick_array = this.get_kick16th_permutation_array(i);

            Kick_Array = this.filter_kick_array_for_permutation(Kick_Array);
            new_kick_array = this.merge_kick_arrays(new_kick_array, Kick_Array);

            this.myGrooveUtils.MIDI_from_HH_Snare_Kick_Arrays(midiTrack, HH_Array, Snare_Array, new_kick_array, Toms_Array, MIDI_type, metronomeFrequency, num_notes, num_notes_for_swing, swing_percentage, this.data.timeSig, HH2_Array);

            this.myGrooveUtils.note_mapping_array = this.myGrooveUtils.note_mapping_array.concat(
              createNoteMappingArrayForHighlighting(HH_Array, Snare_Array, new_kick_array, Toms_Array, num_notes, HH2_Array)
            );
          }
        }
        break;

      case "snare_16ths":
        numSections = this.get_numSectionsFor_permutation_array();

        for (i = 0; i < numSections; i++) {
          if (this.shouldDisplayPermutationForSection(i)) {
            if ((document.getElementById("PermuationOptionsAccentGridDiddled") && document.getElementById("PermuationOptionsAccentGridDiddled") as HTMLInputElement).checked)
              new_snare_array = this.get_snare_accent_with_diddle_permutation_array(i);
            else if ((document.getElementById("PermuationOptionsAccentGrid") && document.getElementById("PermuationOptionsAccentGrid") as HTMLInputElement).checked)
              new_snare_array = this.get_snare_accent_permutation_array(i);
            else
              new_snare_array = this.get_snare_permutation_array(i);

            this.myGrooveUtils.MIDI_from_HH_Snare_Kick_Arrays(midiTrack, HH_Array, new_snare_array, Kick_Array, Toms_Array, MIDI_type, metronomeFrequency, num_notes, num_notes_for_swing, swing_percentage, this.data.timeSig, HH2_Array);

            this.myGrooveUtils.note_mapping_array = this.myGrooveUtils.note_mapping_array.concat(
              createNoteMappingArrayForHighlighting(HH_Array, new_snare_array, Kick_Array, Toms_Array, num_notes, HH2_Array)
            );
          }
        }
        break;

      case "none":
      default:
        if (this.data.subdivision.value < 16)
          num_notes_for_swing = 8 * this.data.timeSig.top / this.data.timeSig.bottom.value;
        else
          num_notes_for_swing = 16 * this.data.timeSig.top / this.data.timeSig.bottom.value;

        this.myGrooveUtils.MIDI_from_HH_Snare_Kick_Arrays(midiTrack, HH_Array, Snare_Array, Kick_Array, Toms_Array, MIDI_type, metronomeFrequency, num_notes, num_notes_for_swing, swing_percentage, this.data.timeSig, HH2_Array);

        this.myGrooveUtils.note_mapping_array = this.myGrooveUtils.note_mapping_array.concat(
          createNoteMappingArrayForHighlighting(HH_Array, Snare_Array, Kick_Array, Toms_Array, num_notes, HH2_Array)
        );

        for (i = 1; i < this.data.numberOfMeasures; i++) {
          Sticking_Array = this.get_empty_note_array_in_32nds();
          HH_Array = this.get_empty_note_array_in_32nds();
          HH2_Array = this.get_empty_note_array_in_32nds();
          Snare_Array = this.get_empty_note_array_in_32nds();
          Kick_Array = this.get_empty_note_array_in_32nds();
          Toms_Array = [this.get_empty_note_array_in_32nds(), this.get_empty_note_array_in_32nds(), this.get_empty_note_array_in_32nds(), this.get_empty_note_array_in_32nds()];

          this.get32NoteArrayFromClickableUI(Sticking_Array, HH_Array, Snare_Array, Kick_Array, Toms_Array, this.data.notesPerMeasure * i, HH2_Array);
          this.muteArrayFromClickableUI(Sticking_Array, HH_Array, Snare_Array, Kick_Array, Toms_Array, i, HH2_Array);

          this.myGrooveUtils.MIDI_from_HH_Snare_Kick_Arrays(midiTrack, HH_Array, Snare_Array, Kick_Array, Toms_Array, MIDI_type, metronomeFrequency, num_notes, num_notes_for_swing, swing_percentage, this.data.timeSig, HH2_Array);

          this.myGrooveUtils.note_mapping_array = this.myGrooveUtils.note_mapping_array.concat(
            createNoteMappingArrayForHighlighting(HH_Array, Snare_Array, Kick_Array, Toms_Array, num_notes, HH2_Array)
          );
        }
        break;
    }

    return "data:audio/midi;base64," + btoa(midiFile.toBytes());
  }

  MIDISaveAs(): void {
    var midi_url = this.createMidiUrlFromClickableUI("general_MIDI");
    document.location = midi_url;
  };

  refresh_ABC = (): void => {
    this.updateSheetMusic();
  }

  undoCommand(): void {
    if (this.class_undo_stack.length > 1) {
      var undoURL = this.class_undo_stack.pop();
      this.AddItemToUndoOrRedoStack(undoURL, this.class_redo_stack);
      undoURL = this.class_undo_stack[this.class_undo_stack.length - 1];
      this.set_Default_notes(undoURL);
    }
  };

  redoCommand(): void {
    if (this.class_redo_stack.length > 0) {
      var redoURL = this.class_redo_stack.pop();
      this.AddItemToUndoOrRedoStack(redoURL, this.class_undo_stack);
      this.set_Default_notes(redoURL);
    }
  };

  AddItemToUndoOrRedoStack(newURL: string, ourStack: Array<string>, noClear: boolean = false): boolean {
    if (!ourStack)
      return false;
    if (newURL === this.class_undo_stack[this.class_undo_stack.length - 1]) {
      return false;
    }
    ourStack.push(newURL);
    while (ourStack.length > UNDO_STACK_MAX_SIZE)
      ourStack.shift();
    return true;
  };

  AddFullURLToUndoStack(fullURL: string): void {
    var urlFragment;
    var searchData = fullURL.indexOf("?");
    urlFragment = fullURL.slice(searchData);
    if (this.AddItemToUndoOrRedoStack(urlFragment, this.class_undo_stack)) {
      this.class_redo_stack = [];
    }
  };

  updateCurrentURL(): void {
    var newURL = this.get_FullURLForPage();
    var newTitle = "";

    this.AddFullURLToUndoStack(newURL);

    var titleEle = document.getElementById("tuneTitle") as HTMLInputElement | null;
    var title = (titleEle && titleEle.value) ? titleEle.value.trim() : "";
    if (title !== "")
      newTitle = title;

    var authorEle = document.getElementById("tuneAuthor") as HTMLInputElement | null;
    var author = (authorEle && authorEle.value) ? authorEle.value.trim() : "";
    if (author !== "") {
      if (title)
        newTitle += " by " + author;
      else
        newTitle = "Groove by " + author;
    }

    if (!newTitle)
      newTitle = this.class_app_title;

    document.title = newTitle;
    try {
      window.history.replaceState(null, newTitle, newURL);
    } catch (err) {
      /* empty */
    }

    if (this.data.debugMode) {
      // put the search data on the bottom of the page to make it easy to cut & paste
      var searchDataEle = document.getElementById("URLSearchData");
      if (searchDataEle) {
        var searchIndex = newURL.indexOf("?");
        var searchURL = newURL.substring(searchIndex).replace("Debug=1&", "");
        searchDataEle.innerHTML = '<p style="margin-left: 10px;"><b>' + searchURL + '</b><p>';
      }
    }
  };

  isLegendVisible(): boolean {
    const elem = document.getElementById("showLegend") as HTMLInputElement | null;
    return elem ? elem.checked : false;
  }

  isShowTempoChecked(): boolean {
    const elem = document.getElementById("showTempo") as HTMLInputElement | null;
    return elem ? elem.checked : false;
  }

  generate_ABC(renderWidth: number): string {
    return this.data.getAbcHeader(this.class_permutation_type != 'none', renderWidth, this.isLegendVisible())
      + this.data.getAbcNotation();
  }

  // this is called by a bunch of places anytime we modify the musical notes on the page
  // this will recreate the ABC code and will then use the ABC to rerender the sheet music
  // on the page.
  updateSheetMusic(): void {
    this.syncUIToMeasures();
    this.data.showLegend = this.isLegendVisible();
    this.myGrooveUtils.isLegendVisible = this.isLegendVisible();
    var renderWidth = 600;
    var svgTarget = document.getElementById("svgTarget");
    if (svgTarget) {
      renderWidth = svgTarget.offsetWidth - 100;
      renderWidth = Math.floor(renderWidth * 0.8);  // reduce width by 20% (This actually makes the notes bigger, because we scale up everything to max width)
    }

    var fullABC = this.generate_ABC(renderWidth);
    var abcSource = document.getElementById("ABCsource") as HTMLInputElement | null;
    if (abcSource)
      abcSource.value = fullABC;
    // this.updateGrooveDBSource();

    // update the current URL so that reloads and history traversal and link shares and bookmarks work correctly
    this.updateCurrentURL();
    this.updateEmbedLink();
    this.displayNewSVG();

    this.myGrooveUtils.midiNoteHasChanged(); // pretty likely the case
  }

  // called by generate_ABC to remake the sheet music on the page
  displayNewSVG(): void {
    var svgTarget = document.getElementById("svgTarget"),
      diverr = document.getElementById("diverr");

    var abcSourceElem = document.getElementById("ABCsource") as HTMLInputElement | null;
    var abc_source = abcSourceElem ? abcSourceElem.value : "";
    var svg_return = this.myGrooveUtils.renderABCtoSVG(abc_source);

    if (diverr) diverr.innerHTML = svg_return.error_html;
    if (svgTarget) svgTarget.innerHTML = svg_return.svg;
  }

  // Render an SVG that is good for download.
  // Constant size at 2000x200
  downloadImages(imageType: string): void {
    var abc_source = this.generate_ABC(800);
    var svg_obj = this.myGrooveUtils.renderABCtoSVG(abc_source);
    var filename;
    var tune_title = (document.getElementById("tuneTitle") as HTMLInputElement).value;

    if (tune_title.length == 0) {
      filename = "notation.";
    } else {
      filename = tune_title;
    }
    filename += imageType;

    var svg_images = svg_obj.svg.split("</svg>");
    // that split should always create at least 2 since it will match that </svg> if there is only one
    // since the split creates an extra one reduce the length by 1
    for (var i = 0; i < svg_images.length - 1; i++) {
      var myPablo = Pablo(svg_images[i] + "</svg>");
      var width = parseFloat(myPablo.attr('width'));
      var height = parseFloat(myPablo.attr('height'));
      var imageRatio = height / width;
      var newWidth = 2000;
      var newHeight = Math.round(newWidth * imageRatio);
      var newBoxWidth = Math.round(newWidth * .8);
      var newBoxHeight = Math.round(newHeight * .8);
      myPablo.attr('width', newWidth + 'px');
      myPablo.attr('height', newHeight + 'px');
      myPablo.attr('viewBox', '0 0 ' + newBoxWidth + ' ' + newBoxHeight);
      myPablo.children('g').attr('transform', 'scale(2)');

      myPablo.download(imageType, filename, function (result) {
        if (result.error) {
          alert("An error occurred when trying to convert the sheet music to a PNG file.");
        }
      });
    }
  }

  PNGSaveAs(): void {
    Pablo.support.image.png(function (acceptable) {
      if (acceptable) {
        this.downloadImages('png');
      } else {
        alert("Sorry, this browser can't export PNG images");
      }
    });
  }

  SVGSaveAs(): void {
    this.downloadImages('svg');
  }

  ShowHideABCResults(): boolean {
    var ABCResults = document.getElementById("ABC_Results");
    if (ABCResults) {
      ABCResults.style.display = ABCResults.style.display === "block" ? "none" : "block";
    }
    return false;
  }

  toggleEmbedTool(): boolean {
    const embedTool = document.getElementById("embedTool");
    const btn = document.getElementById("embeddingOptionsButton");
    if (embedTool) {
      const isCurrentlyHidden = embedTool.style.display === "none" || (!embedTool.style.display && typeof window !== "undefined" && window.getComputedStyle && window.getComputedStyle(embedTool).display === "none");
      if (isCurrentlyHidden) {
        embedTool.style.display = "block";
        if (btn) btn.classList.add("buttonSelected");
        this.renderEmbedMeasureTable(this.data.numberOfMeasures);
        if (typeof embedTool.scrollIntoView === "function") {
          embedTool.scrollIntoView({ behavior: "smooth" });
        }
      } else {
        embedTool.style.display = "none";
        if (btn) btn.classList.remove("buttonSelected");
      }
    }
    return false;
  }

  showHideEmbedTool(): boolean {
    return this.toggleEmbedTool();
  }

  renderEmbedMeasureTable(numMeasures?: number | null): void {
    const tbody = document.getElementById("embedMeasureTableBody") as HTMLTableSectionElement | null;
    if (!tbody) return;

    var count: number = numMeasures ?? 0;
    if (!count) {
      count = this.data ? this.data.numberOfMeasures : 1;
    }
    count = Math.max(1, count);

    // Preserve existing row states
    const existingRows = tbody.querySelectorAll("tr");
    const existingData: Record<number, EmbedMeasureRowState> = {};
    existingRows.forEach(row => {
      const m = parseInt(row.getAttribute("data-measure") || "0", 10);
      if (!m) return;
      const startCb = row.querySelector(".embed-repeat-start") as HTMLInputElement | null;
      const endCb = row.querySelector(".embed-repeat-end") as HTMLInputElement | null;
      const altSel = row.querySelector(".embed-alt-ending") as HTMLSelectElement | HTMLInputElement | null;
      const txtBegin = row.querySelector(".embed-text-begin") as HTMLInputElement | null;
      const txtEnd = row.querySelector(".embed-text-end") as HTMLInputElement | null;
      const txtLyrics = row.querySelector(".embed-text-lyrics") as HTMLInputElement | null;
      existingData[m] = {
        repeatStart: startCb ? startCb.checked : false,
        repeatEnd: endCb ? endCb.checked : false,
        altEnding: altSel ? altSel.value : "",
        textBegin: txtBegin ? txtBegin.value : "",
        textEnd: txtEnd ? txtEnd.value : "",
        lyrics: txtLyrics ? txtLyrics.value : ""
      };
    });

    var html = "";
    for (var m = 1; m <= count; m++) {
      let d = existingData[m];
      if (!d && this.data) {
        const isRepeatStart = this.data.repeatBegins && this.data.repeatBegins.has(m);
        const isRepeatEnd = this.data.repeatEnds && this.data.repeatEnds.has(m);
        const altEnding = this.data.repeatEndings && this.data.repeatEndings.get(m) ? this.data.repeatEndings.get(m) : "";
        const textEntry = this.data.measureText && this.data.measureText.get(m) ? this.data.measureText.get(m) : {};
        d = {
          repeatStart: !!isRepeatStart,
          repeatEnd: !!isRepeatEnd,
          altEnding: altEnding || "",
          textBegin: textEntry.begin || "",
          textEnd: textEntry.end || "",
          lyrics: textEntry.lyrics || ""
        };
      }
      if (!d) {
        d = { repeatStart: false, repeatEnd: false, altEnding: "", textBegin: "", textEnd: "", lyrics: "" };
      }
      html += '<tr data-measure="' + m + '">' +
        '<td>Measure ' + m + '</td>' +
        '<td><input type="checkbox" class="embed-repeat-start" data-measure="' + m + '"' + (d.repeatStart ? ' checked' : '') + ' onchange="myGrooveWriter.updateSheetMusic();"></td>' +
        '<td><input type="checkbox" class="embed-repeat-end" data-measure="' + m + '"' + (d.repeatEnd ? ' checked' : '') + ' onchange="myGrooveWriter.updateSheetMusic();"></td>' +
        '<td><select class="embed-alt-ending" data-measure="' + m + '" onchange="myGrooveWriter.updateSheetMusic();">' +
          '<option value=""' + (d.altEnding === '' ? ' selected' : '') + '>None</option>' +
          '<option value="1"' + (d.altEnding === '1' ? ' selected' : '') + '>1</option>' +
          '<option value="2"' + (d.altEnding === '2' ? ' selected' : '') + '>2</option>' +
          '<option value="3"' + (d.altEnding === '3' ? ' selected' : '') + '>3</option>' +
          '<option value="4"' + (d.altEnding === '4' ? ' selected' : '') + '>4</option>' +
        '</select></td>' +
        '<td><input type="text" class="embed-text-begin" data-measure="' + m + '" value="' + (d.textBegin ? d.textBegin.replace(/"/g, '&quot;') : '') + '" placeholder="e.g. Intro" oninput="myGrooveWriter.updateSheetMusic();" onchange="myGrooveWriter.updateSheetMusic();"></td>' +
        '<td><input type="text" class="embed-text-end" data-measure="' + m + '" value="' + (d.textEnd ? d.textEnd.replace(/"/g, '&quot;') : '') + '" placeholder="e.g. Fill" oninput="myGrooveWriter.updateSheetMusic();" onchange="myGrooveWriter.updateSheetMusic();"></td>' +
        '<td><input type="text" class="embed-text-lyrics" data-measure="' + m + '" value="' + (d.lyrics ? d.lyrics.replace(/"/g, '&quot;') : '') + '" placeholder="e.g. 1 & 2 &" oninput="myGrooveWriter.updateSheetMusic();" onchange="myGrooveWriter.updateSheetMusic();"></td>' +
      '</tr>';
    }
    tbody.innerHTML = html;
  }

  getEmbedTableData(): EmbedTableData | null {
    const repeatBegins: number[] = [];
    const repeatEnds: number[] = [];
    const repeatEndings: string[] = [];
    const measureTexts: string[] = [];

    const measureMap = new Map<number, {
      start: boolean;
      end: boolean;
      altEnding: string;
      txtBegin: string;
      txtEnd: string;
      txtLyrics: string;
    }>();

    const measureContainers = document.querySelectorAll(".measure-controls-container, #embedMeasureTableBody tr");
    if (measureContainers.length === 0) {
      if (!this.data) return null;
      const rBegins = this.data.repeatBegins ? Array.from(this.data.repeatBegins).sort((a, b) => a - b).join(";") : "";
      const rEnds = this.data.repeatEnds ? Array.from(this.data.repeatEnds).sort((a, b) => a - b).join(";") : "";
      const rEndings = this.data.repeatEndings ? Array.from(this.data.repeatEndings.entries()).filter(([m, v]) => v).sort((a, b) => a[0] - b[0]).map(([m, v]) => `${m}:${v}`).join(";") : "";
      const mTexts: string[] = [];
      if (this.data.measureText) {
        Array.from(this.data.measureText.keys()).sort((a, b) => a - b).forEach(m => {
          const entry = this.data.measureText.get(m);
          if (entry) {
            if (entry.begin && entry.begin.trim().length > 0) mTexts.push(`${m}:b:${entry.begin.trim()}`);
            if (entry.end && entry.end.trim().length > 0) mTexts.push(`${m}:e:${entry.end.trim()}`);
            if (entry.lyrics && entry.lyrics.trim().length > 0) mTexts.push(`${m}:l:${entry.lyrics.trim()}`);
          }
        });
      }
      return {
        repeatBegins: rBegins,
        repeatEnds: rEnds,
        repeatEndings: rEndings,
        measureText: mTexts.join(";")
      };
    }

    measureContainers.forEach((row, idx) => {
      const m = parseInt(row.getAttribute("data-measure") || (idx + 1).toString(), 10);
      if (!m) return;
      const startCb = row.querySelector(".embed-repeat-start") as HTMLInputElement | null;
      const endCb = row.querySelector(".embed-repeat-end") as HTMLInputElement | null;
      const altSel = row.querySelector(".embed-alt-ending") as HTMLSelectElement | HTMLInputElement | null;
      const txtBegin = row.querySelector(".embed-text-begin") as HTMLInputElement | null;
      const txtEnd = row.querySelector(".embed-text-end") as HTMLInputElement | null;
      const txtLyrics = row.querySelector(".embed-text-lyrics") as HTMLInputElement | null;

      const current = measureMap.get(m) || {
        start: false,
        end: false,
        altEnding: "",
        txtBegin: "",
        txtEnd: "",
        txtLyrics: ""
      };

      if (startCb && startCb.checked) current.start = true;
      if (endCb && endCb.checked) current.end = true;
      if (altSel && altSel.value && altSel.value.trim().length > 0) current.altEnding = altSel.value.trim();
      if (txtBegin && txtBegin.value.trim().length > 0) current.txtBegin = txtBegin.value.trim();
      if (txtEnd && txtEnd.value.trim().length > 0) current.txtEnd = txtEnd.value.trim();
      if (txtLyrics && txtLyrics.value.trim().length > 0) current.txtLyrics = txtLyrics.value.trim();

      measureMap.set(m, current);
    });

    const sortedMs = Array.from(measureMap.keys()).sort((a, b) => a - b);
    for (const m of sortedMs) {
      const d = measureMap.get(m)!;
      if (d.start) repeatBegins.push(m);
      if (d.end) repeatEnds.push(m);
      if (d.altEnding) repeatEndings.push(m + ":" + d.altEnding);
      if (d.txtBegin) measureTexts.push(m + ":b:" + d.txtBegin);
      if (d.txtEnd) measureTexts.push(m + ":e:" + d.txtEnd);
      if (d.txtLyrics) measureTexts.push(m + ":l:" + d.txtLyrics);
    }

    return {
      repeatBegins: repeatBegins.join(";"),
      repeatEnds: repeatEnds.join(";"),
      repeatEndings: repeatEndings.join(";"),
      measureText: measureTexts.join(";")
    };
  }

  setEmbedTableData(data: Partial<EmbedTableData> | null): void {
    if (!data) return;
    const rbList: number[] = (data.repeatBegins || "").toString().split(";").filter(Boolean).map(Number);
    const reList: number[] = (data.repeatEnds || "").toString().split(";").filter(Boolean).map(Number);
    const altMap: Record<number, string> = {};
    (data.repeatEndings || "").toString().split(";").filter(Boolean).forEach(part => {
      const colon = part.indexOf(":");
      if (colon !== -1) {
        const m = parseInt(part.substring(0, colon), 10);
        const val = part.substring(colon + 1);
        if (m) altMap[m] = val;
      }
    });
    const textBeginMap: Record<number, string> = {};
    const textEndMap: Record<number, string> = {};
    const textLyricsMap: Record<number, string> = {};
    (data.measureText || "").toString().split(";").filter(Boolean).forEach(part => {
      const segments = part.split(":");
      if (segments.length >= 3) {
        const m = parseInt(segments[0], 10);
        const type = segments[1].toLowerCase();
        const text = segments.slice(2).join(":");
        if (type === "b" || type === "s") textBeginMap[m] = text;
        else if (type === "e") textEndMap[m] = text;
        else if (type === "l" || type === "w") textLyricsMap[m] = text;
      }
    });

    if (this.data) {
      this.data.repeatBegins = new Set(rbList.filter(n => !isNaN(n) && n > 0));
      this.data.repeatEnds = new Set(reList.filter(n => !isNaN(n) && n > 0));
      const rEndings = new Map<number, string>();
      Object.entries(altMap).forEach(([m, val]) => {
        if (val) rEndings.set(parseInt(m, 10), val);
      });
      this.data.repeatEndings = rEndings;
      const mText = new Map<number, MeasureTextEntry>();
      const allTextMs = new Set([...Object.keys(textBeginMap), ...Object.keys(textEndMap), ...Object.keys(textLyricsMap)]);
      allTextMs.forEach(mStr => {
        const m = parseInt(mStr, 10);
        const entry: MeasureTextEntry = {};
        if (textBeginMap[m]) entry.begin = textBeginMap[m];
        if (textEndMap[m]) entry.end = textEndMap[m];
        if (textLyricsMap[m]) entry.lyrics = textLyricsMap[m];
        mText.set(m, entry);
      });
      this.data.measureText = mText;
    }

    var maxM = this.data ? this.data.numberOfMeasures : 1;
    const allMeasureNumbers: number[] = [
      ...rbList,
      ...reList,
      ...Object.keys(altMap).map(Number),
      ...Object.keys(textBeginMap).map(Number),
      ...Object.keys(textEndMap).map(Number),
      ...Object.keys(textLyricsMap).map(Number)
    ];
    if (allMeasureNumbers.length > 0) {
      maxM = Math.max(maxM, ...allMeasureNumbers);
    }

    if (document.getElementById("embedMeasureTableBody")) {
      this.renderEmbedMeasureTable(maxM);
    }

    const measureContainers = document.querySelectorAll(".measure-controls-container, #embedMeasureTableBody tr");
    measureContainers.forEach(row => {
      const m = parseInt(row.getAttribute("data-measure") || "0", 10);
      const startCb = row.querySelector(".embed-repeat-start") as HTMLInputElement | null;
      const endCb = row.querySelector(".embed-repeat-end") as HTMLInputElement | null;
      const altSel = row.querySelector(".embed-alt-ending") as HTMLSelectElement | HTMLInputElement | null;
      const txtBegin = row.querySelector(".embed-text-begin") as HTMLInputElement | null;
      const txtEnd = row.querySelector(".embed-text-end") as HTMLInputElement | null;
      const txtLyrics = row.querySelector(".embed-text-lyrics") as HTMLInputElement | null;

      if (startCb) startCb.checked = rbList.includes(m);
      if (endCb) endCb.checked = reList.includes(m);
      if (altSel) altSel.value = altMap[m] || "";
      if (txtBegin) txtBegin.value = textBeginMap[m] || "";
      if (txtEnd) txtEnd.value = textEndMap[m] || "";
      if (txtLyrics) txtLyrics.value = textLyricsMap[m] || "";
    });
  }

  syncTableToGrooveWriter(): void {
    const tableData = this.getEmbedTableData();
    if (!tableData) return;
    this.data.repeatBegins = new Set(
      tableData.repeatBegins ? tableData.repeatBegins.split(";").filter(Boolean).map((s: string) => parseInt(s, 10)).filter((n: number) => !isNaN(n)) : []
    );
    this.data.repeatEnds = new Set(
      tableData.repeatEnds ? tableData.repeatEnds.split(";").filter(Boolean).map((s: string) => parseInt(s, 10)).filter((n: number) => !isNaN(n)) : []
    );
    const repeatEndings = new Map<number, string>();
    if (tableData.repeatEndings) {
      tableData.repeatEndings.split(";").filter(Boolean).forEach((part: string) => {
        const [mStr, end] = part.split(":");
        const m = parseInt(mStr, 10);
        if (!isNaN(m) && end) repeatEndings.set(m, end);
      });
    }
    this.data.repeatEndings = repeatEndings;
    const measureText = new Map<number, MeasureTextEntry>();
    if (tableData.measureText) {
      tableData.measureText.split(";").filter(Boolean).forEach((part: string) => {
        const [mStr, pos, ...rest] = part.split(":");
        const m = parseInt(mStr, 10);
        const txt = rest.join(":");
        if (!isNaN(m) && txt) {
          const entry = measureText.get(m) || {};
          if (pos === "b" || pos === "s") entry.begin = txt;
          if (pos === "e") entry.end = txt;
          if (pos === "l" || pos === "w") entry.lyrics = txt;
          measureText.set(m, entry);
        }
      });
    }
    this.data.measureText = measureText;
  }

  getEmbedUrl(): string {
    return "https://sonpham.me/GrooveScribe/render.html" + this.data.toQueryString();
  }

  updateEmbedLink(): void {
    const convertedUrlElement = document.getElementById("convertedUrl") as HTMLInputElement | null;
    if (convertedUrlElement) {
      convertedUrlElement.value = this.getEmbedUrl();
    }
  }

  copyEmbedLink(): void {
    this.syncUIToMeasures();
    this.updateEmbedLink();
    const convertedUrlElement = document.getElementById("convertedUrl") as HTMLInputElement | null;
    if (convertedUrlElement) {
      if (typeof convertedUrlElement.select === "function") {
        convertedUrlElement.select();
      }
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        navigator.clipboard.writeText(convertedUrlElement.value);
      }
      setEmbedStatus("Copied!");
    }
  }

  openEmbedLink(): void {
    const url = this.getEmbedUrl();
    if (url.length > 0 && typeof window !== "undefined") {
      window.open(url, '_blank');
    }
  }

  // Alias for backward compatibility
  convertAndCopy(): void {
    this.copyEmbedLink();
  }

  populateEmbedFromUrl(urlOrQuery?: string): void {
    let queryString = "";
    if (typeof urlOrQuery === "string" && urlOrQuery.length > 0) {
      queryString = urlOrQuery.includes("?") ? urlOrQuery.split("?")[1] : urlOrQuery;
    } else {
      const convertedUrlElem = document.getElementById("convertedUrl") as HTMLInputElement | null;
      const convertedUrl = convertedUrlElem ? convertedUrlElem.value : "";
      if (convertedUrl.length > 0) {
        queryString = convertedUrl.includes("?") ? convertedUrl.split("?")[1] : convertedUrl;
      } else if (typeof window !== "undefined" && window.location && window.location.search) {
        queryString = window.location.search.startsWith("?") ? window.location.search.substring(1) : window.location.search;
      }
    }

    const query = parseQuery(queryString);

    const isTempo = (query.EmbedTempoTimeSig || query.embedTempoTimeSig || "") === "true" || (query.ShowTempo || query.showTempo || "") === "1";
    if (this.data && (query.EmbedTempoTimeSig !== undefined || query.embedTempoTimeSig !== undefined || query.ShowTempo !== undefined || query.showTempo !== undefined)) {
      this.data.showTempo = isTempo;
    }
    const stElem = document.getElementById("showTempo") as HTMLInputElement | null;
    if (stElem && (query.EmbedTempoTimeSig !== undefined || query.embedTempoTimeSig !== undefined || query.ShowTempo !== undefined || query.showTempo !== undefined)) {
      stElem.checked = isTempo;
    }
    const embedStElem = document.getElementById("embedShowTempo") as HTMLInputElement | null;
    if (embedStElem && (query.EmbedTempoTimeSig !== undefined || query.embedTempoTimeSig !== undefined || query.ShowTempo !== undefined || query.showTempo !== undefined)) {
      embedStElem.checked = isTempo;
    }

    const commentsVal = query.Comments !== undefined ? query.Comments : (query.comments !== undefined ? query.comments : (query.subText !== undefined ? query.subText : query.subtext));
    if (commentsVal !== undefined) {
      const decodedComments = decodeURIComponent((commentsVal || "").replace(/\+/g, ' '));
      const commentsInput = document.getElementById("tuneComments") as HTMLInputElement | null;
      if (commentsInput) {
        commentsInput.value = decodedComments;
      }
      const subTextElem = document.getElementById("subText") as HTMLInputElement | null;
      if (subTextElem) {
        subTextElem.value = decodedComments;
      }
      this.data.comments = decodedComments;
    }

    const rbVal = query.RepeatBegins !== undefined ? query.RepeatBegins : query.repeatBegins;
    const reVal = query.RepeatEnds !== undefined ? query.RepeatEnds : query.repeatEnds;
    const rendVal = query.RepeatEndings !== undefined ? query.RepeatEndings : query.repeatEndings;
    const mtVal = query.MeasureText !== undefined ? query.MeasureText : query.measureText;

    const rbInput = document.getElementById("repeatBegins") as HTMLInputElement | null;
    if (rbInput && rbVal !== undefined) rbInput.value = rbVal || "";
    const reInput = document.getElementById("repeatEnds") as HTMLInputElement | null;
    if (reInput && reVal !== undefined) reInput.value = reVal || "";
    const rendInput = document.getElementById("repeatEndings") as HTMLInputElement | null;
    if (rendInput && rendVal !== undefined) rendInput.value = rendVal || "";
    const mtInput = document.getElementById("measureText") as HTMLInputElement | null;
    if (mtInput && mtVal !== undefined) mtInput.value = encodeAfterLastColon(mtVal || "", false);

    this.setEmbedTableData({
      repeatBegins: rbVal || (rbInput ? rbInput.value : ""),
      repeatEnds: reVal || (reInput ? reInput.value : ""),
      repeatEndings: rendVal || (rendInput ? rendInput.value : ""),
      measureText: encodeAfterLastColon(mtVal || (mtInput ? mtInput.value : ""), false)
    });

    this.updateEmbedLink();
  }

  initEmbedToolEventListeners(): void {
    if (typeof document === "undefined") return;

    const tempoInput = document.getElementById("showTempo");
    if (tempoInput) tempoInput.addEventListener("change", () => this.updateSheetMusic());
    const embedTempoInput = document.getElementById("embedShowTempo");
    if (embedTempoInput && embedTempoInput !== tempoInput) embedTempoInput.addEventListener("change", () => this.updateSheetMusic());
    const commentsInput = document.getElementById("tuneComments");
    if (commentsInput) {
      commentsInput.addEventListener("input", () => this.updateSheetMusic());
      commentsInput.addEventListener("change", () => this.updateSheetMusic());
    }
    const subTextInput = document.getElementById("subText");
    if (subTextInput) {
      subTextInput.addEventListener("input", () => this.updateSheetMusic());
      subTextInput.addEventListener("change", () => this.updateSheetMusic());
    }
    const copyBtn = document.getElementById("copyBtn");
    if (copyBtn) copyBtn.addEventListener("click", () => this.copyEmbedLink());
    const openLinkBtn = document.getElementById("openLink");
    if (openLinkBtn) openLinkBtn.addEventListener("click", () => this.openEmbedLink());
  }

  updateUrl(): void {
    this.updateCurrentURL();
  }

  refreshMeasureGrid(wasStickingsVisible: boolean = false, wasTomsVisible: boolean = false): void {
    const musicalInput = document.getElementById("musicalInput");
    const prevScrollLeft = musicalInput ? musicalInput.scrollLeft : 0;

    this.expandAuthoringViewWhenNecessary(this.data.notesPerMeasure, this.data.numberOfMeasures);
    this.renderMeasureContainer();
    this.applyMeasuresToUI();

    if (wasStickingsVisible) this.stickingsShowHide(true, true, true);
    if (wasTomsVisible) this.showHideToms(true, true, true);

    if (musicalInput && prevScrollLeft > 0) {
      musicalInput.scrollLeft = prevScrollLeft;
    }

    this.updateUrl();
    this.updateSheetMusic();
  }

  addMeasure(): Measure {
    this.syncUIToMeasures();

    const wasStickingsVisible = this.isStickingsVisible();
    const wasTomsVisible = this.isTomsVisible();

    const lastMeasure = this.data.measures[this.data.measures.length - 1];
    const newMeasure = lastMeasure ? lastMeasure.clone() : new Measure(this.data.timeSig, this.data.subdivision);
    newMeasure.repeatBegin = false;
    newMeasure.repeatEnd = false;
    newMeasure.alternateEnding = "";
    newMeasure.textBegin = "";
    newMeasure.textEnd = "";
    newMeasure.lyrics = "";
    this.data.measures.push(newMeasure);

    this.refreshMeasureGrid(wasStickingsVisible, wasTomsVisible);
    return newMeasure;
  }

  removeMeasure(measureIndex: number): boolean {
    if (this.data.numberOfMeasures <= 1 || measureIndex < 0 || measureIndex >= this.data.numberOfMeasures) {
      return false;
    }

    this.syncUIToMeasures();

    const wasStickingsVisible = this.isStickingsVisible();
    const wasTomsVisible = this.isTomsVisible();

    this.data.measures.splice(measureIndex, 1);

    this.refreshMeasureGrid(wasStickingsVisible, wasTomsVisible);
    return true;
  }

  moveMeasure(fromIndex: number, toIndex: number): boolean {
    if (this.data.numberOfMeasures <= 1) {
      return false;
    }
    if (fromIndex < 0 || fromIndex >= this.data.numberOfMeasures) {
      return false;
    }
    if (toIndex < 0 || toIndex >= this.data.numberOfMeasures) {
      return false;
    }
    if (fromIndex === toIndex) {
      return false;
    }

    this.syncUIToMeasures();

    if (this.isAudioPlaying || (this.myGrooveUtils && this.myGrooveUtils.isPlaying())) {
      this.myGrooveUtils?.stopMIDI_playback();
    }

    const wasStickingsVisible = this.isStickingsVisible();
    const wasTomsVisible = this.isTomsVisible();

    const [movedMeasure] = this.data.measures.splice(fromIndex, 1);
    this.data.measures.splice(toIndex, 0, movedMeasure);

    this.selectedNoteIndex = toIndex * this.data.notesPerMeasure;

    this.refreshMeasureGrid(wasStickingsVisible, wasTomsVisible);
    return true;
  }

  closeMeasureButtonClick(measureNum: number): void {
    this.removeMeasure(measureNum - 1);
  };

  copyMeasureToLast(measureIndex: number): Measure | null {
    if (measureIndex < 0 || measureIndex >= this.data.numberOfMeasures) {
      return null;
    }
    this.syncUIToMeasures();

    const wasStickingsVisible = this.isStickingsVisible();
    const wasTomsVisible = this.isTomsVisible();

    const sourceMeasure = this.data.measures[measureIndex];
    const newMeasure = sourceMeasure ? sourceMeasure.clone() : new Measure(this.data.timeSig, this.data.subdivision);
    this.data.measures.push(newMeasure);

    this.refreshMeasureGrid(wasStickingsVisible, wasTomsVisible);
    return newMeasure;
  }

  copyMeasureToLastButtonClick(measureNum: number): void {
    this.copyMeasureToLast(measureNum - 1);

    var add_measure_button = document.getElementById("addMeasureButton");
    if (add_measure_button && typeof add_measure_button.scrollIntoView === 'function')
      add_measure_button.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });

    if (this.data.numberOfMeasures >= 5)
      window.alert("Please be aware that the Groove Scribe is not designed to write an entire musical score.\n" +
        "You can create as many measures as you want, but your browser may slow down as more measures are added.\n" +
        "There are also many notation features that would be useful for score writing that are not part of Groove Scribe");
  }

  clearMeasure(measureIndex: number): boolean {
    if (measureIndex < 0 || measureIndex >= this.data.numberOfMeasures) {
      return false;
    }
    const npm = this.data.notesPerMeasure;
    const start = measureIndex * npm;
    for (let i = start; i < start + npm; i++) {
      this.set_sticking_state(i, 'off');
      this.set_hh_state(i, 'off');
      this.set_hh2_state(i, 'off');
      this.set_tom1_state(i, 'off');
      this.set_tom4_state(i, 'off');
      this.set_snare_state(i, 'off');
      this.set_kick_state(i, 'off');
    }
    if (this.data.measures[measureIndex]) {
      for (const drum of DrumType.ALL) {
        this.data.measures[measureIndex].arrays.set(drum.name, Measure.createEmptyArrayOfLength(npm));
      }
    }
    this.updateSheetMusic();
    return true;
  }

  clearMeasureButtonClick(measureNum: number): boolean {
    return this.clearMeasure(measureNum - 1);
  }

  deleteMeasure(measureIndex: number): boolean {
    return this.removeMeasure(measureIndex);
  }

  deleteMeasureButtonClick(measureNum: number): boolean {
    if (this.data.numberOfMeasures <= 1) {
      if (typeof window !== "undefined" && typeof window.alert === "function") {
        window.alert("A groove must have at least one measure. Use 'Clear measure' if you want to erase all notes.");
      }
      return false;
    }
    return this.removeMeasure(measureNum - 1);
  }

  addMeasureButtonClick = (event?: MouseEvent): void => {
    this.addMeasure();

    var add_measure_button = document.getElementById("addMeasureButton");
    if (add_measure_button && typeof add_measure_button.scrollIntoView === 'function')
      add_measure_button.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });

    if (this.data.numberOfMeasures >= 5)
      window.alert("Please be aware that the Groove Scribe is not designed to write an entire musical score.\n" +
        "You can create as many measures as you want, but your browser may slow down as more measures are added.\n" +
        "There are also many notation features that would be useful for score writing that are not part of Groove Scribe");
  };

  showHideCSS_ClassDisplay(className: string, force: boolean, showElseHide: boolean, showState: string): boolean {
    var myElements = document.querySelectorAll(className);
    var newStateIsOn = true;

    for (var i = 0; i < myElements.length; i++) {
      var element = myElements[i] as HTMLElement;

      if (force) {
        newStateIsOn = showElseHide;
      } else {
        if (element.style.display == showState)
          newStateIsOn = false;
        else
          newStateIsOn = true;
      }

      if (newStateIsOn)
        element.style.display = showState;
      else
        element.style.display = "none";
    }

    return newStateIsOn;
  }

  showHideCSS_ClassVisibility(className: string, force: boolean, showElseHide: boolean): boolean {
    var myElements = document.querySelectorAll(className);
    var newStateIsOn = false;
    for (var i = 0; i < myElements.length; i++) {
      var stickings = myElements[i] as HTMLElement;

      if (force) {
        if (showElseHide) {
          stickings.style.visibility = "visible";
          newStateIsOn = true;
        } else {
          stickings.style.visibility = "hidden";
          newStateIsOn = false;
        }
      } else {
        if (stickings.style.visibility == "visible") {
          stickings.style.visibility = "hidden";
          newStateIsOn = false;
        } else {
          stickings.style.visibility = "visible";
          newStateIsOn = true;
        }
      }
    }
    return newStateIsOn;
  }

  clearAllNotes(): void {
    for (var i = 0; i < this.data.numberOfMeasures * this.data.notesPerMeasure; i++) {
      this.set_sticking_state(i, 'off');
      this.set_hh_state(i, 'off');
      this.set_hh2_state(i, 'off');
      this.set_tom1_state(i, 'off');
      this.set_tom4_state(i, 'off');
      this.set_snare_state(i, 'off');
      this.set_kick_state(i, 'off');
    }
    this.updateSheetMusic();
  }

  isTomsVisible(): boolean {
    var myElements = document.querySelectorAll(".toms-container");
    for (var i = 0; i < myElements.length; i++) {
      if ((myElements[i] as HTMLElement).style.visibility == "visible")
        return true;
    }

    return false;
  }

  showHideToms(force: boolean, showElseHide: boolean, dontRefreshScreen: boolean): boolean {
    const OnElseOff = this.showHideCSS_ClassVisibility(".toms-container", force, showElseHide);
    this.showHideCSS_ClassVisibility(".tom-label", force, showElseHide);
    if (OnElseOff)
      this.addClassById("showHideTomsButton", "ClickToHide", true);
    else
      this.addClassById("showHideTomsButton", "ClickToHide", false);

    this.data.showToms = OnElseOff;
    this.updateNavHighlights();

    if (!dontRefreshScreen)
      this.updateSheetMusic();

    return false;
  };

  isStickingsVisible(): boolean {
    var myElements = document.querySelectorAll(".stickings-container");
    for (var i = 0; i < myElements.length; i++) {
      if ((myElements[i] as HTMLElement).style.display == "block")
        return true;
    }
    return false;
  }

  stickingsShowHide(force: boolean, showElseHide: boolean, dontRefreshScreen: boolean): boolean {
    var OnElseOff = this.showHideCSS_ClassDisplay(".stickings-container", force, showElseHide, "block");
    this.showHideCSS_ClassDisplay(".stickings-label", force, showElseHide, "block");
    if (OnElseOff) {
      this.addClassById("stickingsButton", "ClickToHide", true);
    } else {
      this.addClassById("stickingsButton", "ClickToHide", false);
    }

    this.data.showStickings = OnElseOff;
    this.updateNavHighlights();

    if (!dontRefreshScreen) {
      this.updateSheetMusic();
    }

    return false;
  };

  stickingsShowHideToggle(): void {
    var stickingsAreCurrentlyShown = this.isStickingsVisible();
    this.stickingsShowHide(true, !stickingsAreCurrentlyShown, false);
  }

  stickingsReverseRL(): void {
    for (var i = 0; i < this.data.numberOfMeasures * this.data.notesPerMeasure; i++) {
      var cur_state = this.get_sticking_state(i).url;
      if (cur_state === "R") {
        this.set_sticking_state(i, "left", false);
      } else if (cur_state === "L") {
        this.set_sticking_state(i, "right", false);
      }
    }
    this.updateSheetMusic();
  }

  printMusic(): void {
    window.print();
  };

  getVisibleInstrumentRows(): string[] {
    const rows: string[] = [];
    if (this.isStickingsVisible()) {
      rows.push("sticking");
    }
    rows.push("hh");
    rows.push("hh2");
    if (this.isTomsVisible()) {
      rows.push("tom1");
    }
    rows.push("snare");
    if (this.isTomsVisible()) {
      rows.push("tom4");
    }
    rows.push("kick");
    return rows;
  }

  setMeasureContainerActive(active: boolean): void {
    this.isMeasureContainerActive = active;
    const rows = this.getVisibleInstrumentRows();
    if (!rows.includes(this.selectedInstrument)) {
      this.selectedInstrument = rows.includes("snare") ? "snare" : (rows[0] || "hh");
    }
    const maxNotes = this.data.notesPerMeasure * this.data.numberOfMeasures;
    if (this.selectedNoteIndex < 0 || this.selectedNoteIndex >= maxNotes) {
      this.selectedNoteIndex = 0;
    }
    this.updateNavHighlights();
  }

  setMeasureContainerSelected(selected: boolean): void {
    this.setMeasureContainerActive(selected);
  }

  getNoteElement(instrument: string, index: number): HTMLElement | null {
    switch (instrument) {
      case "sticking":
      case "stickings":
        return document.getElementById("sticking" + index);
      case "hh":
        return document.getElementById("hi-hat" + index);
      case "hh2":
        return document.getElementById("hi-hat2-" + index) || document.getElementById("hi-hat2" + index);
      case "tom1":
        return document.getElementById("tom1-" + index);
      case "snare":
        return document.getElementById("snare" + index);
      case "tom4":
        return document.getElementById("tom4-" + index);
      case "kick":
        return document.getElementById("kick" + index);
      default:
        return null;
    }
  }

  clearNavHighlights(): void {
    const container = document.getElementById("measureContainer");
    if (container) {
      container.classList.remove("nav-active");
    }
    const cols = document.querySelectorAll(".nav-col-highlight");
    for (let i = 0; i < cols.length; i++) {
      cols[i].classList.remove("nav-col-highlight");
    }
    const rows = document.querySelectorAll(".nav-row-highlight");
    for (let i = 0; i < rows.length; i++) {
      rows[i].classList.remove("nav-row-highlight");
    }
    const labels = document.querySelectorAll(".nav-label-highlight");
    for (let i = 0; i < labels.length; i++) {
      labels[i].classList.remove("nav-label-highlight");
    }
    const notes = document.querySelectorAll(".nav-note-cursor");
    for (let i = 0; i < notes.length; i++) {
      notes[i].classList.remove("nav-note-cursor");
    }
  }

  updateNavHighlights(shouldScroll: boolean = false): void {
    this.clearNavHighlights();
    if (this.isAudioPlaying) return;

    const container = document.getElementById("measureContainer");
    if (container && this.isMeasureContainerActive) {
      container.classList.add("nav-active");
    }

    const rows = this.getVisibleInstrumentRows();
    if (!rows.includes(this.selectedInstrument)) {
      this.selectedInstrument = rows.includes("snare") ? "snare" : (rows[0] || "hh");
    }
    const maxNotes = this.data.notesPerMeasure * this.data.numberOfMeasures;
    if (this.selectedNoteIndex < 0 || this.selectedNoteIndex >= maxNotes) {
      this.selectedNoteIndex = 0;
    }

    // Highlight column / stack of notes
    const bgEle = document.getElementById("bg-highlight" + this.selectedNoteIndex);
    if (bgEle) {
      bgEle.classList.add("nav-col-highlight");
    }
    const allInstruments = ["sticking", "hh", "hh2", "tom1", "snare", "tom4", "kick"];
    for (const inst of allInstruments) {
      const el = this.getNoteElement(inst, this.selectedNoteIndex);
      if (el) {
        el.classList.add("nav-col-highlight");
      }
    }

    // Highlight row in active staff container
    const measureIndex = Math.floor(this.selectedNoteIndex / this.data.notesPerMeasure) + 1;
    const staff = document.getElementById("staff-container" + measureIndex);
    if (staff) {
      let rowSelector = "";
      switch (this.selectedInstrument) {
        case "sticking":
        case "stickings":
          rowSelector = ".stickings-container";
          break;
        case "hh":
          rowSelector = ".hi-hat-container";
          break;
        case "hh2":
          rowSelector = ".hi-hat2-container";
          break;
        case "tom1":
          rowSelector = "#tom1-container";
          break;
        case "snare":
          rowSelector = ".snare-container";
          break;
        case "tom4":
          rowSelector = "#tom4-container";
          break;
        case "kick":
          rowSelector = ".kick-container";
          break;
      }
      if (rowSelector) {
        const rowEle = staff.querySelector(rowSelector);
        if (rowEle) rowEle.classList.add("nav-row-highlight");
      }
    }

    // Highlight active note cell
    const noteEle = this.getNoteElement(this.selectedInstrument, this.selectedNoteIndex);
    if (noteEle) {
      noteEle.classList.add("nav-note-cursor");
      if (shouldScroll && typeof noteEle.scrollIntoView === "function") {
        try {
          noteEle.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
        } catch (_) {}
      }
    }
  }

  navigateMeasureNotes(delta: number): void {
    const maxNotes = this.data.notesPerMeasure * this.data.numberOfMeasures;
    if (maxNotes <= 0) return;
    this.selectedNoteIndex = Math.max(0, Math.min(maxNotes - 1, this.selectedNoteIndex + delta));
    this.setMeasureContainerSelected(true);
    this.updateNavHighlights(true);
  }

  navigateMeasureRows(delta: number): void {
    const rows = this.getVisibleInstrumentRows();
    if (rows.length === 0) return;
    let idx = rows.indexOf(this.selectedInstrument);
    if (idx === -1) {
      idx = rows.indexOf("snare") !== -1 ? rows.indexOf("snare") : 0;
    }
    const newIdx = Math.max(0, Math.min(rows.length - 1, idx + delta));
    this.selectedInstrument = rows[newIdx];
    this.setMeasureContainerSelected(true);
    this.updateNavHighlights(true);
  }

  getModeForKey(instrument: string, key: string): string | null {
    if (key === "Backspace" || key === "Delete" || key === "-" || key === "Escape") {
      return "off";
    }
    const instrumentType = (instrument === "stickings" || instrument === "sticking") ? "sticking" : instrument;
    const mapForType = POPUP_KEY_SHORTCUT_MAPPING.get(instrumentType + "ContextMenu");
    if (!mapForType) return null;
    return mapForType.note_mapping.get(key) ?? null;
  }

  setNoteFromNavigation(mode: string): void {
    const instrument = (this.selectedInstrument === "stickings" || this.selectedInstrument === "sticking") ? "sticking" : this.selectedInstrument;
    this._setDrumStateByType(instrument, this.selectedNoteIndex, mode);
    this.updateSheetMusic();
    this.updateNavHighlights();
  }

  handleMeasureContainerKeyDown = (e: KeyboardEvent): boolean => {
    const target = e.target as HTMLElement;
    if (target) {
      const tag = target.tagName ? target.tagName.toUpperCase() : "";
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable) {
        return false;
      }
      if (typeof target.closest === "function" && (target.closest("#embedTool") || target.closest("#sheetMusicTextFields"))) {
        return false;
      }
    }

    if (!this.isMeasureContainerSelected) {
      return false;
    }

    if (this.insertNoteContextMenu) {
      return false;
    }

    if (e.ctrlKey || e.metaKey) {
      return false;
    }

    if (e.key === "ArrowLeft" || e.which === 37) {
      this.navigateMeasureNotes(-1);
      e.preventDefault();
      e.stopPropagation();
      return true;
    }

    if (e.key === "ArrowRight" || e.which === 39) {
      this.navigateMeasureNotes(1);
      e.preventDefault();
      e.stopPropagation();
      return true;
    }

    if (e.key === "ArrowUp" || e.which === 38) {
      this.navigateMeasureRows(-1);
      e.preventDefault();
      e.stopPropagation();
      return true;
    }

    if (e.key === "ArrowDown" || e.which === 40) {
      this.navigateMeasureRows(1);
      e.preventDefault();
      e.stopPropagation();
      return true;
    }

    if (e.key === "Backspace" || e.key === "Delete" || e.which === 8 || e.which === 46) {
      this.setNoteFromNavigation("off");
      e.preventDefault();
      e.stopPropagation();
      return true;
    }

    if (e.key === "Escape") {
      this.setMeasureContainerSelected(false);
      e.preventDefault();
      e.stopPropagation();
      return true;
    }

    const mode = this.getModeForKey(this.selectedInstrument, e.key);
    if (mode) {
      this.setNoteFromNavigation(mode);
      e.preventDefault();
      e.stopPropagation();
      return true;
    }

    return false;
  };

  handleElementClickSelection(target: HTMLElement): void {
    if (!target || typeof target.closest !== "function") return;

    // 1. Check for specific note element
    const noteEl = target.closest(".hi-hat, .hi-hat2, .snare, .kick, .tom, .sticking") as HTMLElement | null;
    if (noteEl && noteEl.id) {
      const idStr = noteEl.id;
      if (idStr.startsWith("hi-hat2")) {
        this.selectedInstrument = "hh2";
        const idx = parseInt(idStr.replace(/^hi-hat2-?/, ""), 10);
        if (!isNaN(idx)) this.selectedNoteIndex = idx;
      } else if (idStr.startsWith("hi-hat")) {
        this.selectedInstrument = "hh";
        const idx = parseInt(idStr.replace("hi-hat", ""), 10);
        if (!isNaN(idx)) this.selectedNoteIndex = idx;
      } else if (idStr.startsWith("snare")) {
        this.selectedInstrument = "snare";
        const idx = parseInt(idStr.replace("snare", ""), 10);
        if (!isNaN(idx)) this.selectedNoteIndex = idx;
      } else if (idStr.startsWith("kick")) {
        this.selectedInstrument = "kick";
        const idx = parseInt(idStr.replace("kick", ""), 10);
        if (!isNaN(idx)) this.selectedNoteIndex = idx;
      } else if (idStr.startsWith("tom1-")) {
        this.selectedInstrument = "tom1";
        const idx = parseInt(idStr.replace("tom1-", ""), 10);
        if (!isNaN(idx)) this.selectedNoteIndex = idx;
      } else if (idStr.startsWith("tom4-")) {
        this.selectedInstrument = "tom4";
        const idx = parseInt(idStr.replace("tom4-", ""), 10);
        if (!isNaN(idx)) this.selectedNoteIndex = idx;
      } else if (idStr.startsWith("sticking")) {
        this.selectedInstrument = "sticking";
        const idx = parseInt(idStr.replace("sticking", ""), 10);
        if (!isNaN(idx)) this.selectedNoteIndex = idx;
      }
      return;
    }

    // 2. Check for background highlight column
    const bgCol = target.closest(".bg-highlight") as HTMLElement | null;
    if (bgCol && bgCol.id && bgCol.id.startsWith("bg-highlight")) {
      const idx = parseInt(bgCol.id.replace("bg-highlight", ""), 10);
      if (!isNaN(idx)) this.selectedNoteIndex = idx;
      return;
    }

    // 3. Check for instrument labels
    if (target.closest(".hh2-label")) {
      this.selectedInstrument = "hh2";
      return;
    }
    if (target.closest(".hh-label")) {
      this.selectedInstrument = "hh";
      return;
    }
    if (target.closest("#tom1-label")) {
      this.selectedInstrument = "tom1";
      return;
    }
    if (target.closest(".snare-label")) {
      this.selectedInstrument = "snare";
      return;
    }
    if (target.closest("#tom4-label")) {
      this.selectedInstrument = "tom4";
      return;
    }
    if (target.closest(".kick-label")) {
      this.selectedInstrument = "kick";
      return;
    }
    if (target.closest(".stickings-label")) {
      this.selectedInstrument = "sticking";
      return;
    }

    // 4. Check for row containers
    if (target.closest(".hi-hat2-container")) {
      this.selectedInstrument = "hh2";
    } else if (target.closest(".hi-hat-container")) {
      this.selectedInstrument = "hh";
    } else if (target.closest("#tom1-container")) {
      this.selectedInstrument = "tom1";
    } else if (target.closest(".snare-container")) {
      this.selectedInstrument = "snare";
    } else if (target.closest("#tom4-container")) {
      this.selectedInstrument = "tom4";
    } else if (target.closest(".kick-container")) {
      this.selectedInstrument = "kick";
    } else if (target.closest(".stickings-container")) {
      this.selectedInstrument = "sticking";
    }
  }

  handleBgHighlightClick(event: MouseEvent, index: number): void {
    this.selectedNoteIndex = index;
    this.setMeasureContainerSelected(true);
  }

  setupMeasureContainerNavigation(): void {
    document.addEventListener("mousedown", (e) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      if (typeof target.closest === "function") {
        if (target.closest(".measure-controls-container") || target.tagName === "INPUT" || target.tagName === "SELECT") {
          this.setMeasureContainerSelected(false);
        } else if (target.closest("#measureContainer") || target.closest("#musicalInput")) {
          this.handleElementClickSelection(target);
          this.setMeasureContainerSelected(true);
        } else if (!target.closest(".noteContextMenu")) {
          this.setMeasureContainerSelected(false);
        }
      } else {
        this.setMeasureContainerSelected(false);
      }
    });

    document.addEventListener("focusin", (e) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      const tag = target.tagName ? target.tagName.toUpperCase() : "";
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (typeof target.closest === "function" && (target.closest("#embedTool") || target.closest("#sheetMusicTextFields") || target.closest(".measure-controls-container")))) {
        this.setMeasureContainerSelected(false);
      }
    });
  }

  setupWriterHotKeys(): void {
    this.setupMeasureContainerNavigation();
    document.addEventListener("keydown", (e) => {
      if (this.handleMeasureContainerKeyDown(e)) {
        return false;
      }
      const target = e.target as HTMLInputElement;
      if (target.type == "range" || (target.tagName.toUpperCase() != "INPUT" && target.tagName.toUpperCase() != "TEXTAREA")) {
        switch (e.which) {
          case 90:
            if (e.ctrlKey) {
              this.undoCommand();
              return false;
            }
            break;

          case 89:
            if (e.ctrlKey) {
              this.redoCommand();
              return false;
            }
            break;

          case 37:
            this.myGrooveUtils.downTempo();
            return false;

          case 39:
            this.myGrooveUtils.upTempo();
            return false;

          default:
            break;
        }
      }
      return true;
    });
  }

  setViewMode(viewMode: boolean, dontUpdateURL?: boolean): void {
    this.data.viewMode = viewMode;
    this.showHideCSS_ClassDisplay(".edit-block", true, !viewMode, "block");
    const fields = document.getElementById("sheetMusicTextFields");
    if (fields) {
      fields.style.setProperty("display", viewMode ? "none" : "flex", "important");
    }
    const view_edit_button = document.getElementById("view-edit-switch");
    if (view_edit_button) {
      view_edit_button.innerHTML = viewMode ? "Switch to EDIT mode" : "Switch to VIEW mode";
    }
    if (!dontUpdateURL) {
      this.updateCurrentURL();
    }
  }

  swapViewEditMode(dontUpdateURL?: boolean): void {
    this.setViewMode(!this.data.viewMode, dontUpdateURL);
  };

  runsOnPageLoad(): void {
    this.setupWriterHotKeys();
    this.setTimeSigLabel();
    this.initEmbedToolEventListeners();

    this.selectButton(document.getElementById("subdivision_" + this.data.notesPerMeasure + "ths"));
    this.myGrooveUtils.AddMidiPlayerToPage("midiPlayer", this.data.subdivision.value, undefined);

    // Must precede setupPermutationMenu because that path calls updateSheetMusic,
    // which reads DOM state back into data.measures — running it against an empty
    // DOM would wipe the not-yet-loaded notes.
    this.set_Default_notes(window.location.search);
    this.setupPermutationMenu();
    this.setMeasureContainerSelected(true);
    this.renderEmbedMeasureTable(this.data.numberOfMeasures);

    this.setViewMode(this.data.viewMode, true);

    this.myGrooveUtils.midiEventCallbacks.loadMidiDataEvent = (playStarting) => {
      var midiURL;

      if (playStarting && this.class_metronome_count_in_active) {
        midiURL = this.myGrooveUtils.MIDI_build_midi_url_count_in_track(this.data.timeSig);
        this.myGrooveUtils.midiNoteHasChanged();
        this.class_metronome_count_in_is_playing = true;
      } else {
        if (this.class_metronome_count_in_is_playing) {
          this.class_metronome_count_in_is_playing = false;
          this.myGrooveUtils.resetMetronomeOptionsOffsetClickStartRotation();
        }
        midiURL = this.createMidiUrlFromClickableUI("our_MIDI");
        this.myGrooveUtils.midiResetNoteHasChanged();
      }
      this.myGrooveUtils.loadMIDIFromURL(midiURL);
    };

    this.myGrooveUtils.midiEventCallbacks.notePlaying = (note_type, percent_complete) => {
      if (note_type == "complete" && this.class_metronome_auto_speed_up_active) {
        this.myGrooveUtils.midiNoteHasChanged();
        this.metronomeAutoSpeedUpTempoUpdate();
      }

      this.hilight_note(note_type, percent_complete);
    };

    const origPlayEvent = this.myGrooveUtils.midiEventCallbacks.playEvent;
    this.myGrooveUtils.midiEventCallbacks.playEvent = () => {
      this.isAudioPlaying = true;
      this.clearNavHighlights();
      if (origPlayEvent) origPlayEvent.call(this.myGrooveUtils.midiEventCallbacks);
    };

    const origStopEvent = this.myGrooveUtils.midiEventCallbacks.stopEvent;
    this.myGrooveUtils.midiEventCallbacks.stopEvent = () => {
      this.isAudioPlaying = false;
      this.updateNavHighlights();
      if (origStopEvent) origStopEvent.call(this.myGrooveUtils.midiEventCallbacks);
    };

    const origPauseEvent = this.myGrooveUtils.midiEventCallbacks.pauseEvent;
    this.myGrooveUtils.midiEventCallbacks.pauseEvent = () => {
      this.isAudioPlaying = false;
      this.updateNavHighlights();
      if (origPauseEvent) origPauseEvent.call(this.myGrooveUtils.midiEventCallbacks);
    };

    this.myGrooveUtils.oneTimeInitializeMidi();
    this.myGrooveUtils.swingEnabled(this.myGrooveUtils.doesDivisionSupportSwing(this.data.notesPerMeasure));

    window.onresize = this.refresh_ABC;

    if (this.data.debugMode) {
      var debugArea = document.getElementById("debugDisplayArea");
      if (debugArea) {
        debugArea.style.display = "block";
      }
      var abcResults = document.getElementById("ABC_Results");
      if (abcResults) {
        abcResults.style.display = "block";
      }
    }

    if (this.myGrooveUtils.is_touch_device()) {
      setTimeout(function () {
        window.scrollTo(0, 1);
      }, 1000);
    }

    this.myGrooveUtils.tempoChangeCallback = this.tempoChangeCallback;
  };

  metronomeAutoSpeedUpTempoUpdate(): void {
    var totalTempoIncreaseAmount = 1;
    if (document.getElementById("metronomeAutoSpeedupTempoIncreaseAmount"))
      totalTempoIncreaseAmount = parseInt((document.getElementById("metronomeAutoSpeedupTempoIncreaseAmount") as HTMLInputElement).value, 10);
    var tempoIncreaseInterval = 60;
    if (document.getElementById("metronomeAutoSpeedupTempoIncreaseInterval")) {
      tempoIncreaseInterval = parseInt((document.getElementById("metronomeAutoSpeedupTempoIncreaseInterval") as HTMLInputElement).value, 10);
      tempoIncreaseInterval = tempoIncreaseInterval * 60;
    }

    var keepIncreasingForever = false;
    if (document.getElementById("metronomeAutoSpeedUpKeepGoingForever"))
      keepIncreasingForever = (document.getElementById("metronomeAutoSpeedUpKeepGoingForever") as HTMLInputElement).checked;

    var curTempo = this.myGrooveUtils.getTempo();

    var midiStartTime = this.myGrooveUtils.getMidiStartTime();
    if (this.class_our_midi_start_time != midiStartTime) {
      this.class_our_midi_start_time = midiStartTime;
      this.class_our_last_midi_tempo_increase_remainder = 0;
      this.class_our_last_midi_tempo_increase_time = new Date(0);
      this.class_our_midi_start_tempo = curTempo;

    } else if (!keepIncreasingForever) {
      if (curTempo >= this.class_our_midi_start_tempo + totalTempoIncreaseAmount) {
        return;
      }
    }
    var totalMidiPlayTime = this.myGrooveUtils.getMidiPlayTime();
    var timeDiffMilliseconds = totalMidiPlayTime.getTime() - this.class_our_last_midi_tempo_increase_time.getTime();
    var tempoDiffFloat = (totalTempoIncreaseAmount) * (timeDiffMilliseconds / (tempoIncreaseInterval * 1000));

    // Carry forward fractional BPM to avoid rounding-induced drift over time.
    tempoDiffFloat += this.class_our_last_midi_tempo_increase_remainder;
    var tempoDiffInt = Math.floor(tempoDiffFloat);
    this.class_our_last_midi_tempo_increase_remainder = tempoDiffFloat - tempoDiffInt;

    this.class_our_last_midi_tempo_increase_time = totalMidiPlayTime;

    if (!keepIncreasingForever) {
      if (curTempo + tempoDiffInt > this.class_our_midi_start_tempo + totalTempoIncreaseAmount) {
        tempoDiffInt = (this.class_our_midi_start_tempo + totalTempoIncreaseAmount) - curTempo;
      }
    }

    if (tempoDiffInt > 0)
      this.myGrooveUtils.setTempo(this.myGrooveUtils.getTempo() + tempoDiffInt);
  };

  get_FullURLForPage(url_destination?: string): string {
    return this.data.toUrl(url_destination);
  }

  show_MetronomeAutoSpeedupConfiguration(): void {
    var popup = document.getElementById("metronomeAutoSpeedupConfiguration");

    if (popup) {
      popup.style.display = "block";
    }

    document.getElementById('metronomeAutoSpeedupTempoIncreaseAmountOutput').innerHTML = (document.getElementById('metronomeAutoSpeedupTempoIncreaseAmount') as HTMLInputElement).value;
    document.getElementById('metronomeAutoSpeedupTempoIncreaseIntervalOutput').innerHTML = (document.getElementById('metronomeAutoSpeedupTempoIncreaseInterval') as HTMLInputElement).value;
  }

  close_MetronomeAutoSpeedupConfiguration(type?: string): void {
    var popup = document.getElementById("metronomeAutoSpeedupConfiguration");

    if (popup)
      popup.style.display = "none";
  }

  timeSigPopupOpen(type?: string): void {
    var popup = document.getElementById("timeSigPopup");
    if (popup)
      popup.style.display = "block";
  }

  setTimeDivisionSelectionOnOrOff(): void {
    if ((8 * this.data.timeSig.top / this.data.timeSig.bottom.value) % 1 != 0) {
      this.addClassById("subdivision_8ths", "disabled", true);
    } else {
      this.addClassById("subdivision_8ths", "disabled", false);
    }

    if (this.data.timeSig.bottom.value !== 4) {
      this.addClassById("subdivision_12ths", "disabled", true);
      this.addClassById("subdivision_24ths", "disabled", true);
      this.addClassById("subdivision_48ths", "disabled", true);
    } else {
      this.addClassById("subdivision_12ths", "disabled", false);
      this.addClassById("subdivision_24ths", "disabled", false);
      this.addClassById("subdivision_48ths", "disabled", false);
    }
  };

  setTimeSigLabel(): void {
    document.getElementById("timeSigLabel").innerHTML = '<sup>' + this.data.timeSig.top + "</sup>/<sub>" + this.data.timeSig.bottom.value + "</sub>";
  }

  timeSigPopupClose(type: string, callback?: () => void): void {
    var popup = document.getElementById("timeSigPopup");

    if (popup)
      popup.style.display = "none";

    if (type == "ok") {
      var newTimeSigTop = parseInt((document.getElementById("timeSigPopupTimeSigTop") as HTMLInputElement).value);
      var newTimeSigBottom = parseInt((document.getElementById("timeSigPopupTimeSigBottom") as HTMLInputElement).value);

      if (this.usingTriplets() && newTimeSigBottom != 4) {
        this.changeDivision(Subdivision.SIXTEENTH);
      }

      this.data.timeSig = new TimeSignature(newTimeSigTop, Subdivision.of(newTimeSigBottom));
      this.changeDivision(this.data.subdivision);
    }
    if (callback) {
      callback();
    }
  };

  updateRangeLabel(event: Event, idToUpdate: string): void {
    var element = document.getElementById(idToUpdate);

    if (element) {
      element.innerHTML = (event.currentTarget as HTMLInputElement).value;
    }
  };

  fillInFullURLInFullURLPopup(): void {
    (document.getElementById("embedCodeCheckbox") as HTMLInputElement).checked = false;
    (document.getElementById("shortenerCheckbox") as HTMLInputElement).checked = false;

    var popup = document.getElementById("fullURLPopup");
    if (popup) {
      var fullURL = this.get_FullURLForPage();
      var textField = document.getElementById("fullURLPopupTextField") as HTMLInputElement;
      textField.value = fullURL;

      popup.style.display = "block";
      textField.focus();
      textField.select();
    }
  }

  show_FullURLPopup = (): void => {
    new ShareButton({
      ui: {
        flyout: 'bottom center',
        button_font: false,
        buttonText: 'SHARE',
        icon_font: false,
      },
      networks: {
        facebook: {
          before: function () {
            this.url = (document.getElementById("fullURLPopupTextField") as HTMLInputElement).value;
            this.description = "Check out this groove.";
          },
          appId: "445510575651140",
          loadSdk: true
        },
        googlePlus: {
          enabled: false
        },
        twitter: {
          before: function () {
            this.url = encodeURIComponent((document.getElementById("fullURLPopupTextField") as HTMLInputElement).value);
            this.description = "Check out this groove:  " + (document.getElementById("fullURLPopupTextField") as HTMLInputElement).value;
          }
        },
        reddit: {
          before: function () {
            this.url = (document.getElementById("fullURLPopupTextField") as HTMLInputElement).value;
            this.title = "Check out this groove: " + (document.getElementById("fullURLPopupTextField") as HTMLInputElement).value;
          }
        },
        email: {
          before: function () {
            this.url = (document.getElementById("fullURLPopupTextField") as HTMLInputElement).value;
            this.description = "Check out this groove. %0A%0A " + encodeURIComponent((document.getElementById("fullURLPopupTextField") as HTMLInputElement).value);
          }
        },
        pinterest: {
          enabled: false
        },
        linkedin: {
          enabled: false
        },
        whatsapp: {
          enabled: false
        }
      }
    });

    this.fillInFullURLInFullURLPopup();
    this.fillInShortenedURLInFullURLPopup(this.get_FullURLForPage(), 'fullURLPopupTextField');
  };

  copyShareURLToClipboard(): void {
    var copyText = document.getElementById("fullURLPopupTextField") as HTMLInputElement;
    copyText.select();
    copyText.setSelectionRange(0, 99999);
    document.execCommand("copy");
  }

  close_FullURLPopup(): void {
    var popup = document.getElementById("fullURLPopup");
    if (popup)
      popup.style.display = "none";
  };

  fillInShortenedURLInFullURLPopup(fullURL: string, cssIdOfTextFieldToFill: string): void {
    (document.getElementById("embedCodeCheckbox") as HTMLInputElement).checked = false;

    var params = {
      "dynamicLinkInfo": {
        "domainUriPrefix": "https://gscribe.com/share",
        "link": fullURL
      }
    };

    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://firebasedynamiclinks.googleapis.com/v1/shortLinks?key=AIzaSyBx4So11fGFPgTI62nP-JmxrxHmuRpJ120');
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function () {
      if (xhr.status === 200) {
        var response = JSON.parse(xhr.responseText);
        var textField = document.getElementById(cssIdOfTextFieldToFill) as HTMLInputElement;
        textField.value = response.shortLink;
        textField.focus();
        textField.select();
        (document.getElementById("shortenerCheckbox") as HTMLInputElement).checked = true;
      } else {
        (document.getElementById("shortenerCheckbox") as HTMLInputElement).checked = false;
      }
    };
    xhr.send(JSON.stringify(params));
  }

  fillInEmbedURLInFullURLPopup(fullURL: string, cssIdOfTextFieldToFill: string): void {
    (document.getElementById("shortenerCheckbox") as HTMLInputElement).checked = false;
    (document.getElementById("embedCodeCheckbox") as HTMLInputElement).checked = true;

    var embedText = '<iframe width="100%" height="240" src="' + fullURL + '" frameborder="0" ></iframe>	';

    var textField = document.getElementById(cssIdOfTextFieldToFill) as HTMLInputElement;
    textField.value = embedText;
    textField.focus();
    textField.select();
  }

  shortenerCheckboxChanged(): void {
    if ((document.getElementById("shortenerCheckbox") as HTMLInputElement).checked) {
      this.fillInShortenedURLInFullURLPopup(this.get_FullURLForPage(), 'fullURLPopupTextField');
    } else {
      this.fillInFullURLInFullURLPopup();
    }
  };

  embedCodeCheckboxChanged(): void {
    if ((document.getElementById("embedCodeCheckbox") as HTMLInputElement).checked) {
      this.fillInEmbedURLInFullURLPopup(this.get_FullURLForPage("display"), 'fullURLPopupTextField');
    } else {
      this.fillInShortenedURLInFullURLPopup(this.get_FullURLForPage(), 'fullURLPopupTextField');
    }
  };

  // Reads DOM click state and writes tab strings back into this.data.measures
  // so ABC/SVG generation reflects interactive edits.
  syncUIToMeasures(): void {
    const titleInput = document.getElementById("tuneTitle") as HTMLInputElement | null;
    if (titleInput && typeof titleInput.value === "string") this.data.title = titleInput.value;
    const authorInput = document.getElementById("tuneAuthor") as HTMLInputElement | null;
    if (authorInput && typeof authorInput.value === "string") this.data.author = authorInput.value;
    const commentsInput = document.getElementById("tuneComments") as HTMLInputElement | null;
    const subTextInput = document.getElementById("subText") as HTMLInputElement | null;
    const commentsVal = (commentsInput && typeof commentsInput.value === "string" && commentsInput.value.length > 0)
      ? commentsInput.value
      : (subTextInput && typeof subTextInput.value === "string" && subTextInput.value.length > 0 ? subTextInput.value : "");
    if (typeof commentsVal === "string" && commentsVal.length > 0) {
      this.data.comments = commentsVal;
      this.data.subText = commentsVal;
    } else if (commentsInput && typeof commentsInput.value === "string") {
      this.data.comments = commentsInput.value;
      this.data.subText = commentsInput.value;
    }
    this.data.showTempo = this.isShowTempoChecked();
    const embedShowTempo = document.getElementById("embedShowTempo") as HTMLInputElement | null;
    if (embedShowTempo) embedShowTempo.checked = this.data.showTempo;
    this.data.showToms = this.isTomsVisible();
    this.data.showStickings = this.isStickingsVisible();

    const npm = this.data.notesPerMeasure;
    const hasStaffInDOM = !!document.querySelector(".staff-container");
    if (hasStaffInDOM) {
      for (let m = 0; m < this.data.numberOfMeasures; m++) {
        const measure = this.data.measures[m];
        if (!measure) continue;
        const start = m * npm;
        for (const drum of DrumType.ALL) {
          const chars: string[] = [];
          for (let i = 0; i < npm; i++) {
            chars.push(this.getDrumState(start + i, drum).url || '-');
          }
          measure.setDataFromString(drum, chars.join(''));
        }
      }
    }

    const tableData = this.getEmbedTableData();
    if (tableData) {
      this.data.repeatBegins = new Set(
        tableData.repeatBegins ? tableData.repeatBegins.split(";").filter(Boolean).map((s: string) => parseInt(s, 10)).filter((n: number) => !isNaN(n)) : []
      );
      this.data.repeatEnds = new Set(
        tableData.repeatEnds ? tableData.repeatEnds.split(";").filter(Boolean).map((s: string) => parseInt(s, 10)).filter((n: number) => !isNaN(n)) : []
      );
      const repeatEndings = new Map<number, string>();
      if (tableData.repeatEndings) {
        tableData.repeatEndings.split(";").filter(Boolean).forEach((part: string) => {
          const [mStr, end] = part.split(":");
          const m = parseInt(mStr, 10);
          if (!isNaN(m) && end) repeatEndings.set(m, end);
        });
      }
      this.data.repeatEndings = repeatEndings;
      const measureText = new Map<number, MeasureTextEntry>();
      if (tableData.measureText) {
        tableData.measureText.split(";").filter(Boolean).forEach((part: string) => {
          const [mStr, pos, ...rest] = part.split(":");
          const m = parseInt(mStr, 10);
          const txt = rest.join(":");
          if (!isNaN(m) && txt) {
            const entry = measureText.get(m) || {};
            if (pos === "b" || pos === "s") entry.begin = txt;
            if (pos === "e") entry.end = txt;
            if (pos === "l" || pos === "w") entry.lyrics = txt;
            measureText.set(m, entry);
          }
        });
      }
      this.data.measureText = measureText;
    }
  }

  // Propagates parsed measure data onto the clickable UI note-on/off classes.
  applyMeasuresToUI(): void {
    for (let m = 0; m < this.data.numberOfMeasures; m++) {
      const measure = this.data.measures[m];
      if (!measure) continue;
      const start = m * this.data.notesPerMeasure;
      for (const drum of DrumType.ALL) {
        const arr = measure.getArray(drum);
        for (let i = 0; i < arr.length; i++) {
          const note = arr[i] ? tabCharToAbcNote(drum, arr[i]) : null;
          if (note) {
            this.setDrumNote(start + i, note, false, drum);
          } else {
            this.setDrumNote(start + i, AbcNote.OFF, false, drum);
          }
        }
      }
    }
  }

  set_Default_notes(encodedURLData: string): void {
    this.isInitializing = true;
    try {
      this.data.fromUrl(encodedURLData);
      this.renderMeasureContainer();
      this.applyMeasuresToUI();

      if (this.data.showToms)
        this.showHideToms(true, true, true);

      if (this.data.showStickings)
        this.stickingsShowHide(true, true, true);

      const titleInput = document.getElementById("tuneTitle") as HTMLInputElement | null;
      if (titleInput) titleInput.value = this.data.title;
      const authorInput = document.getElementById("tuneAuthor") as HTMLInputElement | null;
      if (authorInput) authorInput.value = this.data.author;
      const commentsInput = document.getElementById("tuneComments") as HTMLInputElement | null;
      if (commentsInput) commentsInput.value = this.data.comments;
      const showLegendCheckbox = document.getElementById("showLegend") as HTMLInputElement | null;
      if (showLegendCheckbox) showLegendCheckbox.checked = this.data.showLegend;
      const showTempoCheckbox = document.getElementById("showTempo") as HTMLInputElement | null;
      if (showTempoCheckbox) showTempoCheckbox.checked = this.data.showTempo;
      const embedShowTempo = document.getElementById("embedShowTempo") as HTMLInputElement | null;
      if (embedShowTempo) embedShowTempo.checked = this.data.showTempo;
      this.myGrooveUtils.isLegendVisible = this.data.showLegend;
      this.myGrooveUtils.setTempo(this.data.tempo);
      this.myGrooveUtils.setSwing(this.data.swingPercent);
      this.setMetronomeFrequency(this.data.metronomeFrequency);
      this.updateSheetMusic();

      this.populateEmbedFromUrl(encodedURLData);
    } finally {
      this.isInitializing = false;
    }
  }

  loadNewGroove(encodedURLData: string): void {
    this.set_Default_notes(encodedURLData);
  };

  getABCDataWithLineEndings(): string {
    var myABC = (document.getElementById("ABCsource") as HTMLInputElement).value;
    myABC = myABC.replace(/\r?\n/g, "\r\n");
    return myABC;
  }

  saveABCtoFile(): void {
    var myABC = this.getABCDataWithLineEndings();
    var myURL = 'data:text/plain;charset=utf-8;base64,' + btoa(myABC);
    console.log("Use \"Save As\" to save the new page to a local file");
    window.open(myURL);
  };

  expandAuthoringViewWhenNecessary(numNotesPerMeasure: number, numberOfMeasures: number): void {
    if (numNotesPerMeasure > 16 ||
      (numNotesPerMeasure > 4 && this.data.numberOfMeasures > 1) ||
      (this.data.numberOfMeasures > 2)) {
      this.addClassById("musicalInput", "expanded", true);
    } else {
      this.addClassById("musicalInput", "expanded", false);
    }
  };

  // Switch the note subdivision (e.g. 8ths <-> 16ths, 8ths <-> triplets) and
  // relayout the note grid. When triplet-ness is preserved, existing notes are
  // scaled to the new grid; otherwise the groove is reset to sensible defaults.
  changeDivision(newDivision: Subdivision | number): void {
    const newDivValue = typeof newDivision === 'number' ? newDivision : newDivision.value;
    const newSubdivision = Subdivision.of(newDivValue);
    const isNewDivisionTriplets = newSubdivision.isTriplet();

    if ((newDivValue * this.data.timeSig.top / this.data.timeSig.bottom.value) % 1 !== 0) {
      alert(`1/${newDivValue} notes are disabled in ${this.data.timeSig.top}/${this.data.timeSig.bottom.value} time. This combination would result in a half note.`);
      return;
    }
    if (isNewDivisionTriplets && this.data.timeSig.bottom.value !== 4) {
      alert(`Triplets are disabled in ${this.data.timeSig.top}/${this.data.timeSig.bottom.value} time. Use x/4 time for triplets.`);
      return;
    }
    if (newDivValue === 48 && !this.have_shown_mixed_division_message) {
      this.have_shown_mixed_division_message = true;
      alert("The MIXED subdivision allows you to create a combination of triplets and non-triplet notes in one measure. Set every 3rd note for 16ths and every 6th note for 8th notes");
    }

    const oldDivValue = this.data.subdivision.value;
    const wasStickingsVisible = this.isStickingsVisible();
    const wasTomsVisible = this.isTomsVisible();
    const sameTripletness = this.usingTriplets() === isNewDivisionTriplets;

    if (sameTripletness) {
      this.syncUIToMeasures();
    }

    const oldMeasures = this.data.measures;
    this.data.subdivision = newSubdivision;
    this.data.measures = [];
    for (let m = 0; m < oldMeasures.length; m++) {
      const fresh = new Measure(this.data.timeSig, this.data.subdivision);
      if (sameTripletness && oldMeasures[m]) {
        GrooveWriter.rescaleMeasure(oldMeasures[m], fresh);
      }
      this.data.measures.push(fresh);
    }

    if (!sameTripletness) {
      this.resetMetronomeOptionsMenuOffsetClick();
    }

    this.expandAuthoringViewWhenNecessary(newDivValue, this.data.numberOfMeasures);
    this.renderMeasureContainer();
    document.getElementById("PermutationOptions").innerHTML = this.HTMLforPermutationOptions();
    this.applyMeasuresToUI();

    if (wasStickingsVisible) this.stickingsShowHide(true, true, true);
    if (wasTomsVisible) this.showHideToms(true, true, true);

    this.unselectButton(document.getElementById("subdivision_" + oldDivValue + "ths"));
    this.selectButton(document.getElementById("subdivision_" + newDivValue + "ths"));

    this.setupPermutationMenu();
    this.setTimeDivisionSelectionOnOrOff();
    this.setTimeSigLabel();

    this.updateSheetMusic();
  }

  // Copy notes from src to dst, scaling positions by the ratio of notesPerMeasure.
  // Both measures must have the same triplet-ness so the scale factor divides evenly.
  static rescaleMeasure(src: Measure, dst: Measure): void {
    const drums = [DrumType.STICKINGS, DrumType.HIHAT, DrumType.HIHAT2, DrumType.SNARE, DrumType.KICK, DrumType.TOM1, DrumType.TOM4];
    const srcLen = src.notesPerMeasure;
    const dstLen = dst.notesPerMeasure;
    for (const drum of drums) {
      const srcArr = src.getArray(drum);
      const dstArr = Measure.createEmptyArrayOfLength(dstLen);
      if (dstLen >= srcLen) {
        const scale = Math.floor(dstLen / srcLen);
        for (let i = 0; i < srcLen; i++) dstArr[i * scale] = srcArr[i];
      } else {
        const scale = Math.floor(srcLen / dstLen);
        for (let i = 0; i < dstLen; i++) dstArr[i] = srcArr[i * scale];
      }
      dst.arrays.set(drum.name, dstArr);
    }
  }

  renderMeasureContainer(): void {
    const container = document.getElementById("measureContainer");
    if (!container) return;
    let html = "";
    for (let m = 1; m <= this.data.numberOfMeasures; m++) {
      html += this.HTMLforStaffContainer(m, (m - 1) * this.data.notesPerMeasure);
    }
    container.innerHTML = html;
    const maxNotes = this.data.notesPerMeasure * this.data.numberOfMeasures;
    if (this.selectedNoteIndex >= maxNotes) {
      this.selectedNoteIndex = Math.max(0, maxNotes - 1);
    }
    this.updateNavHighlights();
    this.renderEmbedMeasureTable(this.data.numberOfMeasures);
  }

  HTMLforStaffContainer(baseindex: number, indexStartForNotes: number): string {
    const notesPerMeasure = this.data.notesPerMeasure;
    const groupSize = noteGroupingSize(notesPerMeasure, this.data.timeSig);
    const endNoteIndex = indexStartForNotes + notesPerMeasure - 1;

    const renderNoteRow = (renderNote: (idx: number) => string) => {
      let html = '';
      for (let i = indexStartForNotes; i <= endNoteIndex; i++) {
        html += renderNote(i);
        if ((i - (indexStartForNotes - 1)) % groupSize === 0 && i < endNoteIndex) {
          html += '<div class="space_between_note_groups"> </div>\n';
        }
      }
      return html;
    };

    const stickingsHTML = renderNoteRow((i) => `
      <div id="sticking${i}" class="sticking" onClick="myGrooveWriter.noteLeftClick(event, 'sticking', ${i})" oncontextmenu="event.preventDefault(); myGrooveWriter.noteRightClick(event, 'sticking', ${i})" onmouseenter="myGrooveWriter.noteOnMouseEnter(event, 'sticking', ${i})">
        <div class="sticking_right note_part" id="sticking_right${i}">R</div>
        <div class="sticking_left note_part" id="sticking_left${i}">L</div>
        <div class="sticking_both note_part" id="sticking_both${i}">R/L</div>
        <div class="sticking_count note_part" id="sticking_count${i}">C</div>
      </div>\n`);

    const bgHighlightsHTML = renderNoteRow((i) => `
      <div id="bg-highlight${i}" class="bg-highlight" onClick="myGrooveWriter.handleBgHighlightClick(event, ${i})"></div>\n`);

    const hhHTML = renderNoteRow((i) => `
      <div id="hi-hat${i}" class="hi-hat" onClick="myGrooveWriter.noteLeftClick(event, 'hh', ${i})" oncontextmenu="event.preventDefault(); myGrooveWriter.noteRightClick(event, 'hh', ${i})" onmouseenter="myGrooveWriter.noteOnMouseEnter(event, 'hh', ${i})">
        <div class="hh_crash note_part" id="hh_crash${i}"><i class="fa fa-asterisk"></i></div>
        <div class="hh_ride note_part" id="hh_ride${i}"><i class="fa fa-dot-circle-o"></i></div>
        <div class="hh_ride_bell note_part" id="hh_ride_bell${i}"><i class="fa fa-bell-o"></i></div>
        <div class="hh_cow_bell note_part" id="hh_cow_bell${i}"><i class="fa fa-plus-square-o"></i></div>
        <div class="hh_stacker note_part" id="hh_stacker${i}"><i class="fa fa-bars"></i></div>
        <div class="hh_metronome_normal note_part" id="hh_metronome_normal${i}"><i class="fa fa-neuter"></i></div>
        <div class="hh_metronome_accent note_part" id="hh_metronome_accent${i}"><i class="fa fa-map-pin"></i></div>
        <div class="hh_cross note_part" id="hh_cross${i}"><i class="fa fa-times"></i></div>
        <div class="hh_open note_part" id="hh_open${i}"><i class="fa fa-circle-o"></i></div>
        <div class="hh_close note_part" id="hh_close${i}"><i class="fa fa-plus"></i></div>
        <div class="hh_accent note_part" id="hh_accent${i}"><i class="fa fa-angle-right"></i></div>
      </div>\n`);

    const hh2HTML = renderNoteRow((i) => `
      <div id="hi-hat2-${i}" class="hi-hat2" onClick="myGrooveWriter.noteLeftClick(event, 'hh2', ${i})" oncontextmenu="event.preventDefault(); myGrooveWriter.noteRightClick(event, 'hh2', ${i})" onmouseenter="myGrooveWriter.noteOnMouseEnter(event, 'hh2', ${i})">
        <div class="hh2_crash note_part" id="hh2_crash${i}"><i class="fa fa-asterisk"></i></div>
        <div class="hh2_ride note_part" id="hh2_ride${i}"><i class="fa fa-dot-circle-o"></i></div>
        <div class="hh2_ride_bell note_part" id="hh2_ride_bell${i}"><i class="fa fa-bell-o"></i></div>
        <div class="hh2_cow_bell note_part" id="hh2_cow_bell${i}"><i class="fa fa-plus-square-o"></i></div>
        <div class="hh2_stacker note_part" id="hh2_stacker${i}"><i class="fa fa-bars"></i></div>
        <div class="hh2_metronome_normal note_part" id="hh2_metronome_normal${i}"><i class="fa fa-neuter"></i></div>
        <div class="hh2_metronome_accent note_part" id="hh2_metronome_accent${i}"><i class="fa fa-map-pin"></i></div>
        <div class="hh2_cross note_part" id="hh2_cross${i}"><i class="fa fa-times"></i></div>
        <div class="hh2_open note_part" id="hh2_open${i}"><i class="fa fa-circle-o"></i></div>
        <div class="hh2_close note_part" id="hh2_close${i}"><i class="fa fa-plus"></i></div>
        <div class="hh2_accent note_part" id="hh2_accent${i}"><i class="fa fa-angle-right"></i></div>
      </div>\n`);

    const tom1HTML = renderNoteRow((i) => `
      <div id="tom1-${i}" class="tom" onClick="myGrooveWriter.noteLeftClick(event, 'tom1', ${i})" oncontextmenu="event.preventDefault(); myGrooveWriter.noteRightClick(event, 'tom1', ${i})" onmouseenter="myGrooveWriter.noteOnMouseEnter(event, 'tom1', ${i})">
        <div class="tom_circle note_part" id="tom_circle1-${i}"></div>
      </div>\n`);

    const snareHTML = renderNoteRow((i) => `
      <div id="snare${i}" class="snare" onClick="myGrooveWriter.noteLeftClick(event, 'snare', ${i})" oncontextmenu="event.preventDefault(); myGrooveWriter.noteRightClick(event, 'snare', ${i})" onmouseenter="myGrooveWriter.noteOnMouseEnter(event, 'snare', ${i})">
        <div class="snare_ghost note_part" id="snare_ghost${i}">(<i class="fa fa-circle dot_in_snare_ghost_note"></i>)</div>
        <div class="snare_circle note_part" id="snare_circle${i}"></div>
        <div class="snare_xstick note_part" id="snare_xstick${i}"><i class="fa fa-times"></i></div>
        <div class="snare_buzz note_part" id="snare_buzz${i}"><i class="fa fa-bars"></i></div>
        <div class="snare_flam note_part" id="snare_flam${i}"><i class="fa ">
          <svg xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" width="30" height="30">
            <style type="text/css">
              .flam_fill {fill: currentColor}
              .flam_stroke {stroke: currentColor; fill: none; stroke-width: .7}
            </style>
            <defs>
              <path id="flam_ghd" class="flam_fill" d="m1.7-1c-1-1.7-4.5 0.2-3.4 2 1 1.7 4.5-0.2 3.4-2"></path>
              <ellipse id="flam_hd" rx="4.1" ry="2.9" transform="rotate(-20)" class="flam_fill"></ellipse>
            </defs>
            <g id="note" transform="translate(-44 -35)">
              <path class="flam_stroke" d="m52.1 53.34v-14M52.1 39.34c0.6 3.4 5.6 3.8 3 10 1.2-4.4-1.4-7-3-7"></path>
              <use x="50.50" y="53.34" xlink:href="#flam_ghd"></use>
              <path class="flam_stroke" d="m49.5 49.34l9-5"></path>
              <path class="flam_stroke" d="m50.5 58.34c2.9 3 11.6 3 14.5 0M69.5 53.34v-21"></path><use x="66.00" y="53.34" xlink:href="#flam_hd"></use>
            </g>
          </svg>
        </i></div>
        <div class="snare_drag note_part" id="snare_drag${i}"><i class="fa ">
          <svg xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" width="30" height="30">
            <style type="text/css">
              .drag_fill {fill: currentColor}
              .drag_stroke {stroke: currentColor; fill: none; stroke-width: .7}
            </style>
            <defs>
              <path id="drag_ghd" class="drag_fill" d="m1.7-1c-1-1.7-4.5 0.2-3.4 2 1 1.7 4.5-0.2 3.4-2"></path>
              <ellipse id="drag_hd" rx="4.1" ry="2.9" transform="rotate(-20)" class="drag_fill"></ellipse>
            </defs>
            <g id="note" transform="translate(-44 -35)">
              <path class="fill" d="m51.81 38.34 l8.58 0.00v1.60l-8.58 0.00"></path>
              <path class="fill" d="m52.10 41.34 l8.00 0.00v1.60l-8.00 0.00"></path>
              <path class="drag_stroke" d="m52.1 53.34v-15.00"></path>
              <use x="50.50" y="53.34" xlink:href="#drag_ghd"></use>
              <path class="drag_stroke" d="m49.50 49.34l8.00 -15.00"></path>
              <path class="drag_stroke" d="m60.10 53.34v-15.00"></path>
              <use x="58.50" y="53.34" xlink:href="#drag_ghd"></use>
              <path class="drag_stroke" d="m50.5 58.34c2.9 3 11.6 3 14.5 0M69.5 53.34v-21"></path><use x="66.00" y="53.34" xlink:href="#drag_hd"></use>
            </g>
          </svg>
        </i></div>
        <div class="snare_accent note_part" id="snare_accent${i}">
          <i class="fa fa-chevron-right"></i>
        </div>
      </div>\n`);

    const tom4HTML = renderNoteRow((i) => `
      <div id="tom4-${i}" class="tom" onClick="myGrooveWriter.noteLeftClick(event, 'tom4', ${i})" oncontextmenu="event.preventDefault(); myGrooveWriter.noteRightClick(event, 'tom4', ${i})" onmouseenter="myGrooveWriter.noteOnMouseEnter(event, 'tom4', ${i})">
        <div class="tom_circle note_part" id="tom_circle4-${i}"></div>
      </div>\n`);

    const kickHTML = renderNoteRow((j) => `
      <div id="kick${j}" class="kick" onClick="myGrooveWriter.noteLeftClick(event, 'kick', ${j})" oncontextmenu="event.preventDefault(); myGrooveWriter.noteRightClick(event, 'kick', ${j})" onmouseenter="myGrooveWriter.noteOnMouseEnter(event, 'kick', ${j})">
        <div class="kick_splash note_part" id="kick_splash${j}"><i class="fa fa-times"></i></div>
        <div class="kick_circle note_part" id="kick_circle${j}"></div>
      </div>\n`);

    const addMeasureBtn = baseindex === this.data.numberOfMeasures
      ? `<span id="addMeasureButton" title="Add measure" onClick="myGrooveWriter.addMeasureButtonClick(event)"><i class="fa fa-plus"></i></span>`
      : '';

    const measure = this.data && this.data.measures ? this.data.measures[baseindex - 1] : null;
    const isRepeatStart = measure ? measure.repeatBegin : (this.data && this.data.repeatBegins && this.data.repeatBegins.has(baseindex));
    const isRepeatEnd = measure ? measure.repeatEnd : (this.data && this.data.repeatEnds && this.data.repeatEnds.has(baseindex));
    const altEnding = measure ? measure.alternateEnding : ((this.data && this.data.repeatEndings && this.data.repeatEndings.get(baseindex)) ? this.data.repeatEndings.get(baseindex) : "");
    const textEntry = (this.data && this.data.measureText && this.data.measureText.get(baseindex)) ? this.data.measureText.get(baseindex) : {};
    const textBegin = measure ? measure.textBegin : ((textEntry && textEntry.begin) ? textEntry.begin : "");
    const textEnd = measure ? measure.textEnd : ((textEntry && textEntry.end) ? textEntry.end : "");
    const lyrics = measure ? measure.lyrics : ((textEntry && textEntry.lyrics) ? textEntry.lyrics : "");
    const isOnlyMeasure = this.data.numberOfMeasures <= 1;

    return `
      <div class="staff-container" id="staff-container${baseindex}">
        <div class="stickings-row-container">
          <div class="line-labels">
            <div class="stickings-label" onClick="myGrooveWriter.noteLabelClick(event, 'stickings', ${baseindex})" oncontextmenu="event.preventDefault(); myGrooveWriter.noteLabelClick(event, 'stickings', ${baseindex})">STICKINGS</div>
          </div>
          <div class="music-line-container">
            <div class="notes-container">
              <div class="stickings-container">
                <div class="opening_note_space"> </div>
                ${stickingsHTML}
                <div class="end_note_space"></div>
              </div>
            </div>
          </div>
        </div>

        <span class="notes-row-container">
          <div class="line-labels">
            <div class="hh-label" onClick="myGrooveWriter.noteLabelClick(event, 'hh', ${baseindex})" oncontextmenu="event.preventDefault(); myGrooveWriter.noteLabelClick(event, 'hh', ${baseindex})">Hi-hat</div>
            <div class="hh2-label" onClick="myGrooveWriter.noteLabelClick(event, 'hh2', ${baseindex})" oncontextmenu="event.preventDefault(); myGrooveWriter.noteLabelClick(event, 'hh2', ${baseindex})">H2</div>
            <div class="tom-label" id="tom1-label" onClick="myGrooveWriter.noteLabelClick(event, 'tom1', ${baseindex})" oncontextmenu="event.preventDefault(); myGrooveWriter.noteLabelClick(event, 'tom1', ${baseindex})">Tom</div>
            <div class="snare-label" onClick="myGrooveWriter.noteLabelClick(event, 'snare', ${baseindex})" oncontextmenu="event.preventDefault(); myGrooveWriter.noteLabelClick(event, 'snare', ${baseindex})">Snare</div>
            <div class="tom-label" id="tom4-label" onClick="myGrooveWriter.noteLabelClick(event, 'tom4', ${baseindex})" oncontextmenu="event.preventDefault(); myGrooveWriter.noteLabelClick(event, 'tom4', ${baseindex})">Tom</div>
            <div class="kick-label" onClick="myGrooveWriter.noteLabelClick(event, 'kick', ${baseindex})" oncontextmenu="event.preventDefault(); myGrooveWriter.noteLabelClick(event, 'kick', ${baseindex})">Kick</div>
          </div>
          <div class="music-line-container">
            <div class="notes-container">
              <div class="staff-line-1"></div>
              <div class="staff-line-2"></div>
              <div class="staff-line-3"></div>
              <div class="staff-line-4"></div>
              <div class="staff-line-5"></div>
              <div class="staff-line-6"></div>

              <div class="background-highlight-container">
                <div class="opening_note_space"> </div>
                ${bgHighlightsHTML}
                <div class="end_note_space"></div>
              </div>

              <div class="hi-hat-container">
                <div class="opening_note_space"> </div>
                ${hhHTML}
                <div class="unmuteHHButton" id="unmutehhButton${baseindex}" onClick='myGrooveWriter.muteInstrument("hh", ${baseindex}, false)'><span class="fa-stack unmuteHHStack"><i class="fa fa-ban fa-stack-2x" style="color:red"></i><i class="fa fa-volume-down fa-stack-1x"></i></span></div>
                <div class="end_note_space"></div>
              </div>

              <div class="hi-hat2-container">
                <div class="opening_note_space"> </div>
                ${hh2HTML}
                <div class="unmuteHH2Button" id="unmutehh2Button${baseindex}" onClick='myGrooveWriter.muteInstrument("hh2", ${baseindex}, false)'><span class="fa-stack unmuteHH2Stack"><i class="fa fa-ban fa-stack-2x" style="color:red"></i><i class="fa fa-volume-down fa-stack-1x"></i></span></div>
                <div class="end_note_space"></div>
              </div>

              <div class="toms-container" id="tom1-container">
                <div class="opening_note_space"> </div>
                ${tom1HTML}
                <span class="unmuteTom1Button" id="unmutetom1Button${baseindex}" onClick='myGrooveWriter.muteInstrument("tom1", ${baseindex}, false)'><span class="fa-stack unmuteStack"><i class="fa fa-ban fa-stack-2x" style="color:red"></i><i class="fa fa-volume-down fa-stack-1x"></i></span></span>
                <div class="end_note_space"></div>
              </div>

              <div class="snare-container">
                <div class="opening_note_space"> </div>
                ${snareHTML}
                <span class="unmuteSnareButton" id="unmutesnareButton${baseindex}" onClick='myGrooveWriter.muteInstrument("snare", ${baseindex}, false)'><span class="fa-stack unmuteStack"><i class="fa fa-ban fa-stack-2x" style="color:red"></i><i class="fa fa-volume-down fa-stack-1x"></i></span></span>
                <div class="end_note_space"></div>
              </div>

              <div class="toms-container" id="tom4-container">
                <div class="opening_note_space"> </div>
                ${tom4HTML}
                <span class="unmuteTom4Button" id="unmutetom4Button${baseindex}" onClick='myGrooveWriter.muteInstrument("tom4", ${baseindex}, false)'><span class="fa-stack unmuteStack"><i class="fa fa-ban fa-stack-2x" style="color:red"></i><i class="fa fa-volume-down fa-stack-1x"></i></span></span>
                <div class="end_note_space"></div>
              </div>

              <div class="kick-container">
                <div class="opening_note_space"> </div>
                ${kickHTML}
                <span class="unmuteKickButton" id="unmutekickButton${baseindex}" onClick='myGrooveWriter.muteInstrument("kick", ${baseindex}, false)'><span class="fa-stack unmuteStack"><i class="fa fa-ban fa-stack-2x" style="color:red"></i><i class="fa fa-volume-down fa-stack-1x"></i></span></span>
                <div class="end_note_space"></div>
              </div>
            </div>
          </div>
        </span>
        ${addMeasureBtn}

        <div class="measure-controls-container" data-measure="${baseindex}">
          <div class="measure-control-row measure-repeats-row">
            <label class="measure-checkbox-label"><input type="checkbox" class="embed-repeat-start" data-measure="${baseindex}"${isRepeatStart ? ' checked' : ''} onchange="myGrooveWriter.updateSheetMusic();"> Repeat Start</label>
            <label class="measure-checkbox-label"><input type="checkbox" class="embed-repeat-end" data-measure="${baseindex}"${isRepeatEnd ? ' checked' : ''} onchange="myGrooveWriter.updateSheetMusic();"> Repeat End</label>
            <label class="measure-ending-label measure-select-label">Ending: <input type="text" class="embed-alt-ending measure-ending-input measure-text-input" data-measure="${baseindex}" value="${altEnding.replace(/"/g, '&quot;')}" placeholder="e.g. 1 or 1,2" oninput="myGrooveWriter.updateSheetMusic();" onchange="myGrooveWriter.updateSheetMusic();"></label>
          </div>
          <div class="measure-control-row measure-text-row">
            <label class="measure-text-label">Begin Text:</label>
            <input type="text" class="embed-text-begin measure-text-input" data-measure="${baseindex}" value="${textBegin.replace(/"/g, '&quot;')}" placeholder="e.g. Intro" oninput="myGrooveWriter.updateSheetMusic();" onchange="myGrooveWriter.updateSheetMusic();">
          </div>
          <div class="measure-control-row measure-text-row">
            <label class="measure-text-label">End Text:</label>
            <input type="text" class="embed-text-end measure-text-input" data-measure="${baseindex}" value="${textEnd.replace(/"/g, '&quot;')}" placeholder="e.g. Fill" oninput="myGrooveWriter.updateSheetMusic();" onchange="myGrooveWriter.updateSheetMusic();">
          </div>
          <div class="measure-control-row measure-text-row">
            <label class="measure-text-label"><a href="https://abcnotation.com/wiki/abc:standard:v2.1#lyrics" target="_blank" rel="noopener noreferrer" class="measure-lyrics-link" title="ABC lyrics syntax help">Lyrics</a>:</label>
            <input type="text" class="embed-text-lyrics measure-text-input" data-measure="${baseindex}" value="${lyrics.replace(/"/g, '&quot;')}" placeholder="e.g. 1 & 2 & 3 & 4 &" oninput="myGrooveWriter.updateSheetMusic();" onchange="myGrooveWriter.updateSheetMusic();">
          </div>
          <div class="measure-control-row measure-actions-row">
            <button type="button" class="measure-btn measure-copy-btn" data-measure="${baseindex}" title="Copy this measure and append to the end" onClick="myGrooveWriter.copyMeasureToLastButtonClick(${baseindex})"><i class="fa fa-clone"></i> Copy to last</button>
            <button type="button" class="measure-btn measure-clear-btn" data-measure="${baseindex}" title="Erase all notes in this measure" onClick="myGrooveWriter.clearMeasureButtonClick(${baseindex})"><i class="fa fa-eraser"></i> Clear measure</button>
            <button type="button" class="measure-btn measure-delete-btn" data-measure="${baseindex}" title="${isOnlyMeasure ? 'Cannot delete the only measure' : 'Delete this measure'}" onClick="myGrooveWriter.deleteMeasureButtonClick(${baseindex})"${isOnlyMeasure ? ' disabled' : ''}><i class="fa fa-trash"></i> Delete measure</button>
          </div>
        </div>
      </div>
    `.trim();
  }

  permutationOptionClick(event: Event): void {
    var optionId = (event.target as HTMLElement).id;
    var checkbox = document.getElementById(optionId) as HTMLInputElement;
    var OnElseOff = checkbox.checked;

    for (var i = 1; i < 5; i++) {
      var subOption = optionId + "_sub" + i;
      checkbox = document.getElementById(subOption) as HTMLInputElement;
      if (checkbox)
        checkbox.checked = OnElseOff;
    }

    this.refresh_ABC();
  };

  permutationSubOptionClick(event: Event): void {
    var optionId = (event.target as HTMLElement).id;
    var checkbox = document.getElementById(optionId) as HTMLInputElement;
    var OnElseOff = checkbox.checked;

    if (OnElseOff) {
      var mainOption = optionId.replace("_sub", "").slice(0, -1);
      checkbox = document.getElementById(mainOption) as HTMLInputElement;
      if (checkbox)
        checkbox.checked = true;
    }

    this.refresh_ABC();
  };

  HTMLforPermutationOptions(): string {
    if (this.class_permutation_type == "none")
      return "";

    var optionTypeArray = [{
      id: "PermuationOptionsOstinato",
      subid: "PermuationOptionsOstinato_sub",
      name: "Ostinato",
      SubOptions: [] as string[],
      defaultOn: false
    }, {
      id: "PermuationOptionsSingles",
      subid: "PermuationOptionsSingles_sub",
      name: "Singles",
      SubOptions: ["1", "&", "a"],
      defaultOn: true
    }, {
      id: "PermuationOptionsDoubles",
      subid: "PermuationOptionsDoubles_sub",
      name: "Doubles",
      SubOptions: ["1", "&", "a"],
      defaultOn: true
    }, {
      id: "PermuationOptionsTriples",
      subid: "PermuationOptionsTriples_sub",
      name: "Triples",
      SubOptions: [] as string[],
      defaultOn: true
    }
    ];

    if (!this.usingTriplets()) {
      optionTypeArray[1].SubOptions = ["1", "e", "&", "a"];
      optionTypeArray[2].SubOptions = ["1", "e", "&", "a"];
      optionTypeArray[3].SubOptions = ["1", "e", "&", "a"];
      optionTypeArray.splice(3, 0, {
        id: "PermuationOptionsUpsDowns",
        subid: "PermuationOptionsUpsDowns_sub",
        name: "Downbeats/Upbeats",
        SubOptions: ["downs", "ups"],
        defaultOn: false
      });
      optionTypeArray.splice(5, 0, {
        id: "PermuationOptionsQuads",
        subid: "PermuationOptionsQuads_sub",
        name: "Quads",
        SubOptions: [] as string[],
        defaultOn: false
      });
    }

    switch (this.class_permutation_type) {
      case "snare_16ths":
        optionTypeArray.splice(0, 0, {
          id: "PermuationOptionsAccentGrid",
          subid: "",
          name: "Use Accent Grid",
          SubOptions: [] as string[],
          defaultOn: false
        });
        break;
      case "kick_16ths":
        if (!this.usingTriplets())
          optionTypeArray.splice(0, 0, {
            id: "PermuationOptionsSkipSomeFirstNotes",
            subid: "",
            name: "Simplify multiple kicks",
            SubOptions: [] as string[],
            defaultOn: false
          });
        break;
      default:
        console.log("Bad case in HTMLforPermutationOptions()");
        break;
    }

    var newHTML = '<span id="PermutationOptionsHeader">Permutation Options</span>\n';
    newHTML += '<span class="PermutationOptionWrapper">';

    for (var optionType in optionTypeArray) {
      newHTML += '' +
        '<div class="PermutationOptionGroup" id="' + optionTypeArray[optionType].id + 'Group">\n' +
        '<div class="PermutationOption">\n' +
        '<input ' + (optionTypeArray[optionType].defaultOn ? "checked" : "") + ' type="checkbox" class="myCheckbox" id="' + optionTypeArray[optionType].id + '" onClick="myGrooveWriter.permutationOptionClick(event)">' +
        '<label for="' + optionTypeArray[optionType].id + '">' + optionTypeArray[optionType].name + '</label>\n' +
        '</div>' +
        '<span class="permutationSubOptionContainer" id="' + optionTypeArray[optionType].subid + '">\n';

      var count = 0;
      for (var optionName in optionTypeArray[optionType].SubOptions) {
        count++;
        newHTML += '' +
          '<span class="PermutationSubOption">\n' +
          '	<input ' + (optionTypeArray[optionType].defaultOn ? "checked" : "") + ' type="checkbox" class="myCheckbox" id="' + optionTypeArray[optionType].subid + count + '" onClick="myGrooveWriter.permutationSubOptionClick(event)">' +
          '	<label for="' + optionTypeArray[optionType].subid + count + '">' + optionTypeArray[optionType].SubOptions[optionName] + '</label>' +
          '</span>';
      }

      newHTML += '' +
        '	</span>\n' +
        '</div>\n';
    }

    newHTML += '</span>\n';
    return newHTML;
  };
}

(globalThis as any).GrooveWriter = GrooveWriter;
(globalThis as any).kickPermutationStrait = kickPermutationStrait;
(globalThis as any).kickPermutationMinusSomeStrait = kickPermutationMinusSomeStrait;
(globalThis as any).kickPermutationTriplets = kickPermutationTriplets;
(globalThis as any).shouldDisplayPermutation = shouldDisplayPermutation;
(globalThis as any).PERMUTATION_SECTIONS = PERMUTATION_SECTIONS;

// Global helper wrappers for backward compatibility
const getGWInstance = (): any => {
  if (typeof (window as any) !== "undefined" && (window as any).myGrooveWriter) return (window as any).myGrooveWriter;
  if (typeof (globalThis as any) !== "undefined" && (globalThis as any).myGrooveWriter) return (globalThis as any).myGrooveWriter;
  if (typeof (global as any) !== "undefined" && (global as any).myGrooveWriter) return (global as any).myGrooveWriter;
  return undefined;
};

const renderEmbedMeasureTableGlobal = (num?: number | null) => getGWInstance()?.renderEmbedMeasureTable(num);
const getEmbedTableDataGlobal = () => getGWInstance()?.getEmbedTableData();
const setEmbedTableDataGlobal = (data: any) => getGWInstance()?.setEmbedTableData(data);
const populateFromUrlGlobal = (url?: string) => getGWInstance()?.populateEmbedFromUrl(url);
const getEmbedUrlGlobal = () => getGWInstance()?.getEmbedUrl();
const updateEmbedLinkGlobal = () => getGWInstance()?.updateEmbedLink();
const copyEmbedLinkGlobal = () => getGWInstance()?.copyEmbedLink();
const convertGlobal = () => getGWInstance()?.updateEmbedLink();
const convertAndCopyGlobal = () => getGWInstance()?.copyEmbedLink();
const openLinkGlobal = () => getGWInstance()?.openEmbedLink();
const decodeConvertedUrlGlobal = (url?: string) => getGWInstance()?.populateEmbedFromUrl(url);
const copyMeasureToLastGlobal = (measureIndex: number) => getGWInstance()?.copyMeasureToLast(measureIndex);
const clearMeasureGlobal = (measureIndex: number) => getGWInstance()?.clearMeasure(measureIndex);
const deleteMeasureGlobal = (measureIndex: number) => getGWInstance()?.deleteMeasure(measureIndex);
const moveMeasureGlobal = (fromIndex: number, toIndex: number) => getGWInstance()?.moveMeasure(fromIndex, toIndex);

if (typeof window !== "undefined") {
  (window as any).renderEmbedMeasureTable = renderEmbedMeasureTableGlobal;
  (window as any).getEmbedTableData = getEmbedTableDataGlobal;
  (window as any).setEmbedTableData = setEmbedTableDataGlobal;
  (window as any).populateFromUrl = populateFromUrlGlobal;
  (window as any).getEmbedUrl = getEmbedUrlGlobal;
  (window as any).updateEmbedLink = updateEmbedLinkGlobal;
  (window as any).copyEmbedLink = copyEmbedLinkGlobal;
  (window as any).convert = convertGlobal;
  (window as any).convertAndCopy = convertAndCopyGlobal;
  (window as any).openLink = openLinkGlobal;
  (window as any).decodeConvertedUrl = decodeConvertedUrlGlobal;
  (window as any).copyMeasureToLast = copyMeasureToLastGlobal;
  (window as any).clearMeasure = clearMeasureGlobal;
  (window as any).deleteMeasure = deleteMeasureGlobal;
  (window as any).moveMeasure = moveMeasureGlobal;
  (window as any).encodeAfterLastColon = encodeAfterLastColon;
  (window as any).parseQuery = parseQuery;
}

if (typeof (globalThis as any) !== "undefined") {
  (globalThis as any).renderEmbedMeasureTable = renderEmbedMeasureTableGlobal;
  (globalThis as any).getEmbedTableData = getEmbedTableDataGlobal;
  (globalThis as any).setEmbedTableData = setEmbedTableDataGlobal;
  (globalThis as any).populateFromUrl = populateFromUrlGlobal;
  (globalThis as any).getEmbedUrl = getEmbedUrlGlobal;
  (globalThis as any).updateEmbedLink = updateEmbedLinkGlobal;
  (globalThis as any).copyEmbedLink = copyEmbedLinkGlobal;
  (globalThis as any).convert = convertGlobal;
  (globalThis as any).convertAndCopy = convertAndCopyGlobal;
  (globalThis as any).openLink = openLinkGlobal;
  (globalThis as any).decodeConvertedUrl = decodeConvertedUrlGlobal;
  (globalThis as any).copyMeasureToLast = copyMeasureToLastGlobal;
  (globalThis as any).clearMeasure = clearMeasureGlobal;
  (globalThis as any).deleteMeasure = deleteMeasureGlobal;
  (globalThis as any).moveMeasure = moveMeasureGlobal;
  (globalThis as any).encodeAfterLastColon = encodeAfterLastColon;
  (globalThis as any).parseQuery = parseQuery;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    GrooveWriter,
    renderEmbedMeasureTable: renderEmbedMeasureTableGlobal,
    getEmbedTableData: getEmbedTableDataGlobal,
    setEmbedTableData: setEmbedTableDataGlobal,
    populateFromUrl: populateFromUrlGlobal,
    getEmbedUrl: getEmbedUrlGlobal,
    updateEmbedLink: updateEmbedLinkGlobal,
    copyEmbedLink: copyEmbedLinkGlobal,
    convert: convertGlobal,
    convertAndCopy: convertAndCopyGlobal,
    decodeConvertedUrl: decodeConvertedUrlGlobal,
    copyMeasureToLast: copyMeasureToLastGlobal,
    clearMeasure: clearMeasureGlobal,
    deleteMeasure: deleteMeasureGlobal,
    moveMeasure: moveMeasureGlobal,
    encodeAfterLastColon,
    parseQuery,
    kickPermutationStrait,
    kickPermutationMinusSomeStrait,
    kickPermutationTriplets,
    shouldDisplayPermutation,
    PERMUTATION_SECTIONS
  };
}
