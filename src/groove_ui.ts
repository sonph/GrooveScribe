/*jslint browser:true devel:true */

function is_touch_device(): boolean {
  return (typeof window !== "undefined" && (('ontouchstart' in window) || (navigator.maxTouchPoints > 0)));
}

function mergeDrumTabLines(dominateLine: string, subordinateLine: string): string {
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
}

function updateRangeSlider(sliderID: string): void {
  var slider = document.getElementById(sliderID) as HTMLInputElement | null;
  if (!slider)
    return;
  var programaticCSSRules = document.getElementById(sliderID + "CSSRules");
  if (!programaticCSSRules) {
    programaticCSSRules = document.createElement('style');
    programaticCSSRules.id = sliderID + "CSSRules";
    document.body.appendChild(programaticCSSRules);
  }

  var style_before = document.defaultView.getComputedStyle(slider, ":before");
  var style_after = document.defaultView.getComputedStyle(slider, ":after");
  var before_color = style_before.getPropertyValue('color');
  var after_color = style_after.getPropertyValue('color');

  var percent = Math.ceil(((Number(slider.value) - Number(slider.min)) / (Number(slider.max) - Number(slider.min))) * 100);

  var new_style_str = '#' + sliderID + '::-moz-range-track' + '{ background: -moz-linear-gradient(left, ' + before_color + ' ' + percent + '%, ' + after_color + ' ' + percent + '%)}\n';
  new_style_str += '#' + sliderID + '::-webkit-slider-runnable-track' + '{ background: -webkit-linear-gradient(left, ' + before_color + ' ' + '0%, ' + before_color + ' ' + percent + '%, ' + after_color + ' ' + percent + '%)}\n';
  programaticCSSRules.textContent = new_style_str;
}

function addInlineMetronomeSVG(): string {
  return '<svg class="midiMetronomeImage" version="1.1" width="30" height="30"' +
    'xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 100 100" enable-background="new 0 0 100 100" ' +
    'xml:space="preserve"><path d="M86.945,10.635c-0.863-0.494-1.964-0.19-2.455,0.673l-8.31,14.591l-2.891-1.745l-1.769,9.447l0.205,0.123' +
    'l-1.303,2.286L63.111,6.819c-0.25-1-1.299-1.819-2.33-1.819H37.608c-1.031,0-2.082,0.818-2.334,1.818L13.454,93.182' +
    'c-0.253,1,0.385,1.818,1.416,1.818h68.459c1.031,0,1.67-0.818,1.42-1.818L71.69,41.061l3.117-5.475l0.152,0.092l7.559-5.951' +
    'l-3.257-1.966l8.355-14.67C88.11,12.226,87.81,11.127,86.945,10.635z M71.58,70.625H54.855l12.946-22.737l5.197,20.789' +
    'C73.25,69.678,72.61,70.625,71.58,70.625z M50.714,70.625H26.57c-1.031,0-1.669-0.994-1.416-1.994L39.59,11.5' +
    'c0.253-1,1.303-1.812,2.334-1.812h14.431c1.032,0,2.081,0.725,2.331,1.725l7.854,31.421L50.714,70.625z"></path></svg>';
}

function addInLineGScribeLogoLoneGSVG(): string {
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

(globalThis as any).is_touch_device = is_touch_device;
(globalThis as any).mergeDrumTabLines = mergeDrumTabLines;
(globalThis as any).updateRangeSlider = updateRangeSlider;
(globalThis as any).addInlineMetronomeSVG = addInlineMetronomeSVG;
(globalThis as any).addInLineGScribeLogoLoneGSVG = addInLineGScribeLogoLoneGSVG;
