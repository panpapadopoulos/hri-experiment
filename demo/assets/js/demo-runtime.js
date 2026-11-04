'use strict';
// No answers are stored, sent, written to cookies, or kept in browser storage.
var demoRandom = new Uint32Array(2);crypto.getRandomValues(demoRandom);
uniqueId = 'demo_' + demoRandom[0].toString(16);
condition = demoRandom[1] % 3;
mode = 'demo';
function PsiTurk() {
 this.recordTrialData = function() {};
 this.getTrialData = function() { return []; };
 this.saveData = function(callbacks) { callbacks.success(); };
 this.completeHIT = function() { window.location.replace('complete.html'); };
}
