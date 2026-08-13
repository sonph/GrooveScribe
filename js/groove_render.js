/*jslint browser:true devel:true */
/*global Abc */
var _a, _b;
var constant_MAX_MEASURES = 10;
var constant_DEFAULT_TEMPO = 80;
var constant_NUMBER_OF_TOMS = 4;
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
function setOf(...args) {
    return new Set(args);
}
class DrumType {
    constructor(name, alternates = setOf()) {
        this.name = name;
        this.alternates = alternates;
    }
    static of(name) {
        return new _a(name);
    }
    equals(other) {
        return this.name === other.name;
    }
    isTom() {
        return _a.ALL_TOMS.has(this.name);
    }
    toString() {
        return `DrumType[${this.name}]`;
    }
}
_a = DrumType;
DrumType.NONE = new _a('None');
DrumType.STICKINGS = new _a('Stickings');
DrumType.HIHAT = new _a('H', setOf('HH'));
DrumType.SNARE = new _a('S');
DrumType.KICK = new _a('K', setOf('B', 'BD'));
DrumType.TOM1 = new _a('T1');
DrumType.TOM4 = new _a('T4');
DrumType.ALL = setOf(_a.STICKINGS, _a.HIHAT, _a.SNARE, _a.KICK, _a.TOM1, _a.TOM4);
DrumType.ALL_TOMS = setOf(_a.TOM1.name, _a.TOM4.name);
function noteAttrs(html_id_prefix, iconClass) {
    return {
        html_id_prefix: html_id_prefix,
        iconClass: iconClass
    };
}
function getAsSet(value) {
    if (typeof value === 'string') {
        return setOf(value);
    }
    return value;
}
function getFirstElement(v) {
    if (v instanceof Set) {
        return v.values().next().value || null;
    }
    return v;
}
class AbcNote {
    constructor(drumType, note, tabChar, modifier = null, htmlAttrs = null, midiNote = null) {
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
    getFirstHtmlIdPrefix() {
        if (this.htmlAttrs?.html_id_prefix instanceof Set) {
            return getFirstElement(this.htmlAttrs.html_id_prefix);
        }
        return this.htmlAttrs?.html_id_prefix || null;
    }
    isOff() {
        return this.note === _b.OFF.note;
    }
    static createAbcNoteToTabCharMap() {
        const m = new Map();
        for (let abcNote of _b.ALL_NOTES) {
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
        for (let abcNote of _b.ALL_NOTES) {
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
_b = AbcNote;
AbcNote.OFF = new _b(DrumType.NONE, '', setOf('-'), null, noteAttrs(''), null);
AbcNote.STICK_R = new _b(DrumType.STICKINGS, '"R"x', setOf('R'), null, noteAttrs('sticking_right'));
AbcNote.STICK_L = new _b(DrumType.STICKINGS, '"L"x', setOf('L'), null, noteAttrs('sticking_left'));
AbcNote.STICK_BOTH = new _b(DrumType.STICKINGS, '"R/L"x', setOf('b', 'B'), null, noteAttrs('sticking_both'));
AbcNote.STICK_COUNT = new _b(DrumType.STICKINGS, '"count"x', setOf('c'), null, noteAttrs('sticking_count'), 39);
AbcNote.STICK_OFF = new _b(DrumType.STICKINGS, '""x', setOf('-'));
AbcNote.STICKINGS_ALL = [
    _b.STICK_R,
    _b.STICK_L,
    _b.STICK_BOTH,
    _b.STICK_COUNT,
];
AbcNote.HH_RIDE = new _b(DrumType.HIHAT, "^A'", setOf('r'), null, noteAttrs('hh_ride', 'fa-dot-circle-o'), 51);
AbcNote.HH_RIDE_BELl = new _b(DrumType.HIHAT, "^B'", setOf('b', 'B'), null, noteAttrs('hh_ride_bell', 'fa-bell-o'), 53);
AbcNote.HH_COW_BELL = new _b(DrumType.HIHAT, "^D'", setOf('m', 'M'), null, noteAttrs('hh_cow_bell', 'fa-plus-square-o'), 105);
AbcNote.HH_CRASH = new _b(DrumType.HIHAT, "^c'", setOf('c'), null, noteAttrs('hh_crash', 'fa-asterisk'), 49);
AbcNote.HH_STACKER = new _b(DrumType.HIHAT, "^d'", setOf('s'), null, noteAttrs('hh_stacker', 'fa-bars'), 52);
AbcNote.HH_METRONOME_NORMAL = new _b(DrumType.HIHAT, "^e'", setOf('n'), null, noteAttrs('hh_metronome_normal', 'fa-neuter'), 77);
AbcNote.HH_METRONOME_ACCENT = new _b(DrumType.HIHAT, "^f'", setOf('N'), null, noteAttrs('hh_metronome_accent', 'fa-map-pin'), 76);
AbcNote.HH_OPEN = new _b(DrumType.HIHAT, "^g", setOf('o'), '!open!', noteAttrs(setOf('hh_cross', 'hh_open'), 'fa-circle-o'), 46);
AbcNote.HH_CLOSE = new _b(DrumType.HIHAT, "^g", setOf('+'), '!plus!', noteAttrs(setOf('hh_cross', 'hh_close'), 'fa-plus'), 44);
AbcNote.HH_ACCENT = new _b(DrumType.HIHAT, "^g", setOf('X'), '!accent!', noteAttrs(setOf('hh_cross', 'hh_accent'), 'fa-angle-right'), 108);
AbcNote.HH_NORMAL = new _b(DrumType.HIHAT, "^g", setOf('x'), null, noteAttrs('hh_cross', 'fa-times'), 42);
AbcNote.HH_ALL = [
    _b.HH_RIDE,
    _b.HH_RIDE_BELl,
    _b.HH_COW_BELL,
    _b.HH_CRASH,
    _b.HH_STACKER,
    _b.HH_METRONOME_NORMAL,
    _b.HH_METRONOME_ACCENT,
    _b.HH_OPEN,
    _b.HH_CLOSE,
    _b.HH_ACCENT,
    _b.HH_NORMAL
];
AbcNote.SN_GHOST = new _b(DrumType.SNARE, "!(.!!).!c", setOf('g'), null, noteAttrs('snare_ghost', 'fa-circle'), 21);
// snare_accent must be first, otherwise snare_circle is checked and SN_NORMAL is returned instead.
AbcNote.SN_ACCENT = new _b(DrumType.SNARE, "c", setOf('O'), '!accent!', noteAttrs(setOf('snare_accent', 'snare_circle'), 'fa-chevron-right'), 22);
AbcNote.SN_NORMAL = new _b(DrumType.SNARE, "c", setOf('o'), null, noteAttrs('snare_circle'), 38);
AbcNote.SN_XSTICK = new _b(DrumType.SNARE, "^c", setOf('x'), null, noteAttrs('snare_xstick', 'fa-times'), 37);
AbcNote.SN_BUZZ = new _b(DrumType.SNARE, "!///!c", setOf('b'), null, noteAttrs('snare_buzz', 'fa-bars'), 104);
AbcNote.SN_FLAM = new _b(DrumType.SNARE, "c", setOf('f'), '!accent!{/c}', noteAttrs('snare_flam'), 107);
AbcNote.SN_DRAG = new _b(DrumType.SNARE, "c", setOf('d'), '{//c}', noteAttrs('snare_drag'), 103);
AbcNote.SN_IDS = ['snare_circle', 'snare_ghost', 'snare_accent', 'snare_xstick', 'snare_buzz', 'snare_flam', 'snare_drag'];
AbcNote.SN_ALL = [
    _b.SN_GHOST,
    _b.SN_ACCENT,
    _b.SN_NORMAL,
    _b.SN_XSTICK,
    _b.SN_BUZZ,
    _b.SN_FLAM,
    _b.SN_DRAG
];
AbcNote.KI_SANDK = new _b(DrumType.KICK, "[F^d,]", setOf('X'), null, noteAttrs(setOf('kick_circle', 'kick_splash')));
AbcNote.KI_SPLASH = new _b(DrumType.KICK, "^d,", setOf('x'), null, noteAttrs('kick_splash', 'fa-times'), 36);
AbcNote.KI_NORMAL = new _b(DrumType.KICK, "F", setOf('o'), null, noteAttrs('kick_circle'), 35);
AbcNote.T1_NORMAL = new _b(DrumType.TOM1, "e", setOf('o'), null, noteAttrs('tom_circle1-'), 48);
AbcNote.T4_NORMAL = new _b(DrumType.TOM4, "A", setOf('o'), null, noteAttrs('tom_circle4-'), 43);
AbcNote.ALL_NOTES = [
    _b.STICK_R,
    _b.STICK_L,
    _b.STICK_BOTH,
    _b.STICK_COUNT,
    _b.STICK_OFF,
    _b.HH_RIDE,
    _b.HH_RIDE_BELl,
    _b.HH_COW_BELL,
    _b.HH_CRASH,
    _b.HH_STACKER,
    _b.HH_METRONOME_NORMAL,
    _b.HH_METRONOME_ACCENT,
    _b.HH_OPEN,
    _b.HH_CLOSE,
    _b.HH_ACCENT,
    _b.HH_NORMAL,
    _b.SN_GHOST,
    _b.SN_ACCENT,
    _b.SN_NORMAL,
    _b.SN_XSTICK,
    _b.SN_BUZZ,
    _b.SN_FLAM,
    _b.SN_DRAG,
    _b.KI_SANDK,
    _b.KI_SPLASH,
    _b.KI_NORMAL,
    _b.T1_NORMAL,
    _b.T4_NORMAL,
];
AbcNote.ABC_NOTE_TO_TAB_CHAR = _b.createAbcNoteToTabCharMap();
AbcNote.TAB_CHAR_TO_ABC_NOTE = _b.createTabCharToAbcNoteMap();
// DrumType and note string to tab char string.
function abcNoteToTabChar(drumType, abcNote) {
    if (abcNote instanceof AbcNote) {
        abcNote = abcNote.note;
    }
    return AbcNote.ABC_NOTE_TO_TAB_CHAR.get(drumType.name)?.get(abcNote)?.values().next().value || null;
}
// DrumType and tab char string to AbcNote.
function tabCharToAbcNote(drumType, tabChar) {
    return AbcNote.TAB_CHAR_TO_ABC_NOTE.get(drumType.name)?.get(tabChar) || null;
}
class Subdivision {
    constructor(number) {
        if (typeof number === 'number' && Number.isInteger(number) && number >= 0) {
            this.value = number;
        }
        else {
            console.log(`Invalid Subdivision value: ${number}, default to QUARTER.`);
            this.value = Subdivision.QUARTER.value;
        }
    }
    isTriplet() {
        return this.value % 12 == 0;
    }
    // Denominator for ABC's L: header. Triplets fix L:1/32 with note lengths
    // scaled to 48 units per 4/4 measure — abc2svg rejects fractional L: values
    // like 1/12, and (p:q:r triplet markers reconcile the mismatch with M:4/4.
    abcNoteLength() {
        return this.isTriplet() ? 32 : this.value;
    }
    // Length (in L: units) of a single grid position at this subdivision.
    abcPositionLength() {
        return this.isTriplet() ? 48 / this.value : 1;
    }
    static of(number) {
        return new Subdivision(number);
    }
    equals(other) {
        return this.value === other.value;
    }
    divideBy(other) {
        return other.value / this.value;
    }
}
Subdivision.NONE = new Subdivision(0);
Subdivision.WHOLE = new Subdivision(1);
Subdivision.HALF = new Subdivision(2);
Subdivision.QUARTER = new Subdivision(4);
Subdivision.EIGHTH = new Subdivision(8);
Subdivision.EIGHTH_TRIPLET = new Subdivision(12);
Subdivision.SIXTEENTH = new Subdivision(16);
Subdivision.SIXTEENTH_TRIPLET = new Subdivision(24);
Subdivision.S_32ND = new Subdivision(32);
Subdivision.S_48TH = new Subdivision(48);
class TimeSignature {
    constructor(top, bottom) {
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
    equals(other) {
        return this.top === other.top && this.bottom.equals(other.bottom);
    }
    static fromString(timeSigString) {
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
    }
    ;
}
TimeSignature.COMMON_TIME_44 = new TimeSignature(4, Subdivision.QUARTER);
class Measure {
    static getHiHatDefaultStep(subdivision) {
        switch (subdivision.value) {
            case 8:
                return 1;
            case 16:
                return 2;
            case 12:
                return 3;
            case 24:
                return 3;
            case 32:
                return 4;
            case 48:
                return 6;
            default:
                return subdivision.isTriplet() ? 3 : Math.max(1, Math.floor(subdivision.value / 8));
        }
    }
    constructor(timeSig, tabSubdivision, populateDefault = true) {
        this.timeSig = timeSig;
        this.tabSubdivision = tabSubdivision;
        const notesPerBeat = timeSig.bottom.divideBy(tabSubdivision);
        this.notesPerMeasure = notesPerBeat * timeSig.top;
        // Stores tab note string or `null`. Use getArray(DrumType) instead of accessing this directly.
        this.arrays = new Map();
        for (const drum of DrumType.ALL) {
            this.arrays.set(drum.name, Measure.createEmptyArrayOfLength(this.notesPerMeasure));
        }
        if (populateDefault) {
            this.populateDefaultGroove();
        }
    }
    populateDefaultGroove() {
        const notesPerBeat = this.timeSig.bottom.divideBy(this.tabSubdivision);
        const hiHatStep = Measure.getHiHatDefaultStep(this.tabSubdivision);
        // Hi-hat: on each beat and in between
        Measure.fillArray(this.getArray(DrumType.HIHAT), AbcNote.HH_NORMAL.getFirstTabChar() || 'x', 0, hiHatStep);
        // Kick: odd beats (1, 3, 5, etc.) -> beat index 0, 2, 4, ...
        const kickArray = this.getArray(DrumType.KICK);
        for (let beat = 0; beat < this.timeSig.top; beat += 2) {
            const pos = beat * notesPerBeat;
            if (pos < this.notesPerMeasure) {
                kickArray[pos] = AbcNote.KI_NORMAL.getFirstTabChar() || 'o';
            }
        }
        // Snare: even beats (2, 4, 6, etc.) -> beat index 1, 3, 5, ...
        const snareArray = this.getArray(DrumType.SNARE);
        for (let beat = 1; beat < this.timeSig.top; beat += 2) {
            const pos = beat * notesPerBeat;
            if (pos < this.notesPerMeasure) {
                snareArray[pos] = AbcNote.SN_ACCENT.getFirstTabChar() || 'O';
            }
        }
    }
    isEmpty() {
        for (const drum of DrumType.ALL) {
            const arr = this.arrays.get(drum.name);
            if (arr && arr.some(x => x !== null && x !== '-' && x !== '')) {
                return false;
            }
        }
        return true;
    }
    // String should be without the bar separators `|`.
    setDataFromString(drumType, string) {
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
    toString(drumType) {
        if (!this.getArray(drumType)) {
            console.log(`no value for Drum type: ${drumType}`);
            return '';
        }
        return this.getArray(drumType).map((e) => e || '-').join('');
    }
    getArray(drumType) {
        return this.arrays.get(drumType.name) || [];
    }
    static createEmptyArrayOfLength(length) {
        const array = new Array(length);
        array.fill(null);
        return array;
    }
    static fillArray(array, note, firstPosition, distance) {
        for (let i = firstPosition; i < array.length; i += distance) {
            array[i] = note;
        }
        return array;
    }
    getScaledArray(drumType, newSize) {
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
    clone() {
        const copy = new Measure(this.timeSig, this.tabSubdivision);
        for (const drum of DrumType.ALL) {
            const arr = this.getArray(drum);
            if (arr) {
                copy.arrays.set(drum.name, [...arr]);
            }
        }
        return copy;
    }
}
// Pure parser: URL query string → typed decoded fields. No DOM, no side effects.
function decodeGrooveUrl(paramsString) {
    const params = new URLSearchParams(paramsString);
    const drumTabs = new Map();
    for (const drum of DrumType.ALL) {
        const data = params.get(drum.name);
        if (data) {
            drumTabs.set(drum.name, data);
        }
    }
    const repeatBegins = new Set();
    const rbParam = params.get('RepeatBegins');
    if (rbParam) {
        rbParam.split(';').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n) && n > 0).forEach(n => repeatBegins.add(n));
    }
    const repeatEnds = new Set();
    const reParam = params.get('RepeatEnds');
    if (reParam) {
        reParam.split(';').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n) && n > 0).forEach(n => repeatEnds.add(n));
    }
    const repeatEndings = new Map();
    const rendParam = params.get('RepeatEndings');
    if (rendParam) {
        rendParam.split(';').forEach(entry => {
            const parts = entry.split(':');
            if (parts.length >= 2) {
                const m = parseInt(parts[0].trim(), 10);
                const ending = parts[1].trim();
                if (!isNaN(m) && m > 0 && ending) {
                    repeatEndings.set(m, ending);
                }
            }
        });
    }
    const measureText = new Map();
    const mtParam = params.get('MeasureText');
    if (mtParam) {
        mtParam.split(';').forEach(entry => {
            const parts = entry.split(':');
            if (parts.length >= 2) {
                const m = parseInt(parts[0].trim(), 10);
                if (isNaN(m) || m <= 0)
                    return;
                let isBegin = true;
                let text = "";
                if (parts.length === 2) {
                    text = decodeURIComponent(parts[1]);
                }
                else {
                    const type = parts[1].toLowerCase();
                    isBegin = type.startsWith('b') || type.startsWith('s');
                    text = decodeURIComponent(parts.slice(2).join(':'));
                }
                if (!measureText.has(m)) {
                    measureText.set(m, {});
                }
                const obj = measureText.get(m);
                if (isBegin) {
                    obj.begin = text;
                }
                else {
                    obj.end = text;
                }
            }
        });
    }
    // Backward compatibility: "subText" parameter is merged into "Comments", with "Comments" taking priority.
    const rawComments = params.get('Comments') ?? params.get('comments');
    const rawSubText = params.get('subText') ?? params.get('subtext');
    let comments = '';
    if (rawComments !== null && rawComments !== undefined) {
        comments = decodeURIComponent(rawComments);
    }
    else if (rawSubText !== null && rawSubText !== undefined) {
        comments = decodeURIComponent(rawSubText);
    }
    const subText = comments;
    return {
        viewMode: params.get('Mode') === 'view',
        debugMode: params.get('Debug') === '1',
        timeSig: params.get('TimeSig') ? TimeSignature.fromString(params.get('TimeSig')) : TimeSignature.COMMON_TIME_44,
        subdivision: params.get('Div') ? Subdivision.of(parseInt(params.get('Div'))) : Subdivision.EIGHTH,
        metronomeFrequency: Math.max(parseInt(params.get('MetronomeFreq')) || 0, 0),
        title: params.get('Title') || '',
        author: params.get('Author') || '',
        comments: comments,
        tempo: Math.min(Math.max(parseInt(params.get('Tempo')) || constant_DEFAULT_TEMPO, 20), 400),
        swingPercent: Math.min(Math.max(parseInt(params.get('Swing')) || 0, 0), 100),
        showLegend: params.get('Legend') === '1' || params.get('showLegend') === '1',
        showTempo: params.get('ShowTempo') === '1' || params.get('EmbedTempoTimeSig') === 'true',
        repeatBegins,
        repeatEnds,
        repeatEndings,
        measureText,
        subText,
        drumTabs,
    };
}
function buildMeasuresFromTabs(drumTabs, timeSig, subdivision) {
    const measures = [];
    for (const drum of DrumType.ALL) {
        const data = drumTabs.get(drum.name);
        if (!data)
            continue;
        const measureData = GrooveData.splitTabIntoMeasureStrings(data);
        for (let i = 0; i < measureData.length; i++) {
            if (measures[i] === undefined) {
                measures.push(new Measure(timeSig, subdivision, true));
            }
            measures[i].setDataFromString(drum, measureData[i]);
        }
    }
    return measures;
}
// Build query string manually (not URLSearchParams) so `|` and `/` are preserved
// verbatim in drum tabs and time signatures — percent-encoding breaks the tabs.
function encodeGrooveQueryString(state) {
    const parts = [];
    const add = (key, value) => {
        if (value)
            parts.push(`${key}=${value}`);
    };
    add('Debug', state.debugMode ? '1' : '');
    add('Mode', state.viewMode ? 'view' : 'edit');
    add('GDB_Author', state.grooveDBAuthoring ? '1' : '');
    add('TimeSig', state.timeSig.toString());
    add('Div', state.subdivision.value.toString());
    add('Title', encodeURIComponent(state.title));
    add('Author', encodeURIComponent(state.author));
    // Backward compatibility: subText is merged into Comments, with Comments taking priority
    add('Comments', encodeURIComponent(state.comments || state.subText || ''));
    add('Tempo', state.tempo.toString());
    add('Swing', state.swingPercent ? state.swingPercent.toString() : '');
    add('MetronomeFreq', state.metronomeFrequency ? state.metronomeFrequency.toString() : '');
    if (state.showLegend)
        add('Legend', '1');
    if (state.showTempo)
        add('ShowTempo', '1');
    if (state.repeatBegins && state.repeatBegins.size > 0) {
        add('RepeatBegins', Array.from(state.repeatBegins).sort((a, b) => a - b).join(';'));
    }
    if (state.repeatEnds && state.repeatEnds.size > 0) {
        add('RepeatEnds', Array.from(state.repeatEnds).sort((a, b) => a - b).join(';'));
    }
    if (state.repeatEndings && state.repeatEndings.size > 0) {
        const endings = Array.from(state.repeatEndings.entries())
            .filter(([m, val]) => val && val.length > 0)
            .sort((a, b) => a[0] - b[0])
            .map(([m, val]) => `${m}:${val}`)
            .join(';');
        if (endings.length > 0) {
            add('RepeatEndings', endings);
        }
    }
    if (state.measureText && state.measureText.size > 0) {
        const textParts = [];
        const sortedMeasures = Array.from(state.measureText.keys()).sort((a, b) => a - b);
        for (const m of sortedMeasures) {
            const entry = state.measureText.get(m);
            if (!entry)
                continue;
            if (entry.begin && entry.begin.trim().length > 0) {
                textParts.push(`${m}:b:${encodeURIComponent(entry.begin.trim())}`);
            }
            if (entry.end && entry.end.trim().length > 0) {
                textParts.push(`${m}:e:${encodeURIComponent(entry.end.trim())}`);
            }
        }
        if (textParts.length > 0) {
            add('MeasureText', textParts.join(';'));
        }
    }
    for (const drum of DrumType.ALL) {
        if (!state.showStickings && drum.equals(DrumType.STICKINGS))
            continue;
        if (!state.showToms && drum.isTom())
            continue;
        const arrays = [];
        for (const measure of state.measures) {
            const str = measure.toString(drum);
            if (str)
                arrays.push(str);
        }
        parts.push(`${drum.name}=|${arrays.join('|')}|`);
    }
    return '?' + parts.join('&');
}
class GrooveData {
    constructor(timeSig = TimeSignature.COMMON_TIME_44, subdivision = Subdivision.EIGHTH, numberOfMeasures = 1) {
        this.timeSig = timeSig;
        this.subdivision = subdivision;
        this.measures = [];
        for (let i = 0; i < numberOfMeasures; i++) {
            this.measures.push(new Measure(this.timeSig, this.subdivision));
        }
        this.showTempo = false;
        this.showToms = false;
        this.showStickings = false;
        this.showLegend = false;
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
        this.repeatBegins = new Set();
        this.repeatEnds = new Set();
        this.repeatEndings = new Map();
        this.measureText = new Map();
        this.subText = "";
    }
    get numberOfMeasures() {
        return this.measures.length;
    }
    get notesPerMeasure() {
        return this.timeSig.top * this.timeSig.bottom.divideBy(this.subdivision);
    }
    get notesPerBeat() {
        return this.timeSig.bottom.divideBy(this.subdivision);
    }
    fromUrl(paramsString) {
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
        this.showLegend = decoded.showLegend;
        this.showTempo = decoded.showTempo;
        this.repeatBegins = decoded.repeatBegins;
        this.repeatEnds = decoded.repeatEnds;
        this.repeatEndings = decoded.repeatEndings;
        this.measureText = decoded.measureText;
        this.subText = decoded.subText;
        const measures = buildMeasuresFromTabs(decoded.drumTabs, this.timeSig, this.subdivision);
        const allEmpty = measures.length === 0 || measures.every(m => m.isEmpty());
        if (!allEmpty) {
            this.measures = measures;
        }
        else {
            // Upon loading, if all the arrays are empty, then load an initial groove.
            const numMeasures = measures.length > 0 ? measures.length : 1;
            this.measures = [];
            for (let i = 0; i < numMeasures; i++) {
                this.measures.push(new Measure(this.timeSig, this.subdivision, true));
            }
        }
        return this;
    }
    toQueryString() {
        return encodeGrooveQueryString(this);
    }
    toEditorUrl(baseUrl) {
        const defaultBase = (typeof window !== "undefined" && window.location && window.location.href.includes('render.html'))
            ? window.location.href.replace(/render\.html.*$/, 'index.html')
            : 'https://sonpham.me/GrooveScribe/index.html';
        const base = baseUrl || defaultBase;
        return base + this.toQueryString();
    }
    toUrl(url_destination = '') {
        const base = typeof window !== "undefined" && window.location
            ? window.location.protocol + "//" + window.location.host + window.location.pathname
            : '';
        return base + encodeGrooveQueryString(this);
    }
    static splitTabIntoMeasureStrings(string) {
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
    static hasNotesAtPosition(i, hh_array, snare_array, kick_array, tom1_array, tom4_array) {
        if (i >= hh_array.length)
            return false;
        return hh_array[i] !== null
            || snare_array[i] !== null
            || kick_array[i] !== null
            || (tom1_array != null && tom1_array[i] !== null)
            || (tom4_array != null && tom4_array[i] !== null);
    }
    // Returns null if no note at this position, otherwise, a list of AbcNote objects.
    static getNotesAtPosition(i, hh_array, snare_array, kick_array, tom1_array, tom4_array) {
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
    // Same as getNotesAtPosition, but with snare BEFORE hi-hat in chord order
    static getTripletNotesAtPosition(i, hh_array, snare_array, kick_array, tom1_array, tom4_array) {
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
    static appendAbcNotes(abcs, notes, length) {
        if (length === 0) {
            return;
        }
        if (notes === null || notes.length === 0) {
            // Append rest.
            abcs.push('z' + length);
            return;
        }
        if (notes.length === 1) {
            if (notes[0].note.startsWith('[') && notes[0].note.endsWith(']')) {
                const inner = notes[0].note.slice(1, -1);
                abcs.push((notes[0].modifier || '') + '[' + inner + length + ']');
            }
            else {
                abcs.push((notes[0].modifier || '') + notes[0].note + length);
            }
        }
        else {
            // Multiple notes, use a chord.
            const accents = new Set();
            for (const note of notes) {
                if (note.modifier) {
                    accents.add(note.modifier || '');
                }
            }
            abcs.push(Array.from(accents).join('') + '[' + notes.map(n => {
                const inner = n.note.startsWith('[') && n.note.endsWith(']') ? n.note.slice(1, -1) : n.note;
                return inner + length;
            }).join('') + ']');
        }
    }
    // Emit ABC for one measure of a non-triplet subdivision.
    appendPlainMeasureAbc(line, drumArrays) {
        const [hh, sn, kk, t1, t4] = drumArrays;
        const numNotesPerBeat = this.timeSig.bottom.divideBy(this.subdivision);
        var currentNotes = null;
        var currentNotesPosition = 0;
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
            }
            else if (atStartOfBeat) {
                GrooveData.appendAbcNotes(line, currentNotes, i - currentNotesPosition);
                currentNotes = null;
                currentNotesPosition = i;
            }
            if (atStartOfBeat) {
                line.push(' ');
            }
        }
    }
    // Emit ABC for one measure of a triplet subdivision.
    appendTripletMeasureAbc(line, drumArrays) {
        const [hh, sn, kk, t1, t4] = drumArrays;
        const noteLength = this.subdivision.abcPositionLength();
        const notesPerBeat = this.timeSig.bottom.divideBy(this.subdivision);
        const marker = `(${notesPerBeat}:${notesPerBeat}:${notesPerBeat}`;
        for (let beat = 0; beat < hh.length; beat += notesPerBeat) {
            if (beat > 0) {
                line.push(' ');
            }
            let hasSubdivisions = false;
            for (let k = 1; k < notesPerBeat; k++) {
                if (GrooveData.hasNotesAtPosition(beat + k, hh, sn, kk, t1, t4)) {
                    hasSubdivisions = true;
                    break;
                }
            }
            if (!hasSubdivisions) {
                const beatLength = 32 / this.timeSig.bottom.value;
                const notes = GrooveData.getTripletNotesAtPosition(beat, hh, sn, kk, t1, t4);
                GrooveData.appendAbcNotes(line, notes, beatLength);
            }
            else {
                line.push(marker);
                for (let k = 0; k < notesPerBeat; k++) {
                    const i = beat + k;
                    const notes = GrooveData.getTripletNotesAtPosition(i, hh, sn, kk, t1, t4);
                    GrooveData.appendAbcNotes(line, notes, noteLength);
                }
            }
        }
    }
    // Generates ABC notation for Stickings and Hands voices.
    getAbcNotation() {
        const isTriplet = this.subdivision.isTriplet();
        const stickingsVoiceParts = [];
        const handsVoiceParts = [];
        for (let measureNum = 0; measureNum < this.measures.length; measureNum++) {
            const measure = this.measures[measureNum];
            const m = measureNum + 1;
            const lastMeasure = (measureNum === this.measures.length - 1);
            let measureRests;
            if (isTriplet) {
                const notesPerBeat = this.timeSig.bottom.divideBy(this.subdivision);
                const perBeat = ('x' + this.subdivision.abcPositionLength()).repeat(notesPerBeat);
                measureRests = Array(this.timeSig.top).fill(perBeat).join(' ');
            }
            else {
                const abcUnitsPerBeat = this.subdivision.abcNoteLength() / this.timeSig.bottom.value;
                const beatRest = 'x' + abcUnitsPerBeat;
                measureRests = Array(this.timeSig.top).fill(beatRest).join(' ');
            }
            const hasRepeatBegin = this.repeatBegins && this.repeatBegins.has(m);
            const hasRepeatEnd = this.repeatEnds && this.repeatEnds.has(m);
            const altEnding = this.repeatEndings ? this.repeatEndings.get(m) : undefined;
            const textBegin = this.measureText ? this.measureText.get(m)?.begin : undefined;
            const textEnd = this.measureText ? this.measureText.get(m)?.end : undefined;
            let beginPrefix = '';
            if (hasRepeatBegin) {
                beginPrefix = altEnding ? `|:[${altEnding}` : '|:';
            }
            else if (altEnding) {
                beginPrefix = `[${altEnding}`;
            }
            let endBar;
            if (hasRepeatEnd) {
                endBar = ':|';
            }
            else if (lastMeasure) {
                endBar = '||';
            }
            else {
                endBar = '|';
            }
            // Stickings voice for measure m
            const stickingsArray = measure.getArray(DrumType.STICKINGS);
            const hasMeasureStickings = stickingsArray && stickingsArray.some(x => x !== null && x !== '-' && x !== '');
            let stickingMeasureContent;
            if (hasMeasureStickings) {
                const posLen = isTriplet ? this.subdivision.abcPositionLength() : (this.subdivision.abcNoteLength() / this.subdivision.value);
                const notesPerBeat = this.timeSig.bottom.divideBy(this.subdivision);
                const beatParts = [];
                for (let beat = 0; beat < this.timeSig.top; beat++) {
                    const slotParts = [];
                    for (let i = 0; i < notesPerBeat; i++) {
                        const idx = beat * notesPerBeat + i;
                        const val = stickingsArray[idx];
                        if (val === 'R')
                            slotParts.push(`"R"x${posLen}`);
                        else if (val === 'L')
                            slotParts.push(`"L"x${posLen}`);
                        else if (val === 'b' || val === 'B')
                            slotParts.push(`"R/L"x${posLen}`);
                        else if (val === 'c')
                            slotParts.push(`"count"x${posLen}`);
                        else
                            slotParts.push(`x${posLen}`);
                    }
                    beatParts.push(slotParts.join(''));
                }
                stickingMeasureContent = beatParts.join(' ');
            }
            else {
                stickingMeasureContent = measureRests;
            }
            let stickingPart = (beginPrefix ? beginPrefix + ' ' : '') + stickingMeasureContent + ' ' + endBar;
            stickingsVoiceParts.push(stickingPart);
            // Hands voice for measure m
            const hh_array = measure.getArray(DrumType.HIHAT);
            const snare_array = measure.getArray(DrumType.SNARE);
            const kick_array = measure.getArray(DrumType.KICK);
            const tom1_array = measure.getArray(DrumType.TOM1);
            const tom4_array = measure.getArray(DrumType.TOM4);
            const drumArrays = [hh_array, snare_array, kick_array, tom1_array, tom4_array];
            const handsSegments = [];
            if (beginPrefix) {
                handsSegments.push(beginPrefix + ' ');
            }
            if (textBegin) {
                handsSegments.push(`"${textBegin}"`);
            }
            if (isTriplet) {
                this.appendTripletMeasureAbc(handsSegments, drumArrays);
            }
            else {
                this.appendPlainMeasureAbc(handsSegments, drumArrays);
            }
            if (textEnd) {
                handsSegments.push(`"${textEnd}"`);
            }
            const endBarWithSpacing = isTriplet ? ' ' + endBar : (lastMeasure && !hasRepeatEnd ? ' ' + endBar : endBar);
            handsSegments.push(endBarWithSpacing);
            handsVoiceParts.push(handsSegments.join(''));
        }
        const lines = [];
        lines.push('V:Stickings\n' + stickingsVoiceParts.join(' '));
        lines.push('V:Hands stem=up\n%%voicemap drum\n' + handsVoiceParts.join(' '));
        return lines.join('\n') + '\n';
    }
    getAbcHeader(isPermutation, renderWidth, showLegend = false) {
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
        if (showLegend || this.showLegend) {
            fullABC += "%%staves (Stickings Hands Feet)\n";
        }
        else {
            fullABC += "%%staves (Stickings Hands)\n";
        }
        if (this.comments) {
            fullABC += `P: ${this.comments}\n%%musicspace 20px\n`;
        }
        fullABC += "K:C clef=perc\n";
        if (showLegend || this.showLegend) {
            fullABC += 'V:Stickings\n' +
                'x8 x8 x8 x8 x8 x8 x8 x8 x8 x8 x8 x8 x8 x8 x8 x8 ||\n' +
                'V:Hands stem=up \n' +
                '%%voicemap drum\n' +
                '"^Hi-Hat"^g8 "^Open"!open!^g8 ' +
                '"^Crash"^c\'8 "^Stacker"^d\'8 "^Ride"^A\'8 "^Ride Bell"^B\'8 x4 "^Tom"e8 "^Tom"A8 "^Snare"c8 "^Buzz"!///!c8 "^Cross"^c8 "^Ghost  "!(.!!).!c8 "^Flam"{/c}c8  x20 ||\n' +
                'V:Feet stem=down \n' +
                '%%voicemap drum\n' +
                'x104 "^Kick"F8 "^HH foot"^d,8 x8 ||\n' +
                'T:\n';
        }
        if (this.showTempo) {
            const beatUnit = (this.timeSig.bottom.value === 8 && this.timeSig.top % 3 === 0) ? '3/8' : `1/${this.timeSig.bottom.value}`;
            fullABC += `Q: ${beatUnit}=${this.tempo}\n`;
        }
        return fullABC;
    }
}
// Callback class for abc2svg generator library.
// See https://chiselapp.com/user/moinejf/repository/abc2svg/wiki?name=interface-1.
class SVGLibCallback {
    constructor() {
        this.abc_obj = null;
        this.abc_svg_output = "";
        this.abc_error_output = "";
        this.svg_highlight_y = 0;
        this.svg_highlight_h = 44;
        this.page_format = true;
        this.grooveUtilsUniqueIndex = 0;
        this.abcNoteNumIndex = 0;
    }
    read_file(fn) {
        return "";
    }
    ;
    errmsg(msg, l, c) {
        this.abc_error_output += msg + "<br/>\n";
    }
    ;
    get_abcmodel(tsfirst, voice_tb, music_types) { }
    ;
    anno_start(type, start, stop, x, y, w, h) { }
    ;
    anno_stop(type, start, stop, x, y, w, h) {
        if (type == "bar") {
            this.svg_highlight_y = y + 5;
            this.svg_highlight_h = h + 10;
        }
        if (type == "note" || type == "grace") {
            y = this.svg_highlight_y;
            h = this.svg_highlight_h;
            if (this.abc_obj) {
                this.abc_obj.out_svg('<rect class="abcr" id="abcNoteNum_' + this.grooveUtilsUniqueIndex + "_" + this.abcNoteNumIndex + '" x="');
                this.abc_obj.out_sxsy(x, '" y="', y);
                this.abc_obj.out_svg('" width="' + w.toFixed(2) + '" height="' + h.toFixed(2) + '"/>\n');
            }
            // Grace note is attached to the primary note, so keep the same note index.
            if (type != "grace")
                this.abcNoteNumIndex++;
        }
    }
    ;
    img_out(str) {
        this.abc_svg_output += str;
    }
    ;
}
class GrooveRenderer {
    static renderABCtoSVG(abcString, uniqueIndex = 0, isLegendVisible = false) {
        const callback = new SVGLibCallback();
        callback.grooveUtilsUniqueIndex = uniqueIndex;
        if (isLegendVisible) {
            callback.abcNoteNumIndex = -15;
        }
        else {
            callback.abcNoteNumIndex = 0;
        }
        if (typeof Abc !== "undefined") {
            const abc_obj = new Abc(callback);
            callback.abc_obj = abc_obj;
            abc_obj.tosvg("SOURCE", abcString);
        }
        return {
            svg: callback.abc_svg_output,
            error_html: callback.abc_error_output
        };
    }
}
// Global and node environment exports
globalThis.Subdivision = Subdivision;
globalThis.GrooveData = GrooveData;
globalThis.TimeSignature = TimeSignature;
globalThis.AbcNote = AbcNote;
globalThis.DrumType = DrumType;
globalThis.Measure = Measure;
globalThis.GrooveRenderer = GrooveRenderer;
globalThis.SVGLibCallback = SVGLibCallback;
globalThis.abcNoteToTabChar = abcNoteToTabChar;
globalThis.tabCharToAbcNote = tabCharToAbcNote;
globalThis.getAsSet = getAsSet;
globalThis.setOf = setOf;
globalThis.getFirstElement = getFirstElement;
globalThis.decodeGrooveUrl = decodeGrooveUrl;
globalThis.encodeGrooveQueryString = encodeGrooveQueryString;
globalThis.buildMeasuresFromTabs = buildMeasuresFromTabs;
globalThis.constant_ABC_HH_Normal = constant_ABC_HH_Normal;
globalThis.constant_ABC_HH_Accent = constant_ABC_HH_Accent;
globalThis.constant_ABC_HH_Open = constant_ABC_HH_Open;
globalThis.constant_ABC_HH_Close = constant_ABC_HH_Close;
globalThis.constant_ABC_HH_Ride = constant_ABC_HH_Ride;
globalThis.constant_ABC_HH_Ride_Bell = constant_ABC_HH_Ride_Bell;
globalThis.constant_ABC_HH_Cow_Bell = constant_ABC_HH_Cow_Bell;
globalThis.constant_ABC_HH_Crash = constant_ABC_HH_Crash;
globalThis.constant_ABC_HH_Stacker = constant_ABC_HH_Stacker;
globalThis.constant_ABC_HH_Metronome_Normal = constant_ABC_HH_Metronome_Normal;
globalThis.constant_ABC_HH_Metronome_Accent = constant_ABC_HH_Metronome_Accent;
globalThis.constant_ABC_SN_Normal = constant_ABC_SN_Normal;
globalThis.constant_ABC_SN_Accent = constant_ABC_SN_Accent;
globalThis.constant_ABC_SN_Ghost = constant_ABC_SN_Ghost;
globalThis.constant_ABC_SN_Flam = constant_ABC_SN_Flam;
globalThis.constant_ABC_SN_Drag = constant_ABC_SN_Drag;
globalThis.constant_ABC_SN_XStick = constant_ABC_SN_XStick;
globalThis.constant_ABC_SN_Buzz = constant_ABC_SN_Buzz;
globalThis.constant_ABC_KI_Normal = constant_ABC_KI_Normal;
globalThis.constant_ABC_KI_Splash = constant_ABC_KI_Splash;
globalThis.constant_ABC_KI_SandK = constant_ABC_KI_SandK;
globalThis.constant_ABC_T1_Normal = constant_ABC_T1_Normal;
globalThis.constant_ABC_T2_Normal = constant_ABC_T2_Normal;
globalThis.constant_ABC_T3_Normal = constant_ABC_T3_Normal;
globalThis.constant_ABC_T4_Normal = constant_ABC_T4_Normal;
globalThis.constant_ABC_STICK_R = constant_ABC_STICK_R;
globalThis.constant_ABC_STICK_L = constant_ABC_STICK_L;
globalThis.constant_ABC_STICK_BOTH = constant_ABC_STICK_BOTH;
globalThis.constant_ABC_STICK_COUNT = constant_ABC_STICK_COUNT;
globalThis.constant_ABC_STICK_OFF = constant_ABC_STICK_OFF;
globalThis.constant_ABC_OFF = constant_ABC_OFF;
globalThis.constant_MAX_MEASURES = constant_MAX_MEASURES;
globalThis.constant_DEFAULT_TEMPO = constant_DEFAULT_TEMPO;
globalThis.constant_NUMBER_OF_TOMS = constant_NUMBER_OF_TOMS;
//# sourceMappingURL=groove_render.js.map