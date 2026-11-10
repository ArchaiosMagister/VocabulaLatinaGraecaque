# Respaldo online de morfología

## Qué funciona

La página `gramatica.html` mantiene el banco local de formas docentes y los índices UniMorph publicados con el propio repositorio. De forma opcional, mediante **Usar respaldo online de verbos latinos**, consulta un **índice JSON público de verbos latinos** publicado en el repositorio hermano [GeneradorExamenes](https://github.com/ArchaiosMagister/GeneradorExamenes).

Fuente exacta:
`https://raw.githubusercontent.com/ArchaiosMagister/GeneradorExamenes/main/data/unimorph/lat-v.json`

Esta fuente **no es Collatinus**: es un índice UniMorph que ya se usa desde `morfologia.html`. Por ello no debe presentarse como una segunda verificación independiente. Tiene sentido como **respaldo online de disponibilidad**, no como garantía de cobertura adicional universal.

### Qué se admite para autocorrección

El adaptador `gramatica-respaldo-online.js`:

1. Carga el índice remoto una sola vez por sesión, con timeout y estado de error claro.
2. Conserva únicamente entradas del vocabulario del curso cuyo enunciado latino está documentado y contiene presente, perfecto, supino y conjugación.
3. Acepta solamente formas etiquetadas exactamente como `V;IND;ACT;PRS;persona;número`, con rango 1, y paradigmas con al menos cuatro personas/números distintos.
4. Descarta deponentes, entradas ajenas al curso y lecturas ambiguas en preguntas de reconocimiento.
5. Asigna la unidad del currículo según la primera aparición del lema y la introducción del presente de indicativo, sin ofrecer UD 0.
6. Convierte los datos en **los mismos objetos de ejercicio** del banco local: `id`, `subject`, `unit`, `topic`, `category`, `mode`, `lemma`, `prompt`, `answer`, `accepted`, `explanation`, `language`, y además `source`.
7. Si hay ejercicios verbales locales para un lema, **no añade preguntas remotas duplicadas** de ese lema.
8. Si falla Internet o la fuente, conserva los ejercicios locales y permite desactivar el respaldo.

Los ejercicios que pasan esos filtros se muestran con **la misma tarjeta, enunciado, respuesta, corrección y repetición de fallos** que los otros ejercicios: no se incrusta una pantalla externa.

### Consulta externa para las lagunas

La página incluye, en un apartado desplegable, enlaces a:

- [Collatinus-web](https://outils.biblissima.fr/fr/collatinus-web/) para latín.
- [Eulexis-web](https://outils.biblissima.fr/en/eulexis-web/) para griego antiguo.
- [Logeion](https://logeion.uchicago.edu/) para consultar lemas de ambas lenguas.

Son **páginas de consulta**, no API de soluciones. **Sus resultados no se extraen ni se usan automáticamente para calificar**: no se ha verificado una API pública estable con CORS, etiquetas y condiciones de uso compatibles con esa operación. Al abrirlas muestran su propia interfaz; el requisito de estilo homogéneo se cumple para las formas que realmente entran como ejercicios, no para webs ajenas.

En griego no se dispone todavía de un índice remoto verificado de conjugaciones: el respaldo griego para nuevas formas consiste por ahora en la consulta manual a Eulexis/Logeion, no en autocorrección desde sus páginas.

## Relación con GeneradorExamenes

**Son dos repositorios con bancos propios.** GeneradorExamenes publica su índice UniMorph y su programa de exámenes; VocabulaLatinaGraecaque utiliza un banco propio de gramática y puede consultar ahora el índice verbal del primero. En ese sentido, **existe reutilización de una fuente**, pero **todavía no hay un único banco central de paradigmas validados que alimente ambos generadores de preguntas**.

El formato de intercambio para los módulos es el objeto de ejercicio documentado arriba. Para compartir todos los paradigmas en el futuro, conviene publicar un índice de paradigmas canónico, versionado y con procedencia, y añadir adaptadores separados para Vocabulario (sesiones de autocorrección) y GeneradorExamenes (tablas de examen). No es prudente modificar automáticamente las preguntas de los exámenes antes de validar las nuevas flexiones.

## Pruebas

`node tests/check-online-backup.cjs` comprueba el formato, las casillas, los enunciados y la ausencia de formas inventadas o de otras categorías.

La prueba Chromium de `tests/check-grammar-browser.cjs` simula una respuesta remota sin depender de la red de un tercero. Verifica la normalización al objeto de ejercicio y que puede desconectarse para utilizar solo los bancos locales.
