# Repaso de gramática por unidades

La página **gramatica.html** añade práctica de gramática de Latín I (UD 0–10), Griego I (UD 0–14) y Latín de 4.º ESO (UD 1–8), siguiendo los epígrafes del archivo de temario aportado por el docente.

## Funciones

- Filtros de asignatura, unidades, contenido concreto y categoría (morfología nominal, verbal, sintaxis, conceptos).
- Test de reconocimiento y escritura de formas, feedback inmediato y repetición de fallos.
- Paradigmas estáticos auditables con soluciones deterministas y exclusión de análisis morfológicos ambiguos.
- Normalización de macrones latinos y de tildes y espíritus griegos, sin eliminar la iota suscrita; manejo de ν móvil y alternativas expresamente listadas.
- Progreso local independiente del vocabulario.

## Cobertura

Los **epígrafes** gramaticales del temario están representados, pero esto **no equivale** a tener todas las posibles formas de todas las palabras del vocabulario: hay preguntas explicativas de sintaxis y una selección de paradigmas para escritura de flexiones. La página morfologia.html sigue disponible como módulo complementario para verbos latinos enlazado con los datos de UniMorph del generador de exámenes.

Este módulo no incluye por ahora el apartado cultural de Latín de 4.º ESO ni la derivación etimológica de Griego I, que son secciones distintas del temario gramatical.

## Fuentes de datos

- gramatica-contenidos.js: distribución por unidades y preguntas elaboradas a partir de los epígrafes del documento.
- gramatica-paradigmas.js: tablas flexivas editables con muestras de declinaciones, pronombres y conjugaciones.
- No se generan formas mediante reglas estadísticas ni se dan por correctas las predicciones de un modelo lingüístico.

## Comprobar

Ejecutar desde la raíz: node tests/check-grammar.cjs. Verifica que cada apartado del temario tenga preguntas, que los IDs sean únicos, que las respuestas correctas estén entre las aceptadas y que los ejercicios de test no presenten opciones duplicadas. Además es necesario comprobar la navegación y el teclado en un navegador real antes de publicar.

## Ampliación posterior

Para ofrecer **todas las flexiones de todos los lemas** es necesario integrar y validar los bancos nominales y verbales completos, incluidos los índices de griego actualmente no publicados en el generador. Las construcciones sintácticas abiertas requieren conjuntos de ejemplos con soluciones alternativas revisadas.
