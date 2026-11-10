# Primera fase de lematización griega sin conexión

Se ha construido un corpus portátil en `data/grc-present-indicative-offline.json`, separado de los índices UniMorph y sin dependencias de servidores. Es la **fuente de trabajo principal** para el presente de indicativo; por ahora no se fusiona con GeneradorExamenes.

## Alcance (10 de noviembre de 2026)

- **81 lemas** (80 variantes léxicas del vocabulario de Griego I, incluida la doble grafía φυλάσσω / φυλάττω, y εἰμί como paradigma gramatical).
- **116 paradigmas** de 6 personas, con **696 entradas de forma flexionada**. Una misma grafía puede corresponder a varias lecturas. No son 696 formas gráficamente distintas.
- **8 deponentes**: βούλομαι, γίγνομαι, ἔρχομαι, μάχομαι, ἀφικνέομαι, ἡγέομαι, ὁρμάομαι y προσέρχομαι. Se conserva la voz morfológica y el valor deponente sin asignarles una voz activa inexistente en el modelo.
- Presente de indicativo **activo** de verbos temáticos, **medio-pasivo** de una selección léxica, verbos contractos en `-άω/-έω` y **εἰμί** como excepción expresamente solicitada.
- **πλέω** y **ἀποπλέω** se almacenan con su flexión explícita, sin aplicarles indebidamente la contracción regular en `-έω`. Se conserva la `ν` móvil.
- **Fuera de esta fase**: otros tiempos y modos, dual, variación dialectal, `δύναμαι` (atemático), impersonales `δεῖ` y `χρή`.

La columna `status` diferencia los paradigmas **rule_generated** (formas construidas mediante reglas con lemas seleccionados) de **explicit_exception** (paradigmas introducidos explícitamente). Es esencial: *regla válida* no significa que cada forma esté atestiguada en un corpus ni que se haya revisado su uso concreto. Las formas de `middle-passive` no deben traducirse automáticamente como medias ni pasivas: dependen del contexto y del verbo.

## Consulta y reutilización

```sh
node scripts/grc_present_lookup.mjs γίγνεται
node scripts/grc_present_lookup.mjs ἐστίν
node scripts/grc_present_lookup.mjs λυουσιν
node tests/check-grc-present-offline.mjs
```

El analizador devuelve una **lista de análisis posibles**, cada uno con lema, forma, persona, número, tiempo, modo, voz, indicador de deponente y estado de validación. En la búsqueda normaliza acentos, espíritus, sigma final y composición Unicode, pero **no elimina la iota suscrita** (la convierte en iota adscrita para la comparación). No decide el significado contextual. No consulta Internet.

El corpus JSON se podrá importar o copiar directamente a `GeneradorExamenes` cuando se decida una política común de versiones. No conviene crear todavía dos bases canónicas: el fichero del presente griego en este repositorio será el origen y los otros proyectos consumirán una versión fija cuando el banco esté más validado.

## Control de calidad y referencias

La prueba automatizada comprueba número de paradigmas, seis personas, Unicode, formas con `ν` móvil, casos contraintuitivos, presencia de todos los lemas en el vocabulario y ausencia de atemáticos ajenos al alcance.

Para el sistema temático y la contracción se han consultado paradigmas docentes y gramáticas de referencia, entre ellas *Cambridge Grammar of Classical Greek*, apartado 12.3, y el paradigma de `ἡγέομαι` de *Hellênikê*. El vocabulario y sus traducciones provienen de `data.js`. Los índices UniMorph existentes conservan su propia licencia y procedencia y **no se han mezclado** con esta base.

**Siguiente revisión filológica aconsejable:** contrastar de forma independiente la totalidad de cada forma generada y sus voces léxicamente admisibles; comprobar alternativas contractas como `ἡγεῖ / ἡγῇ`; después incorporar análisis del infinitivo y del imperfecto o integrar la base con otras aplicaciones. No activar autocorrección en exámenes de las formas aún marcadas como `rule_generated` sin verificación.
