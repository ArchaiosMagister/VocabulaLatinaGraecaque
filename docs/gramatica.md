# Práctica de gramática por unidades

La web de gramática `gramatica.html` trabaja los epígrafes del documento docente: **Griego I (UD 0–14), Latín I (UD 0–10) y Latín de 4.º ESO (UD 1–8)**.

## Bancos de ejercicios

- **Banco inicial:** 84 preguntas-base de teoría y sintaxis, más 55 paradigmas modelo de declinaciones y conjugaciones, con 1.039 ejercicios generados.
- **Banco importado:** se procesan las filas íntegras de los repositorios UniMorph `lat` y `grc`. Se conservan **todas las filas atestiguadas** correspondientes a los lemas de los vocabularios docentes, no una muestra de cada paradigma. La fuente y su revisión exacta quedan registradas en el manifiesto.
- **Banco de verbos latinos complementario:** `morfologia.html` puede consultar el índice verbal del repositorio GeneradorExamenes, separado de este módulo.

La interfaz presenta filtros de asignatura, unidad, apartado gramatical, categoría y modalidad. Permite hacer test de análisis, escribir flexiones, repetir errores, practicar de forma acumulativa y guardar progreso en el navegador. Si falta un índice publicado, los ejercicios iniciales siguen funcionando.

## Importación automática

El script `scripts/import_unimorph.mjs` descarga los TSV completos (sin necesitar que el profesor aporte archivos), comprueba su formato y aplica un filtrado **por lema** del vocabulario `data.js`. Los índices resultantes se guardan en `data/unimorph-syllabus/` divididos en 40 partes pequeñas, sin obligar a que el navegador descargue los corpus enteros.

El flujo `.github/workflows/import-grammar-inflections.yml` reproduce la importación y las pruebas, y publica las partes por commit automático. Se ejecuta al cambiar el importador, la fuente de vocabulario o el propio flujo en las ramas configuradas, y también admite lanzamiento manual.

Última importación probada con fuentes fijadas por SHA:

| Idioma | Filas de la fuente examinadas | Filas conservadas | Lemas del vocabulario presentes | Preguntas generadas |
| --- | ---: | ---: | ---: | --- |
| Latín | 976.489 | 10.036 | 476 de 772 | Latín I: 6.029; Latín 4.º: 3.399 |
| Griego antiguo | 41.593 | 1.467 | 103 de 349 | Griego I: 725 |

Las filas conservadas son *lema + forma + etiqueta morfológica*: **no** representan 10.036 o 1.467 palabras distintas. El mismo lema puede tener muchas lecturas y formas, y algunas quedan fuera de los ejercicios por motivos curriculares.

## Correcciones de datos y controles pedagógicos

1. Cada ejercicio se asocia al apartado de gramática introducido en una unidad. Si el lema aparece por primera vez más tarde, se asigna al **repaso morfológico acumulativo** de la unidad correspondiente, sin anticipar vocabulario ni un concepto aún no explicado. Los grupos de vocabulario inseparables se tratan como tales.
2. Se excluyen análisis ambiguos de una forma cuando la pregunta exige una sola lectura; en escritura se aceptan todas las variantes expresamente presentes en la base. No se infieren formas por semejanza.
3. La forma griega de UniMorph a veces incluye artículos (p. ej., *τὸ σῶμα*); el importador separa el artículo reconocido y conserva el original en una cuarta columna de procedencia. Si no puede identificar con seguridad un prefijo, excluye esa fila.
4. Se exige coherencia de categoría léxica entre la fuente y el vocabulario del profesor (por ejemplo, no se trata *amicus* ‘amigo’ como un adjetivo por el hecho de que exista un homónimo adjetival). Los deponentes latinos no se presentan como formas de voz activa corriente por la etiqueta `ACT` de UniMorph.
5. Se descartan duales griegos, categorías no estudiadas, nombres propios en usos que puedan exigir plurales inexistentes, etc.
6. Se ignoran macrones latinos y, en las respuestas griegas, acentos y espíritus; **no se elimina la iota suscrita**. Se admite el `ν` móvil si figura en la base.

## Límites

**No equivale a disponer de todas las flexiones de todos los lemas del curso.** UniMorph griego antiguo es fundamentalmente nominal y adjetival, sin paradigmas verbales en el archivo descargado. La cobertura verbal latina de UniMorph también es limitada respecto del currículo. Se mantienen los paradigmas docentes y las preguntas base para las materias no cubiertas. No se afirman corregibles automáticamente las traducciones libres o los análisis sintácticos abiertos.

Las formas importadas no constituyen validación universal con Collatinus/LEMLAT3/Eulexis ni sustituyen una revisión docente de las irregularidades.

## Licencias y atribución

Los dos archivos fuente UniMorph se publican bajo **CC BY-SA 3.0**. Los índices filtrados de `data/unimorph-syllabus/` mantienen esa licencia y citan las fuentes, los SHA de commit y las huellas de descarga en `manifest.json` y `LICENSE-DATA.md`. La licencia de los datos derivados es independiente del resto del código.

- [UniMorph lat](https://github.com/unimorph/lat), fuente original English Wiktionary.
- [UniMorph grc](https://github.com/unimorph/grc), fuente original Wikipedia.

## Verificación

Ejecutar:

```sh
node tests/check-grammar.cjs
node scripts/import_unimorph.mjs
node tests/check-unimorph-import.mjs
```

La última ejecución automatizada de GitHub Actions ha superado ambas suites, revisando recuentos de partes, duplicados, soluciones admitidas, artículo griego, lemas y asociación curricular. Es recomendable comprobar la navegación, el tema oscuro y la interacción de formularios en navegadores reales antes de fusionar la propuesta.
