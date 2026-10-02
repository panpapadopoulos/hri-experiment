"use strict";
// PROVISIONAL TRUST ITEMS — replace before final study
HRI.trustItems=["I trust the robot's recommendations.","I believe the robot is reliable.","I feel confident relying on the robot.","I would follow the robot's recommendation without checking."];
// Provisional NASA-TLX-style 1?7 ratings; not the weighted NASA-TLX instrument.
HRI.workloadItems=[['mental_demand','Mental Demand','Very low','Very high'],['physical_demand','Physical Demand','Very low','Very high'],['temporal_demand','Temporal Demand','Very low','Very high'],['performance','Performance','Perfect','Failure'],['effort','Effort','Very low','Very high'],['frustration','Frustration','Very low','Very high']];
HRI.questionnaire=function(title,items,max,done){
 HRI.screen(`<h1>${title}</h1><form id="ratings" class="ratings-grid">${items.map(([key,label,low,high])=>`<fieldset><legend>${label}</legend><p>${low} (1) &ndash; ${high} (${max})</p><div class="rating">${Array.from({length:max},(_,i)=>`<label><input required type="radio" name="${key}" value="${i+1}"> ${i+1}</label>`).join('')}</div></fieldset>`).join('')}<button type="submit">Continue</button></form>`);
 document.getElementById('ratings').onsubmit=e=>{e.preventDefault();const data=Object.fromEntries(new FormData(e.target));Object.keys(data).forEach(k=>data[k]=Number(data[k]));done(data);};
};
