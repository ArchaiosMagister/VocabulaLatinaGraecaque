'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const rows=[];
for(const [lemma,forms] of [
 ['amo',['amō','amās','amat','amāmus','amātis','amant']],
 ['duco',['dūcō','dūcis','dūcit','dūcimus','dūcitis','dūcunt']]
]){
 for(const [i,form]of forms.entries()){
  const person=String(i%3+1),number=i<3?'SG':'PL';
  rows.push([lemma,form,'V;IND;ACT;PRS;'+person+';'+number,1]);
 }
}
rows.push(['amo','AMO-NO-VALIDO','V;IND;ACT;PRS;1;SG',2]);
rows.push(['amo','amarem','V;SBJV;ACT;IPFV;1;SG',1]);
rows.push(['palabra-inexistente','inventa','V;IND;ACT;PRS;1;SG',1]);
let callCount=0;
const win={},scope={
 window:win,
 console,
 AbortController,
 setTimeout,
 clearTimeout,
 fetch:async url=>{
  callCount++;
  assert.equal(url,'https://raw.githubusercontent.com/ArchaiosMagister/GeneradorExamenes/main/data/unimorph/lat-v.json');
  return {ok:true,json:async()=>({language:'lat',pos:'V',rows})};
 }
};
const load=name=>vm.runInNewContext(fs.readFileSync(path.join(root,name),'utf8'),scope,{filename:name});
load('data.js');
load('gramatica-enunciados.js');
load('gramatica-respaldo-online.js');
async function main(){
 const api=win.GrammarOnlineBackup;
 const data=await api.load('lat1');
 assert.equal(data.available,true);
 assert.equal(callCount,1);
 const write=data.items.filter(q=>q.mode==='write');
 const choice=data.items.filter(q=>q.mode==='choice');
 assert.equal(write.length,12,'Dos paradigmas de seis formas');
 assert.equal(choice.length,12,'Análisis de las doce formas regulares');
 assert.equal(new Set(data.items.map(q=>q.id)).size,data.items.length);
 assert.deepEqual([...new Set(write.map(q=>q.lemma))].sort(),['amo','duco']);
 assert.ok(write.every(q=>q.subject==='lat1'&&q.unit==='UD 1'&&q.topic==='El presente de indicativo y el infinitivo'));
 assert.ok(write.every(q=>q.category==='Morfología verbal'&&q.language==='lat'&&q.source==='GeneradorExamenes/UniMorph'));
 assert.ok(write.every(q=>q.accepted.length>0&&q.accepted.includes(q.answer.toLowerCase().normalize('NFD').replace(/\p{M}/gu,''))));
 assert.ok(write.some(q=>q.prompt.includes('amo, amavi, amatum (1ª)')));
 assert.ok(write.some(q=>q.prompt.includes('duco, duxi, ductum (3ª)')));
 assert.ok(!data.items.some(q=>q.answer==='AMO-NO-VALIDO'||q.answer==='amarem'));
 assert.ok(choice.every(q=>q.options.includes(q.answer)&&new Set(q.options).size===q.options.length));
 const latin4=await api.load('lat4');
 assert.ok(latin4.items.some(q=>q.subject==='lat4'));
 assert.equal(callCount,1,'El índice remoto se descarga una sola vez');
 const greek=await api.load('gr1');
 assert.equal(greek.available,false);
 assert.equal(greek.items.length,0,'Nunca inventar conjugaciones griegas desde un índice latino');
 assert.equal(callCount,1);
 console.log('Respaldo remoto: 12 flexiones escritas y 12 análisis de dos lemas; filtrado, formato, currículo y caché correctos.');
}
main().catch(e=>{console.error(e);process.exitCode=1});
