"use strict";
HRI.sections=["A","B","C","D"];
// Read directly from manual-rack.jpg labels. Sections are ROWS, not columns.
HRI.items=Object.freeze([
  {
    "id": "A1",
    "name": "Gear",
    "correctSection": "A"
  },
  {
    "id": "A2",
    "name": "Sensor",
    "correctSection": "A"
  },
  {
    "id": "A3",
    "name": "Motor",
    "correctSection": "A"
  },
  {
    "id": "A4",
    "name": "Battery",
    "correctSection": "A"
  },
  {
    "id": "B1",
    "name": "Circuit Board",
    "correctSection": "B"
  },
  {
    "id": "B2",
    "name": "Cable",
    "correctSection": "B"
  },
  {
    "id": "B3",
    "name": "Camera",
    "correctSection": "B"
  },
  {
    "id": "B4",
    "name": "Bracket",
    "correctSection": "B"
  },
  {
    "id": "C1",
    "name": "Wheel",
    "correctSection": "C"
  },
  {
    "id": "C2",
    "name": "Connector",
    "correctSection": "C"
  },
  {
    "id": "C3",
    "name": "Screw",
    "correctSection": "C"
  },
  {
    "id": "C4",
    "name": "Belt",
    "correctSection": "C"
  },
  {
    "id": "D1",
    "name": "Fan",
    "correctSection": "D"
  },
  {
    "id": "D2",
    "name": "Heat Sink",
    "correctSection": "D"
  },
  {
    "id": "D3",
    "name": "Switch",
    "correctSection": "D"
  },
  {
    "id": "D4",
    "name": "Valve",
    "correctSection": "D"
  }
].map(Object.freeze));
HRI.seed=function(text){let n=2166136261; for(const c of text)n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;};
HRI.random=function(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};};
HRI.makeTrial=function(participant,phase,number){
 const random=HRI.random(HRI.seed(participant+":"+phase+":"+number));
 const item=HRI.items[Math.floor(random()*HRI.items.length)],correct=item.correctSection;
 const wrong=phase==="errors_recovery"&&HRI.config.errorTrials.includes(number);
 const other=HRI.sections.filter(s=>s!==correct);
 return {phase,trial_number:number,target_item:item.name,correct_section:correct,
  robot_suggestion:wrong?other[Math.floor(random()*other.length)]:correct,robot_correct:!wrong,
  rack_items:HRI.items.map(item=>item.name)};
};
