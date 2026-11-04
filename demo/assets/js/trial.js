"use strict";
HRI.runTrial=function(trial,done){
 HRI.screen(`<div id="trial-interface" class="trial-interface task-layout"><div class="task-content">
 ${trial.phase==='practice'?`<p class="practice-label">Practice ${trial.trial_number} of ${HRI.config.practiceTrials}</p>`:''}
 <div class="target-display"><p class="eyebrow">Item to find</p><h1>${trial.target_item}</h1></div>
 ${HRI.pepper(`I think it is in Section ${trial.robot_suggestion}.`)}
 </div><div id="choices" class="task-action-area"><p class="choice-prompt">Where is the item?</p><div class="choices">${HRI.sections.map(s=>`<button data-choice="${s}" aria-label="Section ${s}"><span>Section</span><strong>${s}</strong></button>`).join('')}</div><button id="manual" class="secondary">Manual Check</button></div>
 <div class="trial-clock-slot"><p class="trial-countdown" role="timer" aria-label="Trial time remaining"><span class="clock-label">Trial time</span><strong id="time" data-trial-clock></strong></p></div></div>
 <section id="rack" class="rack-inspection" role="dialog" aria-modal="true" aria-labelledby="inspection-target" hidden>
 <header class="inspection-header"><div class="inspection-target"><p class="eyebrow">Looking for</p><h2 id="inspection-target">${trial.target_item}</h2></div><button id="back" class="secondary" aria-label="Back to choices">&larr; Back</button></header>
 <div class="inspection-image"><img id="rack-image" alt="Complete storage rack: rows A, B, C and D"><p id="rack-unavailable" class="image-status" role="status" hidden>The rack image could not be loaded.</p></div><footer class="inspection-actions"><button id="back-bottom" class="secondary" aria-label="Back to choices">&larr; Back</button><p class="trial-countdown" role="timer" aria-label="Trial time remaining"><span class="clock-label">Trial time</span><strong id="manual-time" data-trial-clock></strong></p></footer></section>`);
 const rackImage=document.getElementById('rack-image');
 rackImage.onerror=()=>{rackImage.hidden=true;document.getElementById('rack-unavailable').hidden=false;};
 rackImage.src='assets/images/manual-rack.jpg';
 const start=performance.now(),epoch=Date.now(),limit=HRI.config.trialTimeLimitMs;
 let ended=false,used=false,opened=null,firstOpen=null,duration=0,interval,timeout;
 const close=now=>{if(opened!==null){duration+=now-opened;opened=null;}};
 function finish(choice,timedOut){
  if(ended)return;ended=true;HRI.abortTrial=null;clearInterval(interval);clearTimeout(timeout);
  document.body.classList.remove('inspecting');
  const now=performance.now();close(now);const elapsed=Math.round(now-start);
  done({...trial,participant_id:uniqueId,recovery_condition:HRI.recoveryCondition,
   manual_check_used:used,manual_check_start_time:firstOpen,manual_check_duration_ms:Math.round(duration),
   participant_choice:choice,followed_robot:choice===trial.robot_suggestion,participant_correct:choice===trial.correct_section,
   response_time_ms:choice===null?null:elapsed,trial_duration_ms:elapsed,timed_out:timedOut,trial_start_time:epoch});
 }
 HRI.abortTrial=()=>finish(null,true);
 function expired(){if(HRI.deadline&&Date.now()>=HRI.deadline){HRI.endTask('time_limit');return true;}if(performance.now()-start>=limit){finish(null,true);return true;}return false;}
 function tick(){if(expired())return;const s=Math.ceil((limit-(performance.now()-start))/1000);document.querySelectorAll('[data-trial-clock]').forEach(node=>{node.textContent=String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');node.closest('.trial-countdown').classList.toggle('clock-urgent',s<=5);});}
 document.querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>{if(!expired())finish(b.dataset.choice,false);});
 document.getElementById('manual').onclick=()=>{
  if(expired())return;used=true;opened=performance.now();if(firstOpen===null)firstOpen=epoch+Math.round(opened-start);
  document.getElementById('trial-interface').hidden=true;document.body.classList.add('inspecting');document.getElementById('rack').hidden=false;document.getElementById('back').focus();
 };
 document.getElementById('back').onclick=()=>{
  if(expired())return;close(performance.now());document.getElementById('rack').hidden=true;document.getElementById('trial-interface').hidden=false;document.body.classList.remove('inspecting');document.getElementById('manual').focus();
 };
 document.getElementById('back-bottom').onclick=()=>document.getElementById('back').click();
 document.getElementById('rack').onkeydown=e=>{if(e.key==='Escape'){e.preventDefault();document.getElementById('back').click();}else if(e.key==='Tab'){e.preventDefault();const next=document.activeElement.id==='back'?'back-bottom':'back';document.getElementById(next).focus();}};
 interval=setInterval(tick,100);timeout=setTimeout(()=>finish(null,true),limit);tick();
};
