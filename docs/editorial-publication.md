# Revisión crítica y preparación de El Árbol Que Suena

Revisión del 1 de noviembre de 2026. Alcance: código y documentación locales, páginas públicas, recorridos ilustrativos y pruebas de aplicación y permisos. La valoración educativa y empresarial contiene propuestas, no resultados observados de una cohorte. No constituye una auditoría de los servicios remotos ni una acreditación del curso.

## Criterio de la escuela

La escuela quiere ofrecer tiempo para detenerse, escuchar y pensar la práctica docente. Su valor debe hacerse visible en experiencias musicales, acompañamiento y decisiones educativas concretas. El silencio convive con el canto, el movimiento y las distintas formas de participar; no sirve para clasificar al alumnado como más o menos dispuesto a aprender.

Decisiones de producto coherentes con esa intención:

- Lectura y navegación libres, sin audio automático, ventanas de salida, falsas cuentas atrás ni obligación de dejar el correo para consultar el programa.
- Dos invitaciones a la newsletter, después del hero y en el footer, con consentimiento informado, confirmación y baja sencilla.
- Navegación del aula centrada en continuar la formación. El progreso indica participación; no se utiliza como competición entre docentes.
- Proponer una observación, una práctica y una revisión por módulo; evitar acumular actividades como si la cantidad probara el aprendizaje. Este diseño debe concretarse al preparar el contenido.
- Mantener diferenciados tiempo de acceso a materiales, calendario de apertura y duración del acompañamiento. No prometer tutorías perpetuas por utilizar «acceso permanente».

## Hallazgos prioritarios

| Prioridad | Hallazgo | Consecuencia y siguiente acción |
| --- | --- | --- |
| Antes de publicar | Persisten archivos de ejecución sensibles en el historial original de Git | Seguir el procedimiento de `security-review.md`. La limpieza de la copia actual no resuelve el historial. Coordinar alcance, credenciales y recuperación antes de publicar. |
| Antes de captar | Faltan clave privada del servidor y configuración de correo; `LEGAL_READY=false` | Los formularios pueden revisarse, pero no captan suscripciones reales. Completar titularidad, privacidad, dominio de correo y prueba propia de confirmación y baja antes de activar. |
| Antes de ofrecer una matrícula real | Duración, dedicación, tutorías y calendario detallado sin confirmar; la escuela anuncia enero de 2027 como próxima edición | Convertir la oferta en una ficha de condiciones concreta. No deducir días ni aperturas de módulos del mes anunciado. No rellenar huecos con cifras inventadas. |
| Antes de enseñar | Los módulos carecen todavía de un catálogo definitivo publicado | Revisar lecciones, materiales, bibliografía, accesibilidad, derechos y trabajo final. La pantalla de ejemplo no acredita contenido grabado. |
| Alta | Títulos de módulos poco informativos para quien compra | Mantener los diez módulos y acompañarlos de objetivos, práctica y evidencia esperada. Definir «Neurofonía» antes de presentarlo como un concepto establecido. |
| Revisado por la escuela | El hero utiliza una interpelación directa | La escuela ha sustituido «Y tú imprimes superfichas recicladas» por «Y tú, entre fichas, superfichas y boletines, te pierdes lo importante». Mantener su decisión editorial y revisar la recepción con docentes reales. |
| Alta | La certificación y la experiencia profesional pueden confundirse con acreditaciones externas | El certificado sigue siendo propio. Publicar solo las titulaciones, entidades, créditos o reconocimientos que puedan documentarse. |
| Alta | Acceso permanente y grupo de veinte personas tienen costes de servicio | Calcular mantenimiento, vídeo, tutorías, moderación, revisión de trabajos y soporte antes de decidir condiciones y margen. |
| Antes de abrir el aula | Falta verificar Auth, SMTP, archivos y restauración en los servicios reales | Las pruebas locales de RLS y HTTP son necesarias, pero no acreditan esos servicios. Usar cuentas de ensayo y materiales de prueba cuando estén configurados. |

La comprobación local de configuración solo imprimió presencia o ausencia de variables, nunca sus valores: URL y clave publicable disponibles; credenciales privadas y de correo pendientes; captación legal, marketing y pagos desactivados.

## Mejoras aplicadas durante esta revisión

- Restaurada la newsletter del footer, conservando la tarjeta superior. Secciones, campos, etiquetas y títulos tienen identificadores diferenciados.
- La respuesta de suscripción se muestra en el formulario correspondiente. El formulario inferior devuelve a `#newsletter-footer`; el superior a `#newsletter`. El origen recibido no puede convertirse en una redirección externa.
- Consentimiento de la newsletter más claro sobre ideas y novedades de las formaciones. La suscripción opcional de la solicitud mantiene su independencia de la admisión.
- Corregido el mensaje que corresponde al límite de intentos del formulario de solicitud: el servidor devuelve `rate` y la página solo contemplaba `rate_limit`.
- Incorporada la experiencia confirmada por la escuela: Azahara Mateos es pianista, violonchelista, profesora de música y musicoterapeuta, con veinte años de experiencia. Esta información procede de la escuela; no se han añadido instituciones ni titulaciones.
- La página de la escuela prioriza el texto y la biografía en móvil; el monograma decorativo deja de ocupar la primera pantalla.
- Ampliada la página «La Mirada» con presencia, distintas formas de participación, significado de «aprendizaje invisible» y límites de la interpretación educativa. La portada conserva su estructura breve.
- El acceso flotante a la solicitud queda limitado a portada y programa. En las páginas dedicadas a la escuela y la metodología se mantiene la navegación ordinaria.

## Rigor educativo: qué prometer y cómo demostrarlo

La expresión «aprendizaje invisible» puede servir para explicar procesos que no producen una respuesta inmediata. Debe acompañarse de observaciones y preguntas; un niño callado no demuestra por sí solo que esté aprendiendo ni que no lo esté.

La dopamina participa en procesos de aprendizaje y predicción de recompensas. Convertirla en un enemigo general de la educación simplificaría la propia base científica que se quiere cuidar. La recomendación de diseño es proteger la atención y la autonomía mediante funciones concretas, sin prometer modificar neurotransmisores. Esta aplicación al producto es una decisión de diseño, no una conclusión experimental sobre esta escuela. [Schultz, Dayan y Montague, 1997](https://pubmed.ncbi.nlm.nih.gov/pubmed/9054347/).

La investigación sobre formación musical no permite prometer una mejora automática y general de inteligencia o rendimiento académico. Una revisión de transferencia a resultados cognitivos y académicos encontró efectos próximos a cero en los diseños más exigentes; eso no equivale a negar el valor artístico, musical, expresivo o social de la experiencia. Evitar anunciar efectos generales como resultado asegurado de este curso. [Sala y Gobet, 2020](https://pmc.ncbi.nlm.nih.gov/articles/PMC7683441/).

La traducción de ciencia cognitiva al aula depende de edad, contexto, tarea y condiciones de aplicación. Una referencia escolar general no valida por sí sola una propuesta para bebés ni todos los contextos de 3–6 años. Registrar también los límites de cada fuente. [EEF, revisión de ciencia cognitiva y aula](https://educationendowmentfoundation.org.uk/education-evidence/evidence-reviews/cognitive-Science-approaches-in-the-classroom).

Para España, el programa puede relacionar sus propuestas con el área de comunicación y representación: voz, cuerpo, objetos, canciones, escucha, sonido y silencio. Esa correspondencia curricular no concede homologación ni certificación oficial. Para Latinoamérica habrá que contextualizar cada referencia nacional. [Real Decreto 95/2022, enseñanzas mínimas de Infantil](https://www.boe.es/buscar/act.php?id=BOE-A-2022-1654).

### Ficha propuesta para cada uno de los diez módulos

1. Una decisión docente que se quiere poder tomar al finalizar.
2. Una experiencia musical concreta, con variantes para 0–3 y 3–6 cuando proceda.
3. Dos o tres aspectos observables, descritos sin interpretar intenciones ni diagnosticar.
4. Una explicación del fundamento, identificando evidencia, hipótesis y experiencia profesional.
5. Límites y adaptaciones: distintas formas de comunicación, movimiento, acceso al sonido y participación.
6. Una propuesta de aplicación y una pregunta de revisión posterior.
7. Bibliografía seleccionada y derechos de uso de músicas y materiales.
8. Transcripción, subtítulos y alternativa textual para el contenido audiovisual que lo necesite.

Esta es una propuesta para desarrollar contenidos, no una descripción de materiales ya publicados. El módulo final debería integrar el recorrido en un caso y una revisión docente, además de la emisión administrativa del certificado.

La formación de adultos debe incluir oportunidades para volver a lo aprendido, practicar, recibir devolución y revisar decisiones. Los mecanismos recogidos por la EEF orientan el diseño; los ejemplos concretos para esta escuela deben producirse y evaluarse. [EEF, desarrollo profesional eficaz](https://educationendowmentfoundation.org.uk/education-evidence/guidance-reports/effective-professional-development).

### Evidencias que conviene recoger en la primera cohorte

- Una misma situación docente interpretada antes y después del recorrido.
- Una propuesta musical, su adaptación al contexto y la explicación de los cambios realizados.
- Una devolución docente con criterios conocidos, más una oportunidad de revisión.
- Valoración del acompañamiento y dificultades para aplicar lo aprendido.

No presentar satisfacción, finalización del curso o un testimonio como prueba de un cambio cerebral o de efectos generales en niños. No solicitar imágenes, voces ni documentos identificables de menores para demostrar participación. La rúbrica propuesta valoraría observación, fundamento, adecuación al contexto y revisión; sus criterios definitivos siguen pendientes.

## Tono y confianza

La escuela ha ajustado la frase del hero a «Y tú, entre fichas, superfichas y boletines, te pierdes lo importante». Se conserva esa elección. En la revisión previa se plantearon estas dos alternativas:

- Más cercana: «Y a veces, entre tantas actividades, cuesta escuchar lo que ya está ocurriendo.»
- Más incisiva: «¿En qué momento aprender se convirtió en terminar otra ficha?»

La primera evita convertir la pertenencia a la escuela en un juicio sobre quien todavía usa fichas. La segunda mantiene la provocación dirigida a una práctica, con un alcance histórico menos grandilocuente que el párrafo actual. Son alternativas editoriales, no resultados de una prueba de conversión.

La experiencia de Azahara es un argumento de confianza relevante. Conviene completarla, cuando exista documentación, con una biografía concreta, ámbitos de trabajo y un ejemplo real de su manera de acompañar. Una fotografía propia es opcional; no es necesario convertir la portada en una galería de imágenes. No inventar personas, alumnos, centros, testimonios ni resultados para completar el diseño.

## Captación y correo

La repetición de dos formularios ofrece dos momentos para suscribirse. Debe explicar el contenido que se recibirá, incluido el aviso de formaciones, y permitir una decisión libre. La regla general sobre comunicaciones comerciales exige autorización previa, con excepciones legales que no se deben dar por supuestas. La baja debe ser sencilla. [Preguntas frecuentes oficiales sobre la LSSI](https://lssi.digital.gob.es/lssi/la-ley/preguntas-frecuentes).

Propuesta de recorrido editorial, pendiente de redactar y activar:

| Carta | Intención | Una acción |
| --- | --- | --- |
| Bienvenida, después de confirmar | Presentar a Azahara, el enfoque y qué correos se recibirán | Leer «La Mirada» |
| Antes de otra actividad | Compartir una pregunta de observación aplicable | Probarla y responder si se desea |
| Una decisión docente | Mostrar una experiencia real autorizada o una viñeta expresamente ilustrativa | Leer la explicación |
| Así será la formación | Explicar dedicación, acompañamiento y condiciones ya confirmadas | Consultar el programa |
| Próxima edición | Presentar precio, calendario real y proceso de admisión | Solicitar plaza |

La escuela ha confirmado una cadencia semanal para la newsletter, coherente con la referencia semanal de la plantilla de confirmación. Preparar contenido revisado y capacidad editorial antes de activar los envíos; no se ha fijado un día u hora. Evitar una secuencia que siga vendiendo la misma edición a quien ya está matriculado o ha solicitado dejar de recibirla.

Medir confirmaciones, solicitudes cualificadas, matrículas, bajas y respuestas útiles. No hace falta añadir seguimiento invasivo o nuevas plataformas para definir estas métricas. Ninguna campaña se ha enviado ni activado durante esta revisión.

Alternativas para ofrecer valor antes de la matrícula: una carta breve, una experiencia real de muestra o una hoja de observación sencilla. La carta requiere menos producción inicial; las otras dos solo deben anunciarse cuando el contenido exista y esté revisado. No prometer un regalo o una clase que todavía no están disponibles.

## Viabilidad y alternativas de negocio

La primera cohorte es un producto pequeño con acompañamiento. A 390 €, diez matrículas representarían 3.900 €; quince, 5.850 €; veinte, 7.800 €. Son importes brutos de venta antes de impuestos aplicables, devoluciones, cobro, producción, alojamiento y trabajo. No son beneficio ni una previsión de demanda.

Antes de abrir, calcular horas de preparación, tutorías, revisión de cada trabajo, posibles revisiones adicionales, moderación y soporte. Poner por escrito la duración del acompañamiento y el compromiso de respuesta. Comprobar también los derechos de grabación y distribución de repertorios, textos, partituras y vídeos.

| Modelo | Cuándo valorarlo | Ventaja | Condición |
| --- | --- | --- | --- |
| Cohorte acompañada de veinte docentes | Primera edición actual | Cercanía y devolución que pueden distinguir la escuela | Acotar y sostener la carga docente |
| Formación para un centro o equipo | Después de aprender de la primera cohorte | Trabajo sobre un contexto compartido | Oferta y condiciones específicas; no añadirlo ahora al curso inicial |
| Recorrido autónomo con acompañamiento opcional | Después de revisar contenidos y necesidades reales | Mayor flexibilidad de acceso | Separar claramente qué incluye cada modalidad; no cambiar las condiciones prometidas a la primera cohorte |

Recomendación: validar primero la cohorte acompañada y su transferencia a la práctica. Conservar Astro, TypeScript, Supabase y Resend; concentrar el presupuesto en contenidos, acompañamiento, accesibilidad y fiabilidad. La etiqueta «Internacional» debe expresarse mediante acceso y contextualización para docentes de distintos países, sin sugerir avales externos inexistentes.

## Orden para completar la escuela

1. Resolver exposición histórica y titularidad; conservar cerrada la recogida real mientras no esté lista.
2. Completar la ficha de oferta: calendario, duración, dedicación, tutorías, condiciones y alcance del acompañamiento. Integrar la experiencia de Azahara ya confirmada.
3. Terminar una lección real representativa con materiales accesibles, fundamento, práctica y devolución. Revisar antes de extender el patrón a los otros módulos.
4. Completar correo y dominio, consentimiento y preferencias; comprobar una suscripción propia de ensayo, confirmación, baja y fallos. Activar solo cuando corresponda.
5. Validar aula, permisos, catálogo, copias y restauración con cuentas de ensayo en los servicios configurados.
6. Incorporar Redsys y transferencia en la última fase, según banco, contrato y pruebas. Mantener 390/490 €, diez módulos y veinte plazas; no introducir otra pasarela.

La página `/programa` admite impresión. Los tres artículos originales de prueba siguen como borradores y necesitan revisión y fuentes. Antes de publicar siguen pendientes identificación legal del titular, conservación de datos, proveedores, condiciones de acceso permanente, desistimiento, cancelación y devolución. El correo de soporte y los derechos de contenidos deben verificarse.

## Comprobaciones y límites

La verificación local completa ha superado 30 pruebas de aplicación, 19 de base de datos y RLS, tipos de 86 archivos, construcción y 30 comprobaciones HTTP. Las dos nuevas comprobaciones HTTP cubren el destino del formulario inferior y el tratamiento seguro de un origen de formulario no admitido. Se utilizan datos de ensayo y configuración de servicios reales desactivada.

Estas pruebas no acreditan GoTrue, SMTP, entrega de campañas, reproducción de vídeo remota, R2 ni Redsys reales. La captación legal, el marketing y los pagos continúan desactivados. No se ha publicado esta rama, enviado correos, creado cuentas de alumnado ni modificado servicios externos.
