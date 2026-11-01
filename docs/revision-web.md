# Recorrido local para revisar la web

Con `npm run dev` activo, abrir `http://127.0.0.1:4321/vista-previa`.

Este índice enlaza las páginas públicas reales y una demostración independiente de las pantallas privadas. Ambas comparten los ajustes de diseño para que la escuela pueda revisar el recorrido completo.

## Qué puede explorarse

- Web pública: portada, programa, metodología, escuela, solicitud, acceso, contacto, blog y páginas legales.
- Aula: itinerario de diez módulos, lección, cuestionario, foro, tutorías, trabajo final y certificado de muestra.
- Admisión: revisión, aceptación pendiente de pago y lista de espera.
- Administración: resumen y alumnado, solicitudes, contenidos, trabajos, moderación, tutorías y correo.

Los botones de prueba del cuestionario, foro y gestión solo cambian la página actual. Al recargar se reinician. Los archivos seleccionados en el trabajo final no se suben ni se leen; solo se comprueba su nombre y tamaño para ilustrar la interacción. La muestra del certificado conserva el rótulo «MUESTRA · SIN VALIDEZ», también al imprimir.

## Límites

Las pantallas ilustrativas comparten cabecera, marco del aula y pie con la aplicación, pero usan contenido de ejemplo. No crean sesiones ni usuarios, no consultan Supabase y no simulan pagos. Los vídeos y materiales definitivos siguen pendientes. El correo, las solicitudes reales y los cobros mantienen sus condiciones de activación originales.

Las rutas `/vista-previa` y `/vista-previa/[section]` devuelven 404 fuera de desarrollo. No se ha añadido ninguna excepción de autenticación a las rutas reales ni a las API. Las propiedades de previsualización de los componentes se condicionan también a `import.meta.env.DEV`.

## Comprobado el 1 de noviembre de 2026

- 29 destinos de navegación local responden correctamente.
- Tipos Astro/TypeScript sin errores ni advertencias; construcción correcta.
- 28 comprobaciones HTTP en producción, incluyendo el bloqueo del índice y las pantallas privadas de demostración.
- Prueba en navegador de cuestionario, publicación local en foro y aceptación pendiente de pago.
- Mapa y lección revisados a 390 px, sin desbordamiento horizontal; tamaño normal del navegador restaurado.

No se enviaron correos ni se modificaron datos de la escuela para estas pruebas.

## Navegación por dispositivo

- Captación primero en móvil: menú público con Formación, Escuela, Contacto, Acceso Al Aula y Solicitar Plaza. El acceso inferior a la solicitud aparece al dejar atrás el header cuando el botón principal no está visible; se oculta ante las cajas de newsletter, el footer y al editar campos. Sin JavaScript siguen disponibles el menú HTML y los enlaces de solicitud normales.
- Portada con el título «Tú también aprendiste cantando» y los textos actualizados por la escuela. Hero centrado en una columna: antetítulo, titular, texto desarrollado, dos botones y aviso de la próxima edición en enero de 2027 con enlace a la newsletter. Los detalles de módulos y precio se desarrollan en sus secciones.
- Solicitud en una página, agrupada en datos de contacto y práctica docente. El formulario precede a la información ampliada en el orden del documento; en ordenador, el resumen queda a su derecha. Se conservan nombres de campos, validaciones y condiciones del servidor.
- Aula con una sola navegación lateral por encima de 1000 px y desplegable en tamaños menores. Trabajo final y certificado se agrupan después de las herramientas cotidianas. Sin JavaScript el menú queda abierto y todos los destinos siguen accesibles.
- El acceso «Continuar el módulo» apunta al primer módulo disponible sin participación registrada; si todos los disponibles tienen participación, permite repasar el último. No representa un minuto de reproducción guardado ni abre módulos que las políticas no permitan consultar.
- La lección real presenta primero el vídeo, después la lectura, con documentos y cuestionario al lado en pantallas amplias y debajo en móvil. La demostración mantiene visible que su vídeo definitivo está pendiente.
- No se ha alterado el acceso privado, la configuración legal, los servicios externos ni el estado cerrado de los pagos.

Validación de este ajuste: 85 archivos comprobados sin errores, advertencias ni indicaciones; construcción correcta, 30 pruebas de aplicación y 28 comprobaciones HTTP de producción. Portada, solicitud, itinerario y lección revisados en 320 y 390 px sin desplazamiento horizontal; aula y gestión revisadas también en ordenador. El primer campo de solicitud queda a unos 575 px del inicio en la vista de 390 px, frente a unos 1240 px antes del cambio. Se comprobaron los enlaces del menú móvil, el cambio de sección del aula y la aparición de la solicitud flotante al desplazarse, con ocultación ante el footer. El tamaño normal del navegador se restaura al terminar.

## Portada abreviada

Se conservan seis secciones, en este orden: hero, newsletter, quiénes somos, formación con diez módulos, precio y preguntas frecuentes. Después aparece el footer con la marca, una segunda newsletter y los enlaces. Los bloques intermedios de relato, resultados y formato se han retirado de la portada; el programa y las preguntas frecuentes conservan la información necesaria sobre el recorrido.

La newsletter utiliza la misma tarjeta oscura y el mismo formulario en ambos lugares, mediante `NewsletterCard.astro`. La superior utiliza el origen `home` y el identificador `newsletter`; la del footer utiliza `footer` y `newsletter-footer`. El enlace inferior y la respuesta de su formulario llevan a la tarjeta inferior. Los mensajes se limitan al formulario correspondiente. Los demás pies públicos mantienen su tarjeta original. Se conservan el consentimiento obligatorio, la confirmación por correo, la baja y el cierre con `LEGAL_READY=false`.

La sección de precio presenta primero el proceso de solicitud y después el recuadro de la oferta, en una columna centrada tanto en ordenador como en móvil. La aceptación continúa sin confirmar un pago ni permitir el acceso al aula.

Comprobación de la revisión actual: 30 pruebas de aplicación, 19 de base de datos y RLS, tipos de 86 archivos, construcción y 30 comprobaciones HTTP de producción superadas. El análisis educativo y empresarial, las alternativas editoriales y las condiciones pendientes están en `editorial-publication.md`. La captación real y los pagos siguen desactivados.

Se comprobaron en navegador los dos formularios con una dirección de ensayo: cada uno devuelve al ancla correspondiente y muestra una sola respuesta de servicio cerrado. No hay identificadores duplicados. Footer y biografía revisados en móvil y ordenador; «La Mirada» mantiene lectura sin acceso flotante. No se enviaron correos ni se guardaron contactos reales.

## Dirección visual y contraste

- Antetítulo: «Escuela Internacional de Neuroeducación Musical». El header muestra solo símbolo y nombre; el footer conserva su descriptor alineado.
- Hero editorial centrado en una columna, con titular grande y «cantando» en cursiva, en tinta oscura sobre blanco, con una franja amarilla baja compartida con otros destacados de portada. Los párrafos preceden a las acciones. Se conserva completa la frase aprobada sobre fichas, superfichas y boletines.
- Paleta actual de interfaz: oscuro cálido del footer, amarillo original `#f8de7e`, blanco y tintes derivados. El amarillo sustituye al verde de contraste en titulares, números, estados, programa, aula y bloque de escuela. El logo original conserva sus colores y sus píxeles. El precio usa los mismos fondos cálidos y textos claros que el footer; sus botones son amarillos.
- La formación presenta el título «Sincroniza música, neurociencia y aprendizaje invisible». Las diez filas, numeradas sin cero inicial, enlazan con sus módulos concretos en el programa público mediante anclas.
- Transiciones del titular de 0,7 segundos y entradas de secciones de 0,6 segundos, con una sola ejecución. No cambian la opacidad ni ocultan contenido; las animaciones solo se habilitan sin preferencia de movimiento reducido. Sin JavaScript permanecen todos los textos y enlaces.
- Las referencias visuales orientan composición, líneas y jerarquía; la paleta procede de la identidad de El Árbol Que Suena.

Esta revisión mantiene newsletter, acceso privado, configuración legal y pagos en su estado anterior. No requiere librerías de animación ni nuevos servicios.

La versión anterior se verificó a 320, 390 y 1366 px, con tipos de 86 archivos, construcción y 30 comprobaciones HTTP correctos. La corrección de paleta posterior conserva la composición, los enlaces y las interacciones; requiere su propia revisión visual. Las comprobaciones parciales de contraste no sustituyen una auditoría completa de accesibilidad.

Corrección de paleta comprobada a 320, 390 y 1366 px, sin desbordamiento horizontal. Botones de hero y precio con el amarillo original `#f8de7e`; precio con fondo `#24211d`, igual al footer. Verde de hojas sobre blanco: 6,23:1; tinta sobre amarillo: 8,61:1; crema sobre oscuro: 14,48:1. Tipos y construcción correctos, sin cambios de lógica que requieran repetir pruebas de base de datos o servicios. Tamaño normal del navegador restaurado.

## Antetítulo y newsletter semanal

El antetítulo se sitúa dentro del bloque del titular, con composición tipográfica de antetítulo y sin la línea horizontal. Se elimina la frase «Formación online para docentes…» bajo los botones. El texto desarrollado comienza por «Vuelve a ser el maestro que siempre quisiste tener», seguido de «Los griegos…» y del cierre «Transforma tu día a día…».

Las dos cajas muestran el texto aprobado «Newsletter semanal para docentes que quieren entender qué ocurre en el aula cuando aparentemente no ocurre nada». Se utiliza caja normal, con tamaño y espaciado legibles, en lugar de la antigua etiqueta corta en mayúsculas. La captación superior ocupa una franja completa con fondo `#2d2924`, el oscuro del recuadro original, y el formulario inferior mantiene su tarjeta. La franja superior participa en la ocultación del acceso flotante para que no se superponga a la newsletter.

## Composición centrada y ritmo de lectura

Hero y precio pasan a una columna centrada. Después de las acciones del hero aparece el aviso aprobado de enero de 2027, veinte docentes y edades de 0 a 6 años, con enlace directo a la captación superior. Se actualiza la respuesta de organización del curso para distinguir el mes anunciado del calendario detallado pendiente; las fechas de apertura del aula no se modifican.

Las secciones comparten `--home-section-space`: entre 88 y 112 px por lado en ordenador y 72 px en móvil, incluido el footer de la portada. La newsletter superior utiliza «Una pausa de pensamiento y aprendizaje lento a la semana, sin ruido.» y su nueva explicación. Quiénes somos conserva los dos párrafos solicitados sobre Azahara y la escuela; su composición editorial actual combina identidad amarilla y texto sobre fondo claro. Su trayectoria ampliada permanece en la página de la escuela.

Las filas del programa tienen 40 px de espacio vertical por lado en ordenador y 32 px en móvil; los títulos se desplazan 8 px con ratón o foco, solo sin preferencia de movimiento reducido. Se retiran el cierre «en tu práctica docente», la frase bajo los módulos y la referencia geográfica de este bloque. Los subrayados decorativos introducidos en esta revisión se han retirado a petición de la escuela.

Validación: tipos de 86 archivos sin errores, advertencias ni indicaciones y construcción correcta. Revisión visual en 1366, 390 y 320 px, sin desbordamiento horizontal ni identificadores duplicados. El navegador confirma la igualdad de espaciado en las siete secciones, el orden de hero y precio, los dos párrafos de escuela y los diez números sin cero inicial. El foco por teclado produce el desplazamiento de 8 px en el primer módulo; el enlace del aviso lleva a la newsletter. Formularios, acceso privado, servicios y cobros no cambian.

## Identidad de la escuela y recorrido de admisión

Se retiran los subrayados decorativos y se conserva la identificación de los enlaces. El aviso bajo las acciones del hero pasa de 16 a 13,12 px, con 1,8 de interlineado. Los diez títulos del catálogo comparten mayúscula inicial en cada palabra también al consultar el programa o el aula; en portada crecen de 28,8 a unos 36,9 px en un viewport de 1366 px, y de 24,8 a al menos 28,8 px en móvil.

Quiénes somos presenta el nombre y el párrafo sobre Azahara sobre amarillo, junto al segundo párrafo en serif grande sobre fondo claro. Las cursivas destacan detenerse, escuchar y pensar. Se mantienen las palabras aprobadas, sin añadir imágenes ni credenciales. En móvil ambos bloques se apilan.

El proceso previo al precio utiliza una lista ordenada con tres números destacados y conectados por una línea: Tu Solicitud, Nuestra Respuesta y Tu Matrícula. La conexión pasa a vertical en móvil. Los títulos no alteran las condiciones: la aceptación sigue sin confirmar plaza, pago o acceso al aula. No se activan cobros.

Validación de esta revisión: 86 archivos sin errores, advertencias ni indicaciones; construcción correcta. Portada revisada en navegador a 1366, 800, 390 y 320 px, sin desbordamiento horizontal. Se verifican los dos párrafos de escuela, los tres pasos, el nuevo tamaño del aviso y los diez títulos. La navegación del sexto módulo sigue apuntando a su ancla del programa. No hay cambios de autorización ni de servicios que requieran repetir pruebas de base de datos.

## Amarillo, controles y SEO técnico

El único acento de interfaz pasa a ser el amarillo del botón Solicitar Plaza. Sobre superficies claras se combina con tinta `#24211d`, con contraste calculado de 12,01:1 sobre `#f8de7e`; no se utiliza amarillo claro como texto sobre blanco. Se neutralizan los tonos verdosos de tinta, líneas y estados, incluido el aula de revisión. Se conserva el logo original. Los botones y campos comparten `--control-radius:2px`, que reproduce la referencia actual de Solicitar Plaza. Los controles de newsletter abandonan la píldora, las mayúsculas espaciadas y la sombra luminosa; mantienen su superficie clara y etiquetas accesibles. Las cajas de contenido y los números del recorrido conservan sus formas propias.

La revisión del programa corrige títulos pequeños, numeración con cero inicial y un aviso genérico de fechas, ahora coherentes con portada. Se detectó además una descripción de módulo en una columna móvil de 30 px; debe ocupar la segunda columna bajo el título. Los estados de solicitud y newsletter mantienen un destino válido para Saltar al contenido.

Cambios de SEO implementados:

- Canonical absoluto en el origen `site` de Astro, sin parámetros ni fragmentos. Se separa de `PUBLIC_SITE_URL`, que puede seguir siendo local para accesos y correos de ensayo.
- Títulos y descripciones diferenciados en las cinco páginas principales; un H1 por página. URLs antiguas con redirección permanente y normalización de barra final en páginas de búsqueda.
- Datos JSON-LD de EducationalOrganization, WebSite y WebPage; Course en el programa, limitado a información confirmada. Sin estrellas, acreditaciones, fechas precisas o condiciones de compra inventadas.
- Metadatos Open Graph completos e imagen social de 1200 × 630, regenerada desde su fuente SVG con la paleta actual y el nombre sin punto final.
- `robots.txt` permite leer las directivas noindex. El sitemap incluye solo las cinco páginas principales y artículos publicados; no lista un blog vacío, borradores, formularios, cuentas, avisos legales pendientes o rutas de ensayo. No se inventa lastmod.
- Indexación desactivada por defecto mediante `SEO_INDEXING_ENABLED=false`; exige activación y coincidencia del origen HTTPS canónico. Localhost y despliegues de revisión devuelven noindex. Los estados con tokens conservan sus cabeceras más restrictivas, el acceso privado y no-referrer.

Antes de indexar la publicación definitiva: resolver la revisión histórica de seguridad y completar las condiciones legales; validar HTTPS y la redirección del dominio sin www al canónico en el alojamiento elegido; comprobar que el proxy conserva el origen correcto; activar `SEO_INDEXING_ENABLED=true` en compilación y servidor; verificar canonical, robots y sitemap en ese dominio, dar de alta Search Console y enviar el sitemap. Medir Core Web Vitals y PageSpeed en el alojamiento definitivo. Las pruebas locales no son una medición de rendimiento de producción ni garantizan posiciones de búsqueda.

La documentación de referencia es [Google Search Central sobre canonicals](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls), [sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) y [noindex](https://developers.google.com/search/docs/crawling-indexing/block-indexing).

Posibles animaciones siguientes, propuestas y aún sin implementar:

| Detalle | Tratamiento propuesto | Condición |
| --- | --- | --- |
| Cambio entre páginas públicas | View Transitions nativas, unos 180 ms, con continuidad de la marca | Mejora progresiva; navegación normal sin soporte y sin efecto con movimiento reducido |
| Escuela | Desplazamiento de 6–8 px por bloque con un desfase de unos 80 ms | Una vez por entrada; textos visibles desde el primer momento |
| Recorrido de admisión | Trazado de la línea de conexión mediante transform:scale, unos 450 ms | Animar el adorno, conservar siempre visibles números y explicaciones |
| Controles | Respuesta de presión y flechas, 120–180 ms | Ratón y teclado; sin cambiar posición de botones, tamaño de texto ni foco |

Priorizar transiciones nativas y la línea de los pasos. Usar CSS y el observador existente; sin librerías, scroll secuestrado, parallax, desenfoque de lectura ni efectos en bucle. [MDN documenta View Transitions](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API); [web.dev recomienda transform y opacity para evitar trabajo de layout en animaciones](https://web.dev/articles/animations-guide). Su coste real debe medirse al implementarlas.

Verificación de esta revisión: 36 pruebas de aplicación y 44 comprobaciones HTTP de producción correctas, con servicios desactivados; 90 archivos de Astro/TypeScript sin errores, advertencias ni indicaciones. Las nuevas comprobaciones cubren el origen canónico, parámetros, metadatos, un H1, JSON-LD, sitemap, robots, redirecciones, errores y exclusión de cuentas. La activación de indexación en el origen canónico se comprueba como función local; no se ha activado ni probado sobre un dominio remoto.

Revisión visual en 1366, 800, 390 y 320 px. Sin identificadores duplicados, desbordamiento horizontal ni errores de consola en las pantallas observadas. Radio calculado de 2 px en botones y campos de portada y solicitud. La descripción del programa móvil mide 289 px en la vista de 390 px frente a los 30 px previos. La imagen social se revisa visualmente tras regenerar el SVG. No se han cambiado permisos, políticas de base de datos o servicios externos; no se repiten las pruebas de RLS para esta modificación. Quedan pendientes las mediciones de rendimiento y validación del alojamiento definitivo, incluidas las imágenes de marca y la caché de recursos.

## Subrayado de cantando y edición de enero

Se retira el rectángulo amarillo de «cantando». La alternativa de amarillo como color de letra sobre blanco tiene un contraste de 1,33:1, insuficiente incluso para el titular grande; se elige la alternativa autorizada de texto oscuro y subrayado amarillo. La onda introducida inicialmente se sustituye por un subrayado CSS recto de 3 px, con separación de 0,16 em respecto al texto. Se retiran el SVG y la animación de amplitud; no se añaden recursos ni librerías.

El recuadro pasa a mostrar «Precio Exclusivo Edición Enero 2027», «390 €», «En Mayo 2027 sube a 490 €» y «Limitado a 20 plazas» debajo de Solicitar Plaza. Se mantienen las constantes de precio y aforo. El mes indicado no programa un cambio automático de tarifa ni activa cobros.

Validación de la versión anterior con onda: 90 archivos sin errores, advertencias ni indicaciones y construcción correcta. El ajuste posterior al subrayado recto se revisó a 1366 y 390 px, sin desbordamiento horizontal. Se conserva el titular accesible «Tú también aprendiste cantando». No intervienen API, datos ni cobros.

## Jerarquía del hero y destacados compartidos

El aviso bajo los botones se divide en cuatro líneas lógicas: próxima edición con «Enero 2027» en negrita, aforo, edades y newsletter. Se permite el ajuste natural de las líneas largas en móvil. Se conservan las palabras y el tamaño reducido aprobados por la escuela.

«Transforma tu día a día en el aula con herramientas musicales que impulsan el aprendizaje» pasa a seminegrita, tinta oscura y un ancho de lectura más contenido. Los botones se acercan a esta frase para que formen una unidad de mensaje y acción.

La línea fina de «cantando» se sustituye por una franja amarilla en la parte baja del texto, definida una sola vez en `editorial-accent`. Se comparte con «escuchar», «y aprendizaje invisible» y «tus dudas», en las secciones claras. Se retiran los fondos que cubrían la altura completa de las frases y se reduce de tres a una la palabra destacada en el texto de la escuela. Los paneles de color, botones y secciones oscuras conservan su jerarquía. El acento es estático, no añade recursos ni JavaScript y mantiene el texto oscuro.

Validación: tipos de 90 archivos sin errores, advertencias ni indicaciones y construcción correcta. Revisión en navegador a 1366, 390 y 320 px, sin desbordamiento horizontal ni errores de consola. Se confirman cuatro líneas lógicas en el aviso, peso 600 en la fecha y el mensaje previo a los botones, y un único estilo compartido por los cuatro acentos. Se revisan el hero, la escuela, el programa y las preguntas frecuentes; no cambian formularios, servicios ni permisos.

## Unidad visual y arquitectura de navegación

La portada aprobada proporciona el lenguaje del resto del proyecto. `editorial.css` reúne el destacado amarillo, ritmo vertical, títulos, paneles y formularios; Layout distingue páginas informativas, pasos centrados en una tarea y espacios académicos. Se mantienen tipografías autoalojadas, controles de 2 px y contenido visible sin JavaScript. No se añaden dependencias, imágenes protagonistas ni animaciones de entrada que oculten contenido.

| Página o espacio | Función y siguiente paso |
| --- | --- |
| Portada | Presentación breve → Solicitar Plaza / Ver El Programa; dos captaciones de newsletter |
| Programa | Oferta y admisión visibles antes de los diez módulos; invitación al final y newsletter como alternativa |
| La Escuela | Identidad de Azahara y mirada educativa → programa o solicitud; se sustituye el monograma de relleno por un panel editorial |
| Nuestra Mirada | Argumento educativo, límites de la evidencia y referencia verificable → programa o solicitud |
| Contacto | Canal de consulta y acceso directo a la admisión; newsletter del footer |
| Solicitud | Formulario primero en móvil, condiciones claras, consentimiento independiente; sin otra newsletter ni menú comercial |
| Acceso / seguimiento | Una tarea principal; ayuda y legales disponibles. El seguimiento sin matrícula no ofrece enlaces académicos en el footer |
| Confirmación / baja de newsletter | Preferencias y acción solicitada, sin nuevo formulario de captación ni presión para volver a suscribirse |
| Legales / cuaderno / 404 | Tipografía y espaciado compartidos, navegación útil de retorno y newsletter. El cuaderno vacío no se promociona en los menús |
| Aula y administración | Misma paleta y controles, densidad de trabajo propia, navegación única lateral/desplegable; sin captación comercial |

`CourseInvitation.astro` reutiliza una oferta única: enero de 2027, 390 €, 490 € desde mayo de 2027, diez módulos y hasta veinte docentes. El programa y la solicitud conservan la revisión humana y aclaran que solicitar o ser aceptado no equivale a pagar ni a obtener acceso. No se programan fechas detalladas de apertura.

El acceso flotante móvil se oculta al ver cualquiera de los botones principales, newsletter o footer, y al editar campos. Se extiende a escuela y contacto; la lectura metodológica conserva su ritmo sin barra flotante. El menú marca La Escuela también dentro de Nuestra Mirada. Los enlaces legales del consentimiento y la referencia externa se abren en otra pestaña con indicación accesible; conservan el formulario o la lectura de origen.

Se comprueban automáticamente destinos internos y fragmentos, identificadores duplicados, H1, páginas de estado, redirecciones antiguas y protección del aula. El rastreo se ejecuta desde `test:http` contra una construcción local con credenciales vacías; no envía formularios ni consulta servicios reales. La única referencia externa pública, la revisión de ciencia cognitiva de la EEF, responde y se verifica por separado. `mailto:` se valida como enlace; no acredita que el buzón exista o reciba mensajes.

La revisión académica visual usa únicamente `/vista-previa`, bloqueado en producción. No acredita acceso de cuentas reales, entrega de correos, descarga de materiales privados remotos, videollamadas ni pagos. La titularidad, los textos legales definitivos, el buzón de contacto y Resend siguen pendientes de confirmación o configuración. Captación real, indexación y cobros permanecen cerrados.

Validación final: 92 archivos Astro/TypeScript sin errores, advertencias ni indicaciones; 36 pruebas de aplicación correctas y construcción de servidor completada. Las 44 comprobaciones HTTP pasan, incluido el nuevo rastreo de 68 destinos internos y anclas en 34 páginas/estados. Se comprueban enlaces de confirmación con tokens sintéticos, errores de proveedor y baja sin realizar envíos. No hay cambios de migraciones, permisos o políticas; no se repiten las pruebas de RLS.

En navegador se recorren los 39 destinos distintos de la demostración, incluidos diez módulos, diez cuestionarios, estados de admisión y pestañas de administración. Revisión responsive en 1280, 800, 390 y 320 px, sin desbordamientos en las pantallas observadas. Se prueban apertura/selección del menú de gestión móvil y apertura/cierre con Escape del menú público, con devolución de foco. No aparecen errores o advertencias de consola. La inspección visual corrige el corte del correo de contacto y una regla de párrafos que reducía indebidamente el precio del nuevo bloque de invitación. El precio recupera su tamaño de exposición y tinta oscura; los controles conservan 2 px. Las capturas de escuela, programa y solicitud móvil quedan en la carpeta local de outputs de la revisión.

## Página institucional y simplificación del bloque común · 2 de noviembre de 2026

La página de la escuela pasa a `/escuela-internacional-neuroeducacion-musical`. Se actualizan enlaces públicos, menú y estado activo, captación móvil, mapa de revisión, páginas canónicas de búsqueda, título y descripción. La URL `/azahara-mateos` redirige con 301 a la nueva y conserva los parámetros de campaña; se comprueban también su variante con barra final y la exclusión de la antigua dirección del sitemap.

El encabezado presenta «Música, vínculo y primera infancia», «Una escuela para docentes que quieren impacto real y sensibilidad» y los dos párrafos facilitados por la escuela, con las tildes correspondientes. Conserva un único H1 y un destacado amarillo selectivo en «sensibilidad».

Se retira de metodología el párrafo público «Para profundizar» con la referencia de la EEF y sus estilos sin uso. Las fuentes de trabajo editorial permanecen en la documentación interna. `CourseInvitation.astro` simplifica su oferta a precio, «Precio exclusivo Enero 2027.», «Mayo 2027 sube a 490 €.» y un solo botón Solicitar Plaza. Se eliminan de ese recuadro el enlace secundario y la nota posterior. La solicitud sigue explicando la revisión humana y que el envío no confirma un pago ni una matrícula.

Validación: 93 archivos sin errores, advertencias ni indicaciones; construcción y 36 pruebas de aplicación correctas. Pasan 46 comprobaciones HTTP y 68 destinos/anclas en 34 páginas/estados, con el servidor de ensayo sin servicios configurados. Las nuevas comprobaciones cubren la redirección 301, conservación de parámetros, exclusión de la URL antigua del sitemap y ausencia de enlaces internos al alias. Revisión visual a 1280, 390 y 320 px: un H1, textos actualizados, una sola acción en la oferta y ningún desbordamiento en las pantallas afectadas; sin errores de consola. Se restablece el viewport normal tras la revisión.
