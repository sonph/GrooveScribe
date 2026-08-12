// Javascript for the Groove Scribe HTML application
// Groove Scribe is for drummers and helps create sheet music with an easy to use WYSIWYG groove editor.
//
// Author: Lou Montulli
// Original Creation date: Feb 2015.
//
//  Copyright 2015-2020 Lou Montulli, Mike Johnston
//
//  This file is part of Project Groove Scribe.
//
//  Groove Scribe is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 2 of the License, or
//  (at your option) any later version.
//
//  Groove Scribe is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with Groove Scribe.  If not, see <http://www.gnu.org/licenses/>.

/*jshint multistr: true */
/*jslint browser:true devel:true */

/*global GrooveUtils, Midi, Share */
/*global MIDI, constant_MAX_MEASURES, constant_DEFAULT_TEMPO, constant_ABC_STICK_R, constant_ABC_STICK_L, constant_ABC_STICK_BOTH, constant_ABC_STICK_OFF, constant_ABC_STICK_COUNT, constant_ABC_HH_Ride, constant_ABC_HH_Ride_Bell, constant_ABC_HH_Cow_Bell, constant_ABC_HH_Crash, constant_ABC_HH_Stacker, constant_ABC_HH_Open, constant_ABC_HH_Close, constant_ABC_HH_Accent, constant_ABC_HH_Normal, constant_ABC_SN_Ghost, constant_ABC_SN_Accent, constant_ABC_SN_Normal, constant_ABC_SN_XStick, constant_ABC_SN_Buzz, constant_ABC_SN_Flam, constant_ABC_SN_Drag, constant_ABC_KI_SandK, constant_ABC_KI_Splash, constant_ABC_KI_Normal, constant_ABC_T1_Normal, constant_ABC_T2_Normal, constant_ABC_T3_Normal, constant_ABC_T4_Normal, constant_NUMBER_OF_TOMS, constant_ABC_OFF, MIDI_VELOCITY_NORMAL, MIDI_VELOCITY_ACCENT, MIDI_VELOCITY_GHOST, constant_OUR_MIDI_METRONOME_1, constant_OUR_MIDI_METRONOME_NORMAL, constant_OUR_MIDI_HIHAT_NORMAL, constant_OUR_MIDI_HIHAT_OPEN, constant_OUR_MIDI_HIHAT_ACCENT, constant_OUR_MIDI_HIHAT_CRASH, constant_OUR_MIDI_HIHAT_STACKER, constant_OUR_MIDI_HIHAT_RIDE, constant_OUR_MIDI_HIHAT_FOOT, constant_OUR_MIDI_SNARE_NORMAL, constant_OUR_MIDI_SNARE_ACCENT, constant_OUR_MIDI_SNARE_GHOST, constant_OUR_MIDI_SNARE_XSTICK, constant_OUR_MIDI_SNARE_XSTICK, constant_OUR_MIDI_SNARE_FLAM, onstant_OUR_MIDI_SNARE_DRAG, constant_OUR_MIDI_KICK_NORMAL, constant_OUR_MIDI_TOM1_NORMAL, constant_OUR_MIDI_TOM2_NORMAL, constant_OUR_MIDI_TOM4_NORMAL, constant_OUR_MIDI_TOM4_NORMAL */

const SNARE_FLAM_SVG = `
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
        </svg>'
        `;

const SNARE_DRAG_SVG = `
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
        `;

type KeyShortcutMapping = Map<string, { type: string, note_mapping: Map<string, string> }>;

const UNDO_STACK_MAX_SIZE = 40;

const POPUP_KEY_SHORTCUT_MAPPING: KeyShortcutMapping = new Map([
  ["stickingContextMenu", {
    type: "sticking",
    note_mapping: new Map([
      ["Escape", "off"],
      ["-", "off"],
      ["r", "right"],
      ["l", "left"],
      ["b", "both"],
      ["c", "count"]])
  }],
  ["hhContextMenu", {
    type: "hh",
    note_mapping: new Map([
      ["Escape", "off"],
      ["-", "off"],
      ["x", "normal"],
      ["o", "open"],
      ["X", "accent"],
      ["c", "crash"],
      ["r", "ride"],
      ["b", "ride_bell"],
      ["m", "cow_bell"],
      ["s", "stacker"],
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
      ["x", "xstick"],
      ["d", "buzz"],
      ["f", "flam"]])
  }],
  ["kickContextMenu", {
    type: "kick",
    note_mapping: new Map([
      ["Escape", "off"],
      ["-", "off"],
      ["o", "normal"],
      ["x", "splash"],
      ["X", "kick_and_splash"]])
  }]]);

class E {
  tag: string;
  id?: string;
  classList?: string | Array<string>;
  content?: string;
  onclick?: (ev: MouseEvent) => void;
  oncontextmenu?: (ev: MouseEvent) => void;
  onmouseenter?: (ev: MouseEvent) => void;
  children?: Array<E | null>;
  innerHTML?: string;

  constructor(tag: string) {
    this.tag = tag;
  }

  static of(tag: string, id?: string, classList?: string | Array<string>, children?: Array<E | null>): E {
    const e = new E(tag);
    e.id = id;
    e.classList = classList;
    e.children = children;
    return e;
  }

  setContent(content: string): E {
    this.content = content;
    return this;
  }

  addHandlers(handlers: {
    onclick?: (ev: MouseEvent) => void,
    oncontextmenu?: (ev: MouseEvent) => void,
    onmouseenter?: (ev: MouseEvent) => void,
  }): E {
    this.onclick = handlers.onclick;
    this.oncontextmenu = handlers.oncontextmenu;
    this.onmouseenter = handlers.onmouseenter;
    return this;
  }

  addTo(parent: HTMLElement) {
    console.log("Adding element: ", this.tag, " with id: ", this.id, " to parent: ", parent);
    const element = document.createElement(this.tag);
    if (this.id) {
      element.id = this.id;
    }
    if (this.classList) {
      if (typeof this.classList === "string") {
        element.classList.add(this.classList);
      } else {
        this.classList.forEach((cls) => {
          element.classList.add(cls);
        });
      }
    }
    if (this.content) {
      element.textContent = this.content;
    }
    if (this.innerHTML) {
      element.innerHTML = this.innerHTML;
    }
    if (this.onclick) {
      element.onclick = this.onclick;
    }
    if (this.oncontextmenu) {
      element.oncontextmenu = this.oncontextmenu
    }
    if (this.onmouseenter) {
      element.onmouseenter = this.onmouseenter;
    }
    parent.appendChild(element);
    for (const child of this.children || []) {
      if (child) {
        child.addTo(element);
      }
    }
  }

  addChild(child: E): E {
    if (!this.children) {
      this.children = [];
    }
    this.children.push(child);
    return this;
  }
}

class GrooveWriter {
  myGrooveUtils: GrooveUtils;
  data: GrooveData;
  myGrooveData: GrooveData;
  global_tempoChangeCallbackTimeout: number | null = null;
  class_metronome_frequency: number = 0;
  class_metronome_auto_speed_up_active: boolean;
  class_metronome_count_in_active: boolean;
  class_metronome_count_in_is_playing: boolean;
  class_permutation_type: string;
  class_advancedEditIsOn: boolean;
  class_cur_hh_highlight_id: number;
  class_cur_tom1_highlight_id: number;
  class_cur_tom4_highlight_id: number;
  class_cur_snare_highlight_id: number;
  class_cur_kick_highlight_id: number;
  class_cur_all_notes_highlight_id: number;
  insertNoteContextMenu: HTMLElement | null = null;
  class_which_index_last_clicked: number;
  class_undo_stack: Array<string>;
  class_redo_stack: Array<string>;
  browserInfo: any;
  class_our_midi_start_time: any | null;
  class_our_midi_start_tempo: number;
  class_our_last_midi_tempo_increase_time: any | null;
  class_our_last_midi_tempo_increase_remainder: number;
  have_shown_mixed_division_message: boolean;
  class_app_title: string;
  class_measure_for_note_label_click: number;

  constructor(grooveUtilsForTesting: GrooveUtils | null = null) {
    this.myGrooveUtils = grooveUtilsForTesting || new GrooveUtils();
    this.data = this.myGrooveUtils.data;
    this.data.fromUrl(window.location.search);

    var class_undo_stack = [];
    var class_redo_stack = [];

    // public class vars
    var class_metronome_auto_speed_up_active = false;
    var class_metronome_count_in_active = false;
    var class_metronome_count_in_is_playing = false;

    var class_our_midi_start_time = null;
    var class_our_midi_start_tempo = 0;
    var class_our_last_midi_tempo_increase_time = null;
    var class_our_last_midi_tempo_increase_remainder = 0;

    var have_shown_mixed_division_message = false;

    // private vars in the scope of the class
    var class_app_title = "Groove Scribe";
    var class_permutation_type = "none";
    var class_advancedEditIsOn = false;
    var class_measure_for_note_label_click = 0;
    var class_which_index_last_clicked = 0; // which note was last clicked for the context menu

    // local constants
    var constant_default_tempo = 80;
    var constant_note_stem_off_color = "transparent";

    // Use .notes-row-container .note-on
    var constant_note_on_color_hex = "#000000"; // black
    var constant_note_on_color_rgb = 'rgb(0, 0, 0)'; // black

    // Use .notes-row-container .note-on
    var constant_note_off_color_hex = "#FFF";
    var constant_note_off_color_rgb = 'rgb(255, 255, 255)'; // white

    var constant_note_border_color_hex = "#999";
    var constant_hihat_note_off_color_hex = "#CCC";
    var constant_hihat_note_off_color_rgb = 'rgb(204, 204, 204)'; // grey

    // Use .notes-row-container .note-hidden
    var constant_note_hidden_color_rgb = "transparent";

    var constant_sticking_right_on_color_rgb = "rgb(36, 132, 192)";
    var constant_sticking_left_on_color_rgb = "rgb(57, 57, 57)";
    var constant_sticking_both_on_color_rgb = "rgb(57, 57, 57)";
    var constant_sticking_count_on_color_rgb = "rgb(57, 57, 57)";
    var constant_sticking_right_off_color_rgb = "rgb(204, 204, 204)";
    var constant_sticking_left_off_color_rgb = "rgb(204, 204, 204)";
    var constant_snare_accent_on_color_hex = "#FFF";
    var constant_snare_accent_on_color_rgb = "rgb(255, 255, 255)";

    var insertNoteContextMenu = null;

    // called every time the tempo changes, which can be a lot of times due to the range slider
    // update the main URL with the tempo, but only do it every third of a second at the most
    var global_tempoChangeCallbackTimeout = null;
    var class_metronome_frequency = 0;
  }

  // is the division a triplet groove?   12, 24, or 48 notes
  usingTriplets() {
    return this.data.subdivision.isTriplet();
  }

  removeClass(element: HTMLElement, cssClass: string) {
    element.classList.remove(cssClass);
  }

  addClass(element: HTMLElement, cssClass: string, addElseRemove: boolean = true) {
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

  addClassById(elementId: string, cssClass: string, addElseRemove: boolean = true) {
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

  setNoteState(elementId: string, state: "on" | "off" | "hidden") {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error("setNoteState: element not found for id: " + elementId);
    }
    element.classList.remove("note-on");
    element.classList.remove("note-off");
    element.classList.remove("note-hidden");
    element.classList.add("note-" + state);
  }

  isNoteOn(id: string): boolean {
    return this.getNoteState(id) === "on";
  }

  getNoteState(id: string): "on" | "off" | "hidden" {
    const element = document.getElementById(id);
    if (!element) {
      throw new Error("getNoteState: element not found for id: " + id);
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

  selectButton(element: HTMLElement) {
    // highlight the new div by adding selected css class
    this.addClass(element, "buttonSelected", true);
  }

  unselectButton(element: HTMLElement) {
    // remove selected class if it exists
    this.addClass(element, "buttonSelected", false);
  }

  playSingleNote(note_val: number) {
    if (MIDI.WebAudio) {
      MIDI.WebAudio.noteOn(9, note_val, MIDI_VELOCITY_NORMAL, 0);
    } else if (MIDI.AudioTag) {
      MIDI.AudioTag.noteOn(9, note_val, MIDI_VELOCITY_NORMAL, 0);
    }
  }

  // // returns the ABC notation for the Tom state
  // // false = off
  // // "x" = normal tom
  // get_tom_state(id: string, tom_num: number): { abc: string, url: string } | false {
  //   const note: AbcNote = {
  //     1: AbcNote.T1_NORMAL,
  //     4: AbcNote.T4_NORMAL
  //   }[tom_num];
  //   if (this.isNoteOn(note.htmlAttrs.html_id_prefix + id)) {
  //     return { abc: note.note, url: note.getFirstTabChar() };
  //   }
  //   return false;
  // }

  // set_tom_state(id: number, tomNum: number, mode: 'off' | 'normal', makeSound: boolean): void {
  //   const note = {
  //     1: AbcNote.T1_NORMAL,
  //     4: AbcNote.T4_NORMAL
  //   }[tomNum];
  //   if (mode === 'off') {
  //     this.setNoteState(note.htmlAttrs.html_id_prefix + id, mode === 'off' ? 'off' : 'on');
  //   } else {
  //     this.setNoteState(note.htmlAttrs.html_id_prefix + id, "on");
  //     if (makeSound) {
  //       this.playSingleNote(note.midiNote);
  //     }
  //   }
  // }

  // // silly helpers, but needed for argument compatibility with the other set states
  // set_tom1_state(id, mode, make_sound) {
  //   set_tom_state(id, 1, mode, make_sound);
  // }

  // set_tom4_state(id, mode, make_sound) {
  //   set_tom_state(id, 4, mode, make_sound);
  // }

  // is_kick_on(id: number): boolean {
  //   return get_kick_state(id) !== false;
  // }

  // returns the ABC notation for the kick state
  // false = off
  // "F" = normal kick
  // "^d," = splash
  // "F^d,"  = kick & splash
  // get_kick_state(id: number): { abc: string, url: string } | false {
  //   const splashOn = isNoteOn(AbcNote.KI_SPLASH.htmlAttrs.html_id_prefix + id);
  //   const kickOn = isNoteOn(AbcNote.KI_SPLASH.htmlAttrs.html_id_prefix + id);
  //   var note;
  //   if (splashOn && kickOn) {
  //     note = AbcNote.KI_SANDK;
  //   } else if (splashOn) {
  //     note = AbcNote.KI_SPLASH;
  //   } else if (kickOn) {
  //     note = AbcNote.KI_NORMAL;
  //   }
  //   if (note) {
  //     return { abc: note.note, url: note.getFirstTabChar() };
  //   }
  //   return false;
  // }

  getDrumNote(idNum: number, drumType: DrumType): AbcNote | null {
    const id = idNum.toString();
    switch (drumType.name) {
      case DrumType.KICK.name:
        // For kick, two notes maybe represented on the same line. Thus we need to handle this a little differently.
        const splashOn = this.isNoteOn(AbcNote.KI_SPLASH.getFirstHtmlIdPrefix() + id);
        const kickOn = this.isNoteOn(AbcNote.KI_NORMAL.getFirstHtmlIdPrefix() + id);
        if (splashOn && kickOn) {
          return AbcNote.KI_SANDK;
        }
        if (splashOn) {
          return AbcNote.KI_SPLASH;
        }
        if (kickOn) {
          return AbcNote.KI_NORMAL;
        }
        return null;
      case DrumType.SNARE.name:
        for (const note of AbcNote.SN_ALL) {
          if (this.isNoteOn(note.getFirstHtmlIdPrefix() + id)) {
            return note;
          }
        }
      case DrumType.TOM1.name:
        if (this.isNoteOn(AbcNote.T1_NORMAL.getFirstHtmlIdPrefix() + id)) {
          return AbcNote.T1_NORMAL;
        }
        return null;
      case DrumType.TOM4.name:
        if (this.isNoteOn(AbcNote.T4_NORMAL.getFirstHtmlIdPrefix() + id)) {
          return AbcNote.T4_NORMAL;
        }
        return null;
      case DrumType.HIHAT.name:
        for (const note of AbcNote.HH_ALL) {
          if (this.isNoteOn(note.getFirstHtmlIdPrefix() + id)) {
            return note;
          }
        }
      case DrumType.STICKINGS.name:
        for (const note of AbcNote.STICKINGS_ALL) {
          if (this.isNoteOn(note.getFirstHtmlIdPrefix() + id)) {
            return note;
          }
        }
    }
    return null;
  }

  // If note is AbcNote.OFF, drumType must be set.
  setDrumNote(id: number, note: AbcNote, makeSound: boolean = false, offDrumType: DrumType | null = null): void {
    // First hide all notes.
    const drumType = note.drumType === DrumType.NONE ? offDrumType : note.drumType;
    const notes = {
      [DrumType.KICK.name]: [AbcNote.KI_NORMAL, AbcNote.KI_SPLASH],
      [DrumType.SNARE.name]: AbcNote.SN_ALL,
      [DrumType.TOM1.name]: [AbcNote.T1_NORMAL],
      [DrumType.TOM4.name]: [AbcNote.T4_NORMAL],
      [DrumType.HIHAT.name]: AbcNote.HH_ALL,
      [DrumType.STICKINGS.name]: [AbcNote.STICK_R, AbcNote.STICK_L, AbcNote.STICK_BOTH, AbcNote.STICK_COUNT]
    }[drumType.name];
    for (const n of notes) {
      const prefixes = getAsSet(n.htmlAttrs.html_id_prefix);
      for (const prefix of prefixes) {
        const element = document.getElementById(prefix + id);
        if (!element) continue;
        element.classList.remove("note-on");
        element.classList.remove("note-off");
        element.classList.add("note-hidden");
      }
    }

    // Play note.
    if (makeSound && note?.midiNote) {
      this.playSingleNote(note.midiNote);
    }

    // Set UI state.
    if (note.isOff()) {
      // Show the first "default" element for this drumType as off (so the row visually collapses to off state).
      const defaultNote = notes[0];
      for (const prefix of getAsSet(defaultNote.htmlAttrs.html_id_prefix)) {
        const element = document.getElementById(prefix + id);
        if (!element) continue;
        element.classList.remove("note-hidden");
        element.classList.add("note-off");
      }
      return;
    }
    for (const prefix of getAsSet(note.htmlAttrs.html_id_prefix)) {
      const element = document.getElementById(prefix + id);
      if (!element) continue;
      element.classList.remove("note-hidden");
      element.classList.add("note-on");
    }
  }

  // // set the kick note on with type
  // set_kick_state(id: number, mode: string, makeSound: boolean, note: AbcNote | null = null) {
  //   // Hide all.
  //   const notes = [AbcNote.KI_NORMAL, AbcNote.KI_SPLASH];
  //   notes.forEach((note) => { setNoteState(note.htmlAttrs.html_id_prefix + id, "hidden"); });

  //   if (makeSound && note.midiNote) {
  //     this.play_single_note_for_note_setting(note.midiNote);
  //   }

  //   switch (mode) {
  //     case "off":
  //       document.getElementById("kick_circle" + id).style.backgroundColor = constant_note_off_color_hex;
  //       document.getElementById("kick_circle" + id).style.borderColor = constant_note_border_color_hex;
  //       break;
  //     case "normal":
  //       document.getElementById("kick_circle" + id).style.backgroundColor = constant_note_on_color_hex;
  //       document.getElementById("kick_circle" + id).style.borderColor = constant_note_border_color_hex;
  //       if (makeSound)
  //         playSingleNote(constant_OUR_MIDI_KICK_NORMAL);
  //       break;
  //     case "splash":
  //       document.getElementById("kick_splash" + id).style.color = constant_note_on_color_hex;
  //       document.getElementById("kick_circle" + id).style.borderColor = constant_note_hidden_color_rgb;
  //       if (makeSound)
  //         playSingleNote(constant_OUR_MIDI_HIHAT_FOOT);
  //       break;
  //     case "kick_and_splash":
  //       document.getElementById("kick_circle" + id).style.backgroundColor = constant_note_on_color_hex;
  //       document.getElementById("kick_splash" + id).style.color = constant_note_on_color_hex;
  //       if (makeSound)
  //         playSingleNote(constant_OUR_MIDI_HIHAT_FOOT);
  //       if (makeSound)
  //         playSingleNote(constant_OUR_MIDI_KICK_NORMAL);
  //       break;
  //     default:
  //       console.log("bad switch in set_kick_state");
  //       break;
  //   }
  // }

  // function set_snare_state(id: number, mode: string, make_sound: boolean, note: AbcNote | null = null): void {
  //   for (const idPrefix in AbcNote.SN_IDS) {
  //     setNoteState(idPrefix + id, "hidden");
  //   }
  //   if (make_sound && note?.midiNote) {
  //     playSingleNote(note.midiNote);
  //   }

  //   // turn stuff on conditionally
  //   switch (mode) {
  //     case "off":
  //       document.getElementById("snare_circle" + id).style.backgroundColor = constant_note_off_color_hex;
  //       document.getElementById("snare_circle" + id).style.borderColor = constant_note_border_color_hex;
  //       break;
  //     case "normal":
  //       document.getElementById("snare_circle" + id).style.backgroundColor = constant_note_on_color_hex;
  //       document.getElementById("snare_circle" + id).style.borderColor = constant_note_border_color_hex;
  //       if (make_sound)
  //         playSingleNote(constant_OUR_MIDI_SNARE_NORMAL);
  //       break;
  //     case "flam":
  //       document.getElementById("snare_flam" + id).style.color = constant_note_on_color_hex;
  //       if (make_sound)
  //         playSingleNote(constant_OUR_MIDI_SNARE_FLAM);
  //       break;
  //     case "drag":
  //       document.getElementById("snare_drag" + id).style.color = constant_note_on_color_hex;
  //       if (make_sound)
  //         playSingleNote(constant_OUR_MIDI_SNARE_DRAG);
  //       break;
  //     case "ghost":
  //       document.getElementById("snare_ghost" + id).style.color = constant_note_on_color_hex;
  //       if (make_sound)
  //         playSingleNote(constant_OUR_MIDI_SNARE_GHOST);
  //       break;
  //     case "accent":
  //       document.getElementById("snare_circle" + id).style.backgroundColor = constant_note_on_color_hex;
  //       document.getElementById("snare_circle" + id).style.borderColor = constant_note_border_color_hex;
  //       document.getElementById("snare_accent" + id).style.color = constant_snare_accent_on_color_hex;
  //       if (make_sound)
  //         playSingleNote(constant_OUR_MIDI_SNARE_ACCENT);
  //       break;
  //     case "xstick":
  //       document.getElementById("snare_xstick" + id).style.color = constant_note_on_color_hex;
  //       if (make_sound)
  //         playSingleNote(constant_OUR_MIDI_SNARE_XSTICK);
  //       break;
  //     case "buzz":
  //       document.getElementById("snare_buzz" + id).style.color = constant_note_on_color_hex;
  //       if (make_sound)
  //         playSingleNote(constant_OUR_MIDI_SNARE_BUZZ);
  //       break;
  //     default:
  //       console.log("bad switch in set_snare_state");
  //       break;
  //   }
  // }

  // function is_hh_on(id: string): boolean {
  //   return get_hh_state(id) !== false;
  // }

  // // returns the ABC notation for the HH state
  // // false = off
  // // see the top constants for mappings
  // function get_hh_state(id: string): AbcNote | null {
  //   for (const note of AbcNote.HH_ALL) {
  //     if (isNoteOn(note.htmlAttrs.html_id_prefix + id)) {
  //       return note;
  //     }
  //   }
  //   return null;
  // }

  // // TODO: refactor this using a lookup table of constants
  // function set_hh_state(id, mode, make_sound) {

  //   // hide everything optional
  //   document.getElementById("hh_cross" + id).style.color = constant_note_hidden_color_rgb;
  //   document.getElementById("hh_ride" + id).style.color = constant_note_hidden_color_rgb;
  //   document.getElementById("hh_ride_bell" + id).style.color = constant_note_hidden_color_rgb;
  //   document.getElementById("hh_cow_bell" + id).style.color = constant_note_hidden_color_rgb;
  //   document.getElementById("hh_crash" + id).style.color = constant_note_hidden_color_rgb;
  //   document.getElementById("hh_stacker" + id).style.color = constant_note_hidden_color_rgb;
  //   document.getElementById("hh_metronome_normal" + id).style.color = constant_note_hidden_color_rgb;
  //   document.getElementById("hh_metronome_accent" + id).style.color = constant_note_hidden_color_rgb;
  //   document.getElementById("hh_open" + id).style.color = constant_note_hidden_color_rgb;
  //   document.getElementById("hh_close" + id).style.color = constant_note_hidden_color_rgb;
  //   document.getElementById("hh_accent" + id).style.color = constant_note_hidden_color_rgb;

  //   // turn stuff on conditionally
  //   switch (mode) {
  //     case "off":
  //       document.getElementById("hh_cross" + id).style.color = constant_hihat_note_off_color_hex;
  //       break;
  //     case "normal":
  //       document.getElementById("hh_cross" + id).style.color = constant_note_on_color_hex;
  //       if (make_sound)
  //         playSingleNote(constant_OUR_MIDI_HIHAT_NORMAL);
  //       break;
  //     case "ride":
  //       document.getElementById("hh_ride" + id).style.color = constant_note_on_color_hex;
  //       if (make_sound)
  //         playSingleNote(constant_OUR_MIDI_HIHAT_RIDE);
  //       break;
  //     case "ride_bell":
  //       document.getElementById("hh_ride_bell" + id).style.color = constant_note_on_color_hex;
  //       if (make_sound)
  //         playSingleNote(constant_OUR_MIDI_HIHAT_RIDE_BELL);
  //       break;
  //     case "cow_bell":
  //       document.getElementById("hh_cow_bell" + id).style.color = constant_note_on_color_hex;
  //       if (make_sound)
  //         playSingleNote(constant_OUR_MIDI_HIHAT_COW_BELL);
  //       break;
  //     case "crash":
  //       document.getElementById("hh_crash" + id).style.color = constant_note_on_color_hex;
  //       if (make_sound)
  //         playSingleNote(constant_OUR_MIDI_HIHAT_CRASH);
  //       break;
  //     case "stacker":
  //       document.getElementById("hh_stacker" + id).style.color = constant_note_on_color_hex;
  //       if (make_sound)
  //         playSingleNote(constant_OUR_MIDI_HIHAT_STACKER);
  //       break;
  //     case "metronome_normal":
  //       document.getElementById("hh_metronome_normal" + id).style.color = constant_note_on_color_hex;
  //       if (make_sound)
  //         playSingleNote(constant_OUR_MIDI_HIHAT_METRONOME_NORMAL);
  //       break;
  //     case "metronome_accent":
  //       document.getElementById("hh_metronome_accent" + id).style.color = constant_note_on_color_hex;
  //       if (make_sound)
  //         playSingleNote(constant_OUR_MIDI_HIHAT_METRONOME_ACCENT);
  //       break;
  //     case "open":
  //       document.getElementById("hh_cross" + id).style.color = constant_note_on_color_hex;
  //       document.getElementById("hh_open" + id).style.color = constant_note_on_color_hex;
  //       if (make_sound)
  //         playSingleNote(constant_OUR_MIDI_HIHAT_OPEN);
  //       break;
  //     case "close":
  //       document.getElementById("hh_cross" + id).style.color = constant_note_on_color_hex;
  //       document.getElementById("hh_close" + id).style.color = constant_note_on_color_hex;
  //       if (make_sound)
  //         playSingleNote(constant_OUR_MIDI_HIHAT_NORMAL);
  //       break;
  //     case "accent":
  //       document.getElementById("hh_cross" + id).style.color = constant_note_on_color_hex;
  //       document.getElementById("hh_accent" + id).style.color = constant_note_on_color_hex;
  //       if (make_sound)
  //         playSingleNote(constant_OUR_MIDI_HIHAT_ACCENT);
  //       break;
  //     default:
  //       console.log("bad switch in set_hh_state");
  //       break;
  //   }
  // }

  // function set_sticking_state(id, new_state, make_sound) {

  //   // turn both off
  //   document.getElementById("sticking_right" + id).style.color = constant_note_hidden_color_rgb;
  //   document.getElementById("sticking_left" + id).style.color = constant_note_hidden_color_rgb;
  //   document.getElementById("sticking_both" + id).style.color = constant_note_hidden_color_rgb;
  //   document.getElementById("sticking_count" + id).style.color = constant_note_hidden_color_rgb;

  //   switch (new_state) {
  //     case "off":
  //       // show them all greyed out.
  //       document.getElementById("sticking_right" + id).style.color = constant_sticking_right_off_color_rgb;
  //       document.getElementById("sticking_left" + id).style.color = constant_sticking_left_off_color_rgb;
  //       break;
  //     case "right":
  //       document.getElementById("sticking_right" + id).style.color = constant_sticking_right_on_color_rgb;
  //       break;
  //     case "left":
  //       document.getElementById("sticking_left" + id).style.color = constant_sticking_left_on_color_rgb;
  //       break;
  //     case "both":
  //       document.getElementById("sticking_both" + id).style.color = constant_sticking_both_on_color_rgb;
  //       break;
  //     case "count":
  //       var count_state = this.myGrooveUtils.figure_out_sticking_count_for_index(id, this.data.notesPerMeasure, class_subDivision, this.data.timeSigBottom);

  //       document.getElementById("sticking_count" + id).style.color = constant_sticking_count_on_color_rgb;
  // IMPORTANT
  //       document.getElementById("sticking_count" + id).innerHTML = "" + count_state;
  //       break;

  //     default:
  //       console.log("Bad state in set_sticking_state: " + new_state);
  //       break;
  //   }
  // }

  // function get_sticking_state(id: string): { abc: string, url: string } | false; {
  //   var sticking_state = false;
  //   if (returnType != "ABC" && returnType != "URL") {
  //     console.log("bad returnType in get_kick_state()");
  //     returnType = "ABC";
  //   }

  //   var right_ele = document.getElementById("sticking_right" + id);
  //   var left_ele = document.getElementById("sticking_left" + id);
  //   var both_ele = document.getElementById("sticking_both" + id);
  //   var count_ele = document.getElementById("sticking_count" + id);

  //   if (both_ele.style.color == constant_sticking_both_on_color_rgb) {
  //     // both is on
  //     if (returnType == "ABC")
  //       return constant_ABC_STICK_BOTH;
  //     else if (returnType == "URL")
  //       return "B";
  //   } else if (right_ele.style.color == constant_sticking_right_on_color_rgb) {

  //     if (returnType == "ABC")
  //       return constant_ABC_STICK_R;
  //     else if (returnType == "URL")
  //       return "R";

  //   } else if (left_ele.style.color == constant_sticking_left_on_color_rgb) {

  //     if (returnType == "ABC")
  //       return constant_ABC_STICK_L;
  //     else if (returnType == "URL")
  //       return "L";
  //   } else if (count_ele.style.color == constant_sticking_count_on_color_rgb) {

  //     if (returnType == "ABC")
  //       return constant_ABC_STICK_COUNT;
  //     else if (returnType == "URL")
  //       return "c";
  //   } else {
  //     // none selected.  Call it off
  //     if (returnType == "ABC")
  //       return constant_ABC_STICK_OFF; // off (rest)
  //     else if (returnType == "URL")
  //       return "-"; // off (rest)
  //   }

  //   return false; // should never get here
  // }


  sticking_rotate_state(id: number): void {
    const sticking_state = this.getDrumNote(id, DrumType.STICKINGS);
    const newState = {
      [AbcNote.STICK_OFF.note]: AbcNote.STICK_R,
      [AbcNote.STICK_R.note]: AbcNote.STICK_L,
      [AbcNote.STICK_L.note]: AbcNote.STICK_BOTH,
      [AbcNote.STICK_BOTH.note]: AbcNote.STICK_COUNT,
      [AbcNote.STICK_COUNT.note]: AbcNote.STICK_OFF,
    }[sticking_state.note];
    this.setDrumNote(id, newState, true);
  }

  // highlight the note, this is used to play along with the midi track
  // only one note for each instrument can be highlighted at a time
  // Also unhighlight other instruments if their index is not equal to the passed in index
  // this means that only notes falling on the current beat will be highlighted.
  // var class_cur_hh_highlight_id = false;
  // var class_cur_tom1_highlight_id = false;
  // var class_cur_tom4_highlight_id = false;
  // var class_cur_snare_highlight_id = false;
  // var class_cur_kick_highlight_id = false;
  // var class_cur_all_notes_highlight_id = false;

  hilight_individual_note(instrument: string, id: number) {
    var hilight_all_notes = true; // on by default

    id = Math.floor(id);
    if (id < 0 || id >= this.data.notesPerMeasure * this.data.numberOfMeasures)
      return;

    // turn this one on;
    document.getElementById(instrument + id).style.borderColor = "orange";

    // turn off all the previously highlighted notes that are not on the same beat
    if (this.class_cur_hh_highlight_id !== -1 && this.class_cur_hh_highlight_id != id) {
      if (this.class_cur_hh_highlight_id < this.data.notesPerMeasure * this.data.numberOfMeasures)
        document.getElementById("hi-hat" + this.class_cur_hh_highlight_id).style.borderColor = "transparent";
      this.class_cur_hh_highlight_id = -1;
    }
    if (this.class_cur_tom1_highlight_id !== -1 && this.class_cur_tom1_highlight_id != id) {
      if (this.class_cur_tom1_highlight_id < this.data.notesPerMeasure * this.data.numberOfMeasures)
        document.getElementById("tom1-" + this.class_cur_tom1_highlight_id).style.borderColor = "transparent";
      this.class_cur_tom1_highlight_id = -1;
    }
    if (this.class_cur_tom4_highlight_id !== -1 && this.class_cur_tom4_highlight_id != id) {
      if (this.class_cur_tom4_highlight_id < this.data.notesPerMeasure * this.data.numberOfMeasures)
        document.getElementById("tom4-" + this.class_cur_tom4_highlight_id).style.borderColor = "transparent";
      this.class_cur_tom4_highlight_id = -1;
    }
    if (this.class_cur_snare_highlight_id !== -1 && this.class_cur_snare_highlight_id != id) {
      if (this.class_cur_snare_highlight_id < this.data.notesPerMeasure * this.data.numberOfMeasures)
        document.getElementById("snare" + this.class_cur_snare_highlight_id).style.borderColor = "transparent";
      this.class_cur_snare_highlight_id = -1;
    }
    if (this.class_cur_kick_highlight_id !== -1 && this.class_cur_kick_highlight_id != id) {
      if (this.class_cur_kick_highlight_id < this.data.notesPerMeasure * this.data.numberOfMeasures)
        document.getElementById("kick" + this.class_cur_kick_highlight_id).style.borderColor = "transparent";
      this.class_cur_kick_highlight_id = -1;
    }

    switch (instrument) {
      case "hi-hat":
        this.class_cur_hh_highlight_id = id;
        break;
      case "tom1":
        this.class_cur_tom1_highlight_id = id;
        break;
      case "tom4":
        this.class_cur_tom4_highlight_id = id;
        break;
      case "snare":
        this.class_cur_snare_highlight_id = id;
        break;
      case "kick":
        this.class_cur_kick_highlight_id = id;
        break;
      default:
        console.log("bad case in hilight_note");
        break;
    }

  }

  hilight_all_notes_on_same_beat(instrument: string, id: number) {
    id = Math.floor(id);
    if (id < 0 || id >= this.data.notesPerMeasure * this.data.numberOfMeasures)
      return;

    if (this.class_cur_all_notes_highlight_id === id)
      return; // already highligted

    if (this.class_cur_all_notes_highlight_id !== -1) {
      // turn off old highlighting
      var bg_ele = document.getElementById("bg-highlight" + this.class_cur_all_notes_highlight_id)
      if (bg_ele) {
        bg_ele.style.background = "transparent";
      }
    }

    // turn this one on;
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

    // if we are in a permutation, hightlight each measure as it goes
    if (this.class_permutation_type != "none")
      percent_complete = (percent_complete * this.get_numberOfActivePermutationSections()) % 1.0;

    var note_id_in_32 = Math.floor(percent_complete * this.myGrooveUtils.notesPerMeasureInFullSizeArray(this.usingTriplets(), this.data.timeSig) * this.data.numberOfMeasures);
    var real_note_id = (note_id_in_32 / this.myGrooveUtils.getNoteScaler(this.data.notesPerMeasure, this.data.timeSig));

    //hilight_individual_note(instrument, id);
    this.hilight_all_notes_on_same_beat(instrument, real_note_id);
  }

  clear_all_highlights(instrument: string): void {

    var clearBorder = function(id) {
      var el = document.getElementById(id);
      if (el) el.style.borderColor = "transparent";
    };

    // now turn off  notes if necessary;
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
      // turn off old highlighting
      var bg_ele = document.getElementById("bg-highlight" + this.class_cur_all_notes_highlight_id)
      if (bg_ele) {
        bg_ele.style.background = "transparent";
      }
      this.class_cur_all_notes_highlight_id = -1;
    }
  }

  getTagPosition(tag) {
    var xVal = 0,
      yVal = 0;
    while (tag) {
      xVal += (tag.offsetLeft - tag.scrollLeft + tag.clientLeft);
      yVal += (tag.offsetTop - tag.scrollTop + tag.clientTop);
      tag = tag.offsetParent;
    }
    return {
      x: xVal,
      y: yVal
    };
  }

  tempoChangeCallback = (newTempo) => {

    // if there is a timeout running clear it
    if (this.global_tempoChangeCallbackTimeout != null)
      window.clearTimeout(this.global_tempoChangeCallbackTimeout);

    // set a new timeout
    this.global_tempoChangeCallbackTimeout = window.setTimeout(function () {
      this.global_tempoChangeCallbackTimeout = null
      // update the Main URL to show the new tempo
      this.updateCurrentURL();
    }, 300);
  }

  setMetronomeButton(metronomeInterval: number) {
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
      /* falls through */
      default:
        id = "metronomeOff";
        if (this.myGrooveUtils.getMetronomeSolo()) {
          // turn off solo if we are turning off the metronome
          this.metronomeOptionsMenuPopupClick("Solo");
        }
        break;
    }

    // clear other buttons
    var myElements = document.querySelectorAll(".metronomeButton");
    for (var i = 0; i < myElements.length; i++) {
      var thisButton = myElements[i] as HTMLElement;
      // remove active status
      this.unselectButton(thisButton);
    }
    this.selectButton(document.getElementById(id));
    this.myGrooveUtils.midiNoteHasChanged(); // pretty likely the case
  };

  getMetronomeFrequency() {
    return this.class_metronome_frequency;
  }

  setMetronomeFrequency(newFrequency) {
    this.class_metronome_frequency = newFrequency;
    this.setMetronomeButton(newFrequency);
    // TODO
    // update the current URL so that reloads and history traversal and link shares and bookmarks work correctly
    this.updateUrl();
  };

  // the user has clicked on the metronome options button
  metronomeOptionsAnchorClick = (event) => {

    var contextMenu = document.getElementById("metronomeOptionsContextMenu");
    if (contextMenu) {

      var anchorPoint = document.getElementById("metronomeOptionsAnchor");

      if (anchorPoint) {
        var anchorPos = this.getTagPosition(anchorPoint);
        contextMenu.style.top = anchorPos.y + anchorPoint.offsetHeight + "px";
        contextMenu.style.left = anchorPos.x + anchorPoint.offsetWidth - 150 + "px";
      }

      this.myGrooveUtils.showContextMenu(contextMenu);
    }
  };

  // the user has clicked on the permutation menu
  permutationAnchorClick = (event) => {
    // permutations disabled except in 4/4 time
    if (this.data.timeSig.equals(TimeSignature.COMMON_TIME_44)) {
      return;
    }

    var contextMenu = document.getElementById("permutationContextMenu");
    if (contextMenu) {
      var anchorPoint = document.getElementById("permutationAnchor");

      if (anchorPoint) {
        var anchorPos = this.getTagPosition(anchorPoint);
        contextMenu.style.top = anchorPos.y + anchorPoint.offsetHeight + "px";
        contextMenu.style.left = anchorPos.x + anchorPoint.offsetWidth - 150 + "px";
      }
      this.myGrooveUtils.showContextMenu(contextMenu);
    }
  };

  // the user has clicked on the grooves menu
  groovesAnchorClick = (event) => {

    var contextMenu = document.getElementById("grooveListWrapper");
    if (contextMenu) {
      var anchorPoint = document.getElementById("groovesAnchor");

      if (anchorPoint) {
        var anchorPos = this.getTagPosition(anchorPoint);
        contextMenu.style.top = anchorPos.y + anchorPoint.offsetHeight + "px";
        contextMenu.style.left = anchorPos.x + anchorPoint.offsetWidth - 283 + "px";
      }
      this.myGrooveUtils.showContextMenu(contextMenu);
    }
  };

  // the user has clicked on the help menu
  helpAnchorClick = (event) => {

    var contextMenu = document.getElementById("helpContextMenu");
    if (contextMenu) {
      var anchorPoint = document.getElementById("helpAnchor");

      if (anchorPoint) {
        var anchorPos = this.getTagPosition(anchorPoint);
        contextMenu.style.top = anchorPos.y + anchorPoint.offsetHeight + "px";
        contextMenu.style.left = anchorPos.x + anchorPoint.offsetWidth - 150 + "px";
      }
      this.myGrooveUtils.showContextMenu(contextMenu);
    }
  };

  // the user has clicked on the stickings menu (at bottom)
  stickingsAnchorClick = (event) => {

    var contextMenu = document.getElementById("stickingsContextMenu");
    if (contextMenu) {
      var anchorPoint = document.getElementById("stickingsButton");

      if (anchorPoint) {
        if (!event)
          event = window.event;
        if (event.clientX || event.clientY) {
          contextMenu.style.top = event.clientY - 100 + "px";
          contextMenu.style.left = event.clientX - 150 + "px";
        }
      }
      this.myGrooveUtils.showContextMenu(contextMenu);
    }
  };

  // the user has clicked on the download menu (at bottom)
  DownloadAnchorClick = (event) => {

    var contextMenu = document.getElementById("downloadContextMenu");
    if (contextMenu) {
      var anchorPoint = document.getElementById("downloadButton");

      if (anchorPoint) {
        if (!event)
          event = window.event;
        if (event.clientX || event.clientY) {
          contextMenu.style.top = event.clientY - 150 + "px";
          contextMenu.style.left = event.clientX - 150 + "px";
        }
      }
      this.myGrooveUtils.showContextMenu(contextMenu);
    }
  };

  // figure out if the metronome options menu should be selected and change the UI
  metronomeOptionsMenuSetSelectedState() {
    if (this.myGrooveUtils.getMetronomeSolo() ||
      this.class_metronome_auto_speed_up_active ||
      this.myGrooveUtils.getMetronomeOffsetClickStart() != "1") {
      // make menu look active
      this.addClassById("metronomeOptionsAnchor", "selected", true)
    } else {
      // inactive
      this.addClassById("metronomeOptionsAnchor", "selected", false)
    }
  };

  metronomeOptionsMenuPopupClick(option_type: string) {

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
        this.myGrooveUtils.midiNoteHasChanged(); // if playing need to refresh
        break;

      case "SpeedUp":
        if (this.class_metronome_auto_speed_up_active) {
          // just turn it off if it is on, don't show the configurator
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
          // just turn it off if it is on, don't show the configurator
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
        // bring up the next menu to be clicked
        var contextMenu;

        if (this.data.subdivision.isTriplet())
          contextMenu = document.getElementById("metronomeOptionsOffsetClickForTripletsContextMenu");
        else
          contextMenu = document.getElementById("metronomeOptionsOffsetClickContextMenu");
        if (contextMenu) {
          var anchorPoint = document.getElementById("metronomeOptionsContextMenuOffTheOne");

          if (anchorPoint) {
            var anchorPos = this.getTagPosition(anchorPoint);
            contextMenu.style.top = anchorPos.y + anchorPoint.offsetHeight + "px";
            contextMenu.style.left = anchorPos.x + anchorPoint.offsetWidth - 150 + "px";
          }
          this.myGrooveUtils.showContextMenu(contextMenu);
        }
        break;
      case "Dropper":
        break;
      default:
        console.log("bad case in metronomeOptionsMenuPopupClick()");
        break;
    }

    this.metronomeOptionsMenuSetSelectedState();
  };

  metronomeOptionsMenuOffsetClickPopupClick = (option_type) => {
    this.myGrooveUtils.setMetronomeOffsetClickStart(option_type);

    // clear other and select
    var myElements = document.querySelectorAll(".metronomeOptionsOffsetClickContextMenuItem");
    for (var i = 0; i < myElements.length; i++) {
      var thisItem = myElements[i] as HTMLElement;
      // remove active status
      this.addClass(thisItem, "menuChecked", false);
    }

    // turn on the new one selected
    this.addClassById("metronomeOptionsOffsetClickContextMenuOnThe" + option_type, "menuChecked", true);

    if (option_type != "1") { // 1 is the default state
      // add a check to the menu
      this.addClassById("metronomeOptionsContextMenuOffTheOne", "menuChecked", true);
    } else {
      this.addClassById("metronomeOptionsContextMenuOffTheOne", "menuChecked", false);
    }

    this.myGrooveUtils.midiNoteHasChanged();
    this.metronomeOptionsMenuSetSelectedState();
  };

  resetMetronomeOptionsMenuOffsetClick() {
    // call with the default option
    this.metronomeOptionsMenuOffsetClickPopupClick("1");
  }

  setupPermutationMenu() {
    if (this.data.timeSig.equals(TimeSignature.COMMON_TIME_44)) {
      this.addClassById("permutationAnchor", "enabled");
    }

    // permutations disabled except in 4/4 time
    if (this.data.timeSig.equals(TimeSignature.COMMON_TIME_44)) {
      this.addClassById("permutationAnchor", "enabled", false);
      this.permutationPopupClick("none");  // make sure permutation is off
    }
  }

  permutationPopupClick(perm_type) {
    if (this.class_permutation_type == perm_type)
      return;

    this.class_permutation_type = perm_type;

    switch (perm_type) {
      case "kick_16ths":
        this.showHideCSS_ClassVisibility(".kick-container", true, false); // hide it
        this.showHideCSS_ClassVisibility(".snare-container", true, true); // show it
        while (this.data.numberOfMeasures > 1) {
          this.closeMeasureButtonClick(2);
        }
        this.selectButton(document.getElementById("permutationAnchor"));
        document.getElementById("PermutationOptions").innerHTML = this.HTMLforPermutationOptions();
        document.getElementById("PermutationOptions").className += " displayed";
        break;

      case "snare_16ths":
        this.showHideCSS_ClassVisibility(".kick-container", true, true); // show it
        this.showHideCSS_ClassVisibility(".snare-container", true, false); // hide it
        while (this.data.numberOfMeasures > 1) {
          this.closeMeasureButtonClick(2);
        }
        this.selectButton(document.getElementById("permutationAnchor"));
        document.getElementById("PermutationOptions").innerHTML = this.HTMLforPermutationOptions();
        document.getElementById("PermutationOptions").className += " displayed";
        break;

      case "none":
      /* falls through */
      default:
        this.showHideCSS_ClassVisibility(".kick-container", true, true); // show it
        this.showHideCSS_ClassVisibility(".snare-container", true, true); // show it
        this.class_permutation_type = "none";

        this.unselectButton(document.getElementById("permutationAnchor"));
        document.getElementById("PermutationOptions").innerHTML = this.HTMLforPermutationOptions();
        this.addClassById("PermutationOptions", "displayed", false);
        break;
    }

    this.updateSheetMusic();
  };

  muteInstrument(instrument, measure, muteElseUnmute) {
    // find unmuteHHButton1  or unmuteSnareButton2
    var buttonName = "unmute" + instrument + "Button" + measure
    var button = document.getElementById(buttonName);
    if (muteElseUnmute)
      button.style.display = "inline-block";
    else
      button.style.display = "none";

    this.myGrooveUtils.midiNoteHasChanged();
  }

  isInstrumentMuted(instrument, measure) {
    // find unmuteHHButton1  or unmuteSnareButton2
    var buttonName = "unmute" + instrument + "Button" + measure
    var button = document.getElementById(buttonName);
    if (button && button.style.display == "inline-block")
      return true;
    else
      return false;
  }

  helpMenuPopupClick(help_type) {
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

  // user has clicked on the advanced edit button
  toggleAdvancedEdit() {
    if (this.class_advancedEditIsOn) {
      // turn it off
      this.class_advancedEditIsOn = false;
      this.unselectButton(document.getElementById("advancedEditAnchor"));
    } else {
      this.class_advancedEditIsOn = true;
      this.selectButton(document.getElementById("advancedEditAnchor"));
    }
  };

  // context menu for labels
  noteLabelClick(event, instrument, measure) {
    var contextMenu: HTMLElement | null = null;

    // store this in a global, there can only ever be one context menu open at a time.
    // Yes, I agree this sucks
    this.class_measure_for_note_label_click = measure;

    switch (instrument) {
      case "stickings":
        contextMenu = document.getElementById("stickingsLabelContextMenu");
        break;
      case "hh":
        contextMenu = document.getElementById("hhLabelContextMenu");
        break;
      case "tom1":
        contextMenu = document.getElementById("tom1LabelContextMenu");
        break;
      case "tom4":
        contextMenu = document.getElementById("tom4LabelContextMenu");
        break;
      case "snare":
        contextMenu = document.getElementById("snareLabelContextMenu");
        break;
      case "kick":
        contextMenu = document.getElementById("kickLabelContextMenu");
        break;
      default:
        console.log("bad case in noteLabelClick: " + instrument);
        break;
    }

    if (contextMenu) {
      if (!event)
        event = window.event;
      if (event.clientX || event.clientY) {
        contextMenu.style.top = event.clientY - 30 + "px";
        contextMenu.style.left = event.clientX - 35 + "px";
      }
      this.myGrooveUtils.showContextMenu(contextMenu);
    }

    return false;
  }

  noteLabelPopupClick(instrument, action) {
    var setFunction: ((i: number, mode: string, makeSound: boolean) => void) | null = null;

    switch (instrument) {
      case "stickings":
        setFunction = (i, m, s) => this.set_sticking_state(i, m, s);
        break;
      case "hh":
        setFunction = (i, m, s) => this.set_hh_state(i, m, s);
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

    // start at the first note of the measure we want to effect.   Only fill in the
    // notes for that measure
    // the last boolean in the setFunction should only be true on the first call (plays a sound)
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
      } else if (instrument == "hh" && action == "downbeats") {
        this.set_hh_state(i, (i % 2 === 0 ? "normal" : "off"), i == startIndex);

      } else if (instrument == "hh" && action == "upbeats") {
        this.set_hh_state(i, (i % 2 === 0 ? "off" : "normal"), i == (startIndex + 1));

      } else if (instrument == "snare" && action == "all_on") {
        this.set_snare_state(i, "accent", i == startIndex);

      } else if (instrument == "snare" && action == "all_on_normal") {
        this.set_snare_state(i, "normal", i == startIndex);

      } else if (instrument == "snare" && action == "all_on_ghost") {
        this.set_snare_state(i, "ghost", i == startIndex);

      } else if (instrument == "kick" && action == "hh_foot_nums_on") {
        const num_notes_per_count = this.data.notesPerBeat;
        var cur_state = this.get_kick_state(i, "ABC");
        var kick_is_on = false;
        if (cur_state == constant_ABC_KI_SandK || cur_state == constant_ABC_KI_Normal)
          kick_is_on = true;
        this.set_kick_state(i, (i % num_notes_per_count === 0 ? (kick_is_on ? "kick_and_splash" : "splash") : (kick_is_on ? "normal" : "off")), i == (startIndex));

      } else if (instrument == "kick" && action == "hh_foot_ands_on") {
        const num_notes_per_count = this.data.notesPerBeat;
        var cur_state = this.get_kick_state(i, "ABC");
        var kick_is_on = false;
        if (cur_state == constant_ABC_KI_SandK || cur_state == constant_ABC_KI_Normal)
          kick_is_on = true;

        this.set_kick_state(i, (i % num_notes_per_count === (num_notes_per_count / 2) ? (kick_is_on ? "kick_and_splash" : "splash") : (kick_is_on ? "normal" : "off")), i == (startIndex + num_notes_per_count / 2));

      } else if (action == "all_on") {
        setFunction(i, "normal", i == startIndex);

      } else if (action == "cancel") {
        continue; // do nothing.

      } else {
        console.log("Bad IF case in noteLabelPopupClick");

      }
    }

    this.class_measure_for_note_label_click = 0; // reset
    this.updateSheetMusic();
    return false;
  };

  // returns true on error!
  // returns false if working.  (this is because of the onContextMenu handler
  noteRightClick(event, type: string, id) {
    this.class_which_index_last_clicked = id;

    switch (type) {
      case "sticking":
        this.insertNoteContextMenu = document.getElementById("stickingContextMenu");
        break;
      case "hh":
        this.insertNoteContextMenu = document.getElementById("hhContextMenu");
        break;
      case "tom1":
        this.insertNoteContextMenu = document.getElementById("tom1ContextMenu");
        break;
      case "tom4":
        this.insertNoteContextMenu = document.getElementById("tom4ContextMenu");
        break;
      case "snare":
        this.insertNoteContextMenu = document.getElementById("snareContextMenu");
        break;
      case "kick":
        this.insertNoteContextMenu = document.getElementById("kickContextMenu");
        break;
      default:
        console.log("Bad case in handleNotePopup");
        break;
    }

    if (this.insertNoteContextMenu) {
      if (!event)
        event = window.event;
      if (event.clientX || event.clientY) {
        this.insertNoteContextMenu.style.top = event.clientY - 30 + "px";
        this.insertNoteContextMenu.style.left = event.clientX - 75 + "px";
      }
      this.myGrooveUtils.showContextMenu(this.insertNoteContextMenu);
      this.removeAllPopUpKeyEventListeners();
      this.registerPopUpKeyEventListeners();
    } else {
      return true; //error
    }
    return false;
  }

  removeAllPopUpKeyEventListeners() {
    document.removeEventListener("keydown", this.handlePopUpKeyEventListeners);
  }

  // Register or unregister the key event listeners for the given context menu.
  // contextMenu: DOM element
  // register: boolean indicating whether to register or unregister the listeners
  registerPopUpKeyEventListeners() {
    console.log("Adding listeners for " + this.insertNoteContextMenu.id);
    if (this.insertNoteContextMenu) {
      document.addEventListener("keydown", this.handlePopUpKeyEventListeners);
    }
  }

  handlePopUpKeyEventListeners = (event) => {
    if (!this.insertNoteContextMenu) {
      console.log("No insertNoteContextMenu set");
      return;
    }
    console.log("Handling key event for insert note context menu: " + event.key);
    const mapForType = POPUP_KEY_SHORTCUT_MAPPING.get(this.insertNoteContextMenu.id);
    const new_setting = mapForType?.note_mapping.get(event.key);
    if (new_setting) {
      console.log("Setting " + mapForType.type + " to " + new_setting);
      this.notePopupClick(mapForType.type, new_setting);
      event.preventDefault();
      this.myGrooveUtils.hideContextMenu(this.insertNoteContextMenu);
      this.removeAllPopUpKeyEventListeners();
    }
  };

  noteLeftClick = (event, type, id) => {

    // use a popup if advanced edit is on
    if (this.class_advancedEditIsOn === true) {
      this.noteRightClick(event, type, id);

    } else {

      // this is a non advanced edit left click
      switch (type) {
        case "hh":
          this.set_hh_state(id, this.is_hh_on(id) ? "off" : "normal", true);
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

  notePopupClick(type: string, new_setting: string) {
    var id = this.class_which_index_last_clicked;

    switch (type) {
      case "sticking":
        this.set_sticking_state(id, new_setting, true);
        break;
      case "hh":
        this.set_hh_state(id, new_setting, true);
        break;
      case "tom1":
        this.set_tom1_state(id, new_setting, true);
        break;
      case "tom4":
        this.set_tom4_state(id, new_setting, true);
        break;
      case "snare":
        this.set_snare_state(id, new_setting, true);
        break;
      case "kick":
        this.set_kick_state(id, new_setting, true);
        break;
      default:
        console.log("Bad case in contextMenuClick");
        break;
    }
    this.updateSheetMusic();
  };

  // called when we initially mouseOver a note.
  // We can use it to sense left or right mouse or ctrl events
  noteOnMouseEnter(event, instrument: string, id: number) {
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
      this.updateSheetMusic(); // update music
    }
    return false;
  }

  get_permutation_pre_ABC(section: number): string {
    var abc = "";

    switch (section) {
      case 0:
        abc += "P:Ostinato\n%\n%\n%Just the Ositnato\n";
        break;
      case 1:
        abc += "T: \nP: Singles\n%\n%\n% singles on the \"1\"\n%\n";
        break;
      case 2:
        abc += "%\n%\n% singles on the \"e\"\n%\n";
        break;
      case 3:
        abc += "%\n%\n% singles on the \"&\"\n%\n";
        break;
      case 4:
        abc += "%\n%\n% singles on the \"a\"\n%\n";
        break;
      case 5:
        abc += "T: \nP: Doubles\n%\n%\n% doubles on the \"1\"\n%\n";
        break;
      case 6:
        abc += "%\n%\n% doubles on the \"e\"\n%\n";
        break;
      case 7:
        abc += "%\n%\n% doubles on the \"&\"\n%\n";
        break;
      case 8:
        abc += "%\n%\n% doubles on the \"a\"\n%\n";
        break;
      case 9:
        abc += "T: \nP: Down/Up Beats\n%\n%\n% upbeats on the \"1\"\n%\n";
        break;
      case 10:
        abc += "%\n%\n% downbeats on the \"e\"\n%\n";
        break;
      case 11:
        abc += "T: \nP: Triples\n%\n%\n% triples on the \"1\"\n%\n";
        break;
      case 12:
        abc += "%\n%\n% triples on the \"e\"\n%\n";
        break;
      case 13:
        abc += "%\n%\n% triples on the \"&\"\n%\n";
        break;
      case 14:
        abc += "%\n%\n% triples on the \"a\"\n%\n";
        break;
      case 15:
        abc += "T: \nP: Quads\n%\n%\n% quads\n%\n";
        break;
      default:
        abc += "\nT: Error: No index passed\n";
        break;
    }
    return abc;
  }

  get_permutation_post_ABC(section: number): string {
    var abc = "";

    switch (section) {
      case 0:
        abc += "|\n";
        break;
      case 1:
        abc += "\\\n";
        break;
      case 2:
        abc += "\n";
        break;
      case 3:
        if (this.usingTriplets())
          abc += "|\n";
        else
          abc += "\\\n";
        break;
      case 4:
        abc += "|\n";
        break;
      case 5:
        abc += "\\\n";
        break;
      case 6:
        abc += "\n";
        break;
      case 7:
        if (this.usingTriplets())
          abc += "|\n";
        else
          abc += "\\\n";
        break;
      case 8:
        abc += "|\n";
        break;
      case 9:
        abc += "\\\n";
        break;
      case 10:
        abc += "|\n";
        break;
      case 11:
        if (this.usingTriplets())
          abc += "|\n";
        else
          abc += "\\\n";
        break;
      case 12:
        abc += "\n";
        break;
      case 13:
        abc += "\\\n";
        break;
      case 14:
        abc += "|\n";
        break;
      case 15:
        abc += "|\n";
        break;
      default:
        abc += "\nT: Error: No index passed\n";
        break;
    }
    return abc;
  }

  // 16th note permutation array expressed in 32nd notes
  // some kicks are excluded at the beginning of the measure to make the groupings
  // easier to play through continuously
  get_kick16th_minus_some_strait_permutation_array(section: number): Array<boolean | string> {
    var kick_array;

    switch (section) {
      case 0:
        kick_array = [false, false, false, false, false, false, false, false,
          false, false, false, false, false, false, false, false,
          false, false, false, false, false, false, false, false,
          false, false, false, false, false, false, false, false];
        break;
      case 1:
        kick_array = ["F", false, false, false, false, false, false, false,
          "F", false, false, false, false, false, false, false,
          "F", false, false, false, false, false, false, false,
          "F", false, false, false, false, false, false, false];
        break;
      case 2:
        kick_array = [false, false, "F", false, false, false, false, false,
          false, false, "F", false, false, false, false, false,
          false, false, "F", false, false, false, false, false,
          false, false, "F", false, false, false, false, false];
        break;
      case 3:
        kick_array = [false, false, false, false, "F", false, false, false,
          false, false, false, false, "F", false, false, false,
          false, false, false, false, "F", false, false, false,
          false, false, false, false, "F", false, false, false];
        break;
      case 4:
        kick_array = [false, false, false, false, false, false, "F", false,
          false, false, false, false, false, false, "F", false,
          false, false, false, false, false, false, "F", false,
          false, false, false, false, false, false, "F", false];
        break;
      case 5:
        kick_array = ["F", false, "F", false, false, false, false, false,
          "F", false, "F", false, false, false, false, false,
          "F", false, "F", false, false, false, false, false,
          "F", false, "F", false, false, false, false, false];
        break;
      case 6:
        kick_array = [false, false, "F", false, "F", false, false, false,
          false, false, "F", false, "F", false, false, false,
          false, false, "F", false, "F", false, false, false,
          false, false, "F", false, "F", false, false, false];
        break;
      case 7:
        kick_array = [false, false, false, false, "F", false, "F", false,
          false, false, false, false, "F", false, "F", false,
          false, false, false, false, "F", false, "F", false,
          false, false, false, false, "F", false, "F", false];
        break;
      case 8:
        kick_array = [false, false, false, false, false, false, "F", false,
          "F", false, false, false, false, false, "F", false,
          "F", false, false, false, false, false, "F", false,
          "F", false, false, false, false, false, "F", false];
        break;
      case 9: // downbeats
        kick_array = ["F", false, false, false, "F", false, false, false,
          "F", false, false, false, "F", false, false, false,
          "F", false, false, false, "F", false, false, false,
          "F", false, false, false, "F", false, false, false];
        break;
      case 10: // upbeats
        kick_array = [false, false, "F", false, false, false, "F", false,
          false, false, "F", false, false, false, "F", false,
          false, false, "F", false, false, false, "F", false,
          false, false, "F", false, false, false, "F", false];
        break;
      case 11:
        kick_array = ["F", false, "F", false, "F", false, false, false,
          "F", false, "F", false, "F", false, false, false,
          "F", false, "F", false, "F", false, false, false,
          "F", false, "F", false, "F", false, false, false];
        break;
      case 12:
        kick_array = [false, false, "F", false, "F", false, "F", false,
          false, false, "F", false, "F", false, "F", false,
          false, false, "F", false, "F", false, "F", false,
          false, false, "F", false, "F", false, "F", false];
        break;
      case 13:
        kick_array = [false, false, false, false, "F", false, "F", false,
          "F", false, false, false, "F", false, "F", false,
          "F", false, false, false, "F", false, "F", false,
          "F", false, false, false, "F", false, "F", false];
        break;
      case 14:
        kick_array = [false, false, false, false, false, false, "F", false,
          "F", false, "F", false, false, false, "F", false,
          "F", false, "F", false, false, false, "F", false,
          "F", false, "F", false, false, false, "F", false];
        break;
      case 15:
      /* falls through */
      default:
        kick_array = ["F", false, "F", false, "F", false, "F", false,
          "F", false, "F", false, "F", false, "F", false,
          "F", false, "F", false, "F", false, "F", false,
          "F", false, "F", false, "F", false, "F", false];
        break;
    }

    return kick_array;
  }

  // 16th note permutation array expressed in 32nd notes
  // all kicks are included, including the ones that start the measure
  get_kick16th_strait_permutation_array(section: number): Array<boolean | string> {
    var kick_array = [];
    for (var index = 0; index < 32; index++) {
      switch (section) {
        case 0:
          // no notes on
          kick_array.push(false);
          break;
        case 1:
          // every 0th note of 8
          kick_array.push((index % 8) ? false : 'F');
          break;
        case 2:
          // every 2nd note of 8
          kick_array.push(((index - 2) % 8) ? false : 'F');
          break;
        case 3:
          // every 4nd note of 8
          kick_array.push(((index - 4) % 8) ? false : 'F');
          break;
        case 4:
          // every 6nd note of 8
          kick_array.push(((index - 6) % 8) ? false : 'F');
          break;
        case 5:
          // every 0th and 2nd
          if ((index % 8) == 0)
            kick_array.push('F');
          else if (((index - 2) % 8) == 0)
            kick_array.push('F');
          else
            kick_array.push(false);
          break;
        case 6:
          // every 2nd & 4th
          if (((index - 2) % 8) == 0)
            kick_array.push('F');
          else if (((index - 4) % 8) == 0)
            kick_array.push('F');
          else
            kick_array.push(false);
          break;
        case 7:
          // every 4th & 6th
          if (((index - 4) % 8) == 0)
            kick_array.push('F');
          else if (((index - 6) % 8) == 0)
            kick_array.push('F');
          else
            kick_array.push(false);
          break;
        case 8:
          // every 0th & 6th
          if (((index - 0) % 8) == 0)
            kick_array.push('F');
          else if (((index - 6) % 8) == 0)
            kick_array.push('F');
          else
            kick_array.push(false);
          break;
        case 9: // downbeats
          // every 0th note of 4
          kick_array.push((index % 4) ? false : 'F');
          break;
        case 10: // upbeats
          // every 2nd note of 4
          kick_array.push(((index - 2) % 4) ? false : 'F');
          break;
        case 11:
          return kick_array = ["F", false, "F", false, "F", false, false, false,
            "F", false, "F", false, "F", false, false, false,
            "F", false, "F", false, "F", false, false, false,
            "F", false, "F", false, "F", false, false, false];
          break;
        case 12:
          return kick_array = [false, false, "F", false, "F", false, "F", false,
            false, false, "F", false, "F", false, "F", false,
            false, false, "F", false, "F", false, "F", false,
            false, false, "F", false, "F", false, "F", false];
          break;
        case 13:
          return kick_array = ["F", false, false, false, "F", false, "F", false,
            "F", false, false, false, "F", false, "F", false,
            "F", false, false, false, "F", false, "F", false,
            "F", false, false, false, "F", false, "F", false];
          break;
        case 14:
          return kick_array = ["F", false, "F", false, false, false, "F", false,
            "F", false, "F", false, false, false, "F", false,
            "F", false, "F", false, false, false, "F", false,
            "F", false, "F", false, false, false, "F", false];
          break;
        case 15:
        /* falls through */
        default:
          // every 0th note of 2  (quads)
          kick_array.push((index % 2) ? false : 'F');
          break;
          break;
      }
    }

    console.log(kick_array)
    return kick_array;
  }

  // 48th note triplet kick permutation
  get_kick16th_triplets_permutation_array(section: number): Array<boolean | string> {
    var kick_array = [];
    for (var index = 0; index < 48; index++) {

      switch (section) {
        case 0:
          // no notes on
          kick_array.push(false);
          break;
        case 1:
          // every 0th note of 12
          kick_array.push((index % 12) ? false : 'F');
          break;
        case 2:
          // every 4th note of 12
          kick_array.push(((index - 4) % 12) ? false : 'F');
          break;
        case 3:
          // every 8th note of 12
          kick_array.push(((index - 8) % 12) ? false : 'F');
          break;

        case 5:
          // every 0th and 4th
          if ((index % 12) == 0)
            kick_array.push('F');
          else if (((index - 4) % 12) == 0)
            kick_array.push('F');
          else
            kick_array.push(false);
          break;
        case 6:
          // every 4th && 8th
          if (((index - 4) % 12) == 0)
            kick_array.push('F');
          else if (((index - 8) % 12) == 0)
            kick_array.push('F');
          else
            kick_array.push(false);
          break;
        case 7:
          // every 0th and 8th
          if ((index % 12) == 0)
            kick_array.push('F');
          else if (((index - 8) % 12) == 0)
            kick_array.push('F');
          else
            kick_array.push(false);
          break;

        // these cases should not be called
        case 4: // 4th single
        case 8: // 4th double
        case 9: // 1st up/down
        case 10: // 2nd up/down
        case 12: // 2nd triplet
        case 13: // 3nd triplet
        case 14: // 4nd triplet
        case 15: // 1st Quad
          console.log("bad case in get_kick16th_triplets_permutation_array_for_16ths()");
          break;

        case 11: // first triplet
        /* falls through */
        default:
          // use default
          // every 4th note
          if (index % 4 == 0)
            kick_array.push("F");
          else
            kick_array.push(false);
          break;
      }
    }
    return kick_array;
  }

  // Returns full ABC notation string (modifier + note) for a note; matches constant_ABC_* values.
  _abcFor(note: AbcNote | null): string | false {
    if (!note) return false;
    return (note.modifier || '') + note.note;
  }

  _isNoteOn(id: string): boolean {
    const el = document.getElementById(id);
    return !!el && el.classList.contains('note-on');
  }

  get_hh_state(id: number | string): { abc: string | false, url: string } {
    for (const note of AbcNote.HH_ALL) {
      const prefix = note.getFirstHtmlIdPrefix();
      if (prefix && this._isNoteOn(prefix + id)) {
        return { abc: this._abcFor(note) as string, url: note.getFirstTabChar() };
      }
    }
    return { abc: false, url: '-' };
  }

  get_snare_state(id: number | string): { abc: string | false, url: string } {
    for (const note of AbcNote.SN_ALL) {
      const prefix = note.getFirstHtmlIdPrefix();
      if (prefix && this._isNoteOn(prefix + id)) {
        return { abc: this._abcFor(note) as string, url: note.getFirstTabChar() };
      }
    }
    return { abc: false, url: '-' };
  }

  get_kick_state(id: number | string, returnType?: string): any {
    const splashPrefix = AbcNote.KI_SPLASH.getFirstHtmlIdPrefix();
    const kickPrefix = AbcNote.KI_NORMAL.getFirstHtmlIdPrefix();
    const splashOn = splashPrefix ? this._isNoteOn(splashPrefix + id) : false;
    const kickOn = kickPrefix ? this._isNoteOn(kickPrefix + id) : false;
    let note: AbcNote | null = null;
    if (splashOn && kickOn) note = AbcNote.KI_SANDK;
    else if (splashOn) note = AbcNote.KI_SPLASH;
    else if (kickOn) note = AbcNote.KI_NORMAL;
    const result = {
      abc: note ? this._abcFor(note) as string : false,
      url: note ? note.getFirstTabChar() : '-'
    };
    if (returnType === 'ABC') return result.abc;
    if (returnType === 'URL') return result.url;
    return result;
  }

  get_tom_state(id: number | string, tom_num: number): { abc: string | false, url: string } {
    const note = tom_num === 1 ? AbcNote.T1_NORMAL : AbcNote.T4_NORMAL;
    const prefix = note.getFirstHtmlIdPrefix();
    if (prefix && this._isNoteOn(prefix + id)) {
      return { abc: this._abcFor(note) as string, url: note.getFirstTabChar() };
    }
    return { abc: false, url: '-' };
  }

  get_sticking_state(id: number | string, returnType?: string): any {
    for (const note of AbcNote.STICKINGS_ALL) {
      const prefix = note.getFirstHtmlIdPrefix();
      if (prefix && this._isNoteOn(prefix + id)) {
        const result = { abc: this._abcFor(note) as string, url: note.getFirstTabChar() };
        if (returnType === 'ABC') return result.abc;
        if (returnType === 'URL') return result.url;
        return result;
      }
    }
    const result = { abc: false, url: '-' };
    if (returnType === 'ABC') return result.abc;
    if (returnType === 'URL') return result.url;
    return result;
  }

  // Helpers: check if a drum is currently on (based on rendered UI state).
  is_hh_on(id: number | string): boolean {
    return this.get_hh_state(id).abc !== false;
  }
  is_snare_on(id: number | string): boolean {
    return this.get_snare_state(id).abc !== false;
  }
  is_kick_on(id: number | string): boolean {
    const state = this.get_kick_state(id);
    return state.abc !== false;
  }
  is_tom_on(id: number | string, tom_num: number): boolean {
    return this.get_tom_state(id, tom_num).abc !== false;
  }

  // Setters: mode-string based wrappers around setDrumNote.
  // Preserved for compatibility with pre-refactor code paths.
  private _hhModeToNote(mode: string): AbcNote {
    switch (mode) {
      case 'normal': return AbcNote.HH_NORMAL;
      case 'accent': return AbcNote.HH_ACCENT;
      case 'open': return AbcNote.HH_OPEN;
      case 'close': return AbcNote.HH_CLOSE;
      case 'ride': return AbcNote.HH_RIDE;
      case 'ride_bell': return AbcNote.HH_RIDE_BELl;
      case 'cow_bell': return AbcNote.HH_COW_BELL;
      case 'crash': return AbcNote.HH_CRASH;
      case 'stacker': return AbcNote.HH_STACKER;
      case 'metronome_normal': return AbcNote.HH_METRONOME_NORMAL;
      case 'metronome_accent': return AbcNote.HH_METRONOME_ACCENT;
      case 'off': default: return AbcNote.OFF;
    }
  }
  private _snareModeToNote(mode: string): AbcNote {
    switch (mode) {
      case 'normal': return AbcNote.SN_NORMAL;
      case 'accent': return AbcNote.SN_ACCENT;
      case 'ghost': return AbcNote.SN_GHOST;
      case 'xstick': return AbcNote.SN_XSTICK;
      case 'buzz': return AbcNote.SN_BUZZ;
      case 'flam': return AbcNote.SN_FLAM;
      case 'drag': return AbcNote.SN_DRAG;
      case 'off': default: return AbcNote.OFF;
    }
  }
  private _kickModeToNote(mode: string): AbcNote {
    switch (mode) {
      case 'normal': return AbcNote.KI_NORMAL;
      case 'splash': return AbcNote.KI_SPLASH;
      case 'kick_and_splash': return AbcNote.KI_SANDK;
      case 'off': default: return AbcNote.OFF;
    }
  }
  private _stickingModeToNote(mode: string): AbcNote {
    switch (mode) {
      case 'right': return AbcNote.STICK_R;
      case 'left': return AbcNote.STICK_L;
      case 'both': return AbcNote.STICK_BOTH;
      case 'count': return AbcNote.STICK_COUNT;
      case 'off': default: return AbcNote.STICK_OFF;
    }
  }

  set_hh_state(id: number | string, mode: string, makeSound: boolean = false): void {
    const note = this._hhModeToNote(mode);
    this.setDrumNote(Number(id), note, makeSound, DrumType.HIHAT);
  }
  set_snare_state(id: number | string, mode: string, makeSound: boolean = false): void {
    const note = this._snareModeToNote(mode);
    this.setDrumNote(Number(id), note, makeSound, DrumType.SNARE);
  }
  set_kick_state(id: number | string, mode: string, makeSound: boolean = false): void {
    const note = this._kickModeToNote(mode);
    this.setDrumNote(Number(id), note, makeSound, DrumType.KICK);
  }
  set_tom_state(id: number | string, tom_num: number, mode: string, makeSound: boolean = false): void {
    const drumType = tom_num === 1 ? DrumType.TOM1 : DrumType.TOM4;
    let note: AbcNote;
    if (mode === 'normal') {
      note = tom_num === 1 ? AbcNote.T1_NORMAL : AbcNote.T4_NORMAL;
    } else {
      note = AbcNote.OFF;
    }
    this.setDrumNote(Number(id), note, makeSound, drumType);
  }
  set_tom1_state(id: number | string, mode: string, makeSound: boolean = false): void {
    this.set_tom_state(id, 1, mode, makeSound);
  }
  set_tom4_state(id: number | string, mode: string, makeSound: boolean = false): void {
    this.set_tom_state(id, 4, mode, makeSound);
  }
  set_sticking_state(id: number | string, mode: string, makeSound: boolean = false): void {
    const note = this._stickingModeToNote(mode);
    // Passing STICK_OFF makes the "off" mode preserve drumType via the enum, while other modes carry their own drumType.
    const noteToSet = note === AbcNote.STICK_OFF ? AbcNote.OFF : note;
    this.setDrumNote(Number(id), noteToSet, makeSound, DrumType.STICKINGS);
  }

  // create a new instance of an array with all the values prefilled with false
  // the array size is 32nd notes for the current time signature
  // 4/4 would be 32 notes
  // 5/4 would be 40 notes
  // 2/4 would be 16 notes
  // 4/2 would be 32 notes
  get_empty_note_array_in_32nds(): Array<string | null> {
    const notesPer4Beats = this.usingTriplets() ? 48 : 32;
    const num_notes = (this.data.timeSig.top * notesPer4Beats) / this.data.timeSig.bottom.value;
    return new Array(num_notes).fill(null);
  }


  get_kick16th_permutation_array(section: number) {
    if (this.usingTriplets()) {
      return this.get_kick16th_triplets_permutation_array(section);
    }

    return this.get_kick16th_strait_permutation_array(section);
  }

  get_kick16th_permutation_array_minus_some(section) {
    if (this.usingTriplets()) {
      // triplets never skip any: delegate
      return this.get_kick16th_permutation_array(section);
    }

    return this.get_kick16th_minus_some_strait_permutation_array(section);
  }

  // snare permutation
  get_snare_permutation_array(section) {
    // its the same as the 16th kick permutation, but with different notes
    var snare_array = this.get_kick16th_permutation_array(section);
    // turn the kicks into snares
    for (var i = 0; i < snare_array.length; i++) {
      if (snare_array[i] !== false)
        snare_array[i] = AbcNote.SN_NORMAL.getFirstTabChar();
    }
    return snare_array;
  }

  // Snare permutation, with Accented permutation.   Snare hits every 16th note, accent moves
  get_snare_accent_permutation_array(section) {

    // its the same as the 16th kick permutation, but with different notes
    var snare_array = this.get_kick16th_permutation_array(section);

    if (section > 0) { // Don't convert notes for the first measure since it is the ostinado
      for (var i = 0; i < snare_array.length; i++) {
        if (snare_array[i] !== false)
          snare_array[i] = AbcNote.SN_ACCENT.getFirstTabChar();
        else if ((i % 2) === 0) // all other even notes are ghosted snares
          snare_array[i] = AbcNote.SN_GHOST.getFirstTabChar();
      }
    }
    return snare_array;
  }

  // Snare permutation, with Accented and diddled permutation.   Accented notes are singles, non accents are diddled
  get_snare_accent_with_diddle_permutation_array(section) {

    // its the same as the 16th kick permutation, but with different notes
    var snare_array = this.get_kick16th_permutation_array(section);

    if (section > 0) { // Don't convert notes for the first measure since it is the ostinado
      for (var i = 0; i < snare_array.length; i++) {
        if (snare_array[i] !== false) {
          snare_array[i] = AbcNote.SN_BUZZ.getFirstTabChar();
          i++; // the next one is not diddled  (leave it false)
        } else { // all other even notes are diddled, which means 32nd notes
          snare_array[i] = AbcNote.SN_GHOST.getFirstTabChar();
        }
      }
    }

    return snare_array;
  }

  get_numSectionsFor_permutation_array() {
    var numSections = 16;

    /*)
    if(usingTriplets()) {
    numSections = 8;
    } else {
    numSections = 16;
    }
     */

    return numSections;
  }

  // use the Permutation options to figure out if we should display a particular section
  shouldDisplayPermutationForSection(sectionNum) {
    var ret_val = false;

    switch (sectionNum) {
      case 0:
        if (((document.getElementById("PermuationOptionsOstinato") as HTMLInputElement) as HTMLInputElement).checked &&
          (!document.getElementById("PermuationOptionsOstinato_sub1") ||
            ((document.getElementById("PermuationOptionsOstinato_sub1") as HTMLInputElement) as HTMLInputElement).checked))
          ret_val = true;
        break;
      case 1:
        if (((document.getElementById("PermuationOptionsSingles") as HTMLInputElement) as HTMLInputElement).checked &&
          ((document.getElementById("PermuationOptionsSingles_sub1") as HTMLInputElement) as HTMLInputElement).checked)
          ret_val = true;
        break;
      case 2:
        if (((document.getElementById("PermuationOptionsSingles") as HTMLInputElement) as HTMLInputElement).checked &&
          ((document.getElementById("PermuationOptionsSingles_sub2") as HTMLInputElement) as HTMLInputElement).checked)
          ret_val = true;
        break;
      case 3:
        if (((document.getElementById("PermuationOptionsSingles") as HTMLInputElement) as HTMLInputElement).checked &&
          ((document.getElementById("PermuationOptionsSingles_sub3") as HTMLInputElement) as HTMLInputElement).checked)
          ret_val = true;
        break;
      case 4:
        if (!this.usingTriplets() &&
          ((document.getElementById("PermuationOptionsSingles") as HTMLInputElement) as HTMLInputElement).checked &&
          ((document.getElementById("PermuationOptionsSingles_sub4") as HTMLInputElement) as HTMLInputElement).checked)
          ret_val = true;
        break;
      case 5:
        if (((document.getElementById("PermuationOptionsDoubles") as HTMLInputElement) as HTMLInputElement).checked &&
          ((document.getElementById("PermuationOptionsDoubles_sub1") as HTMLInputElement) as HTMLInputElement).checked)
          ret_val = true;
        break;
      case 6:
        if (((document.getElementById("PermuationOptionsDoubles") as HTMLInputElement) as HTMLInputElement).checked &&
          ((document.getElementById("PermuationOptionsDoubles_sub2") as HTMLInputElement) as HTMLInputElement).checked)
          ret_val = true;
        break;
      case 7:
        if (((document.getElementById("PermuationOptionsDoubles") as HTMLInputElement) as HTMLInputElement).checked &&
          ((document.getElementById("PermuationOptionsDoubles_sub3") as HTMLInputElement) as HTMLInputElement).checked)
          ret_val = true;
        break;
      case 8:
        if (!this.usingTriplets() &&
          ((document.getElementById("PermuationOptionsDoubles") as HTMLInputElement) as HTMLInputElement).checked &&
          ((document.getElementById("PermuationOptionsDoubles_sub4") as HTMLInputElement) as HTMLInputElement).checked)
          ret_val = true;
        break;
      case 9:
        if (!this.usingTriplets() &&
          ((document.getElementById("PermuationOptionsUpsDowns") as HTMLInputElement) as HTMLInputElement).checked &&
          ((document.getElementById("PermuationOptionsUpsDowns_sub1") as HTMLInputElement) as HTMLInputElement).checked)
          ret_val = true;
        break;
      case 10:
        if (!this.usingTriplets() &&
          ((document.getElementById("PermuationOptionsUpsDowns") as HTMLInputElement) as HTMLInputElement).checked &&
          ((document.getElementById("PermuationOptionsUpsDowns_sub2") as HTMLInputElement) as HTMLInputElement).checked)
          ret_val = true;
        break;
      case 11:
        if (((document.getElementById("PermuationOptionsTriples") as HTMLInputElement) as HTMLInputElement).checked &&
          (!document.getElementById("PermuationSubOptionsTriples1") ||
            ((document.getElementById("PermuationOptionsTriples_sub1") as HTMLInputElement) as HTMLInputElement).checked))
          ret_val = true;
        break;
      case 12:
        if (!this.usingTriplets() &&
          ((document.getElementById("PermuationOptionsTriples") as HTMLInputElement) as HTMLInputElement).checked &&
          ((document.getElementById("PermuationOptionsTriples_sub2") as HTMLInputElement) as HTMLInputElement).checked)
          ret_val = true;
        break;
      case 13:
        if (!this.usingTriplets() &&
          ((document.getElementById("PermuationOptionsTriples") as HTMLInputElement) as HTMLInputElement).checked &&
          ((document.getElementById("PermuationOptionsTriples_sub3") as HTMLInputElement) as HTMLInputElement).checked)
          ret_val = true;
        break;
      case 14:
        if (!this.usingTriplets() &&
          (document.getElementById("PermuationOptionsTriples") as HTMLInputElement).checked &&
          (document.getElementById("PermuationOptionsTriples_sub4") as HTMLInputElement).checked)
          ret_val = true;
        break;
      case 15:
        if (!this.usingTriplets() &&
          (document.getElementById("PermuationOptionsQuads") as HTMLInputElement).checked &&
          (!document.getElementById("PermuationOptionsQuads_sub1") ||
            (document.getElementById("PermuationOptionsQuads_sub1") as HTMLInputElement).checked))
          ret_val = true;
        break;
      default:
        console.log("bad case in groove_writer.js:shouldDisplayPermutationForSection()");
        return false;
      //break;
    }

    return ret_val;
  }

  // use the permutation options to count the number of active permutation sections
  get_numberOfActivePermutationSections() {
    var max_num = this.get_numSectionsFor_permutation_array();
    var total_on = 0;

    for (var i = 0; i < max_num; i++) {
      if (this.shouldDisplayPermutationForSection(i))
        total_on++;
    }

    return total_on;
  }

  // query the clickable UI and generate a 32 element array representing the notes of one measure
  // note: the ui may have fewer notes, but we scale them to fit into the 32 elements proportionally
  // If using triplets returns 48 notes.   Otherwise always 32.
  //
  // (note: Only one measure, not all the notes on the page if multiple measures are present)
  // Return value is the number of notes.
  get32NoteArrayFromClickableUI(Sticking_Array, HH_Array, Snare_Array, Kick_Array, Toms_Array, startIndexForClickableUI) {

    var scaler = this.myGrooveUtils.getNoteScaler(this.data.notesPerMeasure, this.data.timeSig); // fill proportionally

    // fill in the arrays from the clickable UI
    for (var i = 0; i < this.data.notesPerMeasure; i++) {
      var array_index = (i) * scaler;

      // only grab the stickings if they are visible
      if (this.isStickingsVisible())
        Sticking_Array[array_index] = this.get_sticking_state(i + startIndexForClickableUI).abc;

      HH_Array[array_index] = this.get_hh_state(i + startIndexForClickableUI).abc;

      if (this.isTomsVisible()) {
        Toms_Array[0][array_index] = this.get_tom_state(i + startIndexForClickableUI, 1).abc;
        Toms_Array[3][array_index] = this.get_tom_state(i + startIndexForClickableUI, 4).abc;
      }

      Snare_Array[array_index] = this.get_snare_state(i + startIndexForClickableUI).abc;

      Kick_Array[array_index] = this.get_kick_state(i + startIndexForClickableUI).abc;
    }

    var num_notes = Snare_Array.length;
    return num_notes;
  }

  // each of the instruments can be muted.   Check the UI and zero out the array if the instrument is marked as muted
  // for a particular measure
  muteArrayFromClickableUI(Sticking_Array, HH_Array, Snare_Array, Kick_Array, Toms_Array, measureIndex) {
    if (this.isInstrumentMuted("hh", measureIndex + 1))
      HH_Array.fill(false);
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
    var new_kick_array = [];

    for (var i in old_kick_array) {
      if (old_kick_array[i] == constant_ABC_KI_Splash ||
        old_kick_array[i] == constant_ABC_KI_SandK)
        new_kick_array.push(constant_ABC_KI_Splash);
      else
        new_kick_array.push(false);
    }

    return new_kick_array;
  }

  // merge 2 kick arrays
  //  4 possible states
  //  false   (off)
  //  constant_ABC_KI_Normal
  //  constant_ABC_KI_SandK
  //  constant_ABC_KI_Splash
  merge_kick_arrays(primary_kick_array, secondary_kick_array) {
    var new_kick_array = [];

    for (var i in primary_kick_array) {

      switch (primary_kick_array[i]) {
        case false:
          new_kick_array.push(secondary_kick_array[i]);
          break;

        case constant_ABC_KI_SandK:
          new_kick_array.push(constant_ABC_KI_SandK);
          break;

        case constant_ABC_KI_Normal:
          if (secondary_kick_array[i] == constant_ABC_KI_SandK ||
            secondary_kick_array[i] == constant_ABC_KI_Splash)
            new_kick_array.push(constant_ABC_KI_SandK);
          else
            new_kick_array.push(constant_ABC_KI_Normal);
          break;

        case constant_ABC_KI_Splash:
          if (secondary_kick_array[i] == constant_ABC_KI_Normal ||
            secondary_kick_array[i] == constant_ABC_KI_SandK)
            new_kick_array.push(constant_ABC_KI_SandK);
          else
            new_kick_array.push(constant_ABC_KI_Splash);
          break;

        default:
          console.log("bad case in merge_kick_arrays()");
          new_kick_array.push(primary_kick_array[i]);
          break;
      }
    }

    return new_kick_array;
  }

  createMidiUrlFromClickableUI(MIDI_type) {
    var Sticking_Array = this.get_empty_note_array_in_32nds();
    var HH_Array = this.get_empty_note_array_in_32nds();
    var Snare_Array = this.get_empty_note_array_in_32nds();
    var Kick_Array = this.get_empty_note_array_in_32nds();
    var Toms_Array = [this.get_empty_note_array_in_32nds(), this.get_empty_note_array_in_32nds(), this.get_empty_note_array_in_32nds(), this.get_empty_note_array_in_32nds()];

    var i,
      new_snare_array,
      num_notes_for_swing = 16;

    var metronomeFrequency = this.getMetronomeFrequency();

    // just the first measure
    var num_notes = this.get32NoteArrayFromClickableUI(Sticking_Array, HH_Array, Snare_Array, Kick_Array, Toms_Array, 0);
    this.muteArrayFromClickableUI(Sticking_Array, HH_Array, Snare_Array, Kick_Array, Toms_Array, 0);

    var midiFile = new Midi.File();
    var midiTrack = new Midi.Track();
    midiFile.addTrack(midiTrack);

    midiTrack.setTempo(this.myGrooveUtils.getTempo());
    midiTrack.setInstrument(0, 0x13);

    var swing_percentage = this.myGrooveUtils.getSwing() / 100;

    // all of the permutations use just the first measure
    switch (this.class_permutation_type) {
      case "kick_16ths":
        var numSections = this.get_numSectionsFor_permutation_array();

        // compute sections with different kick patterns
        for (i = 0; i < numSections; i++) {

          if (this.shouldDisplayPermutationForSection(i)) {
            var new_kick_array;

            if ((document.getElementById("PermuationOptionsSkipSomeFirstNotes") && document.getElementById("PermuationOptionsSkipSomeFirstNotes") as HTMLInputElement).checked)
              new_kick_array = this.get_kick16th_permutation_array_minus_some(i);
            else
              new_kick_array = this.get_kick16th_permutation_array(i);

            // grab hi-hat foots from existing kick array and merge it in.
            Kick_Array = this.filter_kick_array_for_permutation(Kick_Array);
            new_kick_array = this.merge_kick_arrays(new_kick_array, Kick_Array);

            this.myGrooveUtils.MIDI_from_HH_Snare_Kick_Arrays(midiTrack, HH_Array, Snare_Array, new_kick_array, Toms_Array, MIDI_type, metronomeFrequency, num_notes, num_notes_for_swing, swing_percentage, this.data.timeSig);
          }
        }
        break;

      case "snare_16ths": // use the hh & snare from the user
        numSections = this.get_numSectionsFor_permutation_array();

        //compute sections with different snare patterns
        for (i = 0; i < numSections; i++) {
          if (this.shouldDisplayPermutationForSection(i)) {

            if ((document.getElementById("PermuationOptionsAccentGridDiddled") && document.getElementById("PermuationOptionsAccentGridDiddled") as HTMLInputElement).checked)
              new_snare_array = this.get_snare_accent_with_diddle_permutation_array(i);
            else if ((document.getElementById("PermuationOptionsAccentGrid") && document.getElementById("PermuationOptionsAccentGrid") as HTMLInputElement).checked)
              new_snare_array = this.get_snare_accent_permutation_array(i);
            else
              new_snare_array = this.get_snare_permutation_array(i);


            this.myGrooveUtils.MIDI_from_HH_Snare_Kick_Arrays(midiTrack, HH_Array, new_snare_array, Kick_Array, Toms_Array, MIDI_type, metronomeFrequency, num_notes, num_notes_for_swing, swing_percentage, this.data.timeSig);
          }
        }
        break;

      case "none":
      /* falls through */
      default:
        if (this.data.subdivision.value < 16)
          num_notes_for_swing = 8 * this.data.timeSig.top / this.data.timeSig.bottom.value;
        else
          num_notes_for_swing = 16 * this.data.timeSig.top / this.data.timeSig.bottom.value;

        this.myGrooveUtils.MIDI_from_HH_Snare_Kick_Arrays(midiTrack, HH_Array, Snare_Array, Kick_Array, Toms_Array, MIDI_type, metronomeFrequency, num_notes, num_notes_for_swing, swing_percentage, this.data.timeSig);

        for (i = 1; i < this.data.numberOfMeasures; i++) {
          // reset arrays
          Sticking_Array = this.get_empty_note_array_in_32nds();
          HH_Array = this.get_empty_note_array_in_32nds();
          Snare_Array = this.get_empty_note_array_in_32nds();
          Kick_Array = this.get_empty_note_array_in_32nds();
          Toms_Array = [this.get_empty_note_array_in_32nds(), this.get_empty_note_array_in_32nds(), this.get_empty_note_array_in_32nds(), this.get_empty_note_array_in_32nds()];


          // get another measure
          this.get32NoteArrayFromClickableUI(Sticking_Array, HH_Array, Snare_Array, Kick_Array, Toms_Array, this.data.notesPerMeasure * i);
          this.muteArrayFromClickableUI(Sticking_Array, HH_Array, Snare_Array, Kick_Array, Toms_Array, i);

          this.myGrooveUtils.MIDI_from_HH_Snare_Kick_Arrays(midiTrack, HH_Array, Snare_Array, Kick_Array, Toms_Array, MIDI_type, metronomeFrequency, num_notes, num_notes_for_swing, swing_percentage, this.data.timeSig);
        }
        break;
    }

    var midi_url = "data:audio/midi;base64," + btoa(midiFile.toBytes());

    return midi_url;
  }

  MIDISaveAs() {
    var midi_url = this.createMidiUrlFromClickableUI("general_MIDI");
    // save as
    document.location = midi_url;
  };

  // creates a grooveData class from the clickable UI elements of the page
  //
  grooveDataFromClickableUI() {
    // var myGrooveData = new this.myGrooveUtils.grooveDataNew();
    this.data.fromUrl(window.location.search);

    // this.data.notesPerMeasure = this.data.notesPerMeasure;
    // this.data.timeDivision = class_subDivision;
    // this.data.timeSig = this.data.timeSig;
    // this.data.showStickings = isStickingsVisible();
    // this.data.showToms = isTomsVisible();
    // this.data.title = document.getElementById("tuneTitle").value;
    // this.data.author = document.getElementById("tuneAuthor").value;
    // this.data.comments = document.getElementById("tuneComments").value;
    // this.data.swingPercent = this.myGrooveUtils.getSwing();
    // this.data.tempo = this.myGrooveUtils.getTempo();
    // this.data.metronomeFrequency = this.getMetronomeFrequency();
    // this.data.kickStemsUp = true;

    // for (var i = 0; i < this.data.numberOfMeasures; i++) {
    //   var total_notes = this.data.notesPerMeasure * this.data.numberOfMeasures;
    //   myGrooveData.sticking_array = [];
    //   myGrooveData.hh_array = [];
    //   myGrooveData.snare_array = [];
    //   myGrooveData.kick_array = [];
    //   myGrooveData.toms_array = [[], [], [], []];

    //   // query the clickable UI and generate a arrays representing the notes of all measures
    //   for (var i = 0; i < total_notes; i++) {

    //     // only grab the stickings if they are visible
    //     if (isStickingsVisible())
    //       myGrooveData.sticking_array.push(get_sticking_state(i, "ABC"));

    //     myGrooveData.hh_array.push(get_hh_state(i, "ABC"));
    //     myGrooveData.snare_array.push(get_snare_state(i, "ABC"));
    //     myGrooveData.kick_array.push(get_kick_state(i, "ABC"));

    //     if (isTomsVisible()) {
    //       myGrooveData.toms_array[0].push(get_tom_state(i, 1, "ABC"));
    //       myGrooveData.toms_array[3].push(get_tom_state(i, 4, "ABC"));
    //     } else {
    //       myGrooveData.toms_array[0].push(false);
    //       myGrooveData.toms_array[3].push(false);
    //     }
    //   }
    // }

    // return myGrooveData;
  };

  // called by the HTML when changes happen to forms that require the ABC to update
  refresh_ABC() {
    this.updateSheetMusic();
  }

  // Want to create something like this:
  //
  // {{GrooveTab
  // |HasTempo=90
  // |HasSwingPercent=0
  // |HasDivision=16
  // |HasMeasures=2
  // |HasNotesPerMeasure=32
  // |HasTimeSignature=4/4
  // |HasHiHatTab=x---o---+---x---x---o---+---x---x---o---+---x---x---o---+---x---
  // |HasSnareAccentTab=--------O-------------------O-----------O---------------O-------
  // |HasSnareOtherTab=--------------g-------------------g-----------g-----------------
  // |HasKickTab=o---------------o---o---------------o-----------o---o---------o-
  // |HasFootOtherTab=----------------------------------------------------------------
  // |HasTom1Tab=--------------------------------------------------------o-------
  // |HasTom4Tab=----------------o---------------------------------------o-------
  // |HasEditData=?GDB_Author=1&TimeSig=4/4&Div=32&Tempo=80&Measures=2&H=|--x-----x---x-------------------|--x-----x---x-------------------|&S=|----g-----g-------------ooo-o-o-|----g-----g-----------------gggg|&K=|o-----x-------o-o---------------|o-----x-------o-o---------------|&T1=|--------------------------------|------------------------x-------|&T4=|----------------x---------------|------------------------x-------|
  // }}
  //

  undoCommand() {
    if (this.class_undo_stack.length > 1) {
      var undoURL = this.class_undo_stack.pop();
      this.AddItemToUndoOrRedoStack(undoURL, this.class_redo_stack); // add to redo stack
      // the one we want to load is behind the head, since all changes go on the undo stack immediately
      // no need to pop, since it would just get added right back on anyways
      undoURL = this.class_undo_stack[this.class_undo_stack.length - 1];
      this.set_Default_notes(undoURL);
    }
  };

  redoCommand() {
    if (this.class_redo_stack.length > 0) {
      var redoURL = this.class_redo_stack.pop();
      this.AddItemToUndoOrRedoStack(redoURL, this.class_undo_stack); // add to undo stack
      this.set_Default_notes(redoURL);
    }
  };

  // push the new URL on the undo or redo stack
  // keep the stacks at a managable size
  AddItemToUndoOrRedoStack(newURL: string, ourStack: Array<string>, noClear: boolean = false): boolean {
    if (!ourStack)
      return false;
    if (newURL === this.class_undo_stack[this.class_undo_stack.length - 1]) {
      return false; // no change, so don't push
    }
    ourStack.push(newURL);
    while (ourStack.length > UNDO_STACK_MAX_SIZE)
      ourStack.shift();
    return true;
  };

  AddFullURLToUndoStack(fullURL: string) {
    var urlFragment;
    var searchData = fullURL.indexOf("?");
    urlFragment = fullURL.slice(searchData);
    // clear redo array whenever we add a new valid element to the stack
    // when we undo, we end up with a null push that returns false here
    if (this.AddItemToUndoOrRedoStack(urlFragment, this.class_undo_stack)) {
      this.class_redo_stack = [];
    }
  };

  // update the current URL so that reloads and history traversal and link shares and bookmarks work correctly
  updateCurrentURL() {
    var newURL = this.get_FullURLForPage();
    var newTitle = "";

    this.AddFullURLToUndoStack(newURL);

    var title = (document.getElementById("tuneTitle") as HTMLInputElement).value.trim();
    if (title !== "")
      newTitle = title;

    var author = (document.getElementById("tuneAuthor") as HTMLInputElement).value.trim();
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

  generate_ABC(renderWidth: number) {
    return this.data.getAbcHeader(this.class_permutation_type != 'none', renderWidth)
      + this.data.getAbcNotation();
  }

  // this is called by a bunch of places anytime we modify the musical notes on the page
  // this will recreate the ABC code and will then use the ABC to rerender the sheet music
  // on the page.
  updateSheetMusic() {
    var renderWidth = 600;
    var svgTarget = document.getElementById("svgTarget");
    if (svgTarget) {
      renderWidth = svgTarget.offsetWidth - 100;
      renderWidth = Math.floor(renderWidth * 0.8);  // reduce width by 20% (This actually makes the notes bigger, because we scale up everything to max width)
    }

    var fullABC = this.generate_ABC(renderWidth);
    (document.getElementById("ABCsource") as HTMLInputElement).value = fullABC;
    // this.updateGrooveDBSource();

    // update the current URL so that reloads and history traversal and link shares and bookmarks work correctly
    this.updateCurrentURL();
    this.displayNewSVG();

    this.myGrooveUtils.midiNoteHasChanged(); // pretty likely the case
  }

  // called by generate_ABC to remake the sheet music on the page
  displayNewSVG() {
    var svgTarget = document.getElementById("svgTarget"),
      diverr = document.getElementById("diverr");

    var abc_source = (document.getElementById("ABCsource") as HTMLInputElement).value;
    var svg_return = this.myGrooveUtils.renderABCtoSVG(abc_source);

    diverr.innerHTML = svg_return.error_html;
    svgTarget.innerHTML = svg_return.svg;
  }

  // Render an SVG that is good for download.
  // Constant size at 2000x200
  downloadImages(imageType) {
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

  PNGSaveAs() {
    Pablo.support.image.png(function (acceptable) {
      if (acceptable) {
        this.downloadImages('png');
      } else {
        alert("Sorry, this browser can't export PNG images");
      }
    });
  }

  SVGSaveAs() {
    this.downloadImages('svg');
  }

  ShowHideABCResults() {
    var ABCResults = document.getElementById("ABC_Results");

    if (ABCResults.style.display == "block")
      ABCResults.style.display = "none";
    else
      ABCResults.style.display = "block";

    return false; // don't follow the link
  }

  updateUrl() {
    this.updateCurrentURL();
  }

  // remove a measure from the page
  // measureNum is indexed starting at 1, not 0
  closeMeasureButtonClick(measureNum: number) {
    // var uiStickings = "";
    // var uiHH = "";
    // var uiTom1 = "";
    // var uiTom4 = "";
    // var uiSnare = "";
    // var uiKick = "";

    // // get the encoded notes out of the UI.
    // // run through all the measure, but don't include the one that we are deleting
    // var topIndex = this.data.notesPerMeasure * this.data.numberOfMeasures;
    // for (var i = 0; i < topIndex; i++) {
    //   // skip the range we are deleting
    //   if (i < (measureNum - 1) * this.data.notesPerMeasure || i >= measureNum * this.data.notesPerMeasure) {
    //     uiStickings += get_sticking_state(i.toString()).url;
    //     uiHH += get_hh_state(i.toString())?.getFirstTabChar() || '-';
    //     uiTom1 += get_tom_state(i.toString(), 1).url;
    //     uiTom4 += get_tom_state(i.toString(), 4).url;
    //     uiSnare += get_snare_state(i.toString()).url;
    //     uiKick += get_kick_state(i.toString()).url;
    //   }
    // }

    // this.data.numberOfMeasures--;
    this.data.measures.splice(measureNum, 1);
    this.updateUrl();
    this.updateSheetMusic();
    // this.expandAuthoringViewWhenNecessary(this.data.notesPerMeasure, this.data.numberOfMeasures);
    // changeDivisionWithNotes(class_subDivision, uiStickings, uiHH, uiTom1, uiTom4, uiSnare, uiKick);
  };

  // add a measure to the page
  // currently always at the end of the measures
  // copy the notes from the last measure to the new measure
  addMeasureButtonClick = (event) => {
    // var uiStickings = "";
    // var uiHH = "";
    // var uiTom1 = "";
    // var uiTom4 = "";
    // var uiSnare = "";
    // var uiKick = "";
    // var i;

    // // get the encoded notes out of the UI.
    // var topIndex = this.data.notesPerMeasure * this.data.numberOfMeasures;
    // for (i = 0; i < topIndex; i++) {

    //   uiStickings += get_sticking_state(i, "URL");
    //   uiHH += get_hh_state(i, "URL");
    //   uiTom1 += get_tom_state(i, 1, "URL");
    //   uiTom4 += get_tom_state(i, 4, "URL");
    //   uiSnare += get_snare_state(i, "URL");
    //   uiKick += get_kick_state(i, "URL");
    // }

    // // run the the last measure twice to default in some notes
    // for (i = topIndex - this.data.notesPerMeasure; i < topIndex; i++) {
    //   uiStickings += get_sticking_state(i, "URL");
    //   uiHH += get_hh_state(i, "URL");
    //   uiTom1 += get_tom_state(i, 1, "URL");
    //   uiTom4 += get_tom_state(i, 4, "URL");
    //   uiSnare += get_snare_state(i, "URL");
    //   uiKick += get_kick_state(i, "URL");
    // }

    // this.data.numberOfMeasures++;

    // this.expandAuthoringViewWhenNecessary(this.data.notesPerMeasure, this.data.numberOfMeasures);

    // changeDivisionWithNotes(class_subDivision, uiStickings, uiHH, uiTom1, uiTom4, uiSnare, uiKick);

    // reference the button and scroll it into view
    var add_measure_button = document.getElementById("addMeasureButton");
    if (add_measure_button)
      add_measure_button.scrollIntoView({ block: "start", behavior: "smooth" });

    this.updateSheetMusic();

    if (this.data.numberOfMeasures >= 5)
      window.alert("Please be aware that the Groove Scribe is not designed to write an entire musical score.\n" +
        "You can create as many measures as you want, but your browser may slow down as more measures are added.\n" +
        "There are also many notation features that would be useful for score writing that are not part of Groove Scribe");
  };

  showHideCSS_ClassDisplay(className, force, showElseHide, showState): boolean {
    var myElements = document.querySelectorAll(className);
    var newStateIsOn = true;

    for (var i = 0; i < myElements.length; i++) {
      var element = myElements[i] as HTMLElement;

      if (force) {
        newStateIsOn = showElseHide;
      } else {
        // no-force means to swap on each call
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

  showHideCSS_ClassVisibility(className, force, showElseHide): boolean {
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
        // no-force means to swap on each call
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

  // clear all the notes on all measures
  clearAllNotes() {
    for (var i = 0; i < this.data.numberOfMeasures * this.data.notesPerMeasure; i++) {
      this.set_sticking_state(i, 'off');
      this.set_hh_state(i, 'off');
      this.set_tom1_state(i, 'off');
      this.set_tom4_state(i, 'off');
      this.set_snare_state(i, 'off');
      this.set_kick_state(i, 'off');
    }
    this.updateSheetMusic();
  }

  isTomsVisible() {
    var myElements = document.querySelectorAll(".toms-container");
    for (var i = 0; i < myElements.length; i++) {
      if ((myElements[i] as HTMLElement).style.visibility == "visible")
        return true;
    }

    return false;
  }

  showHideToms(force, showElseHide, dontRefreshScreen) {
    const OnElseOff = this.showHideCSS_ClassVisibility(".toms-container", force, showElseHide);
    this.showHideCSS_ClassVisibility(".tom-label", force, showElseHide);
    if (OnElseOff)
      this.addClassById("showHideTomsButton", "ClickToHide", true);
    else
      this.addClassById("showHideTomsButton", "ClickToHide", false);

    if (!dontRefreshScreen)
      this.updateSheetMusic();

    return false; // don't follow the link
  };

  isStickingsVisible() {
    var myElements = document.querySelectorAll(".stickings-container");
    for (var i = 0; i < myElements.length; i++) {
      if ((myElements[i] as HTMLElement).style.display == "block")
        return true;
    }
    return false;
  }

  stickingsShowHide(force, showElseHide, dontRefreshScreen) {
    var OnElseOff = this.showHideCSS_ClassDisplay(".stickings-container", force, showElseHide, "block");
    this.showHideCSS_ClassDisplay(".stickings-label", force, showElseHide, "block");
    if (OnElseOff) {
      this.addClassById("stickingsButton", "ClickToHide", true);
    } else {
      this.addClassById("stickingsButton", "ClickToHide", false);
    }

    if (!dontRefreshScreen) {
      this.updateSheetMusic();
    }

    return false; // don't follow the link
  };

  // if stickings are shown, hide them and vice versa
  stickingsShowHideToggle() {
    var stickingsAreCurrentlyShown = this.isStickingsVisible();
    this.stickingsShowHide(true, !stickingsAreCurrentlyShown, false);
  }

  // Swap Right and Left stickings if any are shown
  stickingsReverseRL() {
    for (var i = 0; i < this.data.numberOfMeasures * this.data.notesPerMeasure; i++) {
      var cur_state = this.get_sticking_state(i, "URL");
      if (cur_state === "R") {
        this.set_sticking_state(i, "left", false);
      } else if (cur_state === "L") {
        this.set_sticking_state(i, "right", false);
      }
    }
    this.updateSheetMusic();
  }

  printMusic() {
    var oldMethod = true;
    if ((this.browserInfo.browser == "Chrome" && this.browserInfo.platform == "windows")) {
      oldMethod = false;
    }

    if (oldMethod) {
      // css media queries wiil hide all but the music
      // force a print

      window.print();

    } else {
      // open a new window just for printing   (new method)
      var win = window.open("", this.class_app_title + " Print");
      win.document.body.innerHTML = "<title>" + this.class_app_title + "</title>\n<center>\n";
      win.document.body.innerHTML += document.getElementById("svgTarget").innerHTML;
      win.document.body.innerHTML += "\n</center>";
      win.print();
    }

  };

  setupWriterHotKeys() {
    document.addEventListener("keydown", (e) => {
      const target = e.target as HTMLInputElement;
      // only accept the event if it not going to an INPUT field   (allow for range types)
      if (target.type == "range" || (target.tagName.toUpperCase() != "INPUT" && target.tagName.toUpperCase() != "TEXTAREA")) {
        switch (e.which) {
          case 90: // ctrl-z
            if (e.ctrlKey) {
              // ctrl-z
              this.undoCommand();
              return false;
            }
            break;

          case 89: // ctrl-y
            if (e.ctrlKey) {
              // ctrl-y
              this.redoCommand();
              return false;
            }
            break;

          case 37: // left arrow
            // left arrow
            this.myGrooveUtils.downTempo();
            return false;
          //break;

          case 39: // right arrow
            // right arrow
            this.myGrooveUtils.upTempo();
            return false;
          //break;

          default:
            /* DEBUG
            else if(e.ctrlKey && e.which !=17 && e.target.type != "text") {
            alert("Key is: " + e.which);
            }
             */
            break;
        }
      }
      return true; // let the default handler deal with the keypress
    });
  }

  swapViewEditMode(dontUpdateURL) {
    var view_edit_button = document.getElementById("view-edit-switch");
    if (this.data.viewMode) {
      this.showHideCSS_ClassDisplay(".edit-block", true, true, "block"); // show
      if (view_edit_button)
        view_edit_button.innerHTML = "Switch to VIEW mode";
      this.data.viewMode = false;
      if (!dontUpdateURL)
        this.updateCurrentURL();
    } else {
      this.showHideCSS_ClassDisplay(".edit-block", true, false, "block"); // hide
      if (view_edit_button)
        view_edit_button.innerHTML = "Switch to EDIT mode";
      this.data.viewMode = true;
      if (!dontUpdateURL)
        this.updateCurrentURL();
    }
  };

  // public function.
  // This function initializes the data for the groove Scribe web page
  runsOnPageLoad() {
    this.setupWriterHotKeys(); // there are other hot keys in GrooveUtils for the midi player
    this.setupPermutationMenu();
    this.setTimeSigLabel();

    // set the background and text color of the current subdivision
    this.selectButton(document.getElementById("subdivision_" + this.data.notesPerMeasure + "ths"));

    // add html for the midi player
    this.myGrooveUtils.AddMidiPlayerToPage("midiPlayer", this.data.subdivision.value, undefined);

    // load the groove from the URL data if it was passed in.
    this.set_Default_notes(window.location.search);

    // if Mode != "view" put into edit mode  (we default to view mode to prevent screen flicker)
    if (!this.data.viewMode) {
      this.swapViewEditMode(true);
    }

    this.myGrooveUtils.midiEventCallbacks.loadMidiDataEvent = (playStarting) => {
      var midiURL;

      if (playStarting && this.class_metronome_count_in_active) {

        midiURL = this.myGrooveUtils.MIDI_build_midi_url_count_in_track(this.data.timeSig);
        this.myGrooveUtils.midiNoteHasChanged(); // this track is temporary
        this.class_metronome_count_in_is_playing = true;
      } else {
        if (this.class_metronome_count_in_is_playing) {
          // we saved the state above so that we could reset the Offset click start, otherwise it starts on the 'e'
          this.class_metronome_count_in_is_playing = false;
          this.myGrooveUtils.resetMetronomeOptionsOffsetClickStartRotation();
        }
        midiURL = this.createMidiUrlFromClickableUI("our_MIDI");
        this.myGrooveUtils.midiResetNoteHasChanged();
      }
      this.myGrooveUtils.loadMIDIFromURL(midiURL);
      // this.updateGrooveDBSource();
    };

    this.myGrooveUtils.midiEventCallbacks.notePlaying = (note_type, percent_complete) => {
      if (note_type == "complete" && this.class_metronome_auto_speed_up_active) {
        // reload with new tempo
        this.myGrooveUtils.midiNoteHasChanged();
        this.metronomeAutoSpeedUpTempoUpdate();
      }

      this.hilight_note(note_type, percent_complete);
    };

    this.myGrooveUtils.oneTimeInitializeMidi();

    // enable or disable swing
    this.myGrooveUtils.swingEnabled(this.myGrooveUtils.doesDivisionSupportSwing(this.data.notesPerMeasure));

    window.onresize = this.refresh_ABC;

    this.browserInfo = this.myGrooveUtils.getBrowserInfo();
    if (this.browserInfo.browser == "MSIE" && this.browserInfo.version < 10) {
      window.alert("This browser has been detected as: " + this.browserInfo.browser + " ver: " + this.browserInfo.version + ".\n" + 'This version of IE is unsupported.   Please use Chrome or Firefox instead');
    } else if (this.browserInfo.browser == "Safari" && this.browserInfo.platform == "windows" && this.browserInfo.version < 535) {
      window.alert("This browser has been detected as: " + this.browserInfo.browser + " ver: " + this.browserInfo.version + ".\n" + 'This version of Safari is unsupported.   Please use Chrome instead');
    }
    if (this.data.debugMode) {
      var debugOutput = document.getElementById("debugOutput");
      if (debugOutput) {
        debugOutput.innerHTML += "<div>This browser has been detected as: " + this.browserInfo.browser + " ver: " + this.browserInfo.version + ".<br>" + this.browserInfo.uastring + "<br>Running on: " + this.browserInfo.platform + "</div>";
      }
    }

    if (this.myGrooveUtils.is_touch_device()) {
      setTimeout(function () {
        window.scrollTo(0, 1);
      }, 1000);
    }

    // get updates when the tempo changes
    this.myGrooveUtils.tempoChangeCallback = this.tempoChangeCallback
  };

  // called right before the midi reloads for the next replay
  // set the new tempo based on the delta required for the time interval
  metronomeAutoSpeedUpTempoUpdate() {

    var totalTempoIncreaseAmount = 1;
    if (document.getElementById("metronomeAutoSpeedupTempoIncreaseAmount"))
      totalTempoIncreaseAmount = parseInt((document.getElementById("metronomeAutoSpeedupTempoIncreaseAmount") as HTMLInputElement).value, 10);
    var tempoIncreaseInterval = 60;
    if (document.getElementById("metronomeAutoSpeedupTempoIncreaseInterval")) {
      tempoIncreaseInterval = parseInt((document.getElementById("metronomeAutoSpeedupTempoIncreaseInterval") as HTMLInputElement).value, 10);
      tempoIncreaseInterval = tempoIncreaseInterval * 60; // turn mins to secs
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
        return; // don't increase any more after we have gone up the total amount
      }
    }
    var totalMidiPlayTime = this.myGrooveUtils.getMidiPlayTime();
    var timeDiffMilliseconds = totalMidiPlayTime.getTime() - this.class_our_last_midi_tempo_increase_time.getTime();
    var tempoDiffFloat = (totalTempoIncreaseAmount) * (timeDiffMilliseconds / (tempoIncreaseInterval * 1000));

    // round the number down, but keep track of the remainder so we carry it forward.   Otherwise
    // rounding errors cause us to be way off.
    tempoDiffFloat += this.class_our_last_midi_tempo_increase_remainder;
    var tempoDiffInt = Math.floor(tempoDiffFloat);
    this.class_our_last_midi_tempo_increase_remainder = tempoDiffFloat - tempoDiffInt;

    this.class_our_last_midi_tempo_increase_time = totalMidiPlayTime;

    if (!keepIncreasingForever) {
      if (curTempo + tempoDiffInt > this.class_our_midi_start_tempo + totalTempoIncreaseAmount) {
        // increase to the total max amount, then we are done
        tempoDiffInt = (this.class_our_midi_start_tempo + totalTempoIncreaseAmount) - curTempo;
      }
    }

    if (tempoDiffInt > 0)
      this.myGrooveUtils.setTempo(this.myGrooveUtils.getTempo() + tempoDiffInt);
  };

  setNotesFromABCArray(drumType, abcArray, numberOfMeasures) {
    // Set from this.data.measures to UI elements.

    // var setFunction;

    // // multiple measures of "how_many_notes"
    // var notesOnScreen = this.data.notesPerMeasure * numberOfMeasures;

    // var noteStringScaler = 1;
    // var displayScaler = 1;
    // if (abcArray.length > notesOnScreen && abcArray.length / notesOnScreen >= 2) {
    //   // if we encounter a 16th note groove for an 8th note board, let's scale it	down
    //   noteStringScaler = Math.ceil(abcArray.length / notesOnScreen);
    // } else if (abcArray.length < notesOnScreen && notesOnScreen / abcArray.length >= 2) {
    //   // if we encounter a 8th note groove for an 16th note board, let's scale it up
    //   displayScaler = Math.ceil(notesOnScreen / abcArray.length);
    // }

    // if (drumType == "Stickings") {
    //   setFunction = set_sticking_state;
    // } else if (drumType == "H") {
    //   setFunction = set_hh_state;
    // } else if (drumType == "T1") {
    //   setFunction = set_tom1_state;
    // } else if (drumType == "T4") {
    //   setFunction = set_tom4_state;
    // } else if (drumType == "S") {
    //   setFunction = set_snare_state;
    // } else if (drumType == "K") {
    //   setFunction = set_kick_state;
    // }

    // //  DisplayIndex is the index into the notes on the HTML page  starts at 1/32\n%%flatbeams
    // var displayIndex = 0;
    // var topDisplay = this.data.notesPerMeasure * this.data.numberOfMeasures;
    // for (var i = 0; i < abcArray.length && displayIndex < topDisplay; i += noteStringScaler, displayIndex += displayScaler) {

    //   switch (abcArray[i]) {
    //     case constant_ABC_STICK_R:
    //       setFunction(displayIndex, "right", false);
    //       break;
    //     case constant_ABC_STICK_L:
    //       setFunction(displayIndex, "left", false);
    //       break;
    //     case constant_ABC_STICK_BOTH:
    //       setFunction(displayIndex, "both", false);
    //       break;
    //     case constant_ABC_STICK_COUNT:
    //       setFunction(displayIndex, "count", false);
    //       break;
    //     case constant_ABC_STICK_OFF:
    //       setFunction(displayIndex, "off", false);
    //       break;
    //     case constant_ABC_HH_Ride:
    //       setFunction(displayIndex, "ride", false);
    //       break;
    //     case constant_ABC_HH_Ride_Bell:
    //       setFunction(displayIndex, "ride_bell", false);
    //       break;
    //     case constant_ABC_HH_Cow_Bell:
    //       setFunction(displayIndex, "cow_bell", false);
    //       break;
    //     case constant_ABC_HH_Crash:
    //       setFunction(displayIndex, "crash", false);
    //       break;
    //     case constant_ABC_HH_Stacker:
    //       setFunction(displayIndex, "stacker", false);
    //       break;
    //     case constant_ABC_HH_Metronome_Normal:
    //       setFunction(displayIndex, "metronome_normal", false);
    //       break;
    //     case constant_ABC_HH_Metronome_Accent:
    //       setFunction(displayIndex, "metronome_accent", false);
    //       break;
    //     case constant_ABC_HH_Open:
    //       setFunction(displayIndex, "open", false);
    //       break;
    //     case constant_ABC_HH_Close:
    //       setFunction(displayIndex, "close", false);
    //       break;
    //     case constant_ABC_HH_Accent:
    //       setFunction(displayIndex, "accent", false);
    //       break;
    //     case constant_ABC_HH_Normal:
    //       setFunction(displayIndex, "normal", false);
    //       break;
    //     case constant_ABC_T1_Normal:
    //       setFunction(displayIndex, "normal", false);
    //       break;
    //     case constant_ABC_T4_Normal:
    //       setFunction(displayIndex, "normal", false);
    //       break;
    //     case constant_ABC_SN_Ghost:
    //       setFunction(displayIndex, "ghost", false);
    //       break;
    //     case constant_ABC_SN_Accent:
    //       setFunction(displayIndex, "accent", false);
    //       break;
    //     case constant_ABC_SN_Normal:
    //       setFunction(displayIndex, "normal", false);
    //       break;
    //     case constant_ABC_SN_Flam:
    //       setFunction(displayIndex, "flam", false);
    //       break;
    //     case constant_ABC_SN_Drag:
    //       setFunction(displayIndex, "drag", false);
    //       break;
    //     case constant_ABC_SN_XStick:
    //       setFunction(displayIndex, "xstick", false);
    //       break;
    //     case constant_ABC_SN_Buzz:
    //       setFunction(displayIndex, "buzz", false);
    //       break;
    //     case constant_ABC_KI_SandK:
    //       setFunction(displayIndex, "kick_and_splash", false);
    //       break;
    //     case constant_ABC_KI_Splash:
    //       setFunction(displayIndex, "splash", false);
    //       break;
    //     case constant_ABC_KI_Normal:
    //       setFunction(displayIndex, "normal", false);
    //       break;
    //     case false:
    //       setFunction(displayIndex, "off", false);
    //       break;
    //     default:
    //       console.log("Bad note in setNotesFromABCArray: " + abcArray[i]);
    //       break;
    //   }
    // }
  }

  // get a really long URL that encodes all of the notes and the rest of the state of the page.
  // this will allow us to bookmark or reference a groove and handle undo/redo.
  //
  get_FullURLForPage(url_destination?) {
    var myGrooveData = this.grooveDataFromClickableUI()
    // return this.myGrooveUtils.getUrlStringFromGrooveData(myGrooveData, url_destination)
    return this.data.toUrl();
  }

  show_MetronomeAutoSpeedupConfiguration() {
    var popup = document.getElementById("metronomeAutoSpeedupConfiguration");

    if (popup) {
      popup.style.display = "block";
    }

    document.getElementById('metronomeAutoSpeedupTempoIncreaseAmountOutput').innerHTML = (document.getElementById('metronomeAutoSpeedupTempoIncreaseAmount') as HTMLInputElement).value;
    document.getElementById('metronomeAutoSpeedupTempoIncreaseIntervalOutput').innerHTML = (document.getElementById('metronomeAutoSpeedupTempoIncreaseInterval') as HTMLInputElement).value;
  }

  close_MetronomeAutoSpeedupConfiguration(type) {
    var popup = document.getElementById("metronomeAutoSpeedupConfiguration");

    if (popup)
      popup.style.display = "none";
  }

  timeSigPopupOpen(type) {
    var popup = document.getElementById("timeSigPopup");
    if (popup)
      popup.style.display = "block";
  }

  // turns on or off triplet 1/4 and 1/8 note selection based on the current time sig setting
  setTimeDivisionSelectionOnOrOff() {

    // check for incompatible odd time signature division  9/16 and 1/8 notes for instance
    if ((8 * this.data.timeSig.top / this.data.timeSig.bottom.value) % 1 != 0) {
      this.addClassById("subdivision_8ths", "disabled", true);
    } else {
      this.addClassById("subdivision_8ths", "disabled", false);
    }

    if (this.data.timeSig.bottom.value !== 4) {
      // triplets are too complicated right now outside of x/4 time.
      // disable them
      this.addClassById("subdivision_12ths", "disabled", true);
      this.addClassById("subdivision_24ths", "disabled", true);
      this.addClassById("subdivision_48ths", "disabled", true);

    } else {
      this.addClassById("subdivision_12ths", "disabled", false);
      this.addClassById("subdivision_24ths", "disabled", false);
      this.addClassById("subdivision_48ths", "disabled", false);
    }
  };


  setTimeSigLabel() {
    // turn on/off special features that are only available in 4/4 time
    // set the label
    document.getElementById("timeSigLabel").innerHTML = '<sup>' + this.data.timeSig.top + "</sup>/<sub>" + this.data.timeSig.bottom.value + "</sub>";
  }

  timeSigPopupClose(type, callback) {
    var popup = document.getElementById("timeSigPopup");

    if (popup)
      popup.style.display = "none";

    // ignore type "cancel"
    if (type == "ok") {
      var newTimeSigTop = parseInt((document.getElementById("timeSigPopupTimeSigTop") as HTMLInputElement).value);
      var newTimeSigBottom = parseInt((document.getElementById("timeSigPopupTimeSigBottom") as HTMLInputElement).value);

      if (this.usingTriplets() && newTimeSigBottom != 4) {
        this.changeDivision(Subdivision.SIXTEENTH);  // switch to a non triplet division since they are not supported in this time signature
      }

      this.data.timeSig = new TimeSignature(newTimeSigTop, Subdivision.of(newTimeSigBottom));
      var new_notes_per_measure = this.data.notesPerMeasure;
      // If new_notes_per_measure is greater it will cause the changeDivision code to error
      // as it tries to read the notes from the UI.   Setting it lower will allow the code to truncate
      // the groove properly to something smaller rather than interpolating the groove into something weird
      // if (new_notes_per_measure < this.data.notesPerMeasure)
      //   this.data.notesPerMeasure = new_notes_per_measure;
      this.changeDivision(this.data.subdivision);   // use this function because it will relayout everything
    }
    if (callback) {
      callback();
    }
  };

  updateRangeLabel(event, idToUpdate) {
    var element = document.getElementById(idToUpdate);

    if (element) {
      element.innerHTML = event.currentTarget.value;
    }
  };

  fillInFullURLInFullURLPopup() {
    (document.getElementById("embedCodeCheckbox") as HTMLInputElement).checked = false;  // uncheck embedCodeCheckbox
    (document.getElementById("shortenerCheckbox") as HTMLInputElement).checked = false;  // uncheck shortenerCheckbox

    var popup = document.getElementById("fullURLPopup");
    if (popup) {
      var fullURL = this.get_FullURLForPage();
      var textField = document.getElementById("fullURLPopupTextField") as HTMLInputElement;
      textField.value = fullURL;

      popup.style.display = "block";

      // select the URL for copy/paste
      textField.focus();
      textField.select();
    }
  }

  show_FullURLPopup = function () {
    var popup = document.getElementById("fullURLPopup");

    var ShareBut = new ShareButton({
      ui: {
        flyout: 'bottom center', // change the flyout direction of the shares. chose from `top left`, `top center`, `top right`, `bottom left`, `bottom right`, `bottom center`, `middle left`, or `middle right` [Default: `top center`]
        button_font: false, // include the Lato font set from the Google Fonts API. [Default: `true`]
        buttonText: 'SHARE', // change the text of the button, [Default: `Share`]
        icon_font: false,   // include the minified Entypo font set. [Default: `true`]
      },
      networks: {
        facebook: {
          before: function () {
            this.url = (document.getElementById("fullURLPopupTextField") as HTMLInputElement).value;
            this.description = "Check out this groove.";
          },
          //app_id : "839699029418014"    // staging id
          // app_id : "1499163983742002"   // MLDC id, lou created
          appId: "445510575651140",   // MLDC id, brad created
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

    // open the popup with full url and try to load short in the background
    this.fillInFullURLInFullURLPopup();
    // default is to use shortened url
    this.fillInShortenedURLInFullURLPopup(this.get_FullURLForPage(), 'fullURLPopupTextField');
  };

  copyShareURLToClipboard() {
    var copyText = document.getElementById("fullURLPopupTextField") as HTMLInputElement;

    copyText.select();
    // hack fix for mobile
    copyText.setSelectionRange(0, 99999);

    document.execCommand("copy");
  }

  close_FullURLPopup() {
    var popup = document.getElementById("fullURLPopup");

    if (popup)
      popup.style.display = "none";
  };

  fillInShortenedURLInFullURLPopup(fullURL, cssIdOfTextFieldToFill) {
    (document.getElementById("embedCodeCheckbox") as HTMLInputElement).checked = false;  // uncheck embedCodeCheckbox, because it is not compatible

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
        // success
        var response = JSON.parse(xhr.responseText);
        var textField = document.getElementById(cssIdOfTextFieldToFill) as HTMLInputElement;
        textField.value = response.shortLink;
        // select the URL for copy/paste
        textField.focus();
        textField.select();
        (document.getElementById("shortenerCheckbox") as HTMLInputElement).checked = true;  // this is now true if isn't already
      } else {
        (document.getElementById("shortenerCheckbox") as HTMLInputElement).checked = false;  // request failed
      }
    };
    xhr.send(JSON.stringify(params));

  }

  // embed looks something like this:
  // <iframe width="100%" height="240" src="https://hosting.com/path/GrooveDisplay.html?Div=16&Title=Example..." frameborder="0" ></iframe>
  fillInEmbedURLInFullURLPopup(fullURL, cssIdOfTextFieldToFill) {
    (document.getElementById("shortenerCheckbox") as HTMLInputElement).checked = false;  // uncheck shortenerCheckbox, because it is not compatible
    (document.getElementById("embedCodeCheckbox") as HTMLInputElement).checked = true;  // this will be true if isn't already

    var embedText = '<iframe width="100%" height="240" src="' + fullURL + '" frameborder="0" ></iframe>	';

    var textField = document.getElementById(cssIdOfTextFieldToFill) as HTMLInputElement;
    textField.value = embedText;

    // select the URL for copy/paste
    textField.focus();
    textField.select();
  }

  shortenerCheckboxChanged() {
    if ((document.getElementById("shortenerCheckbox") as HTMLInputElement).checked) {
      this.fillInShortenedURLInFullURLPopup(this.get_FullURLForPage(), 'fullURLPopupTextField');
    } else {
      this.fillInFullURLInFullURLPopup();
    }
  };

  embedCodeCheckboxChanged() {
    if ((document.getElementById("embedCodeCheckbox") as HTMLInputElement).checked) {
      this.fillInEmbedURLInFullURLPopup(this.get_FullURLForPage("display"), 'fullURLPopupTextField');
    } else {
      this.fillInShortenedURLInFullURLPopup(this.get_FullURLForPage(), 'fullURLPopupTextField');
    }
  };

  // Propagate parsed measure data onto the clickable UI. get_*_state reads
  // note-on classes off these DOM elements, so without this call MIDI
  // generation sees an empty grid and produces a silent track.
  applyMeasuresToUI() {
    const drumTypes = [DrumType.STICKINGS, DrumType.HIHAT, DrumType.SNARE, DrumType.KICK, DrumType.TOM1, DrumType.TOM4];
    for (let m = 0; m < this.data.numberOfMeasures; m++) {
      const measure = this.data.measures[m];
      if (!measure) continue;
      for (const drumType of drumTypes) {
        const arr = measure.getArray(drumType);
        for (let i = 0; i < arr.length; i++) {
          const id = i + m * this.data.notesPerMeasure;
          const note = arr[i] ? tabCharToAbcNote(drumType, arr[i]) : null;
          if (note) {
            this.setDrumNote(id, note, false);
          } else {
            this.setDrumNote(id, AbcNote.OFF, false, drumType);
          }
        }
      }
    }
  }

  set_Default_notes(encodedURLData) {
    this.data.fromUrl(encodedURLData);
    this.applyMeasuresToUI();

    if (this.data.showToms)
      this.showHideToms(true, true, true);

    if (this.data.showStickings)
      this.stickingsShowHide(true, true, true);

    (document.getElementById("tuneTitle") as HTMLInputElement).value = this.data.title;
    (document.getElementById("tuneAuthor") as HTMLInputElement).value = this.data.author;
    (document.getElementById("tuneComments") as HTMLInputElement).value = this.data.comments;
    this.myGrooveUtils.setTempo(this.data.tempo);
    this.myGrooveUtils.setSwing(this.data.swingPercent);
    this.setMetronomeFrequency(this.data.metronomeFrequency);
    this.updateSheetMusic();
  }

  loadNewGroove(encodedURLData) {
    this.set_Default_notes(encodedURLData);
  };

  getABCDataWithLineEndings() {
    var myABC = (document.getElementById("ABCsource") as HTMLInputElement).value;

    // add proper line endings for windows
    myABC = myABC.replace(/\r?\n/g, "\r\n");

    return myABC;
  }

  saveABCtoFile() {
    var myABC = this.getABCDataWithLineEndings();

    var myURL = 'data:text/plain;charset=utf-8;base64,' + btoa(myABC);

    console.log("Use \"Save As\" to save the new page to a local file");
    window.open(myURL);

  };

  // change the base division to something else.
  // eg  16th to 8ths or   32nds to 8th note triplets
  // need to re-layout the html notes, change any globals and then reinitialize
  //
  // OMG this needs to be refactored really bad.   There is a GrooveData struct from groove utils that
  //      would make this whole thing much easier.  :(
  changeDivisionWithNotes(newDivision, Stickings, HH, Tom1, Tom4, Snare, Kick) {
    var oldDivision = (this as any).class_subDivision;
    var wasStickingsVisable = this.isStickingsVisible();
    var wasTomsVisable = this.isTomsVisible();

    (this as any).class_subDivision = newDivision;

    this.addMeasureHtml((this as any).measureContainer);

    // var newHTML = "";
    // for (var cur_measure = 1; cur_measure <= this.data.numberOfMeasures; cur_measure++) {
    //   newHTML += this.HTMLforStaffContainer(cur_measure, (cur_measure - 1) * this.data.notesPerMeasure);
    // }

    // // rewrite the HTML for the HTML note grid
    // document.getElementById("measureContainer").innerHTML = newHTML;

    // change the Permutation options too
    const newHTML = this.HTMLforPermutationOptions();
    document.getElementById("PermutationOptions").innerHTML = newHTML;

    if (wasStickingsVisable)
      this.stickingsShowHide(true, true, true);

    if (wasTomsVisable)
      this.showHideToms(true, true, true);

    // now set the right notes on and off
    if (Stickings && HH && Tom1 && Tom4 && Snare && Kick) {
      (this as any).setNotesFromURLData("Stickings", Stickings, this.data.numberOfMeasures);
      (this as any).setNotesFromURLData("H", HH, this.data.numberOfMeasures);
      (this as any).setNotesFromURLData("T1", Tom1, this.data.numberOfMeasures);
      (this as any).setNotesFromURLData("T4", Tom4, this.data.numberOfMeasures);
      (this as any).setNotesFromURLData("S", Snare, this.data.numberOfMeasures);
      (this as any).setNotesFromURLData("K", Kick, this.data.numberOfMeasures);
    }

    // un-highlight the old div
    this.unselectButton(document.getElementById("subdivision_" + oldDivision + "ths"));

    // highlight the new div
    this.selectButton(document.getElementById("subdivision_" + (this as any).class_subDivision + "ths"));

    // This may disable or enable the menu
    this.setupPermutationMenu();

    // may turn on or off triplets and 1/4 or 1/8th notes based on time signature
    this.setTimeDivisionSelectionOnOrOff();

    // change the time label
    this.setTimeSigLabel();

    // enable or disable swing
    // TODO
    // this.myGrooveUtils.swingEnabled(this.myGrooveUtils.doesDivisionSupportSwing(newDivision));
  }

  expandAuthoringViewWhenNecessary(numNotesPerMeasure, numberOfMeasures) {

    // set the size of the musicalInput authoring element based on the number of notes
    if (numNotesPerMeasure > 16 ||
      (numNotesPerMeasure > 4 && this.data.numberOfMeasures > 1) ||
      (this.data.numberOfMeasures > 2)) {
      this.addClassById("musicalInput", "expanded", true);

    } else {
      this.addClassById("musicalInput", "expanded", false);

    }
  };

  // change the base division to something else.
  // eg  16th to 8ths or   32nds to 8th note triplets
  // need to re-layout the html notes, change any globals and then reinitialize
  changeDivision(newDivision: Subdivision) {
    var uiStickings = "|";
    var uiHH = "|";
    var uiTom1 = "|";
    var uiTom4 = "|";
    var uiSnare = "|";
    var uiKick = "|";

    if ((newDivision as any) == 48 && !this.have_shown_mixed_division_message) {
      this.have_shown_mixed_division_message = true;
      alert("The MIXED subdivision allows you to create a combination of triplets and non-triplet notes in one measure.  Set every 3rd note for 16ths and every 6th note for 8th notes")
    }

    var isNewDivisionTriplets = this.myGrooveUtils.isTripletDivision(newDivision as any);
    var new_notes_per_measure = this.data.notesPerMeasure;

    // check for incompatible odd time signature division   9/8 and 1/4notes for instance or 9/16 and 1/8notes
    if (((newDivision as any) * this.data.timeSig.top / this.data.timeSig.bottom.value) % 1 != 0) {
      alert("1/" + newDivision + " notes are disabled in " + this.data.timeSig.top + "/" + this.data.timeSig.bottom.value + " time.  This combination would result in a half note.");
      return;
    }
    if (isNewDivisionTriplets && this.data.timeSig.bottom.value != 4) {
      alert("Triplets are disabled in " + this.data.timeSig.top + "/" + this.data.timeSig.bottom.value + " time.  Use x/4 time for triplets.");
      return;
    }

    if (this.usingTriplets() === isNewDivisionTriplets) {
      // get the encoded notes out of the UI.
      // run through both measures.
      var topIndex = this.data.notesPerMeasure * this.data.numberOfMeasures;
      for (var i = 0; i < topIndex; i++) {
        uiStickings += this.get_sticking_state(i, "URL");
        uiHH += this.get_hh_state(i).url;
        uiTom1 += this.get_tom_state(i, 1).url;
        uiTom4 += this.get_tom_state(i, 4).url;
        uiSnare += this.get_snare_state(i).url;
        uiKick += this.get_kick_state(i, "URL");
      }

      // override the hi-hat if we are going to a higher division.
      // otherwise the notes get lost in translation (not enough)
      //if (newDivision > this.data.notesPerMeasure)
      //	uiHH = this.myGrooveUtils.GetDefaultHHGroove(new_notes_per_measure, class_num_beats_per_measure, class_note_value_per_measure, this.data.numberOfMeasures);
    } else {
      // changing from or changing to a triplet division
      // triplets don't scale well, so use defaults when we change
      uiStickings = (this.myGrooveUtils as any).buildEmptyTabString(new_notes_per_measure, this.data.numberOfMeasures);
      uiHH = (this.myGrooveUtils as any).GetDefaultHHGroove(new_notes_per_measure, this.data.numberOfMeasures);
      uiTom1 = (this.myGrooveUtils as any).buildEmptyTabString(new_notes_per_measure, this.data.numberOfMeasures);
      uiTom4 = (this.myGrooveUtils as any).buildEmptyTabString(new_notes_per_measure, this.data.numberOfMeasures);
      uiSnare = (this.myGrooveUtils as any).GetDefaultSnareGroove(new_notes_per_measure, this.data.timeSig, this.data.numberOfMeasures);
      uiKick = (this.myGrooveUtils as any).GetDefaultKickGroove(new_notes_per_measure, this.data.timeSig, this.data.numberOfMeasures);

      // reset the metronome click, since it has different options
      this.resetMetronomeOptionsMenuOffsetClick();
    }

    this.expandAuthoringViewWhenNecessary(newDivision, this.data.numberOfMeasures);

    this.changeDivisionWithNotes(newDivision, uiStickings, uiHH, uiTom1, uiTom4, uiSnare, uiKick);

    this.updateSheetMusic();
  };

  createLineLabels(measure: number): E {
    return E.of('div', undefined, 'line-labels', listOf(
      E.of('div', undefined, 'hh-label').setContent('Hi-hat').addHandlers({
        onclick: (event) => this.noteLabelClick(event, 'hh', measure),
        oncontextmenu: (event) => {
          event.preventDefault();
          this.noteLabelClick(event, 'hh', measure);
        },
      }),
      E.of('div', 'tom1-label', 'tom-label').setContent('Tom').addHandlers({
        onclick: (event) => this.noteLabelClick(event, 'tom1', measure),
        oncontextmenu: (event) => {
          event.preventDefault();
          this.noteLabelClick(event, 'tom1', measure);
        },
      }),
      E.of('div', undefined, 'snare-label').setContent('Snare').addHandlers({
        onclick: (event) => this.noteLabelClick(event, 'snare', measure),
        oncontextmenu: (event) => {
          event.preventDefault();
          this.noteLabelClick(event, 'snare', measure);
        },
      }),
      E.of('div', 'tom4-label', 'tom-label').setContent('Tom').addHandlers({
        onclick: (event) => this.noteLabelClick(event, 'tom4', measure),
        oncontextmenu: (event) => {
          event.preventDefault();
          this.noteLabelClick(event, 'tom4', measure);
        },
      }),
      E.of('div', undefined, 'kick-label').setContent('Kick').addHandlers({
        onclick: (event) => this.noteLabelClick(event, 'kick', measure),
        oncontextmenu: (event) => {
          event.preventDefault();
          this.noteLabelClick(event, 'kick', measure);
        },
      }),
    ));
  }

  createNotesContainer(measure: number): E {
    const noteGroupingSize = this.data.timeSig.bottom.divideBy(this.data.subdivision);
    const openingSpace = E.of('div', undefined, 'opening_note_space');
    const endSpace = E.of('div', undefined, 'end_note_space');
    const spaceBetweenGroups = E.of('div', undefined, 'space_between_note_groups');

    const highlights: E[] = [];
    const hihats: E[] = [];
    const snares: E[] = [];
    const kicks: E[] = [];
    const toms1: E[] = [];
    const toms4: E[] = [];
    const all = [highlights, hihats, toms1, toms4, snares, kicks];

    for (let i = 0; i < this.data.notesPerMeasure; i++) {
      const index = i + (measure * this.data.notesPerMeasure);
      if (i === 0) {
        all.forEach(arr => arr.push(openingSpace));
      }
      if (i > 0 && i % noteGroupingSize === 0) {
        all.forEach(arr => arr.push(spaceBetweenGroups));
      }

      // Highlights
      highlights.push(E.of('div', `bg-highlight${index}`, 'bg-highlight'));

      // Hihats
      const hihat = E.of('div', `hi-hat${index}`, 'hi-hat').addHandlers({
        onclick: (event) => this.noteLeftClick(event, 'hh', index),
        oncontextmenu: (event) => {
          event.preventDefault();
          this.noteRightClick(event, 'hh', index);
        },
        onmouseenter: (event) => this.noteOnMouseEnter(event, 'hh', index)
      });
      AbcNote.HH_ALL.forEach((note) => {
        const htmlPrefix = note.getFirstHtmlIdPrefix();
        hihat.addChild(
          E.of('div', `${htmlPrefix}${index}`, ['note_part', htmlPrefix], listOf(
            E.of('i', undefined, `fa ${note.htmlAttrs.iconClass || ''}`))));
      });
      hihats.push(hihat);

      // Snares
      const snare = E.of('div', `snare${index}`, 'snare').addHandlers({
        onclick: (event) => this.noteLeftClick(event, 'snare', index),
        oncontextmenu: (event) => {
          event.preventDefault();
          this.noteRightClick(event, 'snare', index);
        },
        onmouseenter: (event) => this.noteOnMouseEnter(event, 'snare', index)
      });
      AbcNote.SN_ALL.forEach((note) => {
        const htmlPrefix = note.getFirstHtmlIdPrefix();
        if (note.note === AbcNote.SN_GHOST.note) {
          const snare_ghost = E.of('div', `snare_ghost${index}`, ['note_part', htmlPrefix]);
          snare_ghost.innerHTML = `(<i class="fa fa-${note.htmlAttrs.iconClass || ''} dot_in_snare_ghost_note"></i>)`;
          snare.addChild(snare_ghost);
          return;
        }
        if (note.note === AbcNote.SN_FLAM.note) {
          const snare_flam = E.of('div', `snare_flam${index}`, ['note_part', htmlPrefix]);
          snare_flam.innerHTML = SNARE_FLAM_SVG;
          snare.addChild(snare_flam);
          return;
        }
        if (note.note === AbcNote.SN_DRAG.note) {
          const snare_drag = E.of('div', `snare_drag${index}`, ['note_part', htmlPrefix]);
          snare_drag.innerHTML = SNARE_DRAG_SVG;
          snare.addChild(snare_drag);
          return;
        }
        snare.addChild(
          E.of('div', `${htmlPrefix}${index}`, ['note_part', htmlPrefix], listOf(
            E.of('i', undefined, `fa ${note.htmlAttrs.iconClass || ''}`))));
      });
      snares.push(snare);

      // Kicks
      const kick = E.of('div', `kick${index}`, 'kick', listOf(
        E.of('div', `${AbcNote.KI_NORMAL.getFirstHtmlIdPrefix()}${index}`, ['note_part', AbcNote.KI_NORMAL.getFirstHtmlIdPrefix()]),
        E.of('div', `${AbcNote.KI_SPLASH.getFirstHtmlIdPrefix()}${index}`, ['note_part', AbcNote.KI_SPLASH.getFirstHtmlIdPrefix()], listOf(
          E.of('i', undefined, `fa ${AbcNote.KI_SPLASH.htmlAttrs.iconClass || ''}`)
        )).addHandlers({
          onclick: (event) => this.noteLeftClick(event, 'kick', index),
          oncontextmenu: (event) => {
            event.preventDefault();
            this.noteRightClick(event, 'kick', index);
          },
          onmouseenter: (event) => this.noteOnMouseEnter(event, 'kick', index)
        })));

      // Toms

      if (i === this.data.notesPerMeasure - 1) {
        all.forEach(arr => arr.push(endSpace));
      }
    }

    return E.of('div', undefined, 'music-line-container', listOf(
      E.of('div', undefined, 'notes-container', listOf(
        E.of('div', undefined, 'staff-line-1'),
        E.of('div', undefined, 'staff-line-2'),
        E.of('div', undefined, 'staff-line-3'),
        E.of('div', undefined, 'staff-line-4'),
        E.of('div', undefined, 'staff-line-5'),
        E.of('div', undefined, 'background-highlight-container'),
        E.of('div', undefined, 'hi-hat-container'),
        E.of('div', undefined, 'toms-container'),
        E.of('div', undefined, 'snare-container'),
        E.of('div', undefined, 'toms-container'),
        E.of('div', undefined, 'kick-container'),
      ))));
  }

  addMeasureHtml(measureContainer: HTMLElement) {
    const noteGroupingSize = this.data.timeSig.bottom.divideBy(this.data.subdivision);
    const measures: Array<E> = [];

    for (let measure = 0; measure < this.data.numberOfMeasures; measure++) {
      const showRemoveButton = this.data.numberOfMeasures > 1 && measure > 0;

      const stickings = [];
      for (let i = 0; i < this.data.notesPerMeasure; i++) {
        i = i + (measure * this.data.notesPerMeasure);
        const handlers = {
          onclick: (event) => this.noteLeftClick(event, 'sticking', i),
          oncontextmenu: (event) => {
            event.preventDefault();
            this.noteRightClick(event, 'sticking', i);
          },
        }
        const sticking = E.of('div', `sticking${i}`, 'sticking', listOf(
          E.of('div', `sticking_right${i}`, listOf('sticking_right', 'note_part')).setContent('R').addHandlers({
            onclick: handlers.onclick,
            oncontextmenu: handlers.oncontextmenu,
            onmouseenter: (event) => this.noteOnMouseEnter(event, 'sticking', i),
          }),
          E.of('div', `sticking_left${i}`, listOf('sticking_left', 'note_part')).setContent('L').addHandlers(handlers),
          E.of('div', `sticking_both${i}`, listOf('sticking_both', 'note_part')).setContent('R/L').addHandlers(handlers),
          E.of('div', `sticking_count${i}`, listOf('sticking_count', 'note_part')).setContent('C').addHandlers(handlers)
        ));

        stickings.push(sticking);
        // Add space between every note grouping, except the last one.
        if (i % noteGroupingSize == 0 && i < this.data.notesPerMeasure - 1) {
          stickings.push(E.of('div', undefined, 'space_between_note_groups'));
        }
      }

      const staffContainer = E.of('div', 'staff-container' + measure.toString(), 'staff-container', listOf(
        E.of('div', undefined, 'stickings-row-container', listOf(
          E.of('div', undefined, 'line-labels', listOf(
            E.of('div', undefined, 'stickings-label').addHandlers({
              onclick: (event) => this.noteLabelClick(event, 'stickings', measure),
              oncontextmenu: (event) => {
                event.preventDefault();
                this.noteLabelClick(event, 'stickings', measure);
              },
            }),
          )),
          E.of('div', undefined, 'music-line-container', listOf(
            E.of('div', undefined, 'notes-container', listOf(
              E.of('div', undefined, 'stickings-container', listOf(
                E.of('div', undefined, 'opening_note_space'),
                stickings,
                E.of('div', undefined, 'end_note_space')
              ))
            ))
          )),
          E.of('span', undefined, 'notes-row-container', listOf(
            this.createLineLabels(measure),
            this.createNotesContainer(measure)
          )),
          showRemoveButton ? this.htmlRemoveMeasureButton(measure) : null,
        ))));
      measures.push(staffContainer);
    }
    measures.forEach((measure, index) => {
      measure.addTo(measureContainer);
    });
  }

  htmlRemoveMeasureButton(measure: number): E {
    return E.of('span', 'closeMeasureButton' + measure, 'closeMeasureButton', listOf(
      E.of('i', undefined, 'fa fa-times')
    )).addHandlers({
      onclick: (event) => this.closeMeasureButtonClick(measure),
    });
  }

  // public function
  // function to create HTML for the music staff and notes.   We usually want more than one of these
  // baseIndex is the index for the css labels "staff-container1, staff-container2"
  // indexStartForNotes is the index for the note ids.
  HTMLforStaffContainer(baseindex: number, indexStartForNotes: number): string {
    var newHTML = ('\
						<div class="staff-container" id="staff-container' + baseindex + '">\
							<div class="stickings-row-container">\
								<div class="line-labels">\
									<div class="stickings-label" onClick="myGrooveWriter.noteLabelClick(event, \'stickings\', ' + baseindex + ')" oncontextmenu="event.preventDefault(); myGrooveWriter.noteLabelClick(event, \'stickings\', ' + baseindex + ')">STICKINGS</div>\
								</div>\
								<div class="music-line-container">\n\
									\
									<div class="notes-container">\n');

    newHTML += ('\
										<div class="stickings-container">\
											<div class="opening_note_space"> </div>');
    for (var i = indexStartForNotes; i < this.data.notesPerMeasure + indexStartForNotes; i++) {

      newHTML += ('\
														<div id="sticking' + i + '" class="sticking">\n\
															<div class="sticking_right note_part"  id="sticking_right' + i + '"  onClick="myGrooveWriter.noteLeftClick(event, \'sticking\', ' + i + ')" oncontextmenu="event.preventDefault(); myGrooveWriter.noteRightClick(event, \'sticking\', ' + i + ')" onmouseenter="myGrooveWriter.noteOnMouseEnter(event, \'sticking\'">R</div>\n\
															<div class="sticking_left note_part"   id="sticking_left' + i + '"   onClick="myGrooveWriter.noteLeftClick(event, \'sticking\', ' + i + ')" oncontextmenu="event.preventDefault(); myGrooveWriter.noteRightClick(event, \'sticking\', ' + i + ')">L</div>\n\
															<div class="sticking_both note_part"   id="sticking_both' + i + '"   onClick="myGrooveWriter.noteLeftClick(event, \'sticking\', ' + i + ')" oncontextmenu="event.preventDefault(); myGrooveWriter.noteRightClick(event, \'sticking\', ' + i + ')">R/L</div>\n\
															<div class="sticking_count note_part"   id="sticking_count' + i + '"   onClick="myGrooveWriter.noteLeftClick(event, \'sticking\', ' + i + ')" oncontextmenu="event.preventDefault(); myGrooveWriter.noteRightClick(event, \'sticking\', ' + i + ')">C</div>\n\
														</div>\n\
													');

      // add space between notes, exept on the last note
      if ((i - (indexStartForNotes - 1)) % this.myGrooveUtils.noteGroupingSize(this.data.notesPerMeasure, this.data.timeSig) === 0 && i < this.data.notesPerMeasure + indexStartForNotes - 1) {
        newHTML += ('<div class="space_between_note_groups"> </div>\n');
      }
    }
    newHTML += ('<div class="end_note_space"></div>\n</div>\n');

    newHTML += ('\
									</div>\
								</div>\
							</div>\n');

    newHTML += ('\
							<span class="notes-row-container">\
								<div class="line-labels">\
									<div class="hh-label" onClick="myGrooveWriter.noteLabelClick(event, \'hh\', ' + baseindex + ')" oncontextmenu="event.preventDefault(); myGrooveWriter.noteLabelClick(event, \'hh\', ' + baseindex + ')">Hi-hat</div>\
									<div class="tom-label" id="tom1-label" onClick="myGrooveWriter.noteLabelClick(event, \'tom1\', ' + baseindex + ')" oncontextmenu="event.preventDefault(); myGrooveWriter.noteLabelClick(event, \'tom1\', ' + baseindex + ')">Tom</div>\
									<div class="snare-label" onClick="myGrooveWriter.noteLabelClick(event, \'snare\', ' + baseindex + ')" oncontextmenu="event.preventDefault(); myGrooveWriter.noteLabelClick(event, \'snare\', ' + baseindex + ')">Snare</div>\
									<div class="tom-label" id="tom4-label" onClick="myGrooveWriter.noteLabelClick(event, \'tom4\', ' + baseindex + ')" oncontextmenu="event.preventDefault(); myGrooveWriter.noteLabelClick(event, \'tom4\', ' + baseindex + ')">Tom</div>\
									<div class="kick-label" onClick="myGrooveWriter.noteLabelClick(event, \'kick\', ' + baseindex + ')" oncontextmenu="event.preventDefault(); myGrooveWriter.noteLabelClick(event, \'kick\', ' + baseindex + ')">Kick</div>\
								</div>\
								<div class="music-line-container">\
									\
									<div class="notes-container">\
									<div class="staff-line-1"></div>\
									<div class="staff-line-2"></div>\
									<div class="staff-line-3"></div>\
									<div class="staff-line-4"></div>\
									<div class="staff-line-5"></div>\n');

    // backgrounds for highlighting.  Evenly spaced cols of space
    newHTML += ('\
										<div class="background-highlight-container">\
											<div class="opening_note_space"> </div>');
    for (i = indexStartForNotes; i < this.data.notesPerMeasure + indexStartForNotes; i++) {
      newHTML += ('						<div id="bg-highlight' + i + '" class="bg-highlight" >\
												</div>\n');

      if ((i - (indexStartForNotes - 1)) % this.myGrooveUtils.noteGroupingSize(this.data.notesPerMeasure, this.data.timeSig) === 0 && i < this.data.notesPerMeasure + indexStartForNotes - 1) {
        newHTML += ('<div class="space_between_note_groups"> </div> \n');
      }
    }
    newHTML += ('<div class="end_note_space"></div>\n</div>\n');

    // Hi-hats
    newHTML += ('\
										<div class="hi-hat-container">\
											<div class="opening_note_space"> </div>');
    for (i = indexStartForNotes; i < this.data.notesPerMeasure + indexStartForNotes; i++) {

      newHTML += ('\
														<div id="hi-hat' + i + '" class="hi-hat" onClick="myGrooveWriter.noteLeftClick(event, \'hh\', ' + i + ')" oncontextmenu="event.preventDefault(); myGrooveWriter.noteRightClick(event, \'hh\', ' + i + ')" onmouseenter="myGrooveWriter.noteOnMouseEnter(event, \'hh\', ' + i + ')">\
															<div class="hh_crash note_part"  id="hh_crash' + i + '"><i class="fa fa-asterisk"></i></div>\
															<div class="hh_ride note_part"   id="hh_ride' + i + '"><i class="fa fa-dot-circle-o"></i></div>\
															<div class="hh_ride_bell note_part"   id="hh_ride_bell' + i + '"><i class="fa fa-bell-o"></i></div>\
															<div class="hh_cow_bell note_part"    id="hh_cow_bell' + i + '"><i class="fa fa-plus-square-o"></i></div>\
															<div class="hh_stacker note_part"   id="hh_stacker' + i + '"><i class="fa fa-bars"></i></div>\
															<div class="hh_metronome_normal note_part"   id="hh_metronome_normal' + i + '"><i class="fa fa-neuter"></i></div>\
															<div class="hh_metronome_accent note_part"   id="hh_metronome_accent' + i + '"><i class="fa fa-map-pin"></i></div>\
															<div class="hh_cross note_part"  id="hh_cross' + i + '"><i class="fa fa-times"></i></div>\
															<div class="hh_open note_part"   id="hh_open' + i + '"><i class="fa fa-circle-o"></i></div>\
															<div class="hh_close note_part"  id="hh_close' + i + '"><i class="fa fa-plus"></i></div>\
															<div class="hh_accent note_part" id="hh_accent' + i + '"><i class="fa fa-angle-right"></i></div>\
														</div>\n\
													');

      if ((i - (indexStartForNotes - 1)) % this.myGrooveUtils.noteGroupingSize(this.data.notesPerMeasure, this.data.timeSig) === 0 && i < this.data.notesPerMeasure + indexStartForNotes - 1) {
        newHTML += ('<div class="space_between_note_groups"> </div> \n');
      }
    }
    newHTML += '<div class="unmuteHHButton" id="unmutehhButton' + baseindex + '" onClick=\'myGrooveWriter.muteInstrument("hh", ' + baseindex + ', false)\'><span class="fa-stack unmuteHHStack"><i class="fa fa-ban fa-stack-2x" style="color:red"></i><i class="fa fa-volume-down fa-stack-1x"></i></div>';
    newHTML += ('<div class="end_note_space"></div>\n</div>\n');

    // Toms 1
    newHTML += ('\
										<div class="toms-container" id="tom1-container">\
											<div class="opening_note_space"> </div>');
    for (i = indexStartForNotes; i < this.data.notesPerMeasure + indexStartForNotes; i++) {
      newHTML += ('\
						<div id="tom1-' + i + '" class="tom" onClick="myGrooveWriter.noteLeftClick(event, \'tom1\', ' + i + ')" oncontextmenu="event.preventDefault(); myGrooveWriter.noteRightClick(event, \'tom1\', ' + i + ')" onmouseenter="myGrooveWriter.noteOnMouseEnter(event, \'tom1\', ' + i + ')">\
							<div class="tom_circle note_part"  id="tom_circle1-' + i + '"></div>\
						</div>\n\
						');

      if ((i - (indexStartForNotes - 1)) % this.myGrooveUtils.noteGroupingSize(this.data.notesPerMeasure, this.data.timeSig) === 0 && i < this.data.notesPerMeasure + indexStartForNotes - 1) {
        newHTML += ('<div class="space_between_note_groups"> </div> \n');
      }
    }
    newHTML += '<span class="unmuteTom1Button" id="unmutetom1Button' + baseindex + '" onClick=\'myGrooveWriter.muteInstrument("tom1", ' + baseindex + ', false)\'><span class="fa-stack unmuteStack"><i class="fa fa-ban fa-stack-2x" style="color:red"></i><i class="fa fa-volume-down fa-stack-1x"></i></span>';
    newHTML += ('<div class="end_note_space"></div>\n</div>\n');

    // Snare stuff
    newHTML += ('\
										<div class="snare-container">\
											<div class="opening_note_space"> </div> ');
    for (i = indexStartForNotes; i < this.data.notesPerMeasure + indexStartForNotes; i++) {
      newHTML += ('' +
        '<div id="snare' + i + '" class="snare" onClick="myGrooveWriter.noteLeftClick(event, \'snare\', ' + i + ')" oncontextmenu="event.preventDefault(); myGrooveWriter.noteRightClick(event, \'snare\', ' + i + ')" onmouseenter="myGrooveWriter.noteOnMouseEnter(event, \'snare\', ' + i + ')">' +
        '<div class="snare_ghost note_part"  id="snare_ghost' + i + '">(<i class="fa fa-circle dot_in_snare_ghost_note"></i>)</div>' +
        '<div class="snare_circle note_part" id="snare_circle' + i + '"></div>' +
        '<div class="snare_xstick note_part" id="snare_xstick' + i + '"><i class="fa fa-times"></i></div>' +
        '<div class="snare_buzz note_part" id="snare_buzz' + i + '"><i class="fa fa-bars"></i></div>' +
        '<div class="snare_flam note_part" id="snare_flam' + i + '"><i class="fa ">' +
        '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" width="30" height="30">' +
        '	<style type="text/css">' +
        '		.flam_fill {fill: currentColor}' +
        '		.flam_stroke {stroke: currentColor; fill: none; stroke-width: .7}' +
        '	</style>' +
        '	<defs>' +
        '		<path id="flam_ghd" class="flam_fill" d="m1.7-1c-1-1.7-4.5 0.2-3.4 2 1 1.7 4.5-0.2 3.4-2"></path>' +
        '		<ellipse id="flam_hd" rx="4.1" ry="2.9" transform="rotate(-20)" class="flam_fill"></ellipse>' +
        '	</defs>' +
        '	<g id="note" transform="translate(-44 -35)">' +
        '		<path class="flam_stroke" d="m52.1 53.34v-14M52.1 39.34c0.6 3.4 5.6 3.8 3 10 1.2-4.4-1.4-7-3-7"></path>' +
        '		<use x="50.50" y="53.34" xlink:href="#flam_ghd"></use>' +
        '		<path class="flam_stroke" d="m49.5 49.34l9-5"></path>' +
        '		<path class="flam_stroke" d="m50.5 58.34c2.9 3 11.6 3 14.5 0M69.5 53.34v-21"></path><use x="66.00" y="53.34" xlink:href="#flam_hd"></use>' +
        '	</g>' +
        '</svg>' +
        '</i></div>' +
        '<div class="snare_drag note_part" id="snare_drag' + i + '"><i class="fa ">' +
        '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" width="30" height="30">' +
        '	<style type="text/css">' +
        '		.drag_fill {fill: currentColor}' +
        '		.drag_stroke {stroke: currentColor; fill: none; stroke-width: .7}' +
        '	</style>' +
        '	<defs>' +
        '		<path id="drag_ghd" class="drag_fill" d="m1.7-1c-1-1.7-4.5 0.2-3.4 2 1 1.7 4.5-0.2 3.4-2"></path>' +
        '		<ellipse id="drag_hd" rx="4.1" ry="2.9" transform="rotate(-20)" class="drag_fill"></ellipse>' +
        '	</defs>' +
        '	<g id="note" transform="translate(-44 -35)">' +
        '       <path class="fill" d="m51.81 38.34 l8.58 0.00v1.60l-8.58 0.00"></path>' +
        '	    <path class="fill" d="m52.10 41.34 l8.00 0.00v1.60l-8.00 0.00"></path>' +
        '		<path class="drag_stroke" d="m52.1 53.34v-15.00"></path>' +
        '		<use x="50.50" y="53.34" xlink:href="#drag_ghd"></use>' +
        '		<path class="drag_stroke" d="m49.50 49.34l8.00 -15.00"></path>' +
        '		<path class="drag_stroke" d="m60.10 53.34v-15.00"></path>' +
        '		<use x="58.50" y="53.34" xlink:href="#drag_ghd"></use>' +
        '		<path class="drag_stroke" d="m50.5 58.34c2.9 3 11.6 3 14.5 0M69.5 53.34v-21"></path><use x="66.00" y="53.34" xlink:href="#drag_hd"></use>' +

        '	</g>' +
        '</svg>' +
        '</i></div>' +
        '<div class="snare_accent note_part" id="snare_accent' + i + '">' +
        '  <i class="fa fa-chevron-right"></i>' +
        '</div>' +
        '</div> \n');



      if ((i - (indexStartForNotes - 1)) % this.myGrooveUtils.noteGroupingSize(this.data.notesPerMeasure, this.data.timeSig) === 0 && i < this.data.notesPerMeasure + indexStartForNotes - 1) {
        newHTML += ('<div class="space_between_note_groups"> </div> ');
      }
    }
    newHTML += '<span class="unmuteSnareButton" id="unmutesnareButton' + baseindex + '" onClick=\'myGrooveWriter.muteInstrument("snare", ' + baseindex + ', false)\'><span class="fa-stack unmuteStack"><i class="fa fa-ban fa-stack-2x" style="color:red"></i><i class="fa fa-volume-down fa-stack-1x"></i></span>';
    newHTML += ('<div class="end_note_space"></div>\n</div>\n');

    // Toms 4
    newHTML += ('\
										<div class="toms-container" id="tom4-container">\
											<div class="opening_note_space"> </div>');
    for (i = indexStartForNotes; i < this.data.notesPerMeasure + indexStartForNotes; i++) {
      newHTML += ('\
						<div id="tom4-' + i + '" class="tom" onClick="myGrooveWriter.noteLeftClick(event, \'tom4\', ' + i + ')" oncontextmenu="event.preventDefault(); myGrooveWriter.noteRightClick(event, \'tom4\', ' + i + ')" onmouseenter="myGrooveWriter.noteOnMouseEnter(event, \'tom4\', ' + i + ')">\
							<div class="tom_circle note_part"  id="tom_circle4-' + i + '"></div>\
						</div>\n\
						');

      if ((i - (indexStartForNotes - 1)) % this.myGrooveUtils.noteGroupingSize(this.data.notesPerMeasure, this.data.timeSig) === 0 && i < this.data.notesPerMeasure + indexStartForNotes - 1) {
        newHTML += ('<div class="space_between_note_groups"> </div> \n');
      }
    }
    newHTML += '<span class="unmuteTom4Button" id="unmutetom4Button' + baseindex + '" onClick=\'myGrooveWriter.muteInstrument("tom4", ' + baseindex + ', false)\'><span class="fa-stack unmuteStack"><i class="fa fa-ban fa-stack-2x" style="color:red"></i><i class="fa fa-volume-down fa-stack-1x"></i></span>';
    newHTML += ('<div class="end_note_space"></div>\n</div>\n');


    // Kick stuff
    newHTML += ('\
										<div class="kick-container">\
											<div class="opening_note_space"> </div> ');
    for (var j = indexStartForNotes; j < this.data.notesPerMeasure + indexStartForNotes; j++) {
      newHTML += ('\
														<div id="kick' + j + '" class="kick" onClick="myGrooveWriter.noteLeftClick(event, \'kick\', ' + j + ')" oncontextmenu="event.preventDefault(); myGrooveWriter.noteRightClick(event, \'kick\', ' + j + ')" onmouseenter="myGrooveWriter.noteOnMouseEnter(event, \'kick\', ' + j + ')">\
														<div class="kick_splash note_part" id="kick_splash' + j + '"><i class="fa fa-times"></i></div>\
														<div class="kick_circle note_part" id="kick_circle' + j + '"></div>\
														</div> \n\
													');

      if ((j - (indexStartForNotes - 1)) % this.myGrooveUtils.noteGroupingSize(this.data.notesPerMeasure, this.data.timeSig) === 0 && j < this.data.notesPerMeasure + indexStartForNotes - 1) {
        newHTML += ('<div class="space_between_note_groups"> </div> ');
      }
    }
    newHTML += '<span class="unmuteKickButton" id="unmutekickButton' + baseindex + '" onClick=\'myGrooveWriter.muteInstrument("kick", ' + baseindex + ', false)\'><span class="fa-stack unmuteStack"><i class="fa fa-ban fa-stack-2x" style="color:red"></i><i class="fa fa-volume-down fa-stack-1x"></i></span>';
    newHTML += ('<div class="end_note_space"></div>\n</div>\n');

    newHTML += ('\
								</div>\
							</div>\
						</span>\n');

    if (this.data.numberOfMeasures > 1)
      newHTML += '<span title="Remove Measure" id="closeMeasureButton' + baseindex + '" onClick="myGrooveWriter.closeMeasureButtonClick(' + baseindex + ')" class="closeMeasureButton"><i class="fa fa-times-circle"></i></span>';
    else
      newHTML += '<span class="closeMeasureButton"><i class="fa">&nbsp;&nbsp;&nbsp;</i></span>';


    if (baseindex == this.data.numberOfMeasures) // add new measure button
      newHTML += '<span id="addMeasureButton" title="Add measure" onClick="myGrooveWriter.addMeasureButtonClick(event)"><i class="fa fa-plus"></i></span>';

    newHTML += ('</div>');

    return newHTML;
  }

  // a click on a permutation option checkbox
  permutationOptionClick(event) {

    var optionId = event.target.id;
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

  // a click on a permutation sub option checkbox
  permutationSubOptionClick(event) {

    var optionId = event.target.id;
    var checkbox = document.getElementById(optionId) as HTMLInputElement;
    var OnElseOff = checkbox.checked;

    if (OnElseOff) { // only do this if turning a sub option on
      // remove the "_sub" and the number on the end (the last char)
      var mainOption = optionId.replace("_sub", "").slice(0, -1);

      checkbox = document.getElementById(mainOption) as HTMLInputElement;
      if (checkbox)
        checkbox.checked = true;

    }

    this.refresh_ABC();
  };

  // public function
  // function to create HTML for the music staff and notes.   We usually want more than one of these
  // baseIndex is the index for the css labels "staff-container1, staff-container2"
  // indexStartForNotes is the index for the note ids.
  HTMLforPermutationOptions() {

    if (this.class_permutation_type == "none")
      return "";

    var optionTypeArray = [{
      id: "PermuationOptionsOstinato",
      subid: "PermuationOptionsOstinato_sub",
      name: "Ostinato",
      SubOptions: [],
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
      SubOptions: [],
      defaultOn: true
    }
    ];

    // change and add other options for non triplet based ostinatos
    // Most of the types have 4 sub options
    // add up beats and down beats
    // add quads
    if (!this.usingTriplets()) {
      optionTypeArray[1].SubOptions = ["1", "e", "&", "a"]; // singles
      optionTypeArray[2].SubOptions = ["1", "e", "&", "a"]; // doubles
      optionTypeArray[3].SubOptions = ["1", "e", "&", "a"]; // triples
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
        SubOptions: [],
        defaultOn: false
      });
    }

    switch (this.class_permutation_type) {
      case "snare_16ths":
        optionTypeArray.splice(0, 0, {
          id: "PermuationOptionsAccentGrid",
          subid: "",
          name: "Use Accent Grid",
          SubOptions: [],
          defaultOn: false
        });
        break;
      case "kick_16ths":
        if (!this.usingTriplets())
          optionTypeArray.splice(0, 0, {
            id: "PermuationOptionsSkipSomeFirstNotes",
            subid: "",
            name: "Simplify multiple kicks",
            SubOptions: [],
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
} // end of class

(globalThis as any).GrooveWriter = GrooveWriter;
