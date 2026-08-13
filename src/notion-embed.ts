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
}

function setStatus(status: string): void {
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

function renderEmbedMeasureTable(numMeasures?: number | null): void {
  const tbody = document.getElementById("embedMeasureTableBody") as HTMLTableSectionElement | null;
  if (!tbody) return;

  var count: number = numMeasures ?? 0;
  if (!count) {
    if (typeof window !== "undefined" && (window as any).myGrooveWriter && (window as any).myGrooveWriter.data && (window as any).myGrooveWriter.data.numberOfMeasures) {
      count = (window as any).myGrooveWriter.data.numberOfMeasures;
    } else {
      count = 1;
    }
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
    const altSel = row.querySelector(".embed-alt-ending") as HTMLSelectElement | null;
    const txtBegin = row.querySelector(".embed-text-begin") as HTMLInputElement | null;
    const txtEnd = row.querySelector(".embed-text-end") as HTMLInputElement | null;
    existingData[m] = {
      repeatStart: startCb ? startCb.checked : false,
      repeatEnd: endCb ? endCb.checked : false,
      altEnding: altSel ? altSel.value : "",
      textBegin: txtBegin ? txtBegin.value : "",
      textEnd: txtEnd ? txtEnd.value : ""
    };
  });

  var html = "";
  for (var m = 1; m <= count; m++) {
    const d = existingData[m] || { repeatStart: false, repeatEnd: false, altEnding: "", textBegin: "", textEnd: "" };
    html += '<tr data-measure="' + m + '">' +
      '<td>Measure ' + m + '</td>' +
      '<td><input type="checkbox" class="embed-repeat-start" data-measure="' + m + '"' + (d.repeatStart ? ' checked' : '') + ' onchange="convert();"></td>' +
      '<td><input type="checkbox" class="embed-repeat-end" data-measure="' + m + '"' + (d.repeatEnd ? ' checked' : '') + ' onchange="convert();"></td>' +
      '<td><select class="embed-alt-ending" data-measure="' + m + '" onchange="convert();">' +
        '<option value=""' + (d.altEnding === '' ? ' selected' : '') + '>None</option>' +
        '<option value="1"' + (d.altEnding === '1' ? ' selected' : '') + '>1</option>' +
        '<option value="2"' + (d.altEnding === '2' ? ' selected' : '') + '>2</option>' +
        '<option value="3"' + (d.altEnding === '3' ? ' selected' : '') + '>3</option>' +
        '<option value="4"' + (d.altEnding === '4' ? ' selected' : '') + '>4</option>' +
      '</select></td>' +
      '<td><input type="text" class="embed-text-begin" data-measure="' + m + '" value="' + (d.textBegin ? d.textBegin.replace(/"/g, '&quot;') : '') + '" placeholder="e.g. Intro" oninput="convert();" onchange="convert();"></td>' +
      '<td><input type="text" class="embed-text-end" data-measure="' + m + '" value="' + (d.textEnd ? d.textEnd.replace(/"/g, '&quot;') : '') + '" placeholder="e.g. Fill" oninput="convert();" onchange="convert();"></td>' +
    '</tr>';
  }
  tbody.innerHTML = html;
  convert();
}

function getEmbedTableData(): EmbedTableData | null {
  const tbody = document.getElementById("embedMeasureTableBody") as HTMLTableSectionElement | null;
  if (!tbody) return null;
  const rows = tbody.querySelectorAll("tr");
  if (rows.length === 0) return null;

  const repeatBegins: number[] = [];
  const repeatEnds: number[] = [];
  const repeatEndings: string[] = [];
  const measureTexts: string[] = [];

  rows.forEach((row, idx) => {
    const m = parseInt(row.getAttribute("data-measure") || (idx + 1).toString(), 10);
    const startCb = row.querySelector(".embed-repeat-start") as HTMLInputElement | null;
    const endCb = row.querySelector(".embed-repeat-end") as HTMLInputElement | null;
    const altSel = row.querySelector(".embed-alt-ending") as HTMLSelectElement | null;
    const txtBegin = row.querySelector(".embed-text-begin") as HTMLInputElement | null;
    const txtEnd = row.querySelector(".embed-text-end") as HTMLInputElement | null;

    if (startCb && startCb.checked) {
      repeatBegins.push(m);
    }
    if (endCb && endCb.checked) {
      repeatEnds.push(m);
    }
    if (altSel && altSel.value) {
      repeatEndings.push(m + ":" + altSel.value);
    }
    if (txtBegin && txtBegin.value.trim().length > 0) {
      measureTexts.push(m + ":b:" + txtBegin.value.trim());
    }
    if (txtEnd && txtEnd.value.trim().length > 0) {
      measureTexts.push(m + ":e:" + txtEnd.value.trim());
    }
  });

  return {
    repeatBegins: repeatBegins.join(";"),
    repeatEnds: repeatEnds.join(";"),
    repeatEndings: repeatEndings.join(";"),
    measureText: measureTexts.join(";")
  };
}

function setEmbedTableData(data: Partial<EmbedTableData> | null): void {
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
  (data.measureText || "").toString().split(";").filter(Boolean).forEach(part => {
    const segments = part.split(":");
    if (segments.length >= 3) {
      const m = parseInt(segments[0], 10);
      const type = segments[1];
      const text = segments.slice(2).join(":");
      if (type === "b") textBeginMap[m] = text;
      if (type === "e") textEndMap[m] = text;
    }
  });

  // Calculate highest measure index
  var maxM = 1;
  if (typeof window !== "undefined" && (window as any).myGrooveWriter && (window as any).myGrooveWriter.data && (window as any).myGrooveWriter.data.numberOfMeasures) {
    maxM = (window as any).myGrooveWriter.data.numberOfMeasures;
  }
  const allMeasureNumbers: number[] = [
    ...rbList,
    ...reList,
    ...Object.keys(altMap).map(Number),
    ...Object.keys(textBeginMap).map(Number),
    ...Object.keys(textEndMap).map(Number)
  ];
  if (allMeasureNumbers.length > 0) {
    maxM = Math.max(maxM, ...allMeasureNumbers);
  }

  renderEmbedMeasureTable(maxM);

  const tbody = document.getElementById("embedMeasureTableBody") as HTMLTableSectionElement | null;
  if (!tbody) return;
  const rows = tbody.querySelectorAll("tr");
  rows.forEach(row => {
    const m = parseInt(row.getAttribute("data-measure") || "0", 10);
    const startCb = row.querySelector(".embed-repeat-start") as HTMLInputElement | null;
    const endCb = row.querySelector(".embed-repeat-end") as HTMLInputElement | null;
    const altSel = row.querySelector(".embed-alt-ending") as HTMLSelectElement | null;
    const txtBegin = row.querySelector(".embed-text-begin") as HTMLInputElement | null;
    const txtEnd = row.querySelector(".embed-text-end") as HTMLInputElement | null;

    if (startCb) startCb.checked = rbList.includes(m);
    if (endCb) endCb.checked = reList.includes(m);
    if (altSel) altSel.value = altMap[m] || "";
    if (txtBegin) txtBegin.value = textBeginMap[m] || "";
    if (txtEnd) txtEnd.value = textEndMap[m] || "";
  });
}

function convert(selectUrl: boolean = false): void {
  const args = typeof window !== "undefined" && window.location ? window.location.search : "";
  var convertedUrl = "https://sonpham.me/GrooveScribe/render.html" + args;

  const showTempoElem = (document.getElementById("showTempo") || document.getElementById("embedShowTempo")) as HTMLInputElement | null;
  const showTempo = showTempoElem ? showTempoElem.checked : false;
  if (showTempo) {
    convertedUrl = convertedUrl + "&EmbedTempoTimeSig=true";
  }

  const subTextElem = document.getElementById("subText") as HTMLInputElement | null;
  const subText = subTextElem ? subTextElem.value : "";
  if (subText.length > 0) {
    convertedUrl += "&subText=" + encodeURIComponent(subText);
  }

  const tableData = getEmbedTableData();
  const rbElem = document.getElementById("repeatBegins") as HTMLInputElement | null;
  const repeatBegins = tableData ? tableData.repeatBegins : (rbElem ? rbElem.value : "");
  if (repeatBegins.length > 0) {
    convertedUrl += "&RepeatBegins=" + repeatBegins;
  }

  const reElem = document.getElementById("repeatEnds") as HTMLInputElement | null;
  const repeatEnds = tableData ? tableData.repeatEnds : (reElem ? reElem.value : "");
  if (repeatEnds.length > 0) {
    convertedUrl += "&RepeatEnds=" + repeatEnds;
  }

  const rendElem = document.getElementById("repeatEndings") as HTMLInputElement | null;
  const repeatEndings = tableData ? tableData.repeatEndings : (rendElem ? rendElem.value : "");
  if (repeatEndings.length > 0) {
    convertedUrl += "&RepeatEndings=" + repeatEndings;
  }

  const mtElem = document.getElementById("measureText") as HTMLInputElement | null;
  const measureText = tableData ? tableData.measureText : (mtElem ? mtElem.value : "");
  if (measureText.length > 0) {
    convertedUrl += "&MeasureText=" + encodeAfterLastColon(measureText, true);
  }

  // Also sync raw/hidden inputs if present
  if (rbElem) rbElem.value = repeatBegins;
  if (reElem) reElem.value = repeatEnds;
  if (rendElem) rendElem.value = repeatEndings;
  if (mtElem) mtElem.value = measureText;

  const convertedUrlElement = document.getElementById("convertedUrl") as HTMLInputElement | null;
  if (convertedUrlElement) {
    convertedUrlElement.value = convertedUrl;
    if (selectUrl === true && typeof convertedUrlElement.select === "function") {
      convertedUrlElement.select();
    }
  }

  if (selectUrl === true) {
    setStatus("Converted!");
  }
}

function convertAndCopy(): void {
  convert();
  const convertedUrlElement = document.getElementById("convertedUrl") as HTMLInputElement | null;
  if (convertedUrlElement && convertedUrlElement.value.length > 0) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(convertedUrlElement.value);
    }
    setStatus("Copied!");
    return;
  }
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

var dbg: any = {};

function populateFromUrl(urlOrQuery?: string): void {
  let queryString = "";
  if (typeof urlOrQuery === "string" && urlOrQuery.length > 0) {
    queryString = urlOrQuery.includes("?") ? urlOrQuery.split("?")[1] : urlOrQuery;
  } else if (typeof window !== "undefined" && window.location && window.location.search) {
    queryString = window.location.search.startsWith("?") ? window.location.search.substring(1) : window.location.search;
  } else {
    const convertedUrlElem = document.getElementById("convertedUrl") as HTMLInputElement | null;
    const convertedUrl = convertedUrlElem ? convertedUrlElem.value : "";
    if (convertedUrl.length > 0) {
      queryString = convertedUrl.includes("?") ? convertedUrl.split("?")[1] : convertedUrl;
    }
  }

  const query = parseQuery(queryString);
  dbg.query = query;

  const isTempo = (query.EmbedTempoTimeSig || "") === "true" || (query.ShowTempo || "") === "1";
  const stElem = document.getElementById("showTempo") as HTMLInputElement | null;
  if (stElem && (query.EmbedTempoTimeSig !== undefined || query.ShowTempo !== undefined)) {
    stElem.checked = isTempo;
  }
  const embedStElem = document.getElementById("embedShowTempo") as HTMLInputElement | null;
  if (embedStElem && (query.EmbedTempoTimeSig !== undefined || query.ShowTempo !== undefined)) {
    embedStElem.checked = isTempo;
  }

  const subTextElem = document.getElementById("subText") as HTMLInputElement | null;
  if (subTextElem && query.subText !== undefined) {
    subTextElem.value = decodeURIComponent((query.subText || "").replace(/\+/g, ' '));
  }

  const rbInput = document.getElementById("repeatBegins") as HTMLInputElement | null;
  if (rbInput && query.RepeatBegins !== undefined) rbInput.value = query.RepeatBegins || "";
  const reInput = document.getElementById("repeatEnds") as HTMLInputElement | null;
  if (reInput && query.RepeatEnds !== undefined) reInput.value = query.RepeatEnds || "";
  const rendInput = document.getElementById("repeatEndings") as HTMLInputElement | null;
  if (rendInput && query.RepeatEndings !== undefined) rendInput.value = query.RepeatEndings || "";
  const mtInput = document.getElementById("measureText") as HTMLInputElement | null;
  if (mtInput && query.MeasureText !== undefined) mtInput.value = encodeAfterLastColon(query.MeasureText || "", false);

  setEmbedTableData({
    repeatBegins: query.RepeatBegins || (rbInput ? rbInput.value : ""),
    repeatEnds: query.RepeatEnds || (reInput ? reInput.value : ""),
    repeatEndings: query.RepeatEndings || (rendInput ? rendInput.value : ""),
    measureText: encodeAfterLastColon(query.MeasureText || (mtInput ? mtInput.value : ""), false)
  });

  convert();
}

function decodeConvertedUrl(urlOrQuery?: string): void {
  console.log("decoding");
  if (typeof urlOrQuery === "string" && urlOrQuery.length > 0) {
    populateFromUrl(urlOrQuery);
  } else {
    const convertedUrlElem = document.getElementById("convertedUrl") as HTMLInputElement | null;
    const convertedUrl = convertedUrlElem ? convertedUrlElem.value : "";
    populateFromUrl(convertedUrl);
  }
}

function openLink(): void {
  const convertedUrlElem = document.getElementById("convertedUrl") as HTMLInputElement | null;
  const convertedUrl = convertedUrlElem ? convertedUrlElem.value : "";
  if (convertedUrl.length > 0 && typeof window !== "undefined") {
    window.open(convertedUrl, '_blank');
  }
}

// Event Listeners
if (typeof document !== "undefined") {
  const tempoInput = document.getElementById("showTempo");
  if (tempoInput) tempoInput.addEventListener("change", () => convert());
  const embedTempoInput = document.getElementById("embedShowTempo");
  if (embedTempoInput && embedTempoInput !== tempoInput) embedTempoInput.addEventListener("change", () => convert());
  const subTextInput = document.getElementById("subText");
  if (subTextInput) {
    subTextInput.addEventListener("input", () => convert());
    subTextInput.addEventListener("change", () => convert());
  }
  const convertBtn = document.getElementById("convertBtn");
  if (convertBtn) convertBtn.addEventListener("click", () => convert(true));
  const copyBtn = document.getElementById("copyBtn");
  if (copyBtn) copyBtn.addEventListener("click", convertAndCopy);
  const openLinkBtn = document.getElementById("openLink");
  if (openLinkBtn) openLinkBtn.addEventListener("click", openLink);

  // Initialize and populate form on startup
  const initForm = () => {
    const currentSearch = typeof window !== "undefined" && window.location ? window.location.search : "";
    if (currentSearch && currentSearch.length > 1) {
      populateFromUrl(currentSearch);
    } else {
      renderEmbedMeasureTable();
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initForm);
  } else {
    initForm();
  }
}

if (typeof window !== "undefined") {
  (window as any).renderEmbedMeasureTable = renderEmbedMeasureTable;
  (window as any).getEmbedTableData = getEmbedTableData;
  (window as any).setEmbedTableData = setEmbedTableData;
  (window as any).populateFromUrl = populateFromUrl;
  (window as any).convert = convert;
  (window as any).convertAndCopy = convertAndCopy;
  (window as any).decodeConvertedUrl = decodeConvertedUrl;
  (window as any).encodeAfterLastColon = encodeAfterLastColon;
  (window as any).parseQuery = parseQuery;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    renderEmbedMeasureTable,
    getEmbedTableData,
    setEmbedTableData,
    populateFromUrl,
    convert,
    convertAndCopy,
    decodeConvertedUrl,
    encodeAfterLastColon,
    parseQuery
  };
}
