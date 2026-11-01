# El Árbol Que Suena — instrucciones del proyecto

## Producto y decisiones

- Escuela Internacional de Neuroeducación Musical. Primera formación online en español para docentes de 0–6 años, especialmente 3–6, en España y Latinoamérica.
- Mantener 10 módulos, 20 plazas, 390 € de lanzamiento y referencia posterior de 490 €.
- Presentación del precio aprobada: «Precio Exclusivo Edición Enero 2027», 390 €, «En Mayo 2027 sube a 490 €» y «Limitado a 20 plazas». No deducir un día concreto ni automatizar cobros o cambios de tarifa a partir de ese mes.
- Próxima edición comunicada por la escuela: enero de 2027. El calendario detallado, las aperturas de módulos y los horarios de tutoría siguen pendientes; no deducir fechas de desbloqueo a partir del mes anunciado.
- Recorrido: solicitud → revisión humana → aceptación → pendiente de pago → matrícula confirmada → aula. La aceptación no es un pago ni da acceso.
- Apertura de módulos por calendario y participación. Sin nota mínima para avanzar; certificado propio tras completar el recorrido y aprobar el trabajo final.
- Foro por cohorte, moderado por la escuela. No añadir chat ni funciones ajenas al alcance.
- Redsys y transferencia quedan para la última fase. Todos los cobros permanecen desactivados hasta banco, contrato y pruebas. No reintroducir la pasarela retirada.

## Carpeta de trabajo

- La copia local principal está en `D:\El Árbol Que Suena`. Ejecutar comandos y hacer cambios en esa carpeta.
- `img/` conserva los originales locales aportados por la escuela y está excluida de Git localmente. Publicar solo los recursos seleccionados en `public/`.

## Código y diseño

- La página institucional usa `/escuela-internacional-neuroeducacion-musical`. `/azahara-mateos` conserva solo una redirección 301, con los parámetros de campaña. Enlazar siempre la dirección nueva desde menús, portada, mapa de revisión y SEO.
- El bloque común `CourseInvitation.astro` muestra «Precio exclusivo Enero 2027.» y «Mayo 2027 sube a 490 €.», con una única acción «Solicitar Plaza». No añadir el enlace secundario al programa ni un párrafo posterior al botón. La portada conserva su presentación de precio propia.
- Mantener Astro, TypeScript, Tailwind, Supabase y Resend. Revisar los usos antes de añadir un framework o servicio.
- Node.js 22 LTS desde 22.12 o 24 LTS. Usar npm y el lockfile. No mezclar gestores.
- Paleta de interfaz: oscuro cálido del footer, blanco y amarillo original `#f8de7e` como único acento, con sus tintes suaves. El amarillo sustituye al verde en la interfaz; el logo original conserva sus colores. Usar tinta oscura sobre amarillo en superficies claras para mantener contraste. No introducir azul ni colores ajenos a la marca. Botones y campos de texto comparten `--control-radius:2px`, el redondeado de Solicitar Plaza; la newsletter no usa controles en forma de píldora. Tipografía autoalojada. La dirección visual de la portada se mantiene en `src/styles/home.css`; el lenguaje compartido de las demás páginas y el destacado `editorial-accent` se mantienen en `src/styles/editorial.css`, importado por Layout. No duplicar el destacado en hojas locales.
- Portada narrativa centrada en el texto y la captación; evitar imágenes protagonistas. Footer oscuro cálido, marca centrada y caja de newsletter según la referencia de la escuela.
- Portada compacta en este orden: hero → newsletter → quiénes somos → formación con diez módulos → precio → preguntas frecuentes → footer con una segunda newsletter. Reutilizar `NewsletterCard.astro`, con identificadores y respuestas independientes (`home` y `footer`). En las demás páginas informativas conservar la newsletter del footer. Solicitud, acceso, agradecimiento y confirmación/baja de newsletter usan `experience="focused"` en Layout y `mode="focused"` en Header/Footer: una tarea principal, sin menú comercial ni otro formulario de captación; conservar vuelta al programa, ayuda y legales.
- La newsletter se presenta como semanal. La captación superior ocupa una franja oscura de ancho completo, diferenciada del hero blanco. Hero en una columna centrada: antetítulo sin línea horizontal, titular, párrafos, botones y aviso de la próxima edición con enlace a la newsletter. «Vuelve a ser el maestro que siempre quisiste tener» precede al párrafo «Los griegos…».
- Mantener el mismo espaciado superior e inferior en las secciones de portada, adaptado por dispositivo. Quiénes somos combina un bloque amarillo de identidad con otro de texto editorial; se apilan en móvil. Precio centrado: los tres pasos de admisión conectados preceden al recuadro y pasan de horizontal a vertical en móvil. Módulos públicos numerados del 1 al 10, sin cero inicial, con títulos grandes y mayúscula inicial en cada palabra, y desplazamiento lateral breve al pasar el ratón o recibir foco; respetar movimiento reducido. Los destacados puntuales comparten una franja amarilla baja con `editorial-accent`; no añadir ondas ni subrayados decorativos distintos. Conservar las señales de los enlaces. El aviso bajo los botones del hero tiene menor tamaño que los párrafos principales.
- La escuela quiere ofrecer tiempo para parar, escuchar y pensar. Evitar urgencia artificial, audio automático, ventanas de salida, competición entre alumnado y promesas de efectos cerebrales. El silencio convive con el movimiento y distintas formas de participar. Mantener separados observación, hipótesis y evidencia; ver `docs/editorial-publication.md`.
- Biografía confirmada por la escuela: Azahara Mateos es pianista, violonchelista, profesora de música y musicoterapeuta, con veinte años de experiencia. No añadir títulos, instituciones, acreditaciones o resultados no confirmados.
- Priorizar formularios HTML y páginas legibles sin JavaScript. No ocultar contenido con desenfoque, animaciones infinitas ni loaders.
- No inventar fotografías de personas, testimonios, credenciales, cifras, fechas o resultados científicos. Los artículos de prueba deben permanecer como borradores.
- No editar los píxeles del logo original sin una petición concreta; respetar proporción y transparencia.
- Marca sin punto final: «El Árbol Que Suena». Usar `BrandLockup.astro`: el header muestra solo símbolo y nombre; el footer conserva el descriptor «Escuela Internacional de Neuroeducación Musical» con el mismo ancho que el nombre, también en móvil. En la portada, la denominación completa es el antetítulo del hero.
- Animaciones breves y de una sola ejecución; respetar `prefers-reduced-motion`. El contenido debe permanecer visible sin JavaScript y durante las transiciones. No usar animaciones en bucle ni ocultar secciones pendientes de aparecer.
- Destacado tipográfico de portada: franja amarilla estática en la parte baja del texto, con la clase compartida `editorial-accent`. Aplicarla de forma selectiva a «cantando», «escuchar» en la escuela, «y aprendizaje invisible» y «tus dudas». Evitar bloques amarillos que cubran toda la palabra, ondas SVG y animaciones propias del acento. Mantener el texto oscuro para conservar contraste.
- El aviso del hero se organiza en cuatro líneas lógicas, con «Enero 2027» en negrita. «Transforma tu día a día…» va en seminegrita antes de los botones, con espaciado breve para agrupar mensaje y acción. Mantener la premisa Menos es Más.
- Captación diseñada primero para móvil; aula diseñada primero para ordenador, con todas las funciones disponibles en móvil. Menú público breve y navegación del aula única, lateral en ordenador y desplegable en móvil. Los enlaces de los menús llevan mayúscula inicial en cada palabra.
- SEO: Astro `site` define el origen canónico HTTPS; `PUBLIC_SITE_URL` mantiene su función operativa de correo/acceso y no define los metadatos. `SEO_INDEXING_ENABLED=false` por defecto; solo activarlo en el dominio final tras revisar publicación. Vistas previas, cuentas, formularios, estados de newsletter, errores y borradores legales no se indexan. Sitemap solo con las cinco páginas principales y artículos publicados; no inventar fechas `lastmod`, valoraciones o acreditaciones para datos estructurados. Ver `docs/revision-web.md`.
- Unificar la acción de captación como «Solicitar Plaza». Las páginas informativas llevan al programa y/o la solicitud; `CourseInvitation.astro` reúne la invitación y la oferta confirmada sin duplicar condiciones. No promocionar un blog vacío ni añadir destinos sin contenido. Los enlaces de privacidad dentro de formularios se abren en otra pestaña con indicación accesible para conservar lo escrito. En móvil, el acceso flotante se oculta cuando el botón principal, una caja de newsletter o el footer están visibles y al editar campos. La solicitud presenta primero los campos y después la información ampliada en móvil.

## Conexión de la escuela

- Usar el servidor `supabase_eaqs` para el proyecto `bgmkkvgcaygtcfphkvlv`. Configuración local en `.codex/config.toml`, OAuth de desarrollo autorizado y operativo. Las dos migraciones de `supabase/migrations/` están aplicadas; ver `docs/supabase-verification.json`.
- Mantener el alcance exclusivo al proyecto de la escuela. No usar la conexión antigua de AD Alcorcón, ni crear otro proyecto para resolver problemas de autenticación.
- El `.env` local ya contiene URL y clave publicable. Las claves privadas del servidor y de correo siguen pendientes; mantener `LEGAL_READY=false` y los cobros cerrados.

## Seguridad y datos

- Leer los helpers y las políticas antes de cambiar permisos. RLS en toda tabla expuesta; grants explícitos.
- Validar identidad en servidor, sin confiar en sesiones de cliente o metadatos editables. Administración solo con `app_metadata.role`.
- Mantener cerradas las operaciones cuando faltan configuración, políticas o comprobaciones. No sustituir errores por éxitos ficticios.
- `LEGAL_READY=false` impide captar datos reales hasta completar titularidad y políticas. No activarlo por conveniencia de pruebas.
- Nunca versionar datos de ejecución, bases locales, copias, claves ni archivos `.env` (excepto el ejemplo sin valores).
- No imprimir secretos ni datos personales en terminal, chat, capturas o pruebas.
- No consultar ni alterar servicios reales para completar una prueba local. Usar cuentas y datos de ensayo.
- La escuela autorizó el 2 de noviembre de 2026 retirar PocketBase y publicar. Antes de actualizar el remoto, sanear los archivos históricos y verificar que el código actual se conserva; guardar cualquier bundle de recuperación solo en `work/`. Usar un lease del SHA remoto, nunca sobrescribir cambios ajenos. Ver `docs/security-review.md` y `docs/deployment.md`.
- No reescribir el historial de Git ni revocar credenciales sin determinar primero el alcance y coordinar la operación con la escuela.

## Comprobaciones y entrega

- `npm run check`: tipos de Astro/TypeScript.
- `npm test`: pruebas de seguridad y aplicación.
- `npm run test:db`: migración y RLS reales en PGlite.
- `npm run build`: check y construcción.
- `npm run test:http`: límites HTTP, SEO y rastreo de enlaces/anclas con servidor local, credenciales vacías y servicios cerrados.
- `npm run verify`: conjunto completo.
- Pruebas relevantes: visitante, solicitante, aceptado sin pagar, matriculado, administrador y separación entre cohortes; archivos privados, correo fallido, progreso, entrega y certificado.
- Tras un cambio visual revisar navegador en móvil y ordenador; después de una corrección repetir solo las comprobaciones afectadas.
- Las pruebas locales no acreditan GoTrue, SMTP, Storage HTTP, R2 o Redsys remotos. Comunicar esas limitaciones.
- Mantener Node para desarrollo y comprobaciones locales; Cloudflare Workers es la opción de producción priorizada por coste cero. `npm run build:release` construye y comprueba Cloudflare. La configuración deja backend, captación, indexación y pagos cerrados. El emulador nativo falla en este Windows: usar el prerenderizador Node y verificar el Worker real antes de conectar el dominio. No confundir una construcción local con publicación; ver `docs/deployment.md`.
- Mantener las migraciones reproducibles y documentación actualizada. No crear usuarios o matrículas activas de demostración en producción.
