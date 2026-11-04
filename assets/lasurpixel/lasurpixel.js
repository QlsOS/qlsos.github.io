/*! LasurPixel 1.0 — theme, inertial scroll, spotlight, aurora parallax. No dependencies. */
(()=>{
const PROTECT=true; // set false to allow selecting and copying text
const R=document.documentElement;let t;try{t=localStorage.getItem('t')}catch(e){}
R.dataset.theme=t||(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');
const LP=window.LP={};
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,weak=(navigator.hardwareConcurrency||4)<=2||(navigator.deviceMemory||4)<=2,BG={dark:'#03050a',light:'#e9eff8'};
const mkVeil=bg=>{const v=document.createElement('div');v.id='lp-veil';if(bg)v.style.background=bg;R.appendChild(v);return v};
// arriving after a language switch: start covered, then fade out smoothly
let st=0;try{st=+sessionStorage.getItem('lpv')||0}catch(e){}
if(!reduced&&st&&Date.now()-st<4000){const v=mkVeil();v.style.transition='none';v.style.opacity=1;
 const out=()=>requestAnimationFrame(()=>requestAnimationFrame(()=>{try{sessionStorage.removeItem('lpv')}catch(e){}v.style.transition='';v.style.opacity=0;setTimeout(()=>v.remove(),700)}));
 (document.fonts&&document.fonts.ready||Promise.resolve()).then(()=>document.readyState==='complete'?out():addEventListener('load',out,{once:true}));setTimeout(()=>v.remove(),4500)}
// language switch: fade to the page colour, reload, fade back in (compositor-only, cheap on weak PCs)
LP.reload=()=>{if(reduced){location.reload();return}const v=mkVeil();v.style.transition='opacity .22s ease';requestAnimationFrame(()=>{v.style.opacity=1});setTimeout(()=>{try{sessionStorage.setItem('lpv',Date.now())}catch(e){}location.reload()},240)};
// theme switch: View Transitions cross-fade where available, otherwise a light fade through the new colour
LP.theme=n=>{const apply=()=>{R.dataset.theme=n;try{localStorage.setItem('t',n)}catch(e){}};
 if(reduced){apply();return}
 if(document.startViewTransition&&!weak){document.startViewTransition(apply);return}
 const v=mkVeil(BG[n]);v.style.transition='opacity .16s ease';requestAnimationFrame(()=>{v.style.opacity=1;setTimeout(()=>{apply();requestAnimationFrame(()=>{v.style.transition='opacity .45s ease';v.style.opacity=0;setTimeout(()=>v.remove(),520)})},170)})};
document.addEventListener('DOMContentLoaded',()=>{
 const bg=document.querySelector('.bg');const tb=document.getElementById('theme');
 if(tb){let rot=0,busy=0;tb.onclick=()=>{if(busy)return;busy=1;setTimeout(()=>busy=0,650);LP.theme(R.dataset.theme==='light'?'dark':'light');rot+=180;tb.style.rotate=rot+'deg'}}
 // spotlight follows the pointer
 const sel='.btn,.card,.stat,.step,.rg,.layer,.lp-ib,.oc,.mc,.pdet,.lp-spot';
 document.querySelectorAll(sel).forEach(e=>e.classList.add('lp-spot'));
 addEventListener('pointermove',e=>{const el=e.target.closest&&e.target.closest(sel);if(!el)return;const r=el.getBoundingClientRect();el.style.setProperty('--mx',e.clientX-r.left+'px');el.style.setProperty('--my',e.clientY-r.top+'px')},{passive:true});
 document.querySelectorAll('.btn,.lp-ib,.chip').forEach(b=>b.addEventListener('pointerup',()=>setTimeout(()=>b.blur(),0)));
 if(PROTECT){R.setAttribute('data-protect','');const ok=t=>t&&t.closest&&t.closest('input,textarea,[contenteditable]');
  ['copy','cut','dragstart','selectstart'].forEach(ev=>document.addEventListener(ev,e=>{if(!ok(e.target))e.preventDefault()}))}
 // LasurSky: stars at different depths, slower than the page, so scrolling feels like falling deeper
 const cv=document.createElement('canvas');cv.id='lp-sky';if(bg)bg.after(cv);else document.body.prepend(cv);
 const g=cv.getContext('2d'),still=matchMedia('(prefers-reduced-motion: reduce)').matches;let W,H,S=[],last=0;
 const fit=()=>{const d=Math.min(devicePixelRatio||1,2);W=cv.width=innerWidth*d;H=cv.height=innerHeight*d;cv.dpr=d;const n=Math.min(240,Math.round(innerWidth*innerHeight/9000));
  S=Array.from({length:n},()=>{const z=Math.random()**1.6*.9+.1;return{x:Math.random()*W,y:Math.random()*H,z,p:Math.random()*6.28,v:.4+Math.random()*1.2,c:Math.random()<.18?'140,200,255':Math.random()<.1?'190,160,255':'255,255,255'}})};
 const draw=t=>{if(!g||document.hidden)return;g.clearRect(0,0,W,H);const d=cv.dpr,sy=scrollY*d;
  for(const s of S){const y=((s.y-sy*s.z*.22)%H+H)%H,a=(.35+.65*(.5+.5*Math.sin(t/1000*s.v+s.p)))*(.25+s.z*.75),r=(.5+s.z*1.3)*d;g.fillStyle='rgba('+s.c+','+a.toFixed(2)+')';g.fillRect(s.x,y,r,r)}};
 fit();addEventListener('resize',()=>{fit();draw(performance.now())});
 if(still)draw(0);else{const loop=t=>{if(t-last>32){last=t;draw(t)}requestAnimationFrame(loop)};requestAnimationFrame(loop)}
 // aurora parallax (transform only, clamped so the layer never leaves the screen)
 let pend=0;
 const par=()=>{pend=0;if(bg)bg.style.transform='translate3d(0,'+(-Math.min(scrollY*.05,innerHeight*.28)).toFixed(1)+'px,0)'};
 addEventListener('scroll',()=>{if(!pend){pend=1;requestAnimationFrame(par)}},{passive:true});par();
});
// inertial scroll for mouse wheels
if(matchMedia('(prefers-reduced-motion: reduce)').matches||matchMedia('(pointer: coarse)').matches)return;
R.classList.add('lp-smooth');
let tgt=scrollY,cur=scrollY,run=false;
const max=()=>R.scrollHeight-innerHeight;
const tick=()=>{cur+=(tgt-cur)*.12;if(Math.abs(tgt-cur)<.5){cur=tgt;run=false}scrollTo({top:cur,behavior:'instant'});if(run)requestAnimationFrame(tick)};
const go=y=>{tgt=Math.max(0,Math.min(max(),y));if(!run){cur=scrollY;run=true;requestAnimationFrame(tick)}};
LP.scrollTo=go;
addEventListener('wheel',e=>{if(e.ctrlKey||e.defaultPrevented)return;
 for(let el=e.target;el&&el!==document.body&&el!==R;el=el.parentElement){const s=getComputedStyle(el);
  if(/(auto|scroll)/.test(s.overflowY)&&el.scrollHeight>el.clientHeight+1){const up=e.deltaY<0;if((up&&el.scrollTop>0)||(!up&&el.scrollTop+el.clientHeight<el.scrollHeight-1))return}}
 e.preventDefault();let d=e.deltaY;if(e.deltaMode===1)d*=34;else if(e.deltaMode===2)d*=innerHeight;
 go((run?tgt:scrollY)+d)},{passive:false});
addEventListener('scroll',()=>{if(!run){cur=tgt=scrollY}},{passive:true});
addEventListener('click',e=>{const a=e.target.closest&&e.target.closest('a[href^="#"]');if(!a||e.defaultPrevented||e.metaKey||e.ctrlKey)return;
 let el;try{el=document.querySelector(a.hash)}catch(x){}if(!el)return;e.preventDefault();
 go(el.getBoundingClientRect().top+scrollY-(parseFloat(getComputedStyle(el).scrollMarginTop)||0));history.replaceState(null,'',a.hash)});
})();
