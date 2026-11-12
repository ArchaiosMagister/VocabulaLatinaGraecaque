'use strict';
// 100 checks: five inflected forms each of ten Latin and ten Attic Greek lemmata.
// Unlike a blanket "verified" flag, each result distinguishes matches, missing
// imported data and contradictory imported forms.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=x=>fs.readFileSync(path.join(root,x),'utf8');
const bank=JSON.parse(read('data.js').replace(/^window\.VOCAB\s*=\s*/,'').replace(/;\s*$/,''));
const fixture=JSON.parse(read('tests/fixtures/revision-100-formas-clasicas.json'));
const byId=new Map(bank.map(x=>[x.id,x]));
assert.equal(fixture.schema,1);
assert.equal(fixture.checks.length,100);
assert.equal(fixture.checks.filter(c=>c.language==='lat').length,50);
assert.equal(fixture.checks.filter(c=>c.language==='grc').length,50);
const normLat=s=>String(s||'').toLowerCase().normalize('NFD')
 .replace(/\p{M}/gu,'').replace(/æ/g,'ae').replace(/œ/g,'oe').trim();
const normGreek=s=>String(s||'').toLowerCase().normalize('NFD')
 .replace(/[\u0304\u0306]/g,'').replace(/\u0300/g,'\u0301')
 .normalize('NFC').trim();
const normalize=(lang,s)=>lang==='grc'?normGreek(s):normLat(s);
const cache={};
for(const lang of ['lat','grc']){
 const directory=path.join(root,'data/unimorph-syllabus',lang);
 const rows=[];
 for(const filename of fs.readdirSync(directory).filter(x=>/^part-\d+\.json$/.test(x)).sort()){
  const shard=JSON.parse(fs.readFileSync(path.join(directory,filename),'utf8'));
  for(const row of shard)if(row.length>=3)rows.push(row);
 }
 cache[lang]=rows;
}
const seen=new Set();
const results=[];
for(const c of fixture.checks){
 assert.ok(!seen.has(c.id),'Duplicated check: '+c.id);seen.add(c.id);
 assert.ok(['lat','grc'].includes(c.language),'Language not recognized: '+c.id);
 const word=byId.get(c.teacherEntryId);
 assert.ok(word,'Teacher headword missing: '+c.id);
 assert.equal(word.subject,c.subject,'Wrong course: '+c.id);
 assert.equal(word.form,c.teacherHeadword,'Teacher lemma changed: '+c.id);
 assert.ok(word.originals.length>0,'Missing Word source: '+c.id);
 assert.ok(c.authority?.startsWith('https://'),'No classical paradigm reference: '+c.id);
 const [cas,num]=c.feature.split(';');
 assert.ok(['NOM','GEN','DAT','ACC','VOC','ABL'].includes(cas));
 assert.ok(['SG','PL'].includes(num));
 const records=cache[c.language].filter(r=>{
  if(normalize(c.language,r[0])!==normalize(c.language,c.lemma))return false;
  const tags=r[2].split(';');
  return tags[0]==='N'&&tags.includes(cas)&&tags.includes(num);
 });
 const actual=[...new Set(records.map(r=>normalize(c.language,r[1])))].sort();
 const expected=normalize(c.language,c.expected);
 const found=actual.includes(expected);
 const status=actual.length===0?'absent':actual.length===1&&found?'matched':found?'extra-variants':'contradictory';
 results.push({id:c.id,language:c.language,lemma:c.lemma,feature:c.feature,
  expected:c.expected,status,sourceForms:[...new Set(records.map(r=>r[1]))].sort()});
}
const count=status=>results.filter(x=>x.status===status).length;
const summary={checks:results.length,latin:results.filter(x=>x.language==='lat').length,
 greek:results.filter(x=>x.language==='grc').length,
 matched:count('matched'),absent:count('absent'),
 extraVariants:count('extra-variants'),contradictory:count('contradictory')};
assert.equal(summary.checks,100);
const bad=results.filter(x=>['extra-variants','contradictory'].includes(x.status));
for(const item of results)console.log(item.id+' '+item.language+' '+item.lemma+' '+item.feature+
 ' expected='+item.expected+' status='+item.status+' index='+JSON.stringify(item.sourceForms));
console.log('AUDITORIA_100_RESUMEN '+JSON.stringify(summary));
if(bad.length){
 console.error('Formas contradictorias en UniMorph: '+JSON.stringify(bad));
 process.exitCode=1;
}
