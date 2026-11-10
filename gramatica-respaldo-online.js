/* Online Latin backup. Delivers the SAME exercise shape as GrammarImported.
   Public UniMorph verb index hosted by GeneradorExamenes; not Collatinus.
   No extrapolated forms, no third-party grading and no Greek verbs invented.
 */
'use strict';
window.GrammarOnlineBackup=(()=>{
 const SOURCE='https://raw.githubusercontent.com/ArchaiosMagister/GeneradorExamenes/main/data/unimorph/lat-v.json';
 const N={'SG':'singular','PL':'plural'};
 const P={'1':'1.ª','2':'2.ª','3':'3.ª'};
 const features=['1;SG','2;SG','3;SG','1;PL','2;PL','3;PL'];
 const norm=s=>String(s||'').toLowerCase().normalize('NFD')
  .replace(/\p{M}/gu,'').replace(/æ/g,'ae').replace(/œ/g,'oe').trim();
 const plainLemma=s=>norm(String(s||'').split(/[,+(]/)[0].trim());
 const bySubject=new Map();
 let request=null;
 async function download(){
  if(request)return request;
  request=(async()=>{
   const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
   try{
    const response=await fetch(SOURCE,{signal:controller.signal,cache:'force-cache'});
    if(!response.ok)throw Error('HTTP '+response.status);
    const data=await response.json();
    if(data.language!=='lat'||data.pos!=='V'||!Array.isArray(data.rows)||data.rows.length<100)
     throw Error('El banco remoto no tiene el formato esperado');
    return data;
   }finally{clearTimeout(timer)}
  })().catch(error=>{request=null;throw error});
  return request;
 }
 function acquire(entry){
  const numbers=(entry.units||[]).flatMap(u=>{
   const m=String(u).match(/UD\s*(\d+)(?:\s*[–—-]\s*(\d+))?/i);
   return m?[Number(m[2]||m[1])]:[];
  });
  return numbers.length?Math.min(...numbers):null;
 }
 function vocabulary(subject){
  const entries=new Map();
  for(const e of window.VOCAB||[]){
   if(e.subject!==subject)continue;
   const lemma=plainLemma(e.form),unit=acquire(e);
   if(!lemma||unit===null||unit===0)continue;
   if(!entries.has(lemma)||entries.get(lemma).when>unit)entries.set(lemma,{when:unit});
  }
  return entries;
 }
 function label(feature){
  const [person,number]=feature.split(';');
  return P[person]+' persona del '+N[number];
 }
 function asQuestions(subject,data){
  const lex=vocabulary(subject),introduced=subject==='lat1'?1:2;
  const introducedTopic=subject==='lat1'?'El presente de indicativo y el infinitivo':'Presente';
  const grouped=new Map();
  for(const row of data.rows){
   if(!Array.isArray(row)||row.length<4)continue;
   const [lemma,surface,tags,rank]=row;
   if(rank!==1||typeof lemma!=='string'||typeof surface!=='string'||typeof tags!=='string')continue;
   const key=plainLemma(lemma);
   if(!lex.has(key)||key.endsWith('or')||/\s/.test(surface)||surface.length>60)continue;
   const bits=tags.split(';');
   if(bits.length!==6||bits[0]!=='V'||bits[1]!=='IND'||bits[2]!=='ACT'||bits[3]!=='PRS')continue;
   const feature=bits[4]+';'+bits[5];
   if(!features.includes(feature))continue;
   if(!grouped.has(key))grouped.set(key,new Map());
   const forms=grouped.get(key);
   if(!forms.has(feature))forms.set(feature,new Map());
   forms.get(feature).set(norm(surface),surface);
  }
  const result=[];
  for(const [lemma,forms]of grouped){
   if(forms.size<4)continue; // Incomplete or anomalous paradigms are reference-only.
   const entry=window.GrammarEnunciation?.display(subject,lemma,true);
   if(!entry||!window.GrammarEnunciation?.latinFull(entry))continue;
   const unitNum=Math.max(introduced,lex.get(lemma).when);
   const last=subject==='lat1'?10:8;
   if(unitNum>last)continue;
   const unit='UD '+unitNum,topic=unitNum===introduced?introducedTopic:'Repaso morfológico acumulativo';
   const readings=new Map();
   for(const [feature,surfaces]of forms)for(const normalized of surfaces.keys()){
    if(!readings.has(normalized))readings.set(normalized,new Set());
    readings.get(normalized).add(feature);
   }
   for(const [feature,surfaces]of forms){
    const formsList=[...surfaces.values()],base='online|lat-v|'+subject+'|'+unit+'|'+lemma+'|'+feature;
    const analysis=label(feature);
    const full=analysis+' del presente de indicativo activo';
    result.push({
     id:base+'|write',subject,unit,topic,category:'Morfología verbal',mode:'write',lemma,
     prompt:'Escribe '+full+' de '+entry+'.',
     answer:formsList[0],accepted:[...surfaces.keys()],
     explanation:'UniMorph (respaldo online desde GeneradorExamenes): '+entry+' · '+full+'.',
     language:'lat',source:'GeneradorExamenes/UniMorph'
    });
    if([...surfaces.keys()].some(k=>readings.get(k).size!==1))continue;
    const alternatives=features.filter(k=>k!==feature&&forms.has(k)).map(label);
    if(alternatives.length<2)continue;
    for(const surface of formsList){
     result.push({
      id:base+'|choice|'+norm(surface),subject,unit,topic,category:'Morfología verbal',
      mode:'choice',lemma,
      prompt:'¿Qué análisis corresponde a «'+surface+'» de '+entry+'?',
      answer:analysis,options:[analysis,...alternatives.slice(0,3)],
      explanation:'UniMorph (respaldo online desde GeneradorExamenes): '+entry+' · '+full+'.',
      language:'lat',source:'GeneradorExamenes/UniMorph'
     });
    }
   }
  }
  return result;
 }
 async function load(subject){
  if(subject==='gr1')return {items:[],source:SOURCE,available:false,reason:'El índice remoto disponible es solo de verbos latinos.'};
  if(!['lat1','lat4'].includes(subject))throw Error('Asignatura desconocida');
  if(!bySubject.has(subject))bySubject.set(subject,download().then(data=>({
   items:asQuestions(subject,data),source:SOURCE,available:true,
   sourceRecords:data.rows.length,words:'vocabulario docente'
  })).catch(e=>{bySubject.delete(subject);throw e}));
  return bySubject.get(subject);
 }
 return {load,source:SOURCE,asQuestions};
})();
