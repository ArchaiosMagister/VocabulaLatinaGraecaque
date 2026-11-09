#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
const r=JSON.parse(fs.readFileSync(new URL('../data/morphology-coverage.json',import.meta.url),'utf8'));
const manifest=JSON.parse(fs.readFileSync(new URL('../data/unimorph-syllabus/manifest.json',import.meta.url),'utf8'));
assert.equal(r.schema,1);
assert.match(r.definition,/NO supone paradigma completo/);
for(const subject of ['lat1','lat4','gr1']){
 const x=r.subjects[subject],m=manifest.subjects[subject];
 assert.equal(x.lemmas,m.distinct_lemmas,'Error en el denominador de '+subject);
 assert.equal(x.withExercises+x.withoutExercises,x.lemmas);
 assert.ok(x.importedLemmas<=x.withExercises);
 assert.ok(x.curatedLemmas<=x.withExercises);
 assert.ok(x.importedQuestions>20);
 assert.equal(x.uncovered.length,x.withoutExercises);
 assert.ok(new Set(x.uncovered.map(y=>y.lemma)).size===x.uncovered.length);
 assert.ok(x.uncovered.every(y=>y.status===undefined),'No se debe confundir la cobertura con paradigmas completos');
 assert.ok(Object.values(x.types).reduce((n,y)=>n+y.lemmas,0)===x.lemmas);
}
const latin=r.subjects.lat1;
assert.ok(latin.curatedLemmas>=18,'Falta la ampliación docente latina');
assert.ok(latin.importedLemmas>100);
assert.ok(r.subjects.gr1.importedLemmas>25);
console.log('Cobertura auditada: '+Object.entries(r.subjects).map(([s,v])=>s+'='+v.withExercises+'/'+v.lemmas).join(', '));
