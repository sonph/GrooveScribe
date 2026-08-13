describe('groove_render.js isolated execution', () => {
  beforeAll(() => {
    // Load ONLY groove_render.js - completely isolated from audio, midi, UI, or groove_utils
    require('../js/groove_render.js');
  });

  test('GrooveData fromUrl and getAbcNotation work in isolation', () => {
    const url = '?TimeSig=4/4&Div=8&Tempo=80&H=|xxxxxxxx|&S=|--o---o-|&K=|o---o---|';
    const data = new GrooveData().fromUrl(url);

    expect(data.timeSig.toString()).toBe('4/4');
    expect(data.subdivision.value).toBe(8);
    expect(data.tempo).toBe(80);
    expect(data.measures.length).toBe(1);

    const notation = data.getAbcNotation();
    expect(notation).toContain('V:Stickings');
    expect(notation).toContain('V:Hands stem=up');
    expect(notation).toContain('[^g1F1]^g1 [^g1c1]^g1 [^g1F1]^g1 [^g1c1]^g1');
  });

  test('GrooveData getAbcHeader and repeats/subText work in isolation', () => {
    const url = '?TimeSig=4/4&Div=12&Tempo=96&ShowTempo=1&subText=Verse&RepeatBegins=1&RepeatEnds=1&H=|xxxxxxxxxxxx|&S=|---O-----O--|&K=|o-----o-----|';
    const data = new GrooveData().fromUrl(url);

    expect(data.subText).toBe('Verse');
    expect(data.showTempo).toBe(true);

    const header = data.getAbcHeader(false, 600, false);
    expect(header).toContain('M:4/4');
    expect(header).toContain('Q: 1/4=96');

    const notation = data.getAbcNotation();
    expect(notation).toContain('|:');
    expect(notation).toContain(':|');
  });

  test('GrooveRenderer.renderABCtoSVG works when Abc engine is present', () => {
    // Mock minimal Abc engine
    global.Abc = function(callback) {
      this.tosvg = (file, src) => {
        callback.img_out('<svg>mocked</svg>');
      };
    };

    const data = new GrooveData().fromUrl('TimeSig=4/4&Div=8&H=|xxxxxxxx|&S=|--o---o-|&K=|o---o---|');
    const fullAbc = data.getAbcHeader(false, 600, false) + data.getAbcNotation();
    const result = GrooveRenderer.renderABCtoSVG(fullAbc);

    expect(result.svg).toBe('<svg>mocked</svg>');
    expect(result.error_html).toBe('');
  });

  test('GrooveData toEditorUrl and toQueryString encode all embed parameters', () => {
    const url = '?TimeSig=4/4&Div=8&Tempo=80&ShowTempo=1&subText=Chorus%20Section&RepeatBegins=1;3&RepeatEnds=2;4&RepeatEndings=2:1;4:2&MeasureText=1:b:Intro;4:e:Outro&H=|xxxxxxxx|xxxxxxxx|xxxxxxxx|xxxxxxxx|&S=|--o---o-|--o---o-|--o---o-|--o---o-|&K=|o---o---|o---o---|o---o---|o---o---|';
    const data = new GrooveData().fromUrl(url);

    expect(data.comments).toBe('Chorus Section');
    const qs = data.toQueryString();
    expect(qs).toContain('ShowTempo=1');
    expect(qs).not.toContain('EmbedTempoTimeSig');
    expect(qs).toContain('Comments=Chorus%20Section');
    expect(qs).not.toContain('subText=');
    expect(qs).toContain('RepeatBegins=1;3');
    expect(qs).toContain('RepeatEnds=2;4');
    expect(qs).toContain('RepeatEndings=2:1;4:2');
    expect(qs).toContain('MeasureText=1:b:Intro;4:e:Outro');

    const editorUrl = data.toEditorUrl();
    expect(editorUrl).toContain('https://sonpham.me/GrooveScribe/index.html?');
    expect(editorUrl).toContain('ShowTempo=1');
    expect(editorUrl).not.toContain('EmbedTempoTimeSig');
    expect(editorUrl).toContain('Comments=Chorus%20Section');
    expect(editorUrl).not.toContain('subText=');
    expect(editorUrl).toContain('RepeatBegins=1;3');
    expect(editorUrl).toContain('RepeatEnds=2;4');
    expect(editorUrl).toContain('RepeatEndings=2:1;4:2');
    expect(editorUrl).toContain('MeasureText=1:b:Intro;4:e:Outro');
  });

  test('GrooveData gives priority to Comments over subText', () => {
    const url = '?TimeSig=4/4&Div=8&Comments=Priority%20Comment&subText=Legacy%20SubText&H=|xxxxxxxx|&S=|--o---o-|&K=|o---o---|';
    const data = new GrooveData().fromUrl(url);
    expect(data.comments).toBe('Priority Comment');
    expect(data.toQueryString()).toContain('Comments=Priority%20Comment');
    expect(data.toQueryString()).not.toContain('Legacy%20SubText');
  });

  test('loads initial groove for 1/8 subdivision when arrays are empty', () => {
    const data = new GrooveData().fromUrl('TimeSig=4/4&Div=8');
    expect(data.measures.length).toBe(1);
    const m = data.measures[0];
    expect(m.toString(DrumType.HIHAT)).toBe('xxxxxxxx'); // one every space
    expect(m.toString(DrumType.KICK)).toBe('o---o---'); // odd beats 1, 3
    expect(m.toString(DrumType.SNARE)).toBe('--O---O-'); // even beats 2, 4
  });

  test('loads initial groove for 1/16 subdivision when arrays are empty', () => {
    const data = new GrooveData().fromUrl('TimeSig=4/4&Div=16');
    expect(data.measures.length).toBe(1);
    const m = data.measures[0];
    expect(m.toString(DrumType.HIHAT)).toBe('x-x-x-x-x-x-x-x-'); // one every 2 spaces
    expect(m.toString(DrumType.KICK)).toBe('o-------o-------'); // odd beats 1, 3
    expect(m.toString(DrumType.SNARE)).toBe('----O-------O---'); // even beats 2, 4
  });

  test('loads initial groove for 1/8 triplet (Div 12) when arrays are empty', () => {
    const data = new GrooveData().fromUrl('TimeSig=4/4&Div=12');
    expect(data.measures.length).toBe(1);
    const m = data.measures[0];
    expect(m.toString(DrumType.HIHAT)).toBe('x--x--x--x--'); // one every 3 spaces
    expect(m.toString(DrumType.KICK)).toBe('o-----o-----'); // odd beats 1, 3
    expect(m.toString(DrumType.SNARE)).toBe('---O-----O--'); // even beats 2, 4
  });

  test('loads initial groove for 1/16 triplet (Div 24) when arrays are empty', () => {
    const data = new GrooveData().fromUrl('TimeSig=4/4&Div=24');
    expect(data.measures.length).toBe(1);
    const m = data.measures[0];
    expect(m.toString(DrumType.HIHAT)).toBe('x--x--x--x--x--x--x--x--'); // one every 3 spaces
    expect(m.toString(DrumType.KICK)).toBe('o-----------o-----------'); // odd beats 1, 3
    expect(m.toString(DrumType.SNARE)).toBe('------O-----------O-----'); // even beats 2, 4
  });

  test('loads initial groove for 3/4 and 6/8 time signatures when arrays are empty', () => {
    const data34 = new GrooveData().fromUrl('TimeSig=3/4&Div=8');
    const m34 = data34.measures[0];
    expect(m34.toString(DrumType.HIHAT)).toBe('xxxxxx');
    expect(m34.toString(DrumType.KICK)).toBe('o---o-'); // odd beats 1, 3
    expect(m34.toString(DrumType.SNARE)).toBe('--O---'); // even beat 2

    const data68 = new GrooveData().fromUrl('TimeSig=6/8&Div=16');
    const m68 = data68.measures[0];
    expect(m68.toString(DrumType.HIHAT)).toBe('x-x-x-x-x-x-');
    expect(m68.toString(DrumType.KICK)).toBe('o---o---o---'); // odd beats 1, 3, 5
    expect(m68.toString(DrumType.SNARE)).toBe('--O---O---O-'); // even beats 2, 4, 6
  });

  test('populates initial groove when URL explicitly contains empty dash arrays', () => {
    const data = new GrooveData().fromUrl('TimeSig=4/4&Div=8&H=|--------|&S=|--------|&K=|--------|');
    const m = data.measures[0];
    expect(m.toString(DrumType.HIHAT)).toBe('xxxxxxxx');
    expect(m.toString(DrumType.KICK)).toBe('o---o---');
    expect(m.toString(DrumType.SNARE)).toBe('--O---O-');
  });
});
