#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { corpus, normalizeGreek, lemmatizeGreekPresent, expandOptionalNu } from '../scripts/grc_present_lookup.mjs';

const ids = new Set();
const keySet = ['1sg','2sg','3sg','1pl','2pl','3pl'];
let nForms = 0, nParadigms = 0, deponents = 0;
assert.equal(corpus.language, 'grc');
assert.equal(corpus.schema_version, 1);
for (const e of corpus.entries) {
  const lemmaKey=normalizeGreek(e.lemma);
  assert.ok(!ids.has(lemmaKey), 'Lema duplicado: '+e.lemma);
  ids.add(lemmaKey);
  assert.ok(e.paradigms.length >= 1, 'Sin paradigmas: '+e.lemma);
  if(e.deponent) deponents++;
  for(const p of e.paradigms) {
    nParadigms++;
    assert.deepEqual(Object.keys(p.forms), keySet, 'Persona omitida o reordenada: '+e.lemma);
    assert.ok(['rule_generated','explicit_exception'].includes(p.status));
    if (e.deponent) assert.equal(p.voice, 'deponent','Deponente con voz incorrecta: '+e.lemma);
    for(const [person,form] of Object.entries(p.forms)) {
      nForms++;
      assert.ok(form && form === form.normalize('NFC'), 'Unicode no normalizado: '+e.lemma);
      for(const variant of expandOptionalNu(form)){
        assert.ok(lemmatizeGreekPresent(variant).some(x=>
          x.lemma===e.lemma && x.voice===p.voice &&
          Number(person[0])===x.person &&
          (person.endsWith('sg')?'singular':'plural')===x.number
        ), 'No reconoce su propia forma: '+e.lemma+' '+form);
      }
    }
  }
}
assert.deepEqual(corpus.summary,{lexemes:corpus.entries.length,paradigms:nParadigms,finiteForms:nForms,deponents});
assert.equal(corpus.entries.length,81);
assert.equal(nParadigms,116);
assert.equal(nForms,696);
assert.equal(deponents,8);
assert.ok(corpus.entries.some(x=>x.lemma==='εἰμί'));
assert.ok(!corpus.entries.some(x=>normalizeGreek(x.lemma)===normalizeGreek('δύναμαι')));
function has(surface, lemma, voice, person, number){
 assert.ok(lemmatizeGreekPresent(surface).some(x=>
   normalizeGreek(x.lemma)===normalizeGreek(lemma) && x.voice===voice &&
   x.person===person && x.number===number && x.tense==='present' && x.mood==='indicative'
 ), 'No hay análisis: '+surface+' -> '+lemma+' '+person+' '+number);
}
has('λύω','λύω','active',1,'singular');
has('λυομαι','λύω','middle-passive',1,'singular');
has('λύουσι','λύω','active',3,'plural');
has('λύουσιν','λύω','active',3,'plural');
has('γίγνεται','γίγνομαι','deponent',3,'singular');
has('ΓΙΓΝΟΜΕΘΑ','γίγνομαι','deponent',1,'plural');
has('ἔρχῃ','ἔρχομαι','deponent',2,'singular');
has('βούλῃ','βούλομαι','deponent',2,'singular');
has('μάχονται','μάχομαι','deponent',3,'plural');
has('ἡγεῖται','ἡγέομαι','deponent',3,'singular');
has('ἡγοῦμαι','ἡγέομαι','deponent',1,'singular');
has('ἀφικνούμεθα','ἀφικνέομαι','deponent',1,'plural');
has('νικᾷς','νικάω','active',2,'singular');
has('φιλοῦμεν','φιλέω','active',1,'plural');
has('ἐπιθυμῶ','ἐπιθυμέω','active',1,'singular');
has('πλέομεν','πλέω','active',1,'plural');
has('ἀποπλεῖτε','ἀποπλέω','active',2,'plural');
has('εἶ','εἰμί','active',2,'singular');
has('ἐστί','εἰμί','active',3,'singular');
has('ἐστίν','εἰμί','active',3,'singular');
has('εἰσί','εἰμί','active',3,'plural');
has('εἰσίν','εἰμί','active',3,'plural');
assert.deepEqual(lemmatizeGreekPresent(''),[]);
assert.deepEqual(lemmatizeGreekPresent('δύναμαι'),[]);
assert.deepEqual(lemmatizeGreekPresent('palabra-inexistente'),[]);
// Filtrado semántico: solo se han incorporado lemas del vocabulario o εἰμί
const voc=JSON.parse(readFileSync(new URL('../data.js',import.meta.url),'utf8').replace(/^window.VOCAB=/,'').replace(/;\s*$/,''));
const greekSource=new Set(voc.filter(x=>x.subject==='gr1')
  .flatMap(x=>x.form.split(/[,+(]/)[0].split(/\s+o\s+/u))
  .map(normalizeGreek));
for(const e of corpus.entries){
 assert.ok(e.lemma==='εἰμί'||greekSource.has(normalizeGreek(e.lemma)),
  'Lema fuera del vocabulario del docente: '+e.lemma);
}
console.log('OK: '+ids.size+' lemas, '+nParadigms+' paradigmas, '+nForms+' formas de presente; '+deponents+' deponentes.');
