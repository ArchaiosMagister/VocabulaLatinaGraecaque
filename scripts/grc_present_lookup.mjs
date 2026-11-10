#!/usr/bin/env node
/**
 * Índice offline del presente griego. Datos estáticos del vocabulario docente;
 * las formas generadas por regla se distinguen de las excepciones explícitas.
 * Compatible con Node 20+, sin dependencias ni red.
 */
import { readFileSync } from 'node:fs';
const datasetUrl = new URL('../data/grc-present-indicative-offline.json', import.meta.url);
export const corpus = JSON.parse(readFileSync(datasetUrl, 'utf8'));

export function normalizeGreek(input) {
  return String(input ?? '').trim().toLowerCase().normalize('NFD')
    .replace(/\u0345/g, 'ι')
    .replace(/\p{M}/gu, '')
    .replace(/ς/g, 'σ')
    .replace(/[·.,;!?¿¡‘’'"«»]/gu, '')
    .replace(/\s+/gu, ' ')
    .normalize('NFC');
}
export function expandOptionalNu(surface) {
  if (!surface.endsWith('(ν)')) return [surface];
  const without = surface.slice(0, -3);
  return [without, without + 'ν'];
}
export function buildIndex(data = corpus) {
  const index = new Map();
  for (const lexeme of data.entries) {
    for (const paradigm of lexeme.paradigms) {
      for (const [personNumber, surface] of Object.entries(paradigm.forms)) {
        const person = Number(personNumber[0]);
        const number = personNumber.slice(1) === 'sg' ? 'singular' : 'plural';
        const record = {
          lemma: lexeme.lemma,
          form: surface,
          voice: paradigm.voice,
          deponent: lexeme.deponent,
          inflection: lexeme.inflection,
          tense: 'present',
          mood: 'indicative',
          person,
          number,
          status: paradigm.status
        };
        for (const formVariant of [surface, ...(paradigm.alternates?.[personNumber] ?? [])]) {
          for (const variant of expandOptionalNu(formVariant)) {
            const key = normalizeGreek(variant);
          if (!index.has(key)) index.set(key, []);
          if (!index.get(key).some(x =>
            x.lemma === record.lemma && x.voice === record.voice &&
            x.person === person && x.number === number
          )) index.get(key).push(record);
          }
        }
      }
    }
  }
  return index;
}
const index = buildIndex();
/** Devuelve TODAS las lecturas posibles, sin inventar una desambiguación. */
export function lemmatizeGreekPresent(surface) {
  if (!String(surface ?? '').trim()) return [];
  return index.get(normalizeGreek(surface)) ?? [];
}
if (process.argv[1] && import.meta.url === new URL('file://' + process.argv[1]).href) {
  const input = process.argv.slice(2).join(' ');
  if (!input) {
    console.error('Uso: node scripts/grc_present_lookup.mjs <forma griega>');
    process.exitCode = 2;
  } else {
    console.log(JSON.stringify(lemmatizeGreekPresent(input), null, 2));
  }
}
