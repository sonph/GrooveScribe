/*jslint browser:true devel:true */
/*global MIDI, Midi */
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
function hihatMidiFor(abcVal, midi_output_type) {
    switch (abcVal) {
        case constant_ABC_HH_Normal:
        case constant_ABC_HH_Close:
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
function snareMidiFor(abcVal, midi_output_type) {
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
function kickMidiFor(abcVal) {
    switch (abcVal) {
        case constant_ABC_KI_Splash: return { kick: null, splash: MIDI_HIHAT_FOOT };
        case constant_ABC_KI_SandK:
        case "[F^d,]":
            return { kick: MIDI_KICK_NORMAL, splash: MIDI_HIHAT_FOOT };
        case constant_ABC_KI_Normal: return { kick: MIDI_KICK_NORMAL, splash: null };
        default: return { kick: null, splash: null };
    }
}
function tomMidiFor(abcVal) {
    switch (abcVal) {
        case constant_ABC_T1_Normal: return MIDI_TOM1_NORMAL;
        case constant_ABC_T2_Normal: return MIDI_TOM2_NORMAL;
        case constant_ABC_T3_Normal: return MIDI_TOM3_NORMAL;
        case constant_ABC_T4_Normal: return MIDI_TOM4_NORMAL;
        default: return null;
    }
}
// Adjust a base note duration for swing feel.
function swingAdjustedDuration(i, baseDuration, swingPercentage, numNotes, numNotesForSwing) {
    if (swingPercentage === 0)
        return baseDuration;
    const scaler = numNotes / numNotesForSwing;
    const val = i % (4 * scaler);
    const lengthen = val < scaler || (val >= scaler * 2 && val < scaler * 3);
    return baseDuration + (lengthen ? 1 : -1) * baseDuration * swingPercentage;
}
// Return the number of notes to subtract from the metronome index so that
// the click lands on the requested subdivision.
function metronomeOffsetShift(offsetClickStartBeat, isTriplets, sixteenthNoteFrequency) {
    const straightOnly = offsetClickStartBeat === 'E' || offsetClickStartBeat === 'AND' || offsetClickStartBeat === 'A';
    const tripletOnly = offsetClickStartBeat === 'TI' || offsetClickStartBeat === 'TA';
    if (isTriplets && straightOnly) {
        console.log(`OffsetClickStart error: straight offset '${offsetClickStartBeat}' in triplet context`);
    }
    if (!isTriplets && tripletOnly) {
        console.log(`OffsetClickStart error: triplet offset '${offsetClickStartBeat}' in straight context`);
    }
    switch (offsetClickStartBeat) {
        case '1': return 0;
        case 'E': return sixteenthNoteFrequency;
        case 'AND': return 2 * sixteenthNoteFrequency;
        case 'A': return 3 * sixteenthNoteFrequency;
        case 'TI': return sixteenthNoteFrequency * 2;
        case 'TA': return 2 * (sixteenthNoteFrequency * 2);
        default:
            console.log(`bad case in metronomeOffsetShift: ${offsetClickStartBeat}`);
            return 0;
    }
}
// Return which metronome sound (if any) should fire at this note index.
function metronomeNoteAt(specificIndex, metronomeFrequency, isTriplets, timeSig) {
    if (specificIndex < 0)
        return null;
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
function isTripletDivision(subdivision) {
    return subdivision % 12 === 0;
}
function isTripletDivisionFromNotesPerMeasure(notesPerMeasure, timeSig) {
    return isTripletDivision((notesPerMeasure / timeSig.top) * timeSig.bottom.value);
}
function notesPerMeasureInFullSizeArray(is_triplet_division, timeSig) {
    if (is_triplet_division) {
        return 48 * (timeSig.top / timeSig.bottom.value);
    }
    return 32 * (timeSig.top / timeSig.bottom.value);
}
function getNoteScaler(notes_per_measure, timeSig) {
    if (!timeSig.top || timeSig.top < 1 || timeSig.top > 36) {
        console.log("Error in getNoteScaler, out of range: " + timeSig.top);
        return 1.0;
    }
    if (isTripletDivisionFromNotesPerMeasure(notes_per_measure, timeSig))
        return Math.ceil(notesPerMeasureInFullSizeArray(true, timeSig) / notes_per_measure);
    return Math.ceil(notesPerMeasureInFullSizeArray(false, timeSig) / notes_per_measure);
}
function create_note_mapping_array_for_highlighting(HH_array, snare_array, kick_array, toms_array, num_notes) {
    var mapping_array = new Array(num_notes);
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
}
function figure_out_sticking_count_for_index(index, notes_per_measure, sub_division, time_sig_bottom) {
    const note_index = index % notes_per_measure;
    const implied_sub_division = sub_division * (4 / time_sig_bottom);
    switch (implied_sub_division) {
        case 4:
            return note_index + 1;
        case 8:
            return (note_index % 2 === 0) ? Math.floor(note_index / 2) + 1 : "&";
        case 12:
            if (note_index % 3 === 0)
                return Math.floor(note_index / 3) + 1;
            return (note_index % 3 == 1) ? "&" : "a";
        case 24:
            if (note_index % 3 === 0)
                return Math.floor(note_index / 6) + 1;
            return (note_index % 3 == 1) ? "&" : "a";
        case 48:
            if (note_index % 3 === 0)
                return Math.floor(note_index / 12) + 1;
            return (note_index % 3 == 1) ? "&" : "a";
        case 16:
        case 32:
        default:
            var whole_note_interval = implied_sub_division / 4;
            if (note_index % 4 === 0)
                return Math.floor(note_index / whole_note_interval) + 1;
            else if (note_index % 4 === 1)
                return "e";
            else if (note_index % 4 === 2)
                return "&";
            else
                return "a";
    }
}
function convert_sticking_counts_to_actual_counts(sticking_array, time_division, timeSig) {
    var cur_div_of_array = isTripletDivision(time_division) ? 48 : 32;
    var actual_notes_per_measure_in_this_array = notesPerMeasureInFullSizeArray(cur_div_of_array === 48, timeSig);
    var notes_per_measure_in_time_division = ((time_division / 4) * timeSig.top) * (4 / timeSig.bottom.value);
    for (var i in sticking_array) {
        if (sticking_array[i] == '"count"x') {
            var adjusted_index = Math.floor(Number(i) / (actual_notes_per_measure_in_this_array / notes_per_measure_in_time_division));
            var new_count = figure_out_sticking_count_for_index(adjusted_index, notes_per_measure_in_time_division, time_division, timeSig.bottom.value);
            sticking_array[i] = '"' + new_count + '"x';
        }
    }
}
function noteGroupingSize(notes_per_measure, timeSig) {
    var note_grouping;
    var usingTriplets = isTripletDivisionFromNotesPerMeasure(notes_per_measure, timeSig);
    if (usingTriplets) {
        if (timeSig.top != 2 && timeSig.bottom.value != 4)
            console.log("Triplets are only supported in 2/4 and 4/4 time");
        note_grouping = notes_per_measure / (timeSig.top * (4 / timeSig.bottom.value));
    }
    else if (timeSig.top == 3) {
        note_grouping = (notes_per_measure) / 3;
    }
    else if (timeSig.top % 6 == 0 && timeSig.bottom.value % 8 == 0) {
        note_grouping = notes_per_measure / (2 * timeSig.top / 6);
    }
    else {
        note_grouping = (notes_per_measure / timeSig.top) * (timeSig.bottom.value / 4);
    }
    return note_grouping;
}
function MIDI_build_midi_url_count_in_track(timeSig, tempo) {
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
    return "data:audio/midi;base64," + btoa(midiFile.toBytes());
}
function MIDI_from_HH_Snare_Kick_Arrays(midiTrack, HH_Array, Snare_Array, Kick_Array, Toms_Array, midi_output_type, metronome_frequency, num_notes, num_notes_for_swing, swing_percentage, timeSig, metronomeSolo = false, offsetClickStartBeat = "1") {
    var prev_hh_note = 46; // default open hi-hat to mute previous open hats on first stroke
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
            const hh_note = hhLookup ? hhLookup.note : false;
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
            const snLookup = snareMidiFor(Snare_Array[i], midi_output_type);
            const snare_note = snLookup ? snLookup.note : false;
            const snare_velocity = snLookup ? snLookup.velocity : MIDI_VELOCITY_NORMAL;
            if (snare_note !== false) {
                midiTrack.addNoteOn(midi_channel, snare_note, delay_for_next_note, snare_velocity);
                delay_for_next_note = 0;
            }
            const kickLookup = kickMidiFor(Kick_Array[i]);
            const kick_note = kickLookup.kick !== null ? kickLookup.kick : false;
            const kick_splash_note = kickLookup.splash !== null ? kickLookup.splash : false;
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
var global_current_midi_start_time = 0;
var global_last_midi_update_time = 0;
var global_total_midi_play_time_msecs = 0;
var global_total_midi_notes = 0;
var global_total_midi_repeats = 0;
class MidiEventCallback {
    constructor(grooveUtils) {
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
    loadMidiDataEvent(_playStarting) {
        if (this.grooveUtils && this.grooveUtils.data) {
            var midiURL = this.create_MIDIURLFromGrooveData ? this.create_MIDIURLFromGrooveData(this.grooveUtils.data) : (this.grooveUtils.create_MIDIURLFromGrooveData(this.grooveUtils.data));
            if (this.loadMIDIFromURL) {
                this.loadMIDIFromURL(midiURL);
            }
            else if (this.grooveUtils.loadMIDIFromURL) {
                this.grooveUtils.loadMIDIFromURL(midiURL);
            }
            this.noteHasChangedSinceLastDataLoad = false;
        }
        else {
            console.log("can't load midi song. data is empty");
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
    resumeEvent() { }
    ;
    stopEvent() {
        var icon = document.getElementById("midiPlayImage" + this.grooveUtilsUniqueIndex);
        if (icon)
            icon.className = "midiPlayImage Stopped";
    }
    repeatChangeEvent(newValue) {
        var imgLocation = this.getMidiImageLocation ? this.getMidiImageLocation() : (this.grooveUtils ? this.grooveUtils.getMidiImageLocation() : "images/");
        var elem = document.getElementById("midiRepeatImage" + this.grooveUtilsUniqueIndex);
        if (elem) {
            elem.src = newValue ? imgLocation + "repeat.png" : imgLocation + "grey_repeat.png";
        }
    }
    percentProgress(percent) { }
    ;
    notePlaying(note_type, note_position) { }
    ;
    midiInitialized() {
        var icon = document.getElementById("midiPlayImage" + this.grooveUtilsUniqueIndex);
        if (icon) {
            icon.className = "midiPlayImage Stopped";
            icon.onclick = (event) => {
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
globalThis.MidiEventCallback = MidiEventCallback;
globalThis.hihatMidiFor = hihatMidiFor;
globalThis.snareMidiFor = snareMidiFor;
globalThis.kickMidiFor = kickMidiFor;
globalThis.tomMidiFor = tomMidiFor;
globalThis.swingAdjustedDuration = swingAdjustedDuration;
globalThis.metronomeOffsetShift = metronomeOffsetShift;
globalThis.metronomeNoteAt = metronomeNoteAt;
globalThis.isTripletDivision = isTripletDivision;
globalThis.isTripletDivisionFromNotesPerMeasure = isTripletDivisionFromNotesPerMeasure;
globalThis.notesPerMeasureInFullSizeArray = notesPerMeasureInFullSizeArray;
globalThis.getNoteScaler = getNoteScaler;
globalThis.create_note_mapping_array_for_highlighting = create_note_mapping_array_for_highlighting;
globalThis.figure_out_sticking_count_for_index = figure_out_sticking_count_for_index;
globalThis.convert_sticking_counts_to_actual_counts = convert_sticking_counts_to_actual_counts;
globalThis.noteGroupingSize = noteGroupingSize;
globalThis.MIDI_build_midi_url_count_in_track = MIDI_build_midi_url_count_in_track;
globalThis.MIDI_from_HH_Snare_Kick_Arrays = MIDI_from_HH_Snare_Kick_Arrays;
globalThis.MIDI_VELOCITY_NORMAL = MIDI_VELOCITY_NORMAL;
globalThis.MIDI_VELOCITY_ACCENT = MIDI_VELOCITY_ACCENT;
globalThis.MIDI_VELOCITY_GHOST = MIDI_VELOCITY_GHOST;
globalThis.MIDI_METRONOME_1 = MIDI_METRONOME_1;
globalThis.MIDI_METRONOME_NORMAL = MIDI_METRONOME_NORMAL;
globalThis.MIDI_HIHAT_NORMAL = MIDI_HIHAT_NORMAL;
globalThis.MIDI_HIHAT_OPEN = MIDI_HIHAT_OPEN;
globalThis.MIDI_HIHAT_ACCENT = MIDI_HIHAT_ACCENT;
globalThis.MIDI_HIHAT_CRASH = MIDI_HIHAT_CRASH;
globalThis.MIDI_HIHAT_STACKER = MIDI_HIHAT_STACKER;
globalThis.MIDI_HIHAT_METRONOME_NORMAL = MIDI_HIHAT_METRONOME_NORMAL;
globalThis.MIDI_HIHAT_METRONOME_ACCENT = MIDI_HIHAT_METRONOME_ACCENT;
globalThis.MIDI_HIHAT_RIDE = MIDI_HIHAT_RIDE;
globalThis.MIDI_HIHAT_RIDE_BELL = MIDI_HIHAT_RIDE_BELL;
globalThis.MIDI_HIHAT_COW_BELL = MIDI_HIHAT_COW_BELL;
globalThis.MIDI_HIHAT_FOOT = MIDI_HIHAT_FOOT;
globalThis.MIDI_SNARE_NORMAL = MIDI_SNARE_NORMAL;
globalThis.MIDI_SNARE_ACCENT = MIDI_SNARE_ACCENT;
globalThis.MIDI_SNARE_GHOST = MIDI_SNARE_GHOST;
globalThis.MIDI_SNARE_XSTICK = MIDI_SNARE_XSTICK;
globalThis.MIDI_SNARE_BUZZ = MIDI_SNARE_BUZZ;
globalThis.MIDI_SNARE_FLAM = MIDI_SNARE_FLAM;
globalThis.MIDI_SNARE_DRAG = MIDI_SNARE_DRAG;
globalThis.MIDI_KICK_NORMAL = MIDI_KICK_NORMAL;
globalThis.MIDI_TOM1_NORMAL = MIDI_TOM1_NORMAL;
globalThis.MIDI_TOM2_NORMAL = MIDI_TOM2_NORMAL;
globalThis.MIDI_TOM3_NORMAL = MIDI_TOM3_NORMAL;
globalThis.MIDI_TOM4_NORMAL = MIDI_TOM4_NORMAL;
globalThis.CONSTANT_Midi_play_time_zero = CONSTANT_Midi_play_time_zero;
//# sourceMappingURL=groove_audio.js.map