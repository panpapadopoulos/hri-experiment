"use strict";
var psiTurk;
HRI.screen=function(html){document.body.innerHTML='<main class="study-container experiment" tabindex="-1"><div class="study-card">'+html+'</div></main>';document.querySelector('main').focus();window.scrollTo(0,0);};
// Alternate suggestion poses once per recommendation, never while it is displayed.
HRI.suggestionCount=0;
HRI.pepper=function(message,pose='suggestion'){
 const paths={error:'error.png',apology:'apology.png',neutral:'Suggestion1.png'};
 const image=pose==='suggestion' ? `Suggestion${(HRI.suggestionCount++ % 3)+1}.png` : paths[pose];
 const visual=`<img src="/static/images/${image}" alt="Pepper robot assistant">`;
 return `<section class="pepper-message" data-pepper-pose="${pose}"><div class="pepper-avatar pepper-speaking ">${visual}</div><div class="speech-bubble"><h3>Pepper</h3><p>${message}</p></div></section>`;
};
HRI.feedbackPepper=function(trial,result){
 if(!trial.robot_correct)return HRI.pepper(HRI.config.messages[HRI.recoveryCondition],HRI.recoveryCondition==='acknowledgment'?'error':'apology');
 if(!result.timed_out&&result.manual_check_used&&result.followed_robot)return HRI.pepper("Your check confirmed the item location.",'neutral');
 return '';
};
HRI.record=function(type,data){psiTurk.recordTrialData({record_type:type,participant_id:uniqueId,recovery_condition:HRI.recoveryCondition,timestamp:Date.now(),...data});};
// Intermediate transitions retain responses in memory; only final Submit persists them.
HRI.save=function(next){next();};
HRI.submitData=function(next){
 HRI.screen('<h1>Saving</h1><p>Please wait.</p>');
 psiTurk.saveData({success:next,error:function(){HRI.screen('<h1>Save failed</h1><p>Keep this page open. Your responses are still held here.</p><button id="retry">Retry save</button>');document.getElementById('retry').onclick=()=>HRI.submitData(next);}});
};
HRI.continuePage=function(title,content,next){HRI.screen(`<div class="task-layout task-transition"><div class="task-content"><h1>${title}</h1>${content}</div><div class="task-action-area"><button id="continue">Continue</button></div><div class="task-footer" aria-hidden="true"></div></div>`);document.getElementById('continue').onclick=next;};
HRI.trust=function(checkpoint,next){HRI.questionnaire('Trust in the robot',HRI.trustItems.map((s,i)=>['trust_'+(i+1),s,'Strongly disagree','Strongly agree']),7,values=>{HRI.record('trust',{checkpoint,...values});HRI.save(next);});};
HRI.phase=function(phase,count,first,next){
 let index=0;
 const run=function(){
  if(index===count){next();return;}
  const trial=HRI.makeTrial(uniqueId,phase,first+index++);
  HRI.runTrial(trial,result=>{
   HRI.record('trial',result);
   const after=()=>{if(phase!=='practice'&&trial.trial_number===HRI.config.earlyRecoveryTrustTrial)HRI.trust('early_recovery',run);else run();};
   const message=HRI.feedbackPepper(trial,result);
   HRI.continuePage(result.participant_correct?'&#10003; Correct':'&#10005; Incorrect',`<div class="answer-feedback"><p>The item was in <strong>Section ${trial.correct_section}</strong>.</p>${result.timed_out?'<p class="muted">Time ran out before an answer was selected.</p>':''}</div>${message}`,()=>HRI.save(after));
   document.querySelector('.study-card').classList.add('feedback-card',result.participant_correct?'feedback-correct':'feedback-incorrect');
  });
 };
 run();
};
HRI.finish=function(){
 HRI.questionnaire('Workload',HRI.workloadItems,7,values=>{
  HRI.record('workload',values);HRI.save(()=>{
   HRI.screen('<h1>Feedback</h1><form id="feedback"><label for="comments">How did the robot recommendations and responses affect your decisions?</label><textarea id="comments" rows="6" maxlength="10000"></textarea><p>Optional. Do not include identifying information.</p><button>Continue</button></form>');
   document.getElementById('feedback').onsubmit=e=>{
    e.preventDefault();HRI.record('feedback',{comments:document.getElementById('comments').value});
    HRI.save(()=>HRI.continuePage('Debrief','<p>This experiment examines how responses to robot errors affect trust, reliance, workload, and performance.</p><p>The robot recommendations were scripted. Some recommendations were deliberately incorrect. Each participant received acknowledgment, apology, or apology with an explanation. The explanation was scripted, not a diagnosis of a real robot.</p><p>Continue to the final submission screen.</p>',()=>{
     HRI.readyToSubmit();
    }));
   };
  });
 });
};
HRI.readyToSubmit=function(){
 HRI.screen('<div class="completion-card"><img class="lab-logo" src="/static/images/pnw.png" alt="Purdue University Northwest"><h1>Thank you for participating</h1><p>Your responses have not been saved yet.</p><p>Click Submit to send your responses and complete the study. Keep this page open until submission is confirmed.</p><button id="submit-responses" type="button">Submit</button></div>');
 document.getElementById('submit-responses').onclick=function(){
  this.disabled=true;
  HRI.record('completion',{completed:true});
  HRI.submitData(function(){window.removeEventListener('beforeunload',HRI.warnUnsaved);psiTurk.completeHIT();});
 };
};
HRI.warnUnsaved=function(event){event.preventDefault();event.returnValue='';};
HRI.begin=function(){
 const c=HRI.config;
 HRI.continuePage('About the study',`<p>This study explores how people make decisions while working with a robot assistant named Pepper.</p>
 <div class="instruction-grid"><section><h2>What you will do</h2><p>Locate items in a storage rack and choose their row. Pepper will offer a suggestion, but you make every final decision.</p></section>
 <section><h2>What to expect</h2><p>You will complete ${c.practiceTrials} practice trials and ${c.buildTrustTrials+c.errorPhaseTrials+c.recoveryTrials} main trials, with brief questions about your experience.</p></section></div>
 <p>On the next page, learn exactly how to inspect the rack and submit an answer. These introduction pages are not timed.</p>`,HRI.instructions);
 document.getElementById('continue').textContent='View Task Instructions';
};
HRI.instructions=function(){
 const c=HRI.config;
 HRI.continuePage('Task Overview',`<p class="overview-lead">You will complete a series of time-limited tasks with Pepper.<br>Find the requested item as quickly and accurately as you can.</p>
 <div class="overview-steps">
 <section class="overview-step"><header><span class="step-number">1</span><h2>View the item and<br>Pepper&rsquo;s suggestion</h2></header><p>Read the <strong>ITEM TO FIND</strong>. Pepper suggests a section, but you always make the final decision.</p>
 <div class="instruction-example" aria-label="Example target Gear and Pepper recommendation Section A">
 <div class="example-target"><small>ITEM TO FIND</small><strong>GEAR</strong></div>
 <div class="example-pepper"><img src="/static/images/Suggestion1.png" alt="Pepper"><p>I think it is in Section A.</p></div>
 <p class="example-caption">Your decision comes next.</p>
 </div></section>
 <section class="overview-step"><header><span class="step-number">2</span><h2>Make a choice</h2></header><p>Select the row where you think the item is located, or choose <strong>Manual Check</strong> to inspect the rack first. A section click is your final answer.</p>
 <div class="instruction-example" aria-label="Illustration of section choices and Manual Check; not interactive">
 <div class="example-choices"><span>Section <b>A</b></span><span>Section <b>B</b></span><span>Section <b>C</b></span><span>Section <b>D</b></span></div>
 <div class="example-manual">Manual Check</div><p class="example-caption">You may check and still agree with Pepper.</p>
 </div></section>
 <section class="overview-step"><header><span class="step-number">3</span><h2>Manual Check<br><small>(optional)</small></h2></header><p>See <strong>one image of the entire rack</strong>. Sections are horizontal rows: <strong>A to D, top to bottom</strong>. Find the item, select <strong>Back</strong>, then choose its row.</p>
 <div class="instruction-example rack-example"><div class="example-target"><small>LOOKING FOR</small><strong>GEAR</strong></div><img src="/static/images/manual-rack.jpg" alt="Complete rack: Gear is in the top row, Section A"><div class="example-back">&larr; Back</div><p class="example-caption">A1&ndash;A4 all belong to Section A. The image itself is not an answer button.</p></div>
 </section></div>
 <div class="overview-notice"><span aria-hidden="true">i</span><p><strong>${c.trialTimeLimitMs/1000} seconds per trial.</strong> The timer keeps running during Manual Check. If it runs out, the trial ends without an answer. Read the feedback, then click Continue.</p></div>
 <p class="overview-footnote">Start with ${c.practiceTrials} practice trials. Instructions and feedback screens are not timed.</p>`,()=>{
  // Avoid PsiTurk finishInstructions: it automatically saves responses.
  $.ajax({url:'/inexp',type:'POST',data:{uniqueId:uniqueId}});
  const phase3=()=>HRI.phase('continued_interaction',c.recoveryTrials,c.buildTrustTrials+c.errorPhaseTrials+1,()=>HRI.trust('end_phase_3',HRI.finish));
  const phase2=()=>HRI.phase('errors_recovery',c.errorPhaseTrials,c.buildTrustTrials+1,phase3);
  const phase1=()=>HRI.phase('build_trust',c.buildTrustTrials,1,phase2);
  HRI.phase('practice',c.practiceTrials,1,()=>{
   HRI.continuePage('Practice Complete','<p>You are ready to begin the main task.</p>',()=>HRI.trust('baseline',phase1));
   document.getElementById('continue').textContent='Begin Task';
  });
 });
 document.querySelector('.task-layout').classList.add('instruction-page');
 document.querySelector('.study-card').classList.add('overview-card');
 document.querySelector('.task-content>h1').insertAdjacentHTML('beforebegin','<p class="overview-eyebrow">INSTRUCTIONS</p>');
 document.getElementById('continue').textContent='Start Practice';
};
$(function(){try{
 HRI.validate();if(!Number.isInteger(condition)||!HRI.config.conditions[condition])throw Error('Expected condition 0, 1 or 2. Start a new debug participant.');
 HRI.recoveryCondition=HRI.config.conditions[condition];psiTurk=new PsiTurk(uniqueId,adServerLoc,mode);
 if(psiTurk.getTrialData().length){HRI.screen('<h1>Session already started</h1><p>This version cannot resume after a refresh. Saved responses have not been overwritten. Please ask the researcher to start a new participant session.</p>');return;}
 window.addEventListener('beforeunload',HRI.warnUnsaved);
 HRI.record('session',{condition_index:condition,settings:HRI.config,code_version:codeversion,collection_source:uniqueId.startsWith('debugClassroom_')?'classroom':'debug'});HRI.record('consent',{accepted:true,form_version:'development-v1'});
 HRI.screen('<h1>Demographics</h1><form id="demographics"><label>Age<input required type="number" name="age" min="18" max="120"></label><label>Gender<select required name="gender"><option value="">Choose</option><option>Male</option><option>Female</option><option>Non-binary</option><option>Other</option><option>Prefer not to say</option></select></label><label>Robot experience<select name="robot_experience" required><option value="">Choose</option><option>None</option><option>A little</option><option>Moderate</option><option>Extensive</option><option>Prefer not to say</option></select></label><button>Continue</button></form>');
 document.getElementById('demographics').onsubmit=e=>{e.preventDefault();if(!e.target.reportValidity())return;HRI.record('demographics',Object.fromEntries(new FormData(e.target)));HRI.save(HRI.begin);};
}catch(error){HRI.screen('<h1>Unable to start</h1><p id="startup-error"></p>');document.getElementById('startup-error').textContent=error.message;}});
