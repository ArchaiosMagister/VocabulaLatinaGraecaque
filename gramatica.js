'use strict';
(function(){
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/\u0345/g,'ι').replace(/\p{M}/gu,'').replace(/æ/g,'ae').replace(/œ/g,'oe').replace(/ς/g,'σ').replace(/[·.,;!?¿¡‘’'"]/g,'').replace(/\s+/g,' ').trim();
const variants=s=>{
 const raw=String(s);
 if(!raw.includes('(ν)'))return [norm(raw)];
 return [norm(raw.replaceAll('(ν)','')),norm(raw.replaceAll('(ν)','ν'))];
};
const CASES={nom:'nominativo',gen:'genitivo',dat:'dativo',acc:'acusativo',abl:'ablativo',voc:'vocativo'};
const GENDERS={m:'masculino',f:'femenino',n:'neutro'};
const PEOPLE={'1':'1.ª persona','2':'2.ª persona','3':'3.ª persona'};
const NUMBERS={sg:'singular',pl:'plural'};
const content=window.GRAMMAR_CONTENT;
const paradigms=window.GRAMMAR_PARADIGMS;
const corpus={lat1:'Latín I',gr1:'Griego I',lat4:'Latín · 4.º ESO'};
if(!content||!paradigms){$('available').textContent='No se ha podido cargar el banco de ejercicios.';return}
const syllabi=content.syllabi;
let progress={};
try{progress=JSON.parse(localStorage.getItem('classics-grammar-v1')||'{}')||{}}catch{progress={}}
function save(){try{localStorage.setItem('classics-grammar-v1',JSON.stringify(progress))}catch{$('available').textContent='No es posible guardar el progreso en este navegador.'}}
const formatFeature=(key,kind)=>{
 if(key==='inf')return 'infinitivo';
 const parts=key.split('.');
 if(kind==='verbal')return (PEOPLE[parts[0]]||parts[0])+' del '+(NUMBERS[parts[1]]||parts[1]);
 const [cas,gender,num]=parts.length===3?[parts[0],parts[1],parts[2]]:[parts[0],null,parts[1]];
 return (CASES[cas]||cas)+(gender?' '+GENDERS[gender]:'')+' '+(NUMBERS[num]||num);
};
function matchingTopic(p,subject,unit){
 const found=syllabi[subject].find(x=>x[0]===unit);
 if(!found)return null;
 const topics=found[1];
 if(topics.includes(p.topic))return p.topic;
 const aliases={
 'lat1|lat-puella':'Primera y segunda declinación',
 'lat1|lat-servus':'Primera y segunda declinación',
 'lat1|lat-bellum':'Primera y segunda declinación',
 'lat1|lat-bonus':'Los adjetivos',
 'lat4|lat-fortis':'Adjetivos de la 3ª declinación',
 'lat4|lat-rex':'La tercera declinación',
 'lat4|lat-corpus':'La tercera declinación',
 'lat4|lat-amo-present':'Presente',
 'lat4|lat-amo-imperfect':'El imperfecto',
 'lat4|lat-amo-perfect':'El perfecto',
 'lat4|lat-amo-pluperfect':'Pluscuamperfecto',
 'lat1|lat-amo-perfect':'El perfecto y el pluscuamperfecto de indicativo',
 'lat1|lat-amo-pluperfect':'El perfecto y el pluscuamperfecto de indicativo'
 };
 const x=aliases[subject+'|'+p.id];
 return topics.includes(x)?x:null;
}
function buildExercises(){
 const items=[];
 content.questions.forEach((q,i)=>{
  items.push({id:q.s+'|'+q.u+'|concept-'+i,subject:q.s,unit:q.u,topic:q.t,category:q.c,mode:'choice',prompt:q.p,answer:q.a,options:[q.a,...q.w],explanation:q.x,language:'es'});
 });
 for(const p of paradigms){
  const forms=Object.entries(p.forms);
  const readings=new Map();
  for(const [feature,surface] of forms)for(const variant of variants(surface)){
   if(!readings.has(variant))readings.set(variant,new Set());
   readings.get(variant).add(feature);
  }
  for(const [subject,unit] of Object.entries(p.units)){
   const topic=matchingTopic(p,subject,unit);
   if(!topic){console.warn('Paradigma sin tema reconocido:',p.id,subject,unit);continue}
   const category=p.kind==='verbal'?'Morfología verbal':'Morfología nominal';
   for(const [feature,surface] of forms){
    const label=formatFeature(feature,p.kind);
    const base=subject+'|'+unit+'|'+p.id+'|'+feature;
    const instruction=p.kind==='verbal'?label+' del '+p.desc:label;
    items.push({id:base+'|write',subject,unit,topic,category,mode:'write',
      prompt:'Escribe '+instruction+' de '+p.lemma+'.',
      answer:surface,accepted:variants(surface),explanation:'Paradigma: '+p.lemma+' · '+instruction+'.',language:p.lang});
    const safe=variants(surface).every(x=>readings.get(x).size===1);
    if(!safe||forms.length<2)continue;
    const other=[...new Set(forms.filter(x=>x[0]!==feature).map(x=>formatFeature(x[0],p.kind)))].filter(x=>x!==label);
    if(other.length<1)continue;
    items.push({id:base+'|analysis',subject,unit,topic,category,mode:'choice',
      prompt:'¿Qué análisis corresponde a «'+surface+'» de '+p.lemma+'?',
      answer:label,options:[label,...shuffle(other).slice(0,3)],
      explanation:p.lemma+' · '+(p.desc||'paradigma nominal')+' · '+instruction+'.',language:p.lang,
      morphologyExplanation:'La forma «'+surface+'» corresponde a '+instruction+'.'});
   }
  }
 }
 return items;
}
const exercises=buildExercises();
let session=null;
const selectedUnits=()=>new Set([...$('units').querySelectorAll('input:checked')].map(x=>x.value));
function getItems(ignoreErrors=false){
 const subject=$('subject').value,units=selectedUnits(),topic=$('topic').value,cat=$('category').value,mode=$('answer-mode').value;
 return exercises.filter(q=>q.subject===subject&&units.has(q.unit)&&(topic==='all'||q.unit+'|'+q.topic===topic)&&(cat==='all'||q.category===cat)&&(mode==='all'||q.mode===mode)&&(ignoreErrors||!$('errors').checked||progress[q.id]?.failed));
}
function stats(){
 const subject=$('subject').value;
 const entries=Object.entries(progress).filter(([k])=>k.startsWith(subject+'|')).map(([,v])=>v);
 const total=entries.reduce((sum,v)=>sum+v.total,0);
 $('learned').textContent=entries.length;
 $('accuracy').textContent=total?Math.round(entries.reduce((sum,v)=>sum+v.right,0)/total*100)+'%':'—';
 $('pending').textContent=entries.filter(p=>p.failed).length;
}
function setupUnits(){
 const subject=$('subject').value;
 $('units').innerHTML=syllabi[subject].map(([unit])=>'<label><input type="checkbox" value="'+esc(unit)+'" checked> '+esc(unit)+'</label>').join('');
 setupTopics();
}
function setupTopics(){
 const before=$('topic').value,subject=$('subject').value,units=selectedUnits();
 const choices=syllabi[subject].filter(([u])=>units.has(u)).flatMap(([unit,topics])=>topics.map(topic=>({value:unit+'|'+topic,label:unit+' · '+topic})));
 $('topic').innerHTML='<option value="all">Todos los contenidos</option>'+choices.map(x=>'<option value="'+esc(x.value)+'">'+esc(x.label)+'</option>').join('');
 $('topic').value=choices.some(x=>x.value===before)?before:'all';
 update();
}
function outline(){
 const subject=$('subject').value,units=selectedUnits();
 const selected=syllabi[subject].filter(([u])=>units.has(u));
 const topics=selected.flatMap(([u,ts])=>ts.map(t=>[u,t]));
 $('topic-summary').textContent=selected.length+' unidades · '+topics.length+' apartados gramaticales seleccionados. Los ejercicios abarcan todos los apartados descritos en el temario, con diferentes cantidades de preguntas por apartado.';
 $('outline').innerHTML=selected.map(([unit,ts])=>{
  const list=ts.map(t=>{
   const n=exercises.filter(x=>x.subject===subject&&x.unit===unit&&x.topic===t).length;
   return '<li>'+esc(t)+' <span aria-label="'+n+' preguntas">('+n+')</span></li>';
  }).join('');
  return '<section class="grammar-outline-item"><h3>'+esc(unit)+'</h3><ul>'+list+'</ul></section>';
 }).join('')||'<p>Selecciona al menos una unidad.</p>';
}
function update(){
 const n=getItems().length,subject=$('subject').value;
 $('available').textContent=n+' ejercicios disponibles para '+corpus[subject]+($('errors').checked?' · sólo fallos':'')+'.';
 $('start').disabled=n===0;stats();outline();
}
function start(questions){
 const list=questions||getItems();
 if(!list.length)return;
 const count=$('length').value==='all'?list.length:Math.min(list.length,Number($('length').value));
 session={queue:shuffle(list).slice(0,count),i:0,right:0,wrong:[],done:false};
 render();
}
function render(){
 if(!session)return;
 const s=session;
 if(s.i>=s.queue.length){finish();return}
 const q=s.queue[s.i];s.done=false;
 const wordLang=q.language==='grc'?'grc':q.language==='lat'?'la':'es';
 const card=$('practice');
 card.innerHTML='<div class="topline"><span>'+esc(q.category)+'</span><span>'+(s.i+1)+' / '+s.queue.length+'</span></div>'+
 '<div class="progress"><div style="width:'+Math.round(100*s.i/s.queue.length)+'%"></div></div>'+
 '<div class="grammar-topic"><strong>'+esc(q.unit)+'</strong><span>'+esc(q.topic)+'</span></div>'+
 '<h2 class="grammar-question" lang="'+wordLang+'">'+esc(q.prompt)+'</h2>'+
 '<div id="grammar-answer"></div><div id="grammar-feedback" role="status"></div><div id="grammar-next"></div>';
 if(q.mode==='choice'){
  const opts=shuffle(q.options);
  $('grammar-answer').innerHTML='<div class="grammar-choices">'+opts.map((option,i)=>'<button type="button" data-option="'+i+'">'+esc(option)+'</button>').join('')+'</div>';
  $('grammar-answer').querySelectorAll('button').forEach(b=>b.onclick=()=>mark(opts[Number(b.dataset.option)]===q.answer,opts[Number(b.dataset.option)]));
 }else{
  $('grammar-answer').innerHTML='<form id="grammar-form" class="grammar-form"><label for="grammar-input">Tu respuesta</label><input id="grammar-input" autocomplete="off" spellcheck="false" required lang="'+wordLang+'" placeholder="Escribe la forma…"><div class="grammar-actions"><button type="submit" class="primary">Comprobar</button><button id="grammar-skip" class="grammar-skip" type="button">No lo sé</button></div></form>';
  $('grammar-form').onsubmit=e=>{e.preventDefault();const answer=$('grammar-input').value;mark(q.accepted.includes(norm(answer)),answer)};
  $('grammar-skip').onclick=()=>mark(false,'');
  $('grammar-input').focus();
 }
}
function mark(correct,given){
 const s=session;if(!s||s.done)return;s.done=true;
 const q=s.queue[s.i],old=progress[q.id]||{total:0,right:0,failed:false};
 old.total++;old.right+=Number(correct);old.failed=!correct;progress[q.id]=old;save();stats();
 if(correct)s.right++;else s.wrong.push(q);
 $('grammar-answer').querySelectorAll('button,input').forEach(el=>el.disabled=true);
 $('grammar-feedback').className='grammar-feedback'+(correct?'':' bad');
 $('grammar-feedback').innerHTML='<b>'+(correct?'Correcto':'Revisa esta forma')+'</b>'+
 (given&&!correct?'<p>Tu respuesta: '+esc(given)+'</p>':'')+
 '<div class="grammar-answer">Respuesta: <strong lang="'+(q.language==='grc'?'grc':q.language==='lat'?'la':'es')+'">'+esc(q.answer)+'</strong></div>'+
 '<p class="grammar-detail">'+esc(q.morphologyExplanation||q.explanation||'')+'</p>';
 $('grammar-next').innerHTML='<div class="grammar-actions"><button id="grammar-next-btn" class="primary">Siguiente →</button></div>';
 $('grammar-next-btn').onclick=()=>{s.i++;render()};
 $('grammar-next-btn').focus();
}
function finish(){
 const s=session;
 $('practice').innerHTML='<p class="eyebrow">SESIÓN COMPLETADA</p><h2>'+s.right+' de '+s.queue.length+' aciertos</h2><p>Has completado la sesión. '+(s.wrong.length?s.wrong.length+' preguntas para volver a practicar.':'No hay errores en esta sesión.')+'</p><div class="grammar-actions">'+(s.wrong.length?'<button id="grammar-retry" class="primary">Repetir fallos de esta sesión</button>':'')+'<button id="grammar-again">Nueva sesión</button></div>';
 if($('grammar-retry'))$('grammar-retry').onclick=()=>start(s.wrong);
 $('grammar-again').onclick=()=>start();update();
}
$('subject').onchange=setupUnits;
$('units').onchange=setupTopics;
for(const id of ['topic','category','answer-mode','errors'])$(id).onchange=update;
$('all').onclick=()=>{$('units').querySelectorAll('input').forEach(el=>el.checked=true);setupTopics()};
$('none').onclick=()=>{$('units').querySelectorAll('input').forEach(el=>el.checked=false);setupTopics()};
$('start').onclick=()=>start();
setupUnits();
window.GrammarPracticeDebug={exercises,syllabi,variants,norm}; // Datos de auditoría en la consola, sin efectos en la sesión.
})();