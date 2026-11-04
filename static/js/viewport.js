// Fit participant cards without clipping content. Compact/paged layouts do most work;
// scaling is a fallback for small windows or browser zoom. No data or timing effects.
(function(){
 let queued=false;
 function fit(){
  queued=false;if(location.pathname.startsWith('/researcher')){document.body.classList.add('researcher-view');return;}
  const main=document.querySelector('main.study-container');if(!main)return;
  if(window.visualViewport&&window.visualViewport.height<window.innerHeight*0.75&&/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName))return;
  main.style.zoom='1';
  const available=window.innerHeight-(document.getElementById('overall-time')?84:48);
  const height=main.getBoundingClientRect().height;
  const scale=Math.min(1,available/height,(window.innerWidth-8)/Math.max(main.scrollWidth,1));
  if(scale<1)main.style.zoom=String(Math.max(0.1,scale));
 }
 function schedule(){if(!queued){queued=true;queueMicrotask(fit);}}
 new MutationObserver(events=>{if(events.some(e=>e.type==='childList'&&e.target.id!=='overall-time'&&e.target.id!=='time'))schedule();}).observe(document.body,{childList:true,subtree:true});
 window.addEventListener('resize',schedule);document.addEventListener('load',schedule,true);schedule();
})();
