'use strict';
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
const win={};
function load(name,scope){
 const code=fs.readFileSync(path.join(root,name),'utf8');
 vm.runInNewContext(code,scope,{filename:name,timeout:15000});
}
load('gramatica-contenidos.js',{window:win});
load('gramatica-paradigmas.js',{window:win});
load('gramatica-griego-ampliacion.js',{window:win});
assert.equal(win.GRAMMAR_PARADIGMS.filter(p=>p.id.startsWith('gr-')&&p.units.gr1).length>=20,true,'Cobertura mínima de paradigmas griegos');
const els=new Map();
function element(id){
 if(!els.has(id))els.set(id,{
  value:{subject:'lat1',topic:'all',category:'all','answer-mode':'all',length:'10'}[id]||'',
  textContent:'',innerHTML:'',checked:false,disabled:false,
  querySelectorAll(){return []},focus(){}
 });
 return els.get(id);
}
const doc={getElementById:element};
const warnings=[];
load('gramatica.js',{window:win,document:doc,
 localStorage:{getItem(){return '{}'},setItem(){}},
 console:{warn(...args){warnings.push(args.join(' '))}}});
const d=win.GrammarPracticeDebug;
assert.ok(d,'Debe exponerse el conjunto de preguntas para auditoría');
assert.equal(warnings.length,0,'Ningún paradigma debe quedar sin tema');
const ids=new Set();
for(const p of win.GRAMMAR_PARADIGMS.filter(p=>p.id.startsWith('gr-'))){
 assert.ok(p.units.gr1,'Paradigma griego sin unidad: '+p.id);
 assert.ok(Object.values(p.forms).every(s=>typeof s==='string'&&s.length>0),'Forma vacía: '+p.id);
}

for(const q of d.exercises){
 assert.ok(q.id&&q.subject&&q.unit&&q.topic&&q.category&&q.prompt&&q.answer,q.id);
 assert.equal(ids.has(q.id),false,'ID duplicado: '+q.id);ids.add(q.id);
 assert.ok(d.syllabi[q.subject].some(([unit,topics])=>unit===q.unit&&topics.includes(q.topic)),'Tema fuera de currículo: '+q.id);
 if(q.mode==='choice'){
  assert.ok(q.options.length>=2,'Test sin alternativas: '+q.id);
  assert.equal(q.options.filter(x=>x===q.answer).length,1,'Solución de test no única: '+q.id);
  assert.equal(new Set(q.options).size,q.options.length,'Opciones duplicadas: '+q.id);
 }else{
  assert.ok(q.accepted.includes(d.norm(q.answer.split(' / ')[0].replaceAll('(ν)',''))),'Respuesta escrita no admitida: '+q.id);
 }
}
for(const [subject,units] of Object.entries(d.syllabi)){
 for(const [unit,topics]of units)for(const topic of topics){
  assert.ok(d.exercises.some(q=>q.subject===subject&&q.unit===unit&&q.topic===topic),'Falta apartado: '+subject+' '+unit+' '+topic);
 }
}
assert.ok(d.norm('λόγῳ')!==d.norm('λόγω'),'La iota suscrita debe conservarse');
assert.deepEqual(Array.from(d.variants('λύουσι(ν)')),['λυουσι','λυουσιν']);
assert.deepEqual(Array.from(d.variants('nostri / nostrum')),['nostri','nostrum']);
console.log('OK: '+ids.size+' ejercicios únicos y todos los apartados cubiertos.');
