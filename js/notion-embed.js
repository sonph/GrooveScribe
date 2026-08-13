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
    convert();
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
function convert() {
    const args = typeof window !== "undefined" && window.location ? window.location.search : "";
    var convertedUrl = "https://sonpham.me/notion-drum-sheet/render.html" + args;
    const showTempoElem = (document.getElementById("showTempo") || document.getElementById("embedShowTempo"));
    const showTempo = showTempoElem ? showTempoElem.checked : false;
    if (showTempo) {
        convertedUrl = convertedUrl + "&EmbedTempoTimeSig=true";
    }
    const subTextElem = document.getElementById("subText");
    const subText = subTextElem ? subTextElem.value : "";
    if (subText.length > 0) {
        convertedUrl += "&subText=" + encodeURIComponent(subText);
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
        if (typeof convertedUrlElement.select === "function") {
            convertedUrlElement.select();
        }
    }
    setStatus("Converted!");
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
        query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
    }
    return query;
}
var dbg = {};
function decodeConvertedUrl() {
    console.log("decoding");
    const convertedUrlElem = document.getElementById("convertedUrl");
    const convertedUrl = convertedUrlElem ? convertedUrlElem.value : "";
    const query = parseQuery(convertedUrl.split("?")[1] || "");
    dbg.query = query;
    const isTempo = (query.EmbedTempoTimeSig || "") === "true" || (query.ShowTempo || "") === "1";
    const stElem = document.getElementById("showTempo");
    if (stElem)
        stElem.checked = isTempo;
    const embedStElem = document.getElementById("embedShowTempo");
    if (embedStElem)
        embedStElem.checked = isTempo;
    const subTextElem = document.getElementById("subText");
    if (subTextElem)
        subTextElem.value = decodeURIComponent(query.subText || "");
    const rbInput = document.getElementById("repeatBegins");
    if (rbInput)
        rbInput.value = query.RepeatBegins || "";
    const reInput = document.getElementById("repeatEnds");
    if (reInput)
        reInput.value = query.RepeatEnds || "";
    const rendInput = document.getElementById("repeatEndings");
    if (rendInput)
        rendInput.value = query.RepeatEndings || "";
    const mtInput = document.getElementById("measureText");
    if (mtInput)
        mtInput.value = encodeAfterLastColon(query.MeasureText || "", false);
    setEmbedTableData({
        repeatBegins: query.RepeatBegins || "",
        repeatEnds: query.RepeatEnds || "",
        repeatEndings: query.RepeatEndings || "",
        measureText: encodeAfterLastColon(query.MeasureText || "", false)
    });
    convert();
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
        tempoInput.addEventListener("keypress", convert);
    const embedTempoInput = document.getElementById("embedShowTempo");
    if (embedTempoInput && embedTempoInput !== tempoInput)
        embedTempoInput.addEventListener("keypress", convert);
    const subTextInput = document.getElementById("subText");
    if (subTextInput) {
        subTextInput.addEventListener("input", convert);
        subTextInput.addEventListener("keypress", convert);
    }
    const convertBtn = document.getElementById("convertBtn");
    if (convertBtn)
        convertBtn.addEventListener("click", convert);
    const copyBtn = document.getElementById("copyBtn");
    if (copyBtn)
        copyBtn.addEventListener("click", convertAndCopy);
    const openLinkBtn = document.getElementById("openLink");
    if (openLinkBtn)
        openLinkBtn.addEventListener("click", openLink);
    const decodeBtn = document.getElementById("decodeUrlBtn");
    if (decodeBtn)
        decodeBtn.addEventListener("click", decodeConvertedUrl);
    // Initialize table on startup
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => renderEmbedMeasureTable());
    }
    else {
        renderEmbedMeasureTable();
    }
}
if (typeof window !== "undefined") {
    window.renderEmbedMeasureTable = renderEmbedMeasureTable;
    window.getEmbedTableData = getEmbedTableData;
    window.setEmbedTableData = setEmbedTableData;
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
        convert,
        convertAndCopy,
        decodeConvertedUrl,
        encodeAfterLastColon,
        parseQuery
    };
}
//# sourceMappingURL=notion-embed.js.map