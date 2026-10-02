"use strict";
window.HRI = {};
HRI.config = {
 practiceTrials:2, buildTrustTrials:4, errorPhaseTrials:7, recoveryTrials:4,
 // One-based main-task numbers, EXCLUDING practice. Errors must be in Phase 2.
 errorTrials:[5,8,11], trialTimeLimitMs:25000,
 // Main-task checkpoint: two correct trials after the first scheduled error.
 earlyRecoveryTrustTrial:7,
 conditions:["acknowledgment","apology","apology_explanation"],
 messages:{
 acknowledgment:"My previous recommendation was incorrect. Let's continue.",
 apology:"I'm sorry. My previous recommendation was incorrect. Let's continue.",
 apology_explanation:"I'm sorry. My previous recommendation was incorrect because I misidentified the object. Let's continue."
 }
};
HRI.validate = function () {
 const c=HRI.config;
 for(const n of [c.practiceTrials,c.buildTrustTrials,c.errorPhaseTrials,c.recoveryTrials])
  if(!Number.isInteger(n)||n<1) throw Error("Trial counts must be positive integers.");
 if(!(c.trialTimeLimitMs>0)) throw Error("Invalid time limit.");
 if(new Set(c.errorTrials).size!==c.errorTrials.length || c.errorTrials.some(n=>!Number.isInteger(n)||n<=c.buildTrustTrials||n>c.buildTrustTrials+c.errorPhaseTrials)) throw Error("Errors must be unique main-task trial numbers in Phase 2.");
};
