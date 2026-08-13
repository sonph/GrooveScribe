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
});
