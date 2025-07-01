const LOCAL_CONFIG = {
  debugMode: false,
  defaultShowAbcNotation: false,
  showGrooveDBMetaData: false,
}

function addCssFile(filename) {
  const head = document.head; // Or document.getElementsByTagName('head')[0];
  const link = document.createElement('link');

  link.rel = 'stylesheet';
  link.type = 'text/css';
  link.href = filename;

  head.appendChild(link);
}

if (LOCAL_CONFIG.debugMode) {
  console.log("Debug mode is enabled.");
  document.getElementById("debugDisplayArea").style.display = "block";
  myGrooveWriter.myGrooveUtils.debugMode = true;
  document.getElementById("permutationAnchor").style.display = "inline-block";
}

if (LOCAL_CONFIG.defaultShowAbcNotation) {
  myGrooveWriter.ShowHideABCResults();
}

if (LOCAL_CONFIG.showGrooveDBMetaData) {
  console.log("GrooveDB MetaData is enabled.");
  myGrooveWriter.myGrooveUtils.showGrooveDBMetaData = true;
  document.getElementById("GrooveDB_MetaData").style.display = "block";
  myGrooveWriter.myGrooveUtils.grooveDBAuthoring = true;
  addCssFile("css/grooveDB_authoring.css");
}