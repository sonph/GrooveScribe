/*jslint browser:true devel:true */
/*global MIDI, Midi */

declare var MIDI: any;
declare var Midi: any;

var global_midiInitialized = false;

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

// MIDI note lookup for a hi-hat ABC token. Returns null for OFF/unknown.
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

// MIDI note lookup for a snare ABC token.
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

// MIDI note lookup for a kick ABC token.
function kickMidiFor(abcVal): { kick: number | null; splash: number | null } {
  switch (abcVal) {
    case constant_ABC_KI_Splash: return { kick: null, splash: MIDI_HIHAT_FOOT };
    case constant_ABC_KI_SandK:
    case "[F^d,]":
      return { kick: MIDI_KICK_NORMAL, splash: MIDI_HIHAT_FOOT };
    case constant_ABC_KI_Normal: return { kick: MIDI_KICK_NORMAL, splash: null };
    default: return { kick: null, splash: null };
  }
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

// Adjust a base note duration for swing feel.
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
  const lengthen = val < scaler || (val >= scaler * 2 && val < scaler * 3);
  return baseDuration + (lengthen ? 1 : -1) * baseDuration * swingPercentage;
}

// Return the number of notes to subtract from the metronome index so that
// the click lands on the requested subdivision.
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

function isTripletDivision(subdivision: number): boolean {
  return subdivision % 12 === 0;
}

function isTripletDivisionFromNotesPerMeasure(notesPerMeasure: number, timeSig: TimeSignature): boolean {
  return isTripletDivision((notesPerMeasure / timeSig.top) * timeSig.bottom.value);
}

function notesPerMeasureInFullSizeArray(isTripletDivision: boolean, timeSig: TimeSignature): number {
  return (isTripletDivision ? 48 : 32) * (timeSig.top / timeSig.bottom.value);
}

function getNoteScaler(notesPerMeasure: number, timeSig: TimeSignature): number {
  if (!timeSig.top || timeSig.top < 1 || timeSig.top > 36) return 1.0;
  const isTriplet = isTripletDivisionFromNotesPerMeasure(notesPerMeasure, timeSig);
  return Math.ceil(notesPerMeasureInFullSizeArray(isTriplet, timeSig) / notesPerMeasure);
}

function createNoteMappingArrayForHighlighting(
  hhArray: Array<any> | null,
  snareArray: Array<any> | null,
  kickArray: Array<any> | null,
  tomsArray: Array<Array<any>> | null,
  numNotes: number,
  hh2Array?: Array<any> | null,
): Array<boolean> {
  const isNoteOn = (v: any) => v !== false && v !== null && v !== undefined && v !== '-';
  const mappingArray = new Array<boolean>(numNotes);
  for (let i = 0; i < numNotes; i++) {
    mappingArray[i] = Boolean(
      (hhArray && isNoteOn(hhArray[i])) ||
      (hh2Array && isNoteOn(hh2Array[i])) ||
      (snareArray && isNoteOn(snareArray[i])) ||
      (kickArray && isNoteOn(kickArray[i])) ||
      (tomsArray && tomsArray.some(tom => tom && isNoteOn(tom[i])))
    );
  }
  return mappingArray;
}

function convertStickingCountsToActualCounts(stickingArray: Array<string>, timeDivision: number, timeSig: TimeSignature): void {
  const isTriplets = isTripletDivision(timeDivision);
  const actualNotesPerMeasure = notesPerMeasureInFullSizeArray(isTriplets, timeSig);
  const notesPerMeasureInTimeDivision = ((timeDivision / 4) * timeSig.top) * (4 / timeSig.bottom.value);
  const scaleRatio = actualNotesPerMeasure / notesPerMeasureInTimeDivision;

  for (let i = 0; i < stickingArray.length; i++) {
    if (stickingArray[i] === '"count"x') {
      const adjustedIndex = Math.floor(i / scaleRatio);
      const newCount = figureOutStickingCountForIndex(adjustedIndex, notesPerMeasureInTimeDivision, timeDivision, timeSig.bottom.value);
      stickingArray[i] = `"${newCount}"x`;
    }
  }
}

function noteGroupingSize(notesPerMeasure: number, timeSig: TimeSignature): number {
  if (isTripletDivisionFromNotesPerMeasure(notesPerMeasure, timeSig)) {
    return notesPerMeasure / (timeSig.top * (4 / timeSig.bottom.value));
  }
  if (timeSig.top === 3) {
    return notesPerMeasure / 3;
  }
  if (timeSig.top % 6 === 0 && timeSig.bottom.value % 8 === 0) {
    return notesPerMeasure / (2 * timeSig.top / 6);
  }
  return (notesPerMeasure / timeSig.top) * (timeSig.bottom.value / 4);
}

function binaryStringToBase64(bytes: string): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes.charCodeAt(i) & 0xff);
  }
  return btoa(binary);
}

function MIDI_build_midi_url_count_in_track(timeSig: TimeSignature, tempo: number): string {
  var midiFile = new Midi.File();
  var midiTrack = new Midi.Track();
  midiFile.addTrack(midiTrack);

  midiTrack.setTempo(tempo);
  midiTrack.setInstrument(0, 0x13);

  // Initial blank note avoids midi player skipping the first beat.
  midiTrack.addNoteOff(9, 60, 1);

  var noteDelay = 128;
  if (timeSig.bottom.value == 8)
    noteDelay = 64;
  else if (timeSig.bottom.value == 16)
    noteDelay = 32;

  midiTrack.addNoteOn(9, MIDI_METRONOME_1, 0, MIDI_VELOCITY_NORMAL);
  midiTrack.addNoteOff(9, MIDI_METRONOME_1, noteDelay);
  for (var i = 1; i < timeSig.top; i++) {
    midiTrack.addNoteOn(9, MIDI_METRONOME_NORMAL, 0, MIDI_VELOCITY_NORMAL);
    midiTrack.addNoteOff(9, MIDI_METRONOME_NORMAL, noteDelay);
  }

  return "data:audio/midi;base64," + binaryStringToBase64(midiFile.toBytes());
}

function MIDI_from_HH_Snare_Kick_Arrays(
  midiTrack: any,
  HH_Array: Array<any>,
  Snare_Array: Array<any>,
  Kick_Array: Array<any>,
  Toms_Array: Array<Array<any>> | null,
  midi_output_type: string,
  metronome_frequency: number,
  num_notes: number,
  num_notes_for_swing: number,
  swing_percentage: number,
  timeSig: TimeSignature,
  metronomeSolo: boolean = false,
  offsetClickStartBeat: string = "1",
  HH2_Array?: Array<any> | null
): void {
  var prev_hh_note: any = 46; // default open hi-hat to mute previous open hats on first stroke
  var prev_hh2_note: any = 46;
  var midi_channel = 9; // standard MIDI percussion channel

  if (swing_percentage < 0 || swing_percentage > 0.99) {
    console.log("Swing percentage out of range in GrooveUtils.MIDI_from_HH_Snare_Kick_Arrays");
    swing_percentage = 0;
  }

  if (midiTrack.events.length < 4) {
    midiTrack.addNoteOff(midi_channel, 60, 1);
  }

  var isTriplets = isTripletDivisionFromNotesPerMeasure(num_notes, timeSig);
  var delay_for_next_note = 0;

  for (var i = 0; i < num_notes; i++) {
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

    if (!metronomeSolo) {
      const hhLookup = hihatMidiFor(HH_Array[i], midi_output_type);
      const hh_note: any = hhLookup ? hhLookup.note : false;
      const hh_velocity = hhLookup ? hhLookup.velocity : MIDI_VELOCITY_NORMAL;

      if (hh_note !== false) {
        if (prev_hh_note !== false) {
          midiTrack.addNoteOff(midi_channel, prev_hh_note, delay_for_next_note);
          prev_hh_note = false;
          delay_for_next_note = 0;
        }
        midiTrack.addNoteOn(midi_channel, hh_note, delay_for_next_note, hh_velocity);
        delay_for_next_note = 0;

        if (HH_Array[i] == constant_ABC_HH_Open)
          prev_hh_note = hh_note;
      }

      if (HH2_Array && HH2_Array[i] !== false && HH2_Array[i] !== null && HH2_Array[i] !== undefined && HH2_Array[i] !== '-') {
        const hh2Lookup = hihatMidiFor(HH2_Array[i], midi_output_type);
        const hh2_note: any = hh2Lookup ? hh2Lookup.note : false;
        const hh2_velocity = hh2Lookup ? hh2Lookup.velocity : MIDI_VELOCITY_NORMAL;

        if (hh2_note !== false) {
          if (prev_hh2_note !== false) {
            midiTrack.addNoteOff(midi_channel, prev_hh2_note, delay_for_next_note);
            prev_hh2_note = false;
            delay_for_next_note = 0;
          }
          midiTrack.addNoteOn(midi_channel, hh2_note, delay_for_next_note, hh2_velocity);
          delay_for_next_note = 0;

          if (HH2_Array[i] == constant_ABC_HH_Open)
            prev_hh2_note = hh2_note;
        }
      }

      const snLookup = snareMidiFor(Snare_Array[i], midi_output_type);
      const snare_note: any = snLookup ? snLookup.note : false;
      const snare_velocity = snLookup ? snLookup.velocity : MIDI_VELOCITY_NORMAL;

      if (snare_note !== false) {
        midiTrack.addNoteOn(midi_channel, snare_note, delay_for_next_note, snare_velocity);
        delay_for_next_note = 0;
      }

      const kickLookup = kickMidiFor(Kick_Array[i]);
      const kick_note: any = kickLookup.kick !== null ? kickLookup.kick : false;
      const kick_splash_note: any = kickLookup.splash !== null ? kickLookup.splash : false;
      if (kick_note !== false) {
        midiTrack.addNoteOn(midi_channel, kick_note, delay_for_next_note, MIDI_VELOCITY_NORMAL);
        delay_for_next_note = 0;
      }
      if (kick_splash_note !== false) {
        if (prev_hh_note !== false) {
          midiTrack.addNoteOff(midi_channel, prev_hh_note, delay_for_next_note);
          prev_hh_note = false;
          delay_for_next_note = 0;
        }
        midiTrack.addNoteOn(midi_channel, kick_splash_note, delay_for_next_note, MIDI_VELOCITY_NORMAL);
        delay_for_next_note = 0;
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
    }

    delay_for_next_note += duration;
  }

  if (delay_for_next_note)
    midiTrack.addNoteOff(0, 60, delay_for_next_note - 1);
}

var global_current_midi_start_time: any = 0;
var global_last_midi_update_time: any = 0;
var global_total_midi_play_time_msecs = 0;
var global_total_midi_notes = 0;
var global_total_midi_repeats = 0;

class MidiEventCallback {
  grooveUtils: any;
  noteHasChangedSinceLastDataLoad: boolean;
  midiEventCallbacks: object;
  grooveUtilsUniqueIndex: number;
  playEvent: (root?: any) => void;
  playEventCallback: (() => void) | null;
  create_MIDIURLFromGrooveData: (data: GrooveData) => string;
  loadMIDIFromURL: (url: string) => void;
  getMidiImageLocation: () => string;

  constructor(grooveUtils: any) {
    this.grooveUtils = grooveUtils;
    this.grooveUtilsUniqueIndex = grooveUtils ? grooveUtils.grooveUtilsUniqueIndex : 0;
    this.noteHasChangedSinceLastDataLoad = false;

    this.playEvent = function () {
      var icon = document.getElementById("midiPlayImage" + this.grooveUtilsUniqueIndex);
      if (icon)
        icon.className = "midiPlayImage Playing";
      if (this.playEventCallback) {
        this.playEventCallback();
      }
    };
  }

  loadMidiDataEvent(_playStarting?: boolean): void {
    if (this.grooveUtils && this.grooveUtils.data) {
      var midiURL = this.create_MIDIURLFromGrooveData ? this.create_MIDIURLFromGrooveData(this.grooveUtils.data) : (this.grooveUtils.create_MIDIURLFromGrooveData(this.grooveUtils.data));
      if (this.loadMIDIFromURL) {
        this.loadMIDIFromURL(midiURL);
      } else if (this.grooveUtils.loadMIDIFromURL) {
        this.grooveUtils.loadMIDIFromURL(midiURL);
      }
      this.noteHasChangedSinceLastDataLoad = false;
    } else {
      console.log("can't load midi song. data is empty");
    }
  }

  doesMidiDataNeedRefresh(): boolean {
    return this.noteHasChangedSinceLastDataLoad;
  }

  pauseEvent(): void {
    var icon = document.getElementById("midiPlayImage" + this.grooveUtilsUniqueIndex);
    if (icon)
      icon.className = "midiPlayImage Paused";
  }

  resumeEvent(): void { };
  stopEvent(): void {
    var icon = document.getElementById("midiPlayImage" + this.grooveUtilsUniqueIndex);
    if (icon)
      icon.className = "midiPlayImage Stopped";
  }
  repeatChangeEvent(newValue: boolean): void {
    var imgLocation = this.getMidiImageLocation ? this.getMidiImageLocation() : (this.grooveUtils ? this.grooveUtils.getMidiImageLocation() : "images/");
    var elem = document.getElementById("midiRepeatImage" + this.grooveUtilsUniqueIndex) as HTMLImageElement | null;
    if (elem) {
      elem.src = newValue ? imgLocation + "repeat.png" : imgLocation + "grey_repeat.png";
    }
  }
  percentProgress(percent: number): void { };
  notePlaying(note_type?: string, note_position?: number): void { };

  midiInitialized(): void {
    var icon = document.getElementById("midiPlayImage" + this.grooveUtilsUniqueIndex);
    if (icon) {
      icon.className = "midiPlayImage Stopped";
      icon.onclick = (event: MouseEvent) => {
        if (this.grooveUtils) {
          this.grooveUtils.startOrStopMIDI_playback();
        }
      };
    }
    if (this.grooveUtils && this.grooveUtils.setupHotKeys) {
      this.grooveUtils.setupHotKeys();
    }
  }
}

// Global exports
(globalThis as any).MidiEventCallback = MidiEventCallback;
(globalThis as any).hihatMidiFor = hihatMidiFor;
(globalThis as any).snareMidiFor = snareMidiFor;
(globalThis as any).kickMidiFor = kickMidiFor;
(globalThis as any).tomMidiFor = tomMidiFor;
(globalThis as any).swingAdjustedDuration = swingAdjustedDuration;
(globalThis as any).metronomeOffsetShift = metronomeOffsetShift;
(globalThis as any).metronomeNoteAt = metronomeNoteAt;
(globalThis as any).isTripletDivision = isTripletDivision;
(globalThis as any).isTripletDivisionFromNotesPerMeasure = isTripletDivisionFromNotesPerMeasure;
(globalThis as any).notesPerMeasureInFullSizeArray = notesPerMeasureInFullSizeArray;
(globalThis as any).getNoteScaler = getNoteScaler;
(globalThis as any).createNoteMappingArrayForHighlighting = createNoteMappingArrayForHighlighting;
(globalThis as any).convertStickingCountsToActualCounts = convertStickingCountsToActualCounts;
(globalThis as any).noteGroupingSize = noteGroupingSize;
(globalThis as any).binaryStringToBase64 = binaryStringToBase64;
(globalThis as any).MIDI_build_midi_url_count_in_track = MIDI_build_midi_url_count_in_track;
(globalThis as any).MIDI_from_HH_Snare_Kick_Arrays = MIDI_from_HH_Snare_Kick_Arrays;

(globalThis as any).MIDI_VELOCITY_NORMAL = MIDI_VELOCITY_NORMAL;
(globalThis as any).MIDI_VELOCITY_ACCENT = MIDI_VELOCITY_ACCENT;
(globalThis as any).MIDI_VELOCITY_GHOST = MIDI_VELOCITY_GHOST;
(globalThis as any).MIDI_METRONOME_1 = MIDI_METRONOME_1;
(globalThis as any).MIDI_METRONOME_NORMAL = MIDI_METRONOME_NORMAL;
(globalThis as any).MIDI_HIHAT_NORMAL = MIDI_HIHAT_NORMAL;
(globalThis as any).MIDI_HIHAT_OPEN = MIDI_HIHAT_OPEN;
(globalThis as any).MIDI_HIHAT_ACCENT = MIDI_HIHAT_ACCENT;
(globalThis as any).MIDI_HIHAT_CRASH = MIDI_HIHAT_CRASH;
(globalThis as any).MIDI_HIHAT_STACKER = MIDI_HIHAT_STACKER;
(globalThis as any).MIDI_HIHAT_METRONOME_NORMAL = MIDI_HIHAT_METRONOME_NORMAL;
(globalThis as any).MIDI_HIHAT_METRONOME_ACCENT = MIDI_HIHAT_METRONOME_ACCENT;
(globalThis as any).MIDI_HIHAT_RIDE = MIDI_HIHAT_RIDE;
(globalThis as any).MIDI_HIHAT_RIDE_BELL = MIDI_HIHAT_RIDE_BELL;
(globalThis as any).MIDI_HIHAT_COW_BELL = MIDI_HIHAT_COW_BELL;
(globalThis as any).MIDI_HIHAT_FOOT = MIDI_HIHAT_FOOT;
(globalThis as any).MIDI_SNARE_NORMAL = MIDI_SNARE_NORMAL;
(globalThis as any).MIDI_SNARE_ACCENT = MIDI_SNARE_ACCENT;
(globalThis as any).MIDI_SNARE_GHOST = MIDI_SNARE_GHOST;
(globalThis as any).MIDI_SNARE_XSTICK = MIDI_SNARE_XSTICK;
(globalThis as any).MIDI_SNARE_BUZZ = MIDI_SNARE_BUZZ;
(globalThis as any).MIDI_SNARE_FLAM = MIDI_SNARE_FLAM;
(globalThis as any).MIDI_SNARE_DRAG = MIDI_SNARE_DRAG;
(globalThis as any).MIDI_KICK_NORMAL = MIDI_KICK_NORMAL;
(globalThis as any).MIDI_TOM1_NORMAL = MIDI_TOM1_NORMAL;
(globalThis as any).MIDI_TOM2_NORMAL = MIDI_TOM2_NORMAL;
(globalThis as any).MIDI_TOM3_NORMAL = MIDI_TOM3_NORMAL;
(globalThis as any).MIDI_TOM4_NORMAL = MIDI_TOM4_NORMAL;
(globalThis as any).CONSTANT_Midi_play_time_zero = CONSTANT_Midi_play_time_zero;
