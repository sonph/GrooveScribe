function setStatus(status) {
    const statusE = document.getElementById("status");
    if (!statusE)
        return;
    statusE.innerHTML = "<b>" + status + "</b>";
    setTimeout(function () {
        statusE.innerHTML = "";
    }, 4000 /* ms */);
}
function encodeAfterLastColon(str, encode) {
    if (!str)
        return "";
    return str.split(";").map(e => {
        const parts = e.trim().split(":");
        if (parts.length < 2)
            return e;
        var convertedPart;
        if (encode) {
            convertedPart = encodeURIComponent(parts[parts.length - 1]);
        }
        else {
            convertedPart = decodeURIComponent(parts[parts.length - 1]);
        }
        return parts.slice(0, parts.length - 1).concat([convertedPart]).join(":");
    }).join(";");
}
function renderEmbedMeasureTable(numMeasures) {
    const tbody = document.getElementById("embedMeasureTableBody");
    if (!tbody)
        return;
    var count = numMeasures ?? 0;
    if (!count) {
        if (typeof window !== "undefined" && window.myGrooveWriter && window.myGrooveWriter.data && window.myGrooveWriter.data.numberOfMeasures) {
            count = window.myGrooveWriter.data.numberOfMeasures;
        }
        else {
            count = 1;
        }
    }
    count = Math.max(1, count);
    // Preserve existing row states
    const existingRows = tbody.querySelectorAll("tr");
    const existingData = {};
    existingRows.forEach(row => {
        const m = parseInt(row.getAttribute("data-measure") || "0", 10);
        if (!m)
            return;
        const startCb = row.querySelector(".embed-repeat-start");
        const endCb = row.querySelector(".embed-repeat-end");
        const altSel = row.querySelector(".embed-alt-ending");
        const txtBegin = row.querySelector(".embed-text-begin");
        const txtEnd = row.querySelector(".embed-text-end");
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
    convert(false, false);
}
function getEmbedTableData() {
    const tbody = document.getElementById("embedMeasureTableBody");
    if (!tbody)
        return null;
    const rows = tbody.querySelectorAll("tr");
    if (rows.length === 0)
        return null;
    const repeatBegins = [];
    const repeatEnds = [];
    const repeatEndings = [];
    const measureTexts = [];
    rows.forEach((row, idx) => {
        const m = parseInt(row.getAttribute("data-measure") || (idx + 1).toString(), 10);
        const startCb = row.querySelector(".embed-repeat-start");
        const endCb = row.querySelector(".embed-repeat-end");
        const altSel = row.querySelector(".embed-alt-ending");
        const txtBegin = row.querySelector(".embed-text-begin");
        const txtEnd = row.querySelector(".embed-text-end");
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
function setEmbedTableData(data) {
    if (!data)
        return;
    const rbList = (data.repeatBegins || "").toString().split(";").filter(Boolean).map(Number);
    const reList = (data.repeatEnds || "").toString().split(";").filter(Boolean).map(Number);
    const altMap = {};
    (data.repeatEndings || "").toString().split(";").filter(Boolean).forEach(part => {
        const colon = part.indexOf(":");
        if (colon !== -1) {
            const m = parseInt(part.substring(0, colon), 10);
            const val = part.substring(colon + 1);
            if (m)
                altMap[m] = val;
        }
    });
    const textBeginMap = {};
    const textEndMap = {};
    (data.measureText || "").toString().split(";").filter(Boolean).forEach(part => {
        const segments = part.split(":");
        if (segments.length >= 3) {
            const m = parseInt(segments[0], 10);
            const type = segments[1];
            const text = segments.slice(2).join(":");
            if (type === "b")
                textBeginMap[m] = text;
            if (type === "e")
                textEndMap[m] = text;
        }
    });
    // Calculate highest measure index
    var maxM = 1;
    if (typeof window !== "undefined" && window.myGrooveWriter && window.myGrooveWriter.data && window.myGrooveWriter.data.numberOfMeasures) {
        maxM = window.myGrooveWriter.data.numberOfMeasures;
    }
    const allMeasureNumbers = [
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
    const tbody = document.getElementById("embedMeasureTableBody");
    if (!tbody)
        return;
    const rows = tbody.querySelectorAll("tr");
    rows.forEach(row => {
        const m = parseInt(row.getAttribute("data-measure") || "0", 10);
        const startCb = row.querySelector(".embed-repeat-start");
        const endCb = row.querySelector(".embed-repeat-end");
        const altSel = row.querySelector(".embed-alt-ending");
        const txtBegin = row.querySelector(".embed-text-begin");
        const txtEnd = row.querySelector(".embed-text-end");
        if (startCb)
            startCb.checked = rbList.includes(m);
        if (endCb)
            endCb.checked = reList.includes(m);
        if (altSel)
            altSel.value = altMap[m] || "";
        if (txtBegin)
            txtBegin.value = textBeginMap[m] || "";
        if (txtEnd)
            txtEnd.value = textEndMap[m] || "";
    });
}
let isConverting = false;
function getGrooveWriterInstance() {
    if (typeof window !== "undefined" && window.myGrooveWriter) {
        return window.myGrooveWriter;
    }
    if (typeof globalThis !== "undefined" && globalThis.myGrooveWriter) {
        return globalThis.myGrooveWriter;
    }
    if (typeof global !== "undefined" && global.myGrooveWriter) {
        return global.myGrooveWriter;
    }
    return undefined;
}
function syncTableToGrooveWriter() {
    const tableData = getEmbedTableData();
    if (!tableData)
        return;
    const gw = getGrooveWriterInstance();
    if (gw && gw.data) {
        const data = gw.data;
        data.repeatBegins = new Set(tableData.repeatBegins ? tableData.repeatBegins.split(";").filter(Boolean).map((s) => parseInt(s, 10)).filter((n) => !isNaN(n)) : []);
        data.repeatEnds = new Set(tableData.repeatEnds ? tableData.repeatEnds.split(";").filter(Boolean).map((s) => parseInt(s, 10)).filter((n) => !isNaN(n)) : []);
        const repeatEndings = new Map();
        if (tableData.repeatEndings) {
            tableData.repeatEndings.split(";").filter(Boolean).forEach((part) => {
                const [mStr, end] = part.split(":");
                const m = parseInt(mStr, 10);
                if (!isNaN(m) && end)
                    repeatEndings.set(m, end);
            });
        }
        data.repeatEndings = repeatEndings;
        const measureText = new Map();
        if (tableData.measureText) {
            tableData.measureText.split(";").filter(Boolean).forEach((part) => {
                const [mStr, pos, ...rest] = part.split(":");
                const m = parseInt(mStr, 10);
                const txt = rest.join(":");
                if (!isNaN(m) && txt) {
                    const entry = measureText.get(m) || {};
                    if (pos === "b")
                        entry.begin = txt;
                    if (pos === "e")
                        entry.end = txt;
                    measureText.set(m, entry);
                }
            });
        }
        data.measureText = measureText;
    }
}
function convert(selectUrl = false, refreshSheetMusic = true) {
    syncTableToGrooveWriter();
    const args = typeof window !== "undefined" && window.location ? window.location.search : "";
    var convertedUrl = "https://sonpham.me/GrooveScribe/render.html" + args;
    const showTempoElem = (document.getElementById("showTempo") || document.getElementById("embedShowTempo"));
    const showTempo = showTempoElem ? showTempoElem.checked : false;
    if (showTempo) {
        convertedUrl = convertedUrl + "&ShowTempo=1";
    }
    // Backward compatibility: subText is merged into Comments, with Comments taking priority
    const tuneComments = document.getElementById("tuneComments");
    const subTextElem = document.getElementById("subText");
    const comments = (tuneComments && typeof tuneComments.value === "string" && tuneComments.value.trim().length > 0)
        ? tuneComments.value.trim()
        : (subTextElem && typeof subTextElem.value === "string" ? subTextElem.value.trim() : "");
    if (comments.length > 0) {
        convertedUrl += "&Comments=" + encodeURIComponent(comments);
    }
    const tableData = getEmbedTableData();
    const rbElem = document.getElementById("repeatBegins");
    const repeatBegins = tableData ? tableData.repeatBegins : (rbElem ? rbElem.value : "");
    if (repeatBegins.length > 0) {
        convertedUrl += "&RepeatBegins=" + repeatBegins;
    }
    const reElem = document.getElementById("repeatEnds");
    const repeatEnds = tableData ? tableData.repeatEnds : (reElem ? reElem.value : "");
    if (repeatEnds.length > 0) {
        convertedUrl += "&RepeatEnds=" + repeatEnds;
    }
    const rendElem = document.getElementById("repeatEndings");
    const repeatEndings = tableData ? tableData.repeatEndings : (rendElem ? rendElem.value : "");
    if (repeatEndings.length > 0) {
        convertedUrl += "&RepeatEndings=" + repeatEndings;
    }
    const mtElem = document.getElementById("measureText");
    const measureText = tableData ? tableData.measureText : (mtElem ? mtElem.value : "");
    if (measureText.length > 0) {
        convertedUrl += "&MeasureText=" + encodeAfterLastColon(measureText, true);
    }
    // Also sync raw/hidden inputs if present
    if (rbElem)
        rbElem.value = repeatBegins;
    if (reElem)
        reElem.value = repeatEnds;
    if (rendElem)
        rendElem.value = repeatEndings;
    if (mtElem)
        mtElem.value = measureText;
    const convertedUrlElement = document.getElementById("convertedUrl");
    if (convertedUrlElement) {
        convertedUrlElement.value = convertedUrl;
        if (selectUrl === true && typeof convertedUrlElement.select === "function") {
            convertedUrlElement.select();
        }
    }
    if (selectUrl === true) {
        setStatus("Converted!");
    }
    if (refreshSheetMusic && !isConverting) {
        isConverting = true;
        try {
            const gw = getGrooveWriterInstance();
            if (gw && typeof gw.refresh_ABC === "function") {
                gw.refresh_ABC();
            }
        }
        finally {
            isConverting = false;
        }
    }
}
function convertAndCopy() {
    convert();
    const convertedUrlElement = document.getElementById("convertedUrl");
    if (convertedUrlElement && convertedUrlElement.value.length > 0) {
        if (typeof navigator !== "undefined" && navigator.clipboard) {
            navigator.clipboard.writeText(convertedUrlElement.value);
        }
        setStatus("Copied!");
        return;
    }
}
function parseQuery(queryString) {
    var query = {};
    if (!queryString)
        return query;
    var pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
    for (var i = 0; i < pairs.length; i++) {
        if (!pairs[i])
            continue;
        var pair = pairs[i].split('=');
        query[decodeURIComponent(pair[0])] = decodeURIComponent((pair[1] || '').replace(/\+/g, ' '));
    }
    return query;
}
var dbg = {};
function populateFromUrl(urlOrQuery) {
    let queryString = "";
    if (typeof urlOrQuery === "string" && urlOrQuery.length > 0) {
        queryString = urlOrQuery.includes("?") ? urlOrQuery.split("?")[1] : urlOrQuery;
    }
    else if (typeof window !== "undefined" && window.location && window.location.search) {
        queryString = window.location.search.startsWith("?") ? window.location.search.substring(1) : window.location.search;
    }
    else {
        const convertedUrlElem = document.getElementById("convertedUrl");
        const convertedUrl = convertedUrlElem ? convertedUrlElem.value : "";
        if (convertedUrl.length > 0) {
            queryString = convertedUrl.includes("?") ? convertedUrl.split("?")[1] : convertedUrl;
        }
    }
    const query = parseQuery(queryString);
    dbg.query = query;
    const isTempo = (query.EmbedTempoTimeSig || query.embedTempoTimeSig || "") === "true" || (query.ShowTempo || query.showTempo || "") === "1";
    const stElem = document.getElementById("showTempo");
    if (stElem && (query.EmbedTempoTimeSig !== undefined || query.embedTempoTimeSig !== undefined || query.ShowTempo !== undefined || query.showTempo !== undefined)) {
        stElem.checked = isTempo;
    }
    const embedStElem = document.getElementById("embedShowTempo");
    if (embedStElem && (query.EmbedTempoTimeSig !== undefined || query.embedTempoTimeSig !== undefined || query.ShowTempo !== undefined || query.showTempo !== undefined)) {
        embedStElem.checked = isTempo;
    }
    // Backward compatibility: "subText" parameter is merged into "Comments", with "Comments" taking priority.
    const commentsVal = query.Comments !== undefined ? query.Comments : (query.comments !== undefined ? query.comments : (query.subText !== undefined ? query.subText : query.subtext));
    if (commentsVal !== undefined) {
        const decodedComments = decodeURIComponent((commentsVal || "").replace(/\+/g, ' '));
        const commentsInput = document.getElementById("tuneComments");
        if (commentsInput) {
            commentsInput.value = decodedComments;
        }
        const subTextElem = document.getElementById("subText");
        if (subTextElem) {
            subTextElem.value = decodedComments;
        }
        if (typeof window.myGrooveWriter !== "undefined" && window.myGrooveWriter.data) {
            window.myGrooveWriter.data.comments = decodedComments;
        }
    }
    const rbVal = query.RepeatBegins !== undefined ? query.RepeatBegins : query.repeatBegins;
    const reVal = query.RepeatEnds !== undefined ? query.RepeatEnds : query.repeatEnds;
    const rendVal = query.RepeatEndings !== undefined ? query.RepeatEndings : query.repeatEndings;
    const mtVal = query.MeasureText !== undefined ? query.MeasureText : query.measureText;
    const rbInput = document.getElementById("repeatBegins");
    if (rbInput && rbVal !== undefined)
        rbInput.value = rbVal || "";
    const reInput = document.getElementById("repeatEnds");
    if (reInput && reVal !== undefined)
        reInput.value = reVal || "";
    const rendInput = document.getElementById("repeatEndings");
    if (rendInput && rendVal !== undefined)
        rendInput.value = rendVal || "";
    const mtInput = document.getElementById("measureText");
    if (mtInput && mtVal !== undefined)
        mtInput.value = encodeAfterLastColon(mtVal || "", false);
    setEmbedTableData({
        repeatBegins: rbVal || (rbInput ? rbInput.value : ""),
        repeatEnds: reVal || (reInput ? reInput.value : ""),
        repeatEndings: rendVal || (rendInput ? rendInput.value : ""),
        measureText: encodeAfterLastColon(mtVal || (mtInput ? mtInput.value : ""), false)
    });
    convert();
}
function decodeConvertedUrl(urlOrQuery) {
    console.log("decoding");
    if (typeof urlOrQuery === "string" && urlOrQuery.length > 0) {
        populateFromUrl(urlOrQuery);
    }
    else {
        const convertedUrlElem = document.getElementById("convertedUrl");
        const convertedUrl = convertedUrlElem ? convertedUrlElem.value : "";
        populateFromUrl(convertedUrl);
    }
}
function openLink() {
    const convertedUrlElem = document.getElementById("convertedUrl");
    const convertedUrl = convertedUrlElem ? convertedUrlElem.value : "";
    if (convertedUrl.length > 0 && typeof window !== "undefined") {
        window.open(convertedUrl, '_blank');
    }
}
// Event Listeners
if (typeof document !== "undefined") {
    const tempoInput = document.getElementById("showTempo");
    if (tempoInput)
        tempoInput.addEventListener("change", () => convert());
    const embedTempoInput = document.getElementById("embedShowTempo");
    if (embedTempoInput && embedTempoInput !== tempoInput)
        embedTempoInput.addEventListener("change", () => convert());
    const commentsInput = document.getElementById("tuneComments");
    if (commentsInput) {
        commentsInput.addEventListener("input", () => convert());
        commentsInput.addEventListener("change", () => convert());
    }
    const subTextInput = document.getElementById("subText");
    if (subTextInput) {
        subTextInput.addEventListener("input", () => convert());
        subTextInput.addEventListener("change", () => convert());
    }
    const convertBtn = document.getElementById("convertBtn");
    if (convertBtn)
        convertBtn.addEventListener("click", () => convert(true));
    const copyBtn = document.getElementById("copyBtn");
    if (copyBtn)
        copyBtn.addEventListener("click", convertAndCopy);
    const openLinkBtn = document.getElementById("openLink");
    if (openLinkBtn)
        openLinkBtn.addEventListener("click", openLink);
    // Initialize and populate form on startup
    const initForm = () => {
        const currentSearch = typeof window !== "undefined" && window.location ? window.location.search : "";
        if (currentSearch && currentSearch.length > 1) {
            populateFromUrl(currentSearch);
        }
        else {
            renderEmbedMeasureTable();
        }
    };
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initForm);
    }
    else {
        initForm();
    }
}
if (typeof window !== "undefined") {
    window.renderEmbedMeasureTable = renderEmbedMeasureTable;
    window.getEmbedTableData = getEmbedTableData;
    window.setEmbedTableData = setEmbedTableData;
    window.populateFromUrl = populateFromUrl;
    window.convert = convert;
    window.convertAndCopy = convertAndCopy;
    window.decodeConvertedUrl = decodeConvertedUrl;
    window.encodeAfterLastColon = encodeAfterLastColon;
    window.parseQuery = parseQuery;
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
//# sourceMappingURL=notion-embed.js.map