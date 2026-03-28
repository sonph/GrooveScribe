import { GrooveUtils } from './groove_utils.js';
import { GrooveWriter } from './groove_writer.js';
import { grooves } from './grooves.js';

window.GrooveUtils = GrooveUtils;
window.GrooveWriter = GrooveWriter;
window.grooves = grooves;

// Equivalent of the initialization script from index.html
document.addEventListener("DOMContentLoaded", function() {
  window.myGrooveWriter = new GrooveWriter();

  // Add CSS based on state
  if (window.myGrooveWriter.myGrooveUtils.grooveDBAuthoring) {
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.type = "text/css";
    link.href = "css/grooveDB_authoring.css";
    document.head.appendChild(link);
  }
  if (window.myGrooveWriter.myGrooveUtils.debugMode) {
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.type = "text/css";
    link.href = "css/groove_debug.css";
    document.head.appendChild(link);
  }

  // Populate dynamic DOM elements that were previously generated via document.write
  var divisionButtonContainer = document.getElementById("divisionButtonContainer");
  if (divisionButtonContainer) {
    if (!window.myGrooveWriter.myGrooveUtils.grooveDBAuthoring) {
      var span = document.createElement("span");
      span.className = "left-button";
      span.onclick = function() { window.myGrooveWriter.swapViewEditMode(); };
      span.innerHTML = '<span class="left-button-content"><span id="view-edit-switch" >Switch to EDIT mode</span></span>';
      divisionButtonContainer.appendChild(span);
    }
    if (window.myGrooveWriter.myGrooveUtils.is_touch_device()) {
      var span = document.createElement("span");
      span.className = "left-button edit-block";
      span.id = "advancedEditAnchor";
      span.onclick = function(e) { e.preventDefault(); window.myGrooveWriter.toggleAdvancedEdit(); };
      span.innerHTML = '<span class="left-button-content">Advanced Edit</span>';
      divisionButtonContainer.appendChild(span);
    }
  }

  // Permutation Options
  var permOptionsContainer = document.getElementById("PermutationOptions");
  if (permOptionsContainer) {
    permOptionsContainer.innerHTML = window.myGrooveWriter.HTMLforPermutationOptions();
  }

  // Musical Input measures
  var measureContainer = document.getElementById("measureContainer");
  if (measureContainer) {
    var genHTML = "";
    for (var cur_measure = 1; cur_measure <= window.myGrooveWriter.numberOfMeasures(); cur_measure++) {
      genHTML += window.myGrooveWriter.HTMLforStaffContainer(cur_measure, (cur_measure - 1) * window.myGrooveWriter.notesPerMeasure());
    }
    measureContainer.innerHTML = genHTML;
  }

  // Groove List wrapper
  var grooveListWrapper = document.getElementById("grooveListWrapper");
  if (grooveListWrapper) {
    grooveListWrapper.innerHTML = window.grooves.getGroovesAsHTML();
  }
  
  // Call runsOnPageLoad
  window.myGrooveWriter.runsOnPageLoad();
});
