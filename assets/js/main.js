(()=>{
document.documentElement.classList.add('js');

const nav=document.querySelector('nav'),btn=document.getElementById('menu');
if(btn)btn.onclick=()=>nav.classList.toggle('open');
nav&&nav.addEventListener('click',()=>nav.classList.remove('open'));

const L0=window.QLS_L||(x=>x);const D={dispatcher:["dispatcher","The first ring-3 task. Starts services, hands channels to clients ('give me service X') and restarts crashed services."],consoled:["consoled","VGA console driver in ring 3. Holds the screen memory as a handle; if it dies, the kernel driver takes over."],kbdd:["kbdd","PS/2 keyboard driver in ring 3. Owns the interrupt line and port 0x60 as handles; sends characters over a channel."],atad:["atad","ATA disk driver as a service task. Gets the disk ports as capabilities and answers clients over a block protocol."],sh:["sh","The shell in ring 3: line editor, history, and run prog [args] --grant name:rights."],programs:["programs","Static ELF programs. A new task holds exactly the handles it is given; nothing is inherited."],memory:["memory","Physical page manager, paging, kernel heap. Each task has its own page directory and a frame limit."],tasks:["tasks","Preemptive round-robin scheduler. A task is (slot, generation); a crash kills only that task."],handles:["handles","Per-task table. Rights only shrink; a closed number never works again; handles can be revoked or time-limited."],channels:["channels","Pair of endpoints, 64-byte messages, 16 in the queue, blocking and non-blocking. Handles can travel in messages."],"ELF loader":["ELF loader","Loads static ELF32 into a fresh address space with a guard page under the 16 KB stack."],"x86 (32-bit)":["x86 (32-bit)","Boots through its own two-stage bootloader with a CRC-32 check. Target of v1.0.0."],"ARM (QEMU virt)":["ARM (QEMU virt)","UART shell, GICv2, generic timer, PSCI. No paging or ring 3 yet."],"more after v1.0.0":["More ports","x86-64, RISC-V, AArch64, no-MMU and more. Each port keeps the kernel within 64 KiB."]};
const L=window.QLS_L||(x=>x);const det=document.getElementById('detail'),chips=[...document.querySelectorAll('.chip')];
chips.forEach(c=>c.onclick=()=>{chips.forEach(x=>x.classList.remove('on'));c.classList.add('on');const d=D[c.dataset.k];if(d&&window.QLS_RD&&QLS_RD[c.dataset.k])d[1]=QLS_RD[c.dataset.k];if(d&&det)det.innerHTML='<h3>'+d[0]+'</h3><p>'+d[1]+'</p>'});
const tr=document.getElementById('trace');
if(tr)tr.onclick=()=>{const seq=['sh','channels','dispatcher','consoled'];chips.forEach(x=>x.classList.remove('on','hot'));seq.forEach((k,i)=>setTimeout(()=>{chips.forEach(x=>x.classList.remove('hot'));const c=chips.find(x=>x.dataset.k===k);c&&c.classList.add('hot');det.innerHTML='<h3>'+L(['1. sh sends a request','2. over a channel','3. dispatcher routes it','4. consoled draws'][i])+'</h3><p>'+(window.QLS_RD&&QLS_RD[k]||D[k][1])+'</p>'},i*900));setTimeout(()=>chips.forEach(x=>x.classList.remove('hot')),seq.length*900+600)};
const g=document.getElementById('mgrid');
if(g)(window.QLS_METRICS?Promise.resolve(window.QLS_METRICS):fetch('data/metrics.json').then(r=>r.json())).then(m=>{
 const k=n=>(n/1024).toFixed(1)+' KiB',f=n=>n.toLocaleString('en');
 const it=[[f(m.kernel_loc),L('lines in kernel/')],[f(m.user_loc),L('lines in user/ (ring 3)')],[m.test_targets,L('make test targets')],[m.host_tests,L('host-side test files')]];
 g.innerHTML=it.map(x=>'<div class="gl stat"><b>'+x[0]+'</b><span>'+x[1]+'</span></div>').join('');
 const a=m.kernel_budget_now,t=m.kernel_budget_v1,mx=Math.max(a,t)*1.1;
 document.getElementById('bnow').style.width=a/mx*100+'%';document.getElementById('btgt').style.left=t/mx*100+'%';
 document.getElementById('btxt').innerHTML=L('Ceiling now')+' <b>'+k(a)+'</b> · '+L('target at v1.0.0')+' <b>'+k(t)+'</b> '+L('(white mark). The gap closes as drivers and the shell leave ring 0.');
 document.getElementById('mupd').textContent=L('Updated')+' '+m.updated+'.';
 document.querySelectorAll('[data-m=kib]').forEach(e=>e.textContent='≤ '+(a/1024).toFixed(0)+' KiB');
}).catch(()=>{});
const dq=document.getElementById('dq'),dr=document.getElementById('dres');
if(dq&&window.QLS_SEARCH)dq.oninput=()=>{const w=dq.value.toLowerCase().split(/\s+/).filter(Boolean);if(!w.length){dr.innerHTML='';return}
 dr.innerHTML=QLS_SEARCH.filter(s=>{const t=(s[1]+' '+s[3]).toLowerCase();return w.every(x=>t.includes(x))}).slice(0,12).map(s=>'<a href="'+(s[4]||'')+s[0]+'.html#'+s[2]+'"><b>'+s[1]+'</b><small>'+s[0]+'</small></a>').join('')||'<a>—</a>'};
addEventListener('load',()=>{if(location.hash){try{const t=document.querySelector(location.hash);t&&t.scrollIntoView()}catch(e){}}});

const RM=window.QLS_ROADMAP,rl=document.getElementById('rlist');
if(RM&&rl){const ru=window.QLS_LANG==='ru',T=o=>ru?o.ru:o.en,st=n=>n<=RM.done?'done':n===RM.current?'now':'plan';
 const it=RM.items.map(i=>({n:i.n,b:i.b,t:T(i),id:String(i.n),s:st(i.n)})).concat(RM.post.map((p,k)=>({n:100+k,b:'+',t:T(p),id:'+'+(k+1),s:'plan'})));
 const SL={all:['All','Все'],done:['Done','Готово'],now:['In progress','В работе'],plan:['Planned','В планах']};let fs='all',fb='all';
 document.getElementById('rcount').textContent=RM.done+' / '+RM.total;document.getElementById('rpg').style.width=RM.done/RM.total*100+'%';
 const bl=Object.keys(RM.blocks).concat(['+']);
 const chips=(el,list,get,set)=>{el.innerHTML=list.map(k=>'<button class="chip'+(get()===k[0]?' on':'')+'" data-k="'+k[0]+'" title="'+(k[2]||'')+'">'+k[1]+'</button>').join('');el.querySelectorAll('button').forEach(b=>b.onclick=()=>{set(b.dataset.k);draw()})};
 function draw(){chips(document.getElementById('rf1'),Object.keys(SL).map(k=>[k,SL[k][ru?1:0]]),()=>fs,v=>fs=v);
  chips(document.getElementById('rf2'),[['all',ru?'Все блоки':'All blocks']].concat(bl.map(b=>[b,b==='+'?(ru?'После 1.0':'After 1.0'):b,b==='+'?'':T(RM.blocks[b])])),()=>fb,v=>fb=v);
  rl.innerHTML=it.filter(x=>(fs==='all'||x.s===fs)&&(fb==='all'||x.b===fb)).map((x,k)=>'<div class="gl rg lp-spot '+x.s+'" style="--i:'+k+'"><u class="bar"></u><b>'+(x.b==='+'?'+':String(x.n).padStart(2,'0'))+'</b><span>'+x.t+'</span><div class="mt"><em>'+(x.b==='+'?'v1.0+':x.b)+'</em><i>'+SL[x.s][ru?1:0]+'</i></div></div>').join('')||'<p>—</p>'}
 draw();const dv=document.getElementById('devlog');
 if(dv)dv.innerHTML=RM.items.filter(i=>i.n<=RM.done).slice(-6).reverse().map(i=>'<li><b>'+(ru?'Цель ':'Goal ')+i.n+'</b> '+T(i)+'</li>').join('');}
{const R2=window.QLS_ROADMAP,ru2=window.QLS_LANG==='ru',T2=o=>ru2?o.ru:o.en,sx=document.getElementById('steps');
 if(R2&&sx){const ids='ABCDEF'.split('').filter(b=>R2.items.some(i=>i.b===b)),SL={done:ru2?'Готово':'Done',now:ru2?'В работе':'In progress',plan:ru2?'В планах':'Planned'};
  const B=ids.map(b=>{const g=R2.items.filter(i=>i.b===b),a=g[0].n,z=g[g.length-1].n,dn=g.filter(i=>i.n<=R2.done).length;return{b,g,a,z,dn,s:z<=R2.done?'done':(R2.current>=a&&R2.current<=z)?'now':'plan',t:T2(R2.blocks[b])}});
  const tot=B.reduce((x,k)=>x+k.g.length,0),dnt=B.reduce((x,k)=>x+k.dn,0);document.getElementById('stcount').textContent=dnt+' / '+tot;
  const dB=B.filter(k=>k.s==='done').length,cur=B.find(k=>k.s==='now'),end=(dB>0?dB-.5:.5)+(cur?cur.dn/cur.g.length:0),n=B.length;
  sx.innerHTML='<div class="track"><div class="rail" style="left:'+.5/n*100+'%;right:'+.5/n*100+'%"><i></i></div><div class="nodes">'+B.map(k=>'<button class="nd lp-spot '+k.s+'" data-b="'+k.b+'"><span class="dot">'+k.b+'</span><b>'+k.t+'</b><small>'+(ru2?'цели ':'goals ')+k.a+'–'+k.z+'</small><em>'+k.dn+' / '+k.g.length+'</em></button>').join('')+'</div></div><div class="gl pdet" id="pdet"></div>';
  const pd=document.getElementById('pdet'),nds=[...sx.querySelectorAll('.nd')],raf2=f=>requestAnimationFrame(()=>requestAnimationFrame(f));
  const show=b=>{const k=B.find(x=>x.b===b),pc=Math.round(k.dn/k.g.length*100);nds.forEach(x=>x.classList.toggle('sel',x.dataset.b===b));
   pd.innerHTML='<div class="ph"><div><small>'+(ru2?'Блок ':'Block ')+k.b+' · '+(ru2?'цели ':'goals ')+k.a+'–'+k.z+'</small><h3>'+k.t+'</h3></div><div class="pr"><u class="'+k.s+'">'+SL[k.s]+'</u><b>'+pc+'%</b></div></div><div class="pb"><i data-w="'+pc+'"></i></div><div class="pgl">'+k.g.map(i=>'<div class="gi '+(i.n<=R2.done?'done':i.n===R2.current?'now':'plan')+'"><b>'+i.n+'</b><span>'+T2(i)+'</span></div>').join('')+'</div>';
   pd.classList.remove('swap');void pd.offsetWidth;pd.classList.add('swap');raf2(()=>{const f=pd.querySelector('.pb i');if(f)f.style.width=f.dataset.w+'%'})};
  nds.forEach(x=>x.onclick=()=>show(x.dataset.b));show((cur||B.filter(k=>k.s==='done').pop()||B[0]).b);
  raf2(()=>{const f=sx.querySelector('.rail i');if(f)f.style.width=(end-.5)/(n-1)*100+'%'});}
 const HW=window.QLS_SITE&&QLS_SITE.hardware,hb=document.getElementById('hwbody');
 if(HW&&hb){const w=s=>String(s).replace(/\bok\b/g,'<span class="ok">ok</span>').replace(/\b(no|fail)\b/g,'<span class="no">$1</span>');
  const LB=ru2?['Загрузка','Клавиатура','Диск виден','Reboot / выкл.','Заметки']:['Boot','Keyboard','Disk seen','Reboot / off','Notes'];
  hb.innerHTML=HW.map(r=>'<article class="gl mc"><h3>'+r.name+'</h3><p class="s2">'+(ru2&&r.sub_ru||r.sub_en||'')+'</p><dl><div><dt>'+LB[0]+'</dt><dd>'+w(r.boot)+'</dd></div><div><dt>'+LB[1]+'</dt><dd>'+w(r.kb)+'</dd></div><div><dt>'+LB[2]+'</dt><dd>'+w(r.disk)+'</dd></div><div><dt>'+LB[3]+'</dt><dd>'+w(r.rb)+'</dd></div><div class="n"><dt>'+LB[4]+'</dt><dd>'+(ru2&&r.notes_ru||r.notes_en||'')+'</dd></div></dl></article>').join('')+
  '<a class="gl mc cta" href="https://github.com/qlsdev/QlsOS/blob/HEAD/docs/hardware-checklist.md"><h3>'+(ru2?'Ваша машина?':'Your machine?')+'</h3><p class="s2">'+(ru2?'Пройдите чек-лист и пришлите свою строку →':'Run the checklist and send your row →')+'</p></a>'
}}
const links=[...document.querySelectorAll('nav a[href^="#"]')];
if('IntersectionObserver'in window&&links.length){
 const io=new IntersectionObserver(es=>[...es].sort((a,b)=>a.isIntersecting-b.isIntersecting).forEach(e=>{const id='#'+e.target.id;if(e.isIntersecting)links.forEach(a=>a.classList.toggle('on',a.hash===id));else links.forEach(a=>{if(a.hash===id)a.classList.remove('on')})}),{rootMargin:'-40% 0px -55% 0px'});
 links.forEach(a=>{const s=document.querySelector(a.hash);s&&io.observe(s)});
}
document.querySelectorAll('pre[data-copy]').forEach(p=>{
 const b=document.createElement('button');b.className='copy';b.textContent='copy';
 b.onclick=async()=>{try{await navigator.clipboard.writeText(p.dataset.copy);b.textContent='ok';setTimeout(()=>b.textContent='copy',1200)}catch(e){}};
 p.appendChild(b);
});
})();
