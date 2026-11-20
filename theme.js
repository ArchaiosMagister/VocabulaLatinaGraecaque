(()=>{
'use strict';
const key='classics-theme',valid=['system','light','dark'],media=window.matchMedia('(prefers-color-scheme: dark)');
let preference='system';
try{const saved=localStorage.getItem(key);if(valid.includes(saved))preference=saved}catch{}
function apply(){
 const dark=preference==='dark'||(preference==='system'&&media.matches);
 document.documentElement.dataset.theme=dark?'dark':'light';
 const meta=document.querySelector('meta[name="theme-color"]');
 if(meta)meta.content=dark?'#101b18':'#f6f4ed';
 const select=document.getElementById('theme-select');
 if(select)select.value=preference;
}
apply();
document.addEventListener('DOMContentLoaded',()=>{
 apply();
 document.getElementById('theme-select').addEventListener('change',event=>{
  if(!valid.includes(event.target.value))return;
  preference=event.target.value;
  try{localStorage.setItem(key,preference)}catch{}
  apply();
 });
});
media.addEventListener('change',()=>{if(preference==='system')apply()});
window.addEventListener('storage',event=>{
 if(event.key===key){preference=valid.includes(event.newValue)?event.newValue:'system';apply()}
});
})();

/* SCHOLA_LEGACY_NOTICE_V1: solo información; no modifica práctica, datos ni URL. */
(()=>{'use strict';
 if(!location.pathname.startsWith('/VocabulaLatinaGraecaque/'))return;
 document.addEventListener('DOMContentLoaded',()=>{
  const header=document.querySelector('header');
  if(!header||document.getElementById('schola-legacy-notice'))return;
  const grammar=location.pathname.endsWith('/gramatica.html');
  const message=document.createElement('span');
  message.textContent=grammar
   ?'Las herramientas de gramática y morfología están reunidas también en ScholaClassica. Este repaso sigue funcionando. '
   :'Este vocabulario también está disponible en ScholaClassica. Puedes seguir practicando aquí. ';
  const link=document.createElement('a');
  link.href=grammar?'/ScholaClassica/apps/repaso-gramatica/index.html':'/ScholaClassica/apps/vocabulario/index.html'+location.search;
  link.textContent=grammar?'Abrir repaso gramatical en ScholaClassica':'Abrir Vocabulario en ScholaClassica';
  link.style.fontWeight='600';
  const notice=document.createElement('aside');
  notice.id='schola-legacy-notice';
  notice.setAttribute('role','note');
  notice.style.cssText='box-sizing:border-box;max-width:74rem;margin:.65rem auto;padding:.65rem .9rem;border:1px solid rgba(128,128,128,.4);border-radius:.65rem;background:rgba(128,128,128,.09);font:inherit;font-size:.88rem;line-height:1.45;';
  notice.append(message,link);
  header.insertAdjacentElement('afterend',notice);
 });
})();
