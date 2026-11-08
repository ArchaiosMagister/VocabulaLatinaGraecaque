# Vocabula Latina Græcaque

Repositorio de léxico básico en latín y griego dirigido a estudiantes de Bachillerato.

## Aplicación de vocabulario

Aplicación estática lista para GitHub Pages. Los alumnos practican sin cuenta y envían avisos. El profesor entra con un código privado para añadir o editar palabras, asignar varias unidades, indicar si entran en examen y revisar los avisos.

## Publicar en GitHub Pages

1. Sube el contenido de esta carpeta a un repositorio. `index.html` debe quedar en la raíz.
2. En **Settings → Pages**, selecciona **Deploy from a branch**, rama `main` y carpeta `/(root)`; guarda.
3. Abre la dirección que muestre GitHub Pages cuando termine la publicación.

Las rutas son relativas: funciona tanto en `usuario.github.io` como en `usuario.github.io/repositorio/`. No requiere Node, compilación ni servidor propio. La carpeta incluye `.nojekyll`.

## Área de profesor

Pulsa **Área de profesor** e introduce el código privado entregado por separado. No subas el código a GitHub ni lo añadas a `config.js`. No existe registro público de profesores.

La sesión dura ocho horas y se guarda sólo en la pestaña actual. Pulsa **Cerrar sesión** al terminar en un equipo compartido. Cerrar sesión invalida ese acceso en el servidor.

En el formulario de palabras:

- Elige asignatura, forma completa, traducción y respuestas aceptadas, una por línea.
- Marca una o varias unidades o añade otras separadas por punto y coma.
- Marca **Incluir también en vocabulario de examen** cuando corresponda. Siempre se incluirá también en General.
- Pulsa **Guardar palabra**. Las modificaciones se guardan en Supabase y los alumnos las reciben al abrir o recargar la aplicación, sin cambiar archivos de GitHub.
- Para modificar una aportación, pulsa **Editar palabra**. Para retirarla, desmarca **Publicada y disponible para alumnos** y guarda.
- Si introduces exactamente la misma forma de una entrada inicial en la misma asignatura, tu versión la sustituye al cargar el vocabulario. Al retirar esa aportación se recupera la versión inicial. No se consideran iguales grafías diferentes por semejanza.

Los cambios de vocabulario no alteran una sesión de práctica ya iniciada. Se aplican a la siguiente sesión. El progreso de práctica continúa guardándose por navegador y puede exportarse/importarse desde la ayuda.

## Avisos de alumnos

**Avisar de un error** permite informar de palabras faltantes u otros problemas. Desde una tarjeta, test, ejercicio escrito o consulta, **Señalar un error** adjunta la palabra, asignatura, modo y unidades. No se pide nombre ni correo.

En el área de profesor, **Avisos de alumnos** permite filtrar pendientes, en revisión, resueltos y descartados; añadir notas privadas; y preparar una palabra nueva a partir de un aviso. Los alumnos no pueden leer la bandeja ni las notas. Preparar una palabra no la publica automáticamente: debes completar y guardar el formulario.

Si no hay conexión, no se anuncia un envío o guardado como exitoso: el formulario conserva su contenido para que puedas reintentarlo. Se puede practicar con las entradas iniciales aunque fallen las novedades compartidas.

## Conexión ya configurada

`config.js` contiene únicamente la dirección pública del servicio. El proyecto independiente de Supabase se llama **Vocabulario_clasico**, en la región europea `eu-central-1`. No usa el proyecto Palabra_del_dia.

No necesita una clave secreta de Supabase en GitHub. La función del servidor utiliza las credenciales que Supabase proporciona en su entorno, verifica el código y cada sesión antes de cualquier operación de profesor. Las tablas tienen RLS y no conceden acceso directo a visitantes ni a usuarios autenticados. Sólo la función puede acceder a ellas.

El código se guarda en el servidor como una huella SHA-256. Es un secreto aleatorio largo, no un PIN corto. Los tokens de sesión también se guardan sólo como huellas. Los formularios validan longitud y campos y las consultas no concatenan SQL. Se limitan intentos de acceso y envíos de avisos; no se guardan direcciones IP en claro.

## Mantenimiento del servicio

El código desplegado de la función está en `backend/index.ts`; el esquema inicial en `backend/schema.sql`. El servicio ya está desplegado y el esquema aplicado: **no vuelvas a ejecutar el esquema en el proyecto actual**. Las fuentes de vocabulario no se muestran ni se incluyen en esta carpeta.

Para cambiar el código de profesor, establece una nueva huella SHA-256 en `vocab_settings.code_hash` y revoca las sesiones de `vocab_sessions` desde un acceso administrativo de Supabase. No cambies el código en JavaScript del navegador. Si pierdes el código, se debe restablecer por esa vía; no hay recuperación pública.

Los avisos son privados para quienes posean el código. El vocabulario publicado está destinado a los alumnos. No incluyas datos personales en las traducciones o los avisos.

Conserva este proyecto de Supabase activo. Los límites, pausas o indisponibilidad del servicio afectan al login y a los cambios compartidos; no a la práctica con el vocabulario inicial.

Configuración de publicación: [documentación oficial de GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).
