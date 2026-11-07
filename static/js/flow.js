"use strict";
// Current classroom flow: condition is allocated by PsiTurk before this script runs.
HRI.requireFields=function(form){
 const button=form.querySelector('button[type="submit"]');
 const touched=new Set();
 const update=()=>{
  button.disabled=!form.checkValidity();
  const groups=new Map();
  [...form.elements].filter(x=>x.name&&x.type!=='submit').forEach(x=>{if(!groups.has(x.name))groups.set(x.name,[]);groups.get(x.name).push(x);});
  for(const [name,fields] of groups){
   const active=fields.filter(x=>!x.disabled);const field=active[0];
   let error=form.querySelector('[data-error-for="'+name+'"]');
   const invalid=field&&touched.has(name)&&active.some(x=>!x.validity.valid);
   if(invalid&&!error){error=document.createElement('p');error.className='field-error';error.dataset.errorFor=name;error.id='error-'+name;error.setAttribute('role','status');const anchor=field.closest('.survey-row,fieldset')||field.closest('label')||field;anchor.insertAdjacentElement('afterend',error);}
   if(error){error.hidden=!invalid;const message=name==='age'?'Enter a whole-number age from 18 to 80.':name==='gender_other'?'Please describe your gender, or choose another option.':field?.type==='radio'||field?.tagName==='SELECT'?'Please choose an answer.':'Please complete this field.';if(error.textContent!==message)error.textContent=message;}
   fields.forEach(x=>{x.setAttribute('aria-invalid',String(!!invalid));if(error)x.setAttribute('aria-describedby',error.id);});
  }
 };
 const changed=e=>{if(e.target.name)touched.add(e.target.name);update();};
 form.addEventListener('input',changed);form.addEventListener('change',changed);form.addEventListener('focusout',changed);update();
};
HRI.showVideo=function(){
 const videos={acknowledgment:'Acknowledge.mp4',apology:'Apology.mp4',apology_explanation:'ApologyExplanation.mp4'};
 HRI.screen(`<div class="intro-video"><video id="intro-video" controls autoplay playsinline src="/static/videos/${videos[HRI.recoveryCondition]}"></video><div class="navigation"><button id="replay" type="button">Replay</button><button id="skip" type="button">Continue / Skip Video</button></div></div>`);
 const video=document.getElementById('intro-video');video.play().catch(()=>{});
 document.getElementById('replay').onclick=()=>{video.currentTime=0;video.play().catch(()=>{});};
 document.getElementById('skip').onclick=()=>HRI.instructions(0);
};
HRI.demographics=function(){
 const experience=(key,title)=>`<fieldset><legend>${title}</legend><div class="experience-options">${['None','A little','Moderate','Extensive'].map((s,i)=>`<label><input type="radio" required name="${key}" value="${s}"> ${s}</label>`).join('')}</div></fieldset>`;
 HRI.screen(`<h1>About you</h1><form id="demographics" class="demographics-form"><div class="demographic-basics"><label>Age (18&ndash;80)<input required type="number" inputmode="numeric" step="1" name="age" min="18" max="80"></label><label>Gender<select required name="gender"><option value="">Choose</option><option>Male</option><option>Female</option><option>Non-binary</option><option>Other</option><option>Prefer not to say</option></select></label></div><label id="gender-other" hidden>Please describe your gender<input name="gender_other" maxlength="100" pattern=".*\\S.*" disabled></label>${experience('robot_experience','Experience interacting with robots')}${experience('psiturk_experience','Experience participating in studies using PsiTurk')}<button type="submit" disabled>Continue</button></form>`);
 const form=document.getElementById('demographics');
 form.elements.gender.onchange=()=>{const other=form.elements.gender.value==='Other';document.getElementById('gender-other').hidden=!other;form.elements.gender_other.disabled=!other;form.elements.gender_other.required=other;};
 HRI.requireFields(form);
 form.onsubmit=e=>{e.preventDefault();if(!form.reportValidity())return;const values=Object.fromEntries(new FormData(form));values.age=Number(values.age);HRI.record('demographics',values);HRI.showVideo();};
};
HRI.instructions=function(page=0){
 const slides=[
 ['Your task: locate the item',`<div class="task-preview-layout">
 <figure class="trial-preview" aria-label="Non-interactive example of the trial screen">
 <div class="preview-clock">Task time remaining <strong>10:00</strong></div>
 <div class="preview-topline"><div class="target-display"><p class="eyebrow">Item to find</p><h2>GEAR</h2></div><div class="preview-tools"><div class="example-manual">Manual Check</div><div class="preview-trial-time"><small>Trial time</small><strong>00:12</strong></div></div></div>
 <div class="preview-pepper"><img src="/static/images/Suggestion1.png" alt="Pepper robot"><div class="speech-bubble"><h3>Pepper</h3><p>I think it is in Section A.</p></div></div>
 <p class="preview-prompt">Where is the item?</p>
 <div class="example-choices"><span>Section <b>A</b></span><span>Section <b>B</b></span><span>Section <b>C</b></span><span>Section <b>D</b></span></div>

 <figcaption>Example screen only. The timers are not running.</figcaption>
 </figure>
 <div class="preview-explanation"><p><strong>Find the named item in the rack.</strong> Choose the row where it belongs: A, B, C, or D.</p>
 <ol><li><strong>Read the item name.</strong> In this example, you are looking for a gear.</li><li><strong>Read Pepper's suggestion.</strong> Pepper suggests Section A, but its recommendation may be right or wrong.</li><li><strong>Make your choice.</strong> Select a section, or use Manual Check to inspect the rack first. You make the final decision.</li></ol>
<p>You will make <strong>15 choices</strong>, one item at a time.</p></div></div>`],
 ['Choose a section','<p>Read the item name and Pepper&rsquo;s suggestion. Select <strong>A, B, C, or D</strong> for the row where you believe the item is located. Clicking a section submits your final answer for that trial.</p><div class="example-choices"><span>Section <b>A</b></span><span>Section <b>B</b></span><span>Section <b>C</b></span><span>Section <b>D</b></span></div><p>You may follow Pepper or choose a different section. If 12 seconds pass without a choice, the trial is recorded as a timeout.</p>'],
 ['How to use Manual Check',`<div class="manual-guide-layout"><figure><img class="manual-guide-image" src="/static/images/manual-rack.jpg" alt="The full rack: Section A is the top row, followed by B, C and D"><figcaption>Rows from top to bottom: <strong>A, B, C, D</strong>.<br>For example, the gear is in the top row: <strong>Section A</strong>.</figcaption></figure><div><ol class="manual-steps"><li>Press <strong>Manual Check</strong> to open the rack image.</li><li>Find the item named at the top of the screen.</li><li>Note its <strong>row letter</strong>. A1, A2, A3 and A4 all belong to Section A.</li><li>Press either <strong>Back</strong> button to return to the choices.</li><li>Select <strong>A, B, C or D</strong> to give your answer.</li></ol><p class="instruction-note"><strong>Clicking the image does not give an answer.</strong> Both timers keep running while you look.</p><p>You can check the rack and still choose Pepper's suggested section.</p></div></div>`],
 ['Your two timers','<div class="timing-guide"><section><h2>12 seconds for each item</h2><p>Choose a section before this timer reaches zero. It turns red at <strong>5 seconds</strong>.</p><p>If time runs out, that trial ends without an answer.</p></section><section><h2>10 minutes for the whole task</h2><p>This timer starts when you press <strong>Begin Task</strong>. It keeps running during feedback and the short questions between trials.</p><p>If time runs out, you move to the final questions.</p></section></div><p class="instruction-note"><strong>Both timers keep running during Manual Check.</strong> These instructions are not timed.</p>'],
 ['When your answer is correct','<p>You will see Correct and the item&rsquo;s actual section. Read the feedback, then press Continue for the next step.</p><img class="guide-image" src="/static/images/instructions/correct.png" alt="Example correct answer feedback">'],
 ['When your answer is incorrect','<p>If you choose the wrong section, the screen shows Incorrect and the correct section. Read it, then press Continue.</p><img class="guide-image" src="/static/images/instructions/participant-incorrect.png" alt="Example incorrect participant answer feedback">'],
 ['When Pepper&rsquo;s suggestion is incorrect',`<p>When Pepper suggests the wrong section, it shows a message like this. This can happen even if your own answer was correct. Read the message, then press Continue.</p><img class="guide-image" src="/static/images/instructions/${HRI.recoveryCondition}.png" alt="Example Pepper recovery message for your assigned condition">`],
 ['Ready to begin','<p>Find the item &rarr; choose a section, or inspect the rack first &rarr; read feedback &rarr; Continue.</p><p><strong>12 seconds per trial &middot; 15 trials &middot; 10-minute overall limit.</strong></p><p>Brief trust questions appear during the task. Answer every question before continuing. At the end, complete the final questions and press Submit.</p><p>The overall countdown remains visible during the task, including Manual Check. These instructions and the final questionnaires are outside the timed task.</p>']
 ];
 if(window.matchMedia('(max-width:600px)').matches){
  const preview=document.createElement('div');preview.innerHTML=slides[0][1];
  slides.splice(0,1,['Your task screen',preview.querySelector('figure').outerHTML],['Find the item',preview.querySelector('.preview-explanation').innerHTML]);
  const manualIndex=slides.findIndex(x=>x[0]==='How to use Manual Check');const manual=document.createElement('div');manual.innerHTML=slides[manualIndex][1];
  slides.splice(manualIndex,1,['The rack and its rows',manual.querySelector('figure').outerHTML],['How to use Manual Check',manual.querySelector('.manual-guide-layout>div').innerHTML]);
 }
 const [title,content]=slides[page];
 HRI.screen(`<div class="guide-page"><p class="eyebrow">Instructions ${page+1} / ${slides.length}</p><h1>${title}</h1><div class="guide-content">${content}</div><div class="navigation"><button id="previous" type="button" ${page===0?'disabled':''}>Previous</button><button id="next" type="button">${page===slides.length-1?'Begin Task':'Next'}</button></div></div>`);
 document.getElementById('previous').onclick=()=>HRI.instructions(page-1);
 document.getElementById('next').onclick=()=>page===slides.length-1?HRI.startTask():HRI.instructions(page+1);
};
const originalScreen=HRI.screen;
HRI.screen=function(html){originalScreen(html);if(HRI.deadline){document.body.insertAdjacentHTML('afterbegin','<div class="overall-clock" role="timer" aria-label="Overall task time remaining">Task time remaining <strong id="overall-time"></strong></div>');HRI.paintClock();}};
HRI.paintClock=function(){const node=document.getElementById('overall-time');if(node){const seconds=Math.max(0,Math.ceil((HRI.deadline-Date.now())/1000));node.textContent=String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');}};
HRI.endTask=function(reason){
 if(!HRI.deadline)return;
 HRI.expiring=true;
 if(HRI.abortTrial)HRI.abortTrial();
 clearInterval(HRI.overallInterval);HRI.deadline=null;
 HRI.record('task_end',{reason,elapsed_ms:Date.now()-HRI.taskStarted});
 HRI.trust('final',HRI.finish);
 if(reason==='time_limit')document.querySelector('h1').insertAdjacentHTML('afterend','<p role="status">The 10-minute task limit has been reached. Please complete these final questions and submit your responses.</p>');
};
HRI.startTask=function(){
 $.ajax({url:'/inexp',type:'POST',data:{uniqueId:uniqueId}});
 HRI.expiring=false;HRI.taskStarted=Date.now();HRI.deadline=HRI.taskStarted+HRI.config.taskTimeLimitMs;
 HRI.overallInterval=setInterval(()=>{HRI.paintClock();if(Date.now()>=HRI.deadline)HRI.endTask('time_limit');},100);
 const phase3=()=>HRI.phase('continued_interaction',4,12,()=>HRI.endTask('completed_trials'));
 const phase2=()=>HRI.phase('errors_recovery',7,5,phase3);
 HRI.phase('build_trust',4,1,()=>HRI.trust('pre_error',phase2));
};
// MDMT v1 Capacity Trust: original Reliable and Capable items (Ullman & Malle, 2019).
HRI.mdmtItems=[['reliable','Reliable'],['capable','Capable'],['predictable','Predictable'],['skilled','Skilled'],['count_on','Someone you can count on'],['competent','Competent'],['consistent','Consistent'],['meticulous','Meticulous']];
HRI.itemHelp={
 mdmt_reliable:'Pepper gives advice you can depend on.',
 mdmt_capable:'Pepper is able to do this task.',
 mdmt_predictable:'You can tell what to expect from Pepper.',
 mdmt_skilled:'Pepper is good at doing this task.',
 mdmt_count_on:'You can turn to Pepper when you need help.',
 mdmt_competent:'Pepper has the ability needed to do the task well.',
 mdmt_consistent:'Pepper performs in a similar way from one trial to the next.',
 mdmt_meticulous:'Pepper pays close attention to small details.',
 mental_demand:'How much thinking and attention did the task need?',
 physical_demand:'How much physical activity did the task need?',
 temporal_demand:'How rushed did you feel?',
 performance:'How well did you do? 1 means you did very well; 7 means you did very poorly.',
 effort:'How hard did you have to work to do the task?',
 frustration:'How annoyed, stressed, or discouraged did you feel?'
};
HRI.ratingPage=function(title,items,options,intro,done){
 items=items.map(([key,label])=>[key,label+(HRI.itemHelp[key]?`<small class="item-help">${HRI.itemHelp[key]}</small>`:'')]);
 HRI.screen(`<div class="survey-page"><h1>${title}</h1><p class="survey-intro">${intro}</p><form id="ratings"><div class="survey-matrix"><div class="survey-row survey-head" style="--options:${options.length}"><span>Description</span>${options.map(([value,label])=>`<span>${label}</span>`).join('')}</div>${items.map(([key,label])=>`<div class="survey-row" role="group" aria-label="${label.replace(/<[^>]*>/g,' ')}" style="--options:${options.length}"><span class="survey-label">${label}</span>${options.map(([value,caption])=>`<label class="survey-radio"><input required type="radio" name="${key}" value="${value}" aria-label="${label.replace(/<[^>]*>/g,' ')}: ${caption}"></label>`).join('')}<select class="survey-select" name="${key}" aria-label="${label.replace(/<[^>]*>/g,' ')}" required disabled><option value="">Choose</option>${options.map(([value,caption])=>`<option value="${value}">${caption}</option>`).join('')}</select></div>`).join('')}</div><div class="navigation"><button type="submit" disabled>Continue</button></div></form></div>`);
 const form=document.getElementById('ratings');
 const compact=window.matchMedia('(max-width: 600px)');
 const sync=()=>{form.querySelectorAll('.survey-row[role="group"]').forEach(row=>{const select=row.querySelector('select');const radios=[...row.querySelectorAll('input')];if(compact.matches){const checked=radios.find(x=>x.checked);if(checked)select.value=checked.value;}else if(select.value){radios.forEach(x=>x.checked=x.value===select.value);}select.disabled=!compact.matches;radios.forEach(x=>x.disabled=compact.matches);});form.dispatchEvent(new Event('input'));};
 sync();compact.addEventListener('change',sync);HRI.requireFields(form);
 form.onsubmit=e=>{e.preventDefault();if(HRI.deadline&&Date.now()>=HRI.deadline){HRI.endTask('time_limit');return;}if(!form.reportValidity())return;const values=Object.fromEntries(new FormData(form));Object.keys(values).forEach(key=>values[key]=values[key]==='does_not_fit'?null:Number(values[key]));done(values);};
};
HRI.trust=function(checkpoint,next){
 const options=Array.from({length:8},(_,i)=>[i,String(i)]);options.push(['does_not_fit','Does Not Fit']);
 HRI.ratingPage('Your view of Pepper',HRI.mdmtItems.map(([key,label])=>['mdmt_'+key,label]),options,'How well does each description fit Pepper right now? <strong>0 = Not at all; 7 = Very.</strong> Choose Does Not Fit if a description does not apply.',values=>{HRI.record('trust',{checkpoint,instrument:'mdmt_capacity_v1',explanation_version:'plain_language_v1',...values});HRI.save(next);});
};
HRI.questionnaire=function(title,items,max,done){
 HRI.ratingPage(title,items.map(([key,label,low,high])=>[key,`${label}<small>${low} (1) to ${high} (${max})</small>`]),Array.from({length:max},(_,i)=>[i+1,String(i+1)]),'Choose one answer in each row to describe your experience.',done);
};
