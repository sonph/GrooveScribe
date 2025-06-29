function setStatus(status) {
  const statusE = document.getElementById("status");
  statusE.innerHTML = "<b>" + status + "</b>";
  setTimeout(function () {
    statusE.innerHTML = "";
  }, 4000 /* ms */);
}

function encodeAfterLastColon(str, /* bool */ encode) {
  return str.split(";").map(e => {
    const parts = e.trim().split(":");
    var convertedPart;
    if (encode) {
      convertedPart = encodeURIComponent(parts[parts.length - 1]);
    } else {
      convertedPart = decodeURIComponent(parts[parts.length - 1]);
    }
    return parts.slice(0, parts.length - 1).concat([convertedPart]).join(":");
  }).join(";");
}

function convert() {
  const args = window.location.search;

  var convertedUrl = "https://sonpham.me/notion-drum-sheet/render.html" + args;

  const showTempo = document.getElementById("showTempo").checked;
  if (showTempo) {
    convertedUrl = convertedUrl + "&EmbedTempoTimeSig=true";
  }

  const subText = document.getElementById("subText").value;
  if (subText.length > 0) {
    convertedUrl += "&subText=" + encodeURIComponent(subText);
  }

  const repeatBegins = document.getElementById("repeatBegins").value;
  if (repeatBegins.length > 0) {
    convertedUrl += "&RepeatBegins=" + repeatBegins;
  }

  const repeatEnds = document.getElementById("repeatEnds").value;
  if (repeatEnds.length > 0) {
    convertedUrl += "&RepeatEnds=" + repeatEnds;
  }

  const repeatEndings = document.getElementById("repeatEndings").value;
  if (repeatEndings.length > 0) {
    convertedUrl += "&RepeatEndings=" + repeatEndings;
  }

  const measureText = document.getElementById("measureText").value;
  if (measureText.length > 0) {
    convertedUrl += "&MeasureText=" + encodeAfterLastColon(measureText, true);
  }

  const convertedUrlElement = document.getElementById("convertedUrl");
  convertedUrlElement.value = convertedUrl;
  convertedUrlElement.select();

  setStatus("Converted!");
}

function convertAndCopy() {
  convert();
  const convertedUrlElement = document.getElementById("convertedUrl");
  if (convertedUrlElement.value.length > 0) {
    navigator.clipboard.writeText(convertedUrlElement.value);
    setStatus("Copied!");
    return;
  }
}

function parseQuery(queryString) {
  var query = {};
  var pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
  for (var i = 0; i < pairs.length; i++) {
    var pair = pairs[i].split('=');
    query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
  }
  return query;
}

var dbg = {};

function decodeConvertedUrl() {
  console.log("decoding");
  const convertedUrl = document.getElementById("convertedUrl").value;
  const query = parseQuery(convertedUrl.split("?")[1]);
  dbg.query = query;
  document.getElementById("showTempo").checked = (query.EmbedTempoTimeSig || "") === "true";
  document.getElementById("subText").value = decodeURIComponent(query.subText || "");
  document.getElementById("repeatBegins").value = query.RepeatBegins || "";
  document.getElementById("repeatEnds").value = query.RepeatEnds || "";
  document.getElementById("repeatEndings").value = query.RepeatEndings || "";
  document.getElementById("measureText").value = encodeAfterLastColon(query.MeasureText || "", false);
}

function openLink() {
  const convertedUrl = document.getElementById("convertedUrl").value;
  if (convertedUrl.length > 0) {
    window.open(convertedUrl, '_blank');
  }
}

document.getElementById("showTempo").addEventListener("keypress", convert);
document.getElementById("convertBtn").addEventListener("click", convert);
document.getElementById("copyBtn").addEventListener("click", convertAndCopy);
document.getElementById("openLink").addEventListener("click", openLink);

// Decode URL to allow for easy modification of groove without having to re-type all the custom fields
document.getElementById("decodeUrlBtn").addEventListener("click", decodeConvertedUrl);