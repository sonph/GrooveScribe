/*jslint browser:true devel:true */
/*global Abc, MIDI, Midi, Pablo, ShareButton */

declare var MIDI: any;
declare var Midi: any;
declare var Abc: any;
declare var Pablo: any;
declare var ShareButton: any;

// In Node/CommonJS test environments, automatically require sub-modules if not loaded.
if (typeof require !== "undefined") {
  try {
    require('./groove_render.js');
    require('./groove_audio.js');
    require('./groove_ui.js');
  } catch (e) {
    // In browser or non-file environments
  }
}

class GrooveUtils {
  data: GrooveData;
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
  isLegendVisible: boolean;

  constructor(excludeAbcForTesting = false) {
    this.grooveUtilsUniqueIndex = 0;
    this.data = new GrooveData();
    this.note_mapping_array = null;
    this.metronomeSolo = false;
    this.metronomeOffsetClickStart = "1";
    this.metronomeOffsetClickStartRotation = 0;
    this.isLegendVisible = false;
    this.noteCallback = null;
    this.playEventCallback = null;
    this.repeatCallback = null;
    this.tempoChangeCallback = null;
    this.visible_context_menu = false;

    if (!excludeAbcForTesting && typeof Abc !== "undefined") {
      this.abcToSVGCallback = new SVGLibCallback();
      this.abc_obj = new Abc(this.abcToSVGCallback);
      this.abcToSVGCallback.abc_obj = this.abc_obj;
    }
    this.abcNoteNumCurrentlyHighlighted = -1;

    this.midiEventCallbacks = new MidiEventCallback(this);
    this.isMIDIPaused = false;
    this.shouldMIDIRepeat = true;
    this.swingIsEnabled = false;
    this.midiBaseLocation = "";
  }

  getQueryVariableFromString(variable: string, def_value: string, my_string: string): string {
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

  is_touch_device(): boolean {
    return is_touch_device();
  };

  documentOnClickHanderCloseContextMenu = (event: MouseEvent): void => {
    if (this.visible_context_menu) {
      this.hideContextMenu(this.visible_context_menu as HTMLElement);
    }
  };

  showContextMenu(contextMenu: HTMLElement | null): void {
    if (!contextMenu) return;
    if (this.visible_context_menu && this.visible_context_menu !== contextMenu) {
      this.hideContextMenu(this.visible_context_menu as HTMLElement);
    }
    contextMenu.style.display = "block";
    this.visible_context_menu = contextMenu;

    // Prevent context menu from clipping below viewport.
    if (contextMenu.offsetTop + contextMenu.clientHeight > document.documentElement.clientHeight) {
      contextMenu.style.top = document.documentElement.clientHeight - contextMenu.clientHeight + 'px';
    }
    // Defer wiring the outside-click handler so the click that opened the
    // menu doesn't immediately close it. Arrow function preserves `this`.
    setTimeout(() => {
      document.onclick = this.documentOnClickHanderCloseContextMenu;
      document.body.style.cursor = "pointer"; // make document.onclick work on iPad
    }, 100);
  };

  hideContextMenu(contextMenu?: HTMLElement): void {
    document.onclick = () => { };
    document.body.style.cursor = "auto";
    const target = (contextMenu || this.visible_context_menu) as HTMLElement | false;
    if (target) {
      target.style.display = "none";
    }
    this.visible_context_menu = false;
  };

  isTripletDivision(subdivision: number): boolean {
    return isTripletDivision(subdivision);
  }

  isTripletDivisionFromNotesPerMeasure(notesPerMeasure: number, timeSig: TimeSignature): boolean {
    return isTripletDivisionFromNotesPerMeasure(notesPerMeasure, timeSig);
  }

  getMetronomeSolo(): boolean {
    return this.metronomeSolo;
  };

  setMetronomeSolo(bool: boolean): void {
    this.metronomeSolo = bool;
  };

  getMetronomeOffsetClickStart(): string {
    return this.metronomeOffsetClickStart;
  };

  getMetronomeOffsetClickStartIsRotating(): boolean {
    return this.metronomeOffsetClickStart == 'ROTATE';
  };

  setMetronomeOffsetClickStart(value: string): void {
    this.metronomeOffsetClickStart = value;
  };

  advanceMetronomeOptionsOffsetClickStartRotation(): boolean {
    if (this.getMetronomeOffsetClickStartIsRotating()) {
      this.metronomeOffsetClickStartRotation++;
      return true;
    }
    return false;
  };

  getMetronomeOptionsOffsetClickStartRotation(isTriplets: boolean): string {
    if (this.getMetronomeOffsetClickStartIsRotating()) {
      if (isTriplets && this.metronomeOffsetClickStartRotation > 2)
        this.metronomeOffsetClickStartRotation = 0;
      else if (this.metronomeOffsetClickStartRotation > 3)
        this.metronomeOffsetClickStartRotation = 0;

      switch (this.metronomeOffsetClickStartRotation) {
        case 0:
          return '1';
        case 1:
          return isTriplets ? 'TI' : 'E';
        case 2:
          return isTriplets ? 'TA' : 'AND';
        case 3:
          return 'A';
      }
    } else {
      return this.metronomeOffsetClickStart;
    }
  };

  resetMetronomeOptionsOffsetClickStartRotation(value?: any): number {
    return this.metronomeOffsetClickStartRotation = 0;
  };

  mergeDrumTabLines(dominateLine: string, subordinateLine: string): string {
    return mergeDrumTabLines(dominateLine, subordinateLine);
  };

  setupHotKeys(): void {
    document.onkeydown = (e) => {
      const target = e.target as HTMLInputElement;
      if (e.which == 32 && (target.type == "range" || (target.tagName.toUpperCase() != "INPUT" && target.tagName.toUpperCase() != "TEXTAREA"))) {
        this.startOrStopMIDI_playback();
        return false;
      }
      if (e.which == 179) {
        this.startOrPauseMIDI_playback();
      }
      if (e.which == 178) {
        this.stopMIDI_playback();
      }

      return true;
    };
  }

  noteGroupingSize(notes_per_measure: number, timeSig: TimeSignature): number {
    return noteGroupingSize(notes_per_measure, timeSig);
  };

  notesPerMeasureInFullSizeArray(is_triplet_division: boolean, timeSig: TimeSignature): number {
    return notesPerMeasureInFullSizeArray(is_triplet_division, timeSig);
  }

  getNoteScaler(notes_per_measure: number, timeSig: TimeSignature): number {
    return getNoteScaler(notes_per_measure, timeSig);
  };

  create_note_mapping_array_for_highlighting(HH_array: Array<any>, snare_array: Array<any>, kick_array: Array<any>, toms_array: Array<Array<any>> | null, num_notes: number, HH2_array?: Array<any> | null): Array<boolean> {
    return create_note_mapping_array_for_highlighting(HH_array, snare_array, kick_array, toms_array, num_notes, HH2_array);
  };

  figure_out_sticking_count_for_index(index: number, notes_per_measure: number, sub_division: number, time_sig_bottom: number): string | number {
    return figure_out_sticking_count_for_index(index, notes_per_measure, sub_division, time_sig_bottom);
  };

  convert_sticking_counts_to_actual_counts(sticking_array: Array<string>, time_division: number, timeSig: TimeSignature): void {
    convert_sticking_counts_to_actual_counts(sticking_array, time_division, timeSig);
  };

  renderABCtoSVG(abcString: string): { svg: string, error_html: string } {
    if (this.isLegendVisible) {
      this.abcNoteNumIndex = -15;
      if (this.abcToSVGCallback)
        this.abcToSVGCallback.abcNoteNumIndex = -15;
    } else {
      this.abcNoteNumIndex = 0;
      if (this.abcToSVGCallback)
        this.abcToSVGCallback.abcNoteNumIndex = 0;
    }
    if (this.abcToSVGCallback) {
      this.abcToSVGCallback.grooveUtilsUniqueIndex = this.grooveUtilsUniqueIndex;
      this.abcToSVGCallback.abc_svg_output = '';
      this.abcToSVGCallback.abc_error_output = '';
    }

    if (this.abc_obj) {
      this.abc_obj.tosvg("SOURCE", abcString);
    }
    return {
      svg: this.abcToSVGCallback ? this.abcToSVGCallback.abc_svg_output : '',
      error_html: this.abcToSVGCallback ? this.abcToSVGCallback.abc_error_output : ''
    };
  }

  isElementOnScreen(element: HTMLElement): boolean {
    var rect = element.getBoundingClientRect();
    return (
      rect.top >= 80 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  };

  clearHighlightNoteInABCSVG(): void {
    if (this.abcNoteNumCurrentlyHighlighted > -1) {
      var myElements = document.querySelectorAll("#abcNoteNum_" + this.grooveUtilsUniqueIndex + "_" + this.abcNoteNumCurrentlyHighlighted);
      for (var i = 0; i < myElements.length; i++) {
        var class_name = myElements[i].getAttribute("class") || "";
        myElements[i].setAttribute("class", class_name.replace(new RegExp(' highlighted', 'g'), ""));
        if (this.data && this.data.debugMode && i === 0) {
          if (!this.isElementOnScreen(myElements[i] as HTMLElement) && typeof myElements[i].scrollIntoView === 'function') {
            if (this.abcNoteNumCurrentlyHighlighted === 0)
              myElements[i].scrollIntoView({ block: "start", behavior: "smooth" });
            else
              myElements[i].scrollIntoView({ block: "end", behavior: "smooth" });
          }
        }
      }
      this.abcNoteNumCurrentlyHighlighted = -1;
    }
  };

  highlightNoteInABCSVGByIndex(noteToHighlight: number): void {
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

  highlightNoteInABCSVGFromPercentComplete(percentComplete: number): void {
    if (this.note_mapping_array !== null && this.note_mapping_array.length > 0) {
      var curNoteIndex = Math.floor(percentComplete * this.note_mapping_array.length);
      if (curNoteIndex >= this.note_mapping_array.length) {
        curNoteIndex = this.note_mapping_array.length - 1;
      }

      var real_note_index = -1;
      for (var i = 0; i <= curNoteIndex && i < this.note_mapping_array.length; i++) {
        if (this.note_mapping_array[i])
          real_note_index++;
      }

      this.highlightNoteInABCSVGByIndex(real_note_index);
    }
  }

  tempoUpdate(tempo: number): void {
    var textField = document.getElementById('tempoTextField' + this.grooveUtilsUniqueIndex) as HTMLInputElement | null;
    if (textField)
      textField.value = "" + tempo;
    this.updateRangeSlider('tempoInput' + this.grooveUtilsUniqueIndex);
    this.midiNoteHasChanged();

    if (this.tempoChangeCallback)
      this.tempoChangeCallback(tempo);
  };

  tempoUpdateFromTextField = (event: Event): void => {
    var newTempo = Number((event.target as HTMLInputElement).value);
    var tempoInput = document.getElementById("tempoInput" + this.grooveUtilsUniqueIndex) as HTMLInputElement | null;
    if (tempoInput)
      tempoInput.value = "" + newTempo;
    this.tempoUpdate(newTempo);
  };

  tempoUpdateFromSlider = (event: Event): void => {
    this.tempoUpdate(Number((event.target as HTMLInputElement).value));
  };

  upTempo(): void {
    var tempo = this.getTempo();
    tempo++;
    this.setTempo(tempo);
  };

  downTempo(): void {
    var tempo = this.getTempo();
    tempo--;
    this.setTempo(tempo);
  };

  getGrooveUtilsBaseLocation(): string {
    return this.midiBaseLocation;
  };

  getMidiSoundFontLocation(): string {
    return this.getGrooveUtilsBaseLocation() + "soundfont/";
  };
  getMidiImageLocation(): string {
    return this.getGrooveUtilsBaseLocation() + "images/";
  };

  setGrooveData(grooveData: GrooveData): void {
    this.data = grooveData;
  };

  midiNoteHasChanged(): void {
    this.midiEventCallbacks.noteHasChangedSinceLastDataLoad = true;
  };
  midiResetNoteHasChanged(): void {
    this.midiEventCallbacks.noteHasChangedSinceLastDataLoad = false;
  };

  MIDI_build_midi_url_count_in_track(timeSig: TimeSignature): string {
    return MIDI_build_midi_url_count_in_track(timeSig, this.getTempo());
  };

  MIDI_from_HH_Snare_Kick_Arrays(midiTrack: any, HH_Array: Array<any>, Snare_Array: Array<any>, Kick_Array: Array<any>, Toms_Array: Array<Array<any>> | null, midi_output_type: string, metronome_frequency: number, num_notes: number, num_notes_for_swing: number, swing_percentage: number, timeSig: TimeSignature, HH2_Array?: Array<any> | null): void {
    var isTriplets = this.isTripletDivisionFromNotesPerMeasure(num_notes, timeSig);
    var offsetClickStartBeat = this.getMetronomeOptionsOffsetClickStartRotation(isTriplets);
    MIDI_from_HH_Snare_Kick_Arrays(
      midiTrack,
      HH_Array,
      Snare_Array,
      Kick_Array,
      Toms_Array,
      midi_output_type,
      metronome_frequency,
      num_notes,
      num_notes_for_swing,
      swing_percentage,
      timeSig,
      this.metronomeSolo,
      offsetClickStartBeat,
      HH2_Array
    );
  };

  create_MIDIURLFromGrooveData(myGrooveData: GrooveData, MIDI_type?: string): string {
    var midiFile = new Midi.File();
    var midiTrack = new Midi.Track();
    midiFile.addTrack(midiTrack);

    midiTrack.setTempo(myGrooveData.tempo);
    midiTrack.setInstrument(0, 0x13);

    var swing_percentage = myGrooveData.swingPercent / 100;
    const isTriplets = myGrooveData.subdivision.isTriplet();
    const fullSizePerMeasure = this.notesPerMeasureInFullSizeArray(isTriplets, myGrooveData.timeSig);
    const num_notes_for_swing = myGrooveData.subdivision.value < 16
      ? (8 * myGrooveData.timeSig.top) / myGrooveData.timeSig.bottom.value
      : (16 * myGrooveData.timeSig.top) / myGrooveData.timeSig.bottom.value;

    this.note_mapping_array = [];

    for (var measureIndex = 0; measureIndex < myGrooveData.numberOfMeasures; measureIndex++) {
      const measure = myGrooveData.measures[measureIndex];
      const hhArray = measure ? measure.getScaledArray(DrumType.HIHAT, fullSizePerMeasure).map(c => c ? tabCharToAbcNote(DrumType.HIHAT, c)?.note || false : false) : new Array(fullSizePerMeasure).fill(false);
      const hh2Array = measure ? measure.getScaledArray(DrumType.HIHAT2, fullSizePerMeasure).map(c => c ? tabCharToAbcNote(DrumType.HIHAT2, c)?.note || false : false) : new Array(fullSizePerMeasure).fill(false);
      const snareArray = measure ? measure.getScaledArray(DrumType.SNARE, fullSizePerMeasure).map(c => c ? tabCharToAbcNote(DrumType.SNARE, c)?.note || false : false) : new Array(fullSizePerMeasure).fill(false);
      const kickArray = measure ? measure.getScaledArray(DrumType.KICK, fullSizePerMeasure).map(c => c ? tabCharToAbcNote(DrumType.KICK, c)?.note || false : false) : new Array(fullSizePerMeasure).fill(false);
      const tomsArray: Array<Array<any>> = [
        measure ? measure.getScaledArray(DrumType.TOM1, fullSizePerMeasure).map(c => c ? tabCharToAbcNote(DrumType.TOM1, c)?.note || false : false) : new Array(fullSizePerMeasure).fill(false),
        new Array(fullSizePerMeasure).fill(false),
        new Array(fullSizePerMeasure).fill(false),
        measure ? measure.getScaledArray(DrumType.TOM4, fullSizePerMeasure).map(c => c ? tabCharToAbcNote(DrumType.TOM4, c)?.note || false : false) : new Array(fullSizePerMeasure).fill(false),
      ];

      this.MIDI_from_HH_Snare_Kick_Arrays(
        midiTrack,
        hhArray,
        snareArray,
        kickArray,
        tomsArray,
        MIDI_type || "general_MIDI",
        myGrooveData.metronomeFrequency,
        fullSizePerMeasure,
        num_notes_for_swing,
        swing_percentage,
        myGrooveData.timeSig,
        hh2Array
      );

      this.note_mapping_array = this.note_mapping_array.concat(
        this.create_note_mapping_array_for_highlighting(
          hhArray,
          snareArray,
          kickArray,
          tomsArray,
          fullSizePerMeasure,
          hh2Array
        )
      );
    }

    return "data:audio/midi;base64," + btoa(midiFile.toBytes());
  };

  loadMIDIFromURL(midiURL: string): void {
    MIDI.Player.timeWarp = 1; // speed the song is played back
    MIDI.Player.BPM = this.getTempo();
    MIDI.Player.loadFile(midiURL, this.midiLoaderCallback());
  };

  pauseMIDI_playback(): void {
    if (this.isMIDIPaused === false) {
      this.isMIDIPaused = true;
      this.midiEventCallbacks.pauseEvent();
      MIDI.Player.pause();
      this.midiEventCallbacks.notePlaying("clear", -1);
      this.clearHighlightNoteInABCSVG();
    }
  };

  startMIDI_playback(): void {
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

  stopMIDI_playback(): void {
    if (MIDI.Player.playing || this.isMIDIPaused) {
      this.isMIDIPaused = false;
      MIDI.Player.stop();
      this.midiEventCallbacks.stopEvent();
      this.midiEventCallbacks.notePlaying("clear", -1);
      this.clearHighlightNoteInABCSVG();
      this.resetMetronomeOptionsOffsetClickStartRotation()
    }
  };

  startOrStopMIDI_playback(): void {
    if (MIDI.Player.playing) {
      this.stopMIDI_playback();
    } else {
      this.startMIDI_playback();
    }
  };

  startOrPauseMIDI_playback(): void {
    if (MIDI.Player.playing) {
      this.pauseMIDI_playback();
    } else {
      this.startMIDI_playback();
    }
  };

  isPlaying(): boolean {
    return MIDI.Player.playing;
  };

  repeatMIDI_playback = (): void => {
    this.shouldMIDIRepeat = !this.shouldMIDIRepeat;
    MIDI.Player.loop(this.shouldMIDIRepeat);
    this.midiEventCallbacks.repeatChangeEvent(this.shouldMIDIRepeat);
  };

  oneTimeInitializeMidi(): void {
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
        MIDI.programChange(9, 127);
        root.midiEventCallbacks.midiInitialized();
      }
    });
  };

  getMidiStartTime(): Date {
    return global_current_midi_start_time;
  };

  getMidiPlayTime(): Date {
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

    return play_time_diff;
  };

  updateMidiPlayTime(): void {
    var totalTime = this.getMidiPlayTime();
    var time_string = totalTime.getUTCMinutes() + ":" + (totalTime.getSeconds() < 10 ? "0" : "") + totalTime.getSeconds();

    var MidiPlayTime = document.getElementById("MIDIPlayTime" + this.grooveUtilsUniqueIndex);
    if (MidiPlayTime)
      MidiPlayTime.innerHTML = time_string;
  };

  ourMIDICallback(data: any): void {
    var percentComplete = (data.now / data.end);
    this.midiEventCallbacks.percentProgress(percentComplete * 100);

    if (this.lastMidiTimeUpdate && this.lastMidiTimeUpdate < (data.now + 800)) {
      this.updateMidiPlayTime();
      this.lastMidiTimeUpdate = data.now;
    }

    if (data.now < 16) {
      this.lastMidiTimeUpdate = -1;
    }
    if (data.now == data.end) {
      this.midiEventCallbacks.notePlaying("complete", 1);

      if (this.shouldMIDIRepeat) {
        global_total_midi_repeats++;

        if (this.advanceMetronomeOptionsOffsetClickStartRotation() || this.midiEventCallbacks.doesMidiDataNeedRefresh()) {
          MIDI.Player.stop();
          this.midiEventCallbacks.loadMidiDataEvent(false);
          MIDI.Player.start();
        }
        if (this.repeatCallback) {
          this.repeatCallback();
        }
      } else {
        MIDI.Player.stop();
        this.midiEventCallbacks.percentProgress(100);
        this.midiEventCallbacks.stopEvent();
      }
    }

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
  }

  midiLoaderCallback(): void {
    MIDI.Player.addListener((data) => this.ourMIDICallback(data));
  }

  getTempo(): number {
    var tempoInput = document.getElementById("tempoInput" + this.grooveUtilsUniqueIndex) as HTMLInputElement;
    var tempo = constant_DEFAULT_TEMPO;

    if (tempoInput) {
      tempo = parseInt(tempoInput.value, 10);
      if (tempo < 19 && tempo > 281)
        tempo = constant_DEFAULT_TEMPO;
    }

    return tempo;
  };

  updateRangeSlider(sliderID: string): void {
    updateRangeSlider(sliderID);
  }

  setSwingSlider(newSetting: number): void {
    var swingInput = document.getElementById("swingInput" + this.grooveUtilsUniqueIndex) as HTMLInputElement | null;
    if (swingInput)
      swingInput.value = "" + newSetting;
    this.updateRangeSlider('swingInput' + this.grooveUtilsUniqueIndex);
  };

  swingEnabled(trueElseFalse: boolean): void {
    this.swingIsEnabled = trueElseFalse;
    if (this.swingIsEnabled === false) {
      this.setSwing(0);
    } else {
      this.swingUpdateText(this.getSwing());
    }
  };

  getSwing(): number {
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

  swingUpdateText(swingAmount: number): void {
    var swingOutput = document.getElementById('swingOutput' + this.grooveUtilsUniqueIndex);
    if (this.swingIsEnabled === false) {
      if (swingOutput)
        swingOutput.innerHTML = "N/A";
    } else {
      if (swingOutput)
        swingOutput.innerHTML = "" + swingAmount + "%";
      this.swingPercent = swingAmount;
      this.midiNoteHasChanged();
    }
  };

  setSwing(swingAmount: number): void {
    if (this.swingIsEnabled === false)
      swingAmount = 0;
    this.setSwingSlider(swingAmount);
    this.swingUpdateText(swingAmount);
  };

  swingUpdateEvent = (event: Event): void => {
    if (this.swingIsEnabled === false) {
      this.setSwingSlider(0);
    } else {
      this.swingUpdateText(Number((event.target as HTMLInputElement).value));
      this.updateRangeSlider('swingInput' + this.grooveUtilsUniqueIndex);
    }
  };

  setMetronomeCountIn(enabled: boolean): void {
    // intentional no-op
  }

  setMetronomeFrequencyDisplay(newFrequency: number): void {
    var mm = document.getElementById('midiMetronomeMenu' + this.grooveUtilsUniqueIndex);

    if (mm) {
      mm.className = mm.className.replace(" selected", "");

      if (newFrequency > 0) {
        mm.className += " selected";
      }
    }
  };

  loadFullScreenGrooveScribe = (): void => {
    var fullURL = (this as any).getUrlStringFromGrooveData ? (this as any).getUrlStringFromGrooveData(this.data, 'fullGrooveScribe') : this.data.toUrl();

    var win = window.open(fullURL, '_blank');
    if (win) {
      win.focus();
    }
  };

  metronomeMiniMenuClick = (): void => {
    if (this.data.metronomeFrequency > 0)
      this.data.metronomeFrequency = 0;
    else
      this.data.metronomeFrequency = 4;

    this.setMetronomeFrequencyDisplay(this.data.metronomeFrequency);
    this.midiNoteHasChanged();
  };

  expandOrRetractMIDI_playback(force?: boolean, expandElseContract?: boolean): void {
    var playerControlElement = document.getElementById('playerControl' + this.grooveUtilsUniqueIndex);
    var playerControlRowElement = document.getElementById('playerControlsRow' + this.grooveUtilsUniqueIndex);
    var tempoAndProgressElement = document.getElementById('tempoAndProgress' + this.grooveUtilsUniqueIndex);
    var midiMetronomeMenuElement = document.getElementById('midiMetronomeMenu' + this.grooveUtilsUniqueIndex);
    var gsLogoLoadFullGSElement = document.getElementById('midiGSLogo' + this.grooveUtilsUniqueIndex);
    var midiExpandImageElement = document.getElementById('midiExpandImage' + this.grooveUtilsUniqueIndex);
    var midiPlayTime = document.getElementById('MIDIPlayTime' + this.grooveUtilsUniqueIndex);

    if (!playerControlElement || !playerControlRowElement || !tempoAndProgressElement || !midiMetronomeMenuElement || !gsLogoLoadFullGSElement || !midiExpandImageElement || !midiPlayTime) {
      return;
    }

    if (playerControlElement.className.indexOf("small") > -1 || (force && expandElseContract)) {
      playerControlElement.className = playerControlElement.className.replace(" small", "") + " large";
      playerControlRowElement.className = playerControlRowElement.className.replace(" small", "") + " large";
      tempoAndProgressElement.className = tempoAndProgressElement.className.replace(" small", "") + " large";
      midiMetronomeMenuElement.className = midiMetronomeMenuElement.className.replace(" small", "") + " large";
      gsLogoLoadFullGSElement.className = gsLogoLoadFullGSElement.className.replace(" small", "") + " large";
      midiExpandImageElement.className = midiExpandImageElement.className.replace(" small", "") + " large";
      midiPlayTime.className = midiPlayTime.className.replace(" small", "") + " large";
    } else {
      playerControlElement.className = playerControlElement.className.replace(" large", "") + " small";
      playerControlRowElement.className = playerControlRowElement.className.replace(" large", "") + " small";
      midiMetronomeMenuElement.className = midiMetronomeMenuElement.className.replace(" large", "") + " small";
      tempoAndProgressElement.className = tempoAndProgressElement.className.replace(" large", "") + " small";
      gsLogoLoadFullGSElement.className = gsLogoLoadFullGSElement.className.replace(" large", "") + " small";
      midiExpandImageElement.className = midiExpandImageElement.className.replace(" large", "") + " small";
      midiPlayTime.className = midiPlayTime.className.replace(" large", "") + " small";
    }
  };

  addInlineMetronomeSVG(): string {
    return addInlineMetronomeSVG();
  }

  addInLineGScribeLogoLoneGSVG(): string {
    return addInLineGScribeLogoLoneGSVG();
  }

  HTMLForMidiPlayer(expandable?: boolean): string {
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

  AddMidiPlayerToPage(HTML_Id_to_attach_to: string, division: number, expandable?: boolean): void {
    var html_element = document.getElementById(HTML_Id_to_attach_to);
    if (html_element)
      html_element.innerHTML = this.HTMLForMidiPlayer(expandable);

    // attach onclicks
    html_element = document.getElementById("tempoInput" + this.grooveUtilsUniqueIndex);
    if (html_element) {
      html_element.addEventListener("input", this.tempoUpdateFromSlider, false);
    }

    html_element = document.getElementById("tempoTextField" + this.grooveUtilsUniqueIndex);
    if (html_element) {
      html_element.addEventListener("change", this.tempoUpdateFromTextField, false);
    }

    html_element = document.getElementById("swingInput" + this.grooveUtilsUniqueIndex);
    if (html_element) {
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

  setTempo(newTempo: number): void {
    if (newTempo < 19 && newTempo > 281)
      return;

    var input = document.getElementById("tempoInput" + this.grooveUtilsUniqueIndex) as HTMLInputElement | null;
    if (input)
      input.value = "" + newTempo;
    this.tempoUpdate(newTempo);
  };

  doesDivisionSupportSwing(division: number): boolean {
    if (this.isTripletDivision(division) || division == 4)
      return false;

    return true;
  };
}

(globalThis as any).GrooveUtils = GrooveUtils;
