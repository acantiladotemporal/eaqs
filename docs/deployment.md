# Publicación de la escuela

## Decisiones y alcance

El 2 de noviembre de 2026 la escuela autorizó publicar el proyecto y retirar PocketBase, ya obsoleto. Tras comprobar que Vercel usa Hobby, eligió priorizar coste cero y evaluar Cloudflare. GitHub sigue siendo `acantiladotemporal/eaqs`; la producción preferida es Cloudflare Workers dentro de las cuotas gratuitas, sin activar planes de pago.

La copia de trabajo sigue en `D:\El Árbol Que Suena`. `main` será la referencia de publicación. Los originales de `img/`, `.codex/`, los entornos locales, los paquetes construidos y `work/` no se publican en Git.

## Construcción reproducible

- `npm ci`: instala el lockfile.
- `npm run verify`: pruebas de aplicación y PostgreSQL/RLS, tipos, servidor Node y límites HTTP; utiliza datos y credenciales de ensayo.
- `npm run build:release`: pruebas de aplicación/RLS, tipos y construcción Cloudflare con inspección del resultado.
- `npm run build:cloudflare`: construcción del Worker mediante el adaptador oficial; no publica.
- `npm run check:cloudflare`: revisa entrada, recursos, compatibilidad Node, configuración cerrada y ausencia de almacenamiento adicional.
- `npm run check:release`: revisa archivos que se incorporarían a Git y patrones de credenciales sin mostrar valores. No constituye una auditoría exhaustiva de secretos.
- `npm run deploy:cloudflare`: publica el resultado Cloudflare previamente construido en la cuenta autorizada mediante Wrangler.

El adaptador local predeterminado sigue siendo Node para permitir desarrollo y comprobaciones independientes de la nube. El script de construcción establece `EAQS_BUILD_TARGET=cloudflare`. Las sesiones de Astro están deshabilitadas: la identidad utiliza cookies de Supabase. No se crean KV, D1, imágenes de pago ni otros recursos adicionales.

El emulador nativo `workerd` falla en este ordenador Windows con una infracción de acceso. La opción oficial `prerenderEnvironment: 'node'` permite construir sin modificar Windows; no acredita por sí sola la ejecución del Worker. La validación del Worker se hará sobre su dirección de Cloudflare, con la configuración cerrada y solicitudes GET de ensayo, antes de conectar el dominio. `EAQS_WORKER_TEST_URL=<origen workers.dev> npm run test:worker` verifica ese recorrido y no envía formularios.

## Estado funcional de la primera publicación

`LEGAL_READY`, `SEO_INDEXING_ENABLED` y `NEWSLETTER_MARKETING_ENABLED` permanecen en `false`; pagos cerrados en código. Los bindings de Supabase se dejan vacíos en la primera publicación. Un binding vacío en ejecución prevalece sobre una clave publicable compilada en el desarrollo local. No copiar las variables históricas del proyecto Vercel: pertenecen a una integración anterior y su alcance no ha sido validado para esta aplicación.

La publicación sirve para revisar y ajustar la web. Captación real, correos, sesiones de alumnado, materiales y cobros requieren completar la configuración de la escuela y sus pruebas. La interfaz privada de demostración no existe en la construcción de producción.

## Git y retirada de PocketBase

`scripts/prepare-clean-history.mjs` crea una copia Git local saneada y un bundle de recuperación dentro de `work/`, sin alterar el checkout ni el remoto. Filtra `pb_data`, `pb_migrations`, el ejecutable, el log antiguo y los entornos de ejecución. Verifica que el árbol del nuevo proyecto no cambia y que los objetos históricos retirados dejan de ser alcanzables. No publicar el bundle.

Antes de actualizar `main`, comprobar el SHA remoto esperado y utilizar una actualización con lease. Conservar el código y los metadatos útiles de los commits antiguos; cambian sus identificadores al retirar los archivos. La escuela autorizó esta retirada; no se revocan credenciales ni se afirma haber eliminado copias de terceros o cachés de GitHub. Ver `security-review.md`.

## Dominio y cambios siguientes

Conectar `www.elarbolquesuena.com` solo después de validar el Worker. Añadir la redirección del dominio raíz al canónico al incorporarlo. Mantener los nameservers de Cloudflare y los registros de correo ajenos a la web. Verificar resolución DNS, certificado, HTTPS y el contenido servido después de conectar.

Antes de cada actualización: revisar el diff, ejecutar las comprobaciones afectadas, subir el commit y desplegar el artefacto Cloudflare correspondiente. Registrar el identificador de versión para poder usar `wrangler rollback`. La integración automática de Git se considera operativa únicamente cuando Cloudflare confirme el enlace al repositorio y la rama `main`; una publicación por CLI no acredita esa conexión.

## Publicación efectuada: 2 de noviembre de 2026

- GitHub `main` actualizado. La implementación saneada se publicó como `4676033`, seguida de los ajustes de construcción `616e18d` y la conexión de dominios preparada en `065183b`.
- Worker publicado en `https://www.elarbolquesuena.com` y comprobado también en `https://eaqs.elarbolquesuena-web.workers.dev`. Primera versión con ambos dominios: `4ffb6c62-c0a9-4337-be28-5848728d820e` (`065183b`). La versión anterior es `d78d3f7e-2f7a-4107-81d2-a60ded5cf9e3`, con el mismo código y sin los dominios conectados todavía.
- El Worker supera 17 comprobaciones remotas de solo lectura y el rastreo de 68 enlaces/anclas en 34 páginas/estados. También se revisaron portada y navegación móvil en navegador, sin desbordamiento horizontal a 390 px. Estas pruebas no envían formularios ni acreditan servicios de correo, acceso de alumnado o cobros reales.
- Zona `elarbolquesuena.com` activa y verificada en la misma cuenta del Worker. Ambos dominios quedaron conectados después de guardar los dos registros web antiguos desde el panel y sustituirlos por los de Workers. Los once registros restantes, incluidos MX, mail y TXT, se conservaron. La copia local de recuperación de los destinos web está en `work/cloudflare-web-dns-recovery.json`, excluida de Git.
- HTTPS y contenido comprobados en `www`; la raíz devuelve 308 a HTTPS `www`, conservando rutas y parámetros. En el dominio definitivo pasan 18 comprobaciones de solo lectura y los 68 enlaces/anclas. La validación usa TLS normal; no se omiten errores de certificado.
- La escuela autorizó la aplicación GitHub de Cloudflare y conectó el Worker existente `eaqs` con `acantiladotemporal/eaqs`. Se guardaron rama `main`, raíz `/`, construcción `npm run build:release` y publicación `npm run deploy:cloudflare`. `.node-version` fija la línea Node 24. La prueba de esta conexión consiste en comprobar que el siguiente commit genera una construcción y despliegue correctos. El token de compilación lo gestiona Cloudflare; el OAuth local no se traslada a GitHub.
- Vercel conserva su configuración anterior. No se activó Pro ni se pausaron sus construcciones; Cloudflare es el alojamiento elegido por la escuela. La dirección `eaqs.vercel.app` no acredita esta publicación.

Captación, indexación, backend y pagos continúan desactivados. No se ha contratado ningún plan de pago.

## Recuperación

Para volver a un código anterior, consultar `npx wrangler deployments list` y `npx wrangler versions list`, elegir la versión comprobada y ejecutar `npx wrangler rollback <version-id>`. Revisar su confirmación y comprobar después el dominio con `EAQS_WORKER_TEST_URL=https://www.elarbolquesuena.com npm run test:worker`. El rollback de código no sustituye una copia de los datos ni revierte DNS o cambios de esquema. Los despliegues de GitHub pueden actualizar de nuevo producción: coordinar la reversión con `main` antes del siguiente push.

Si fuera necesario recuperar el alojamiento web anterior, la copia local contiene los valores exactos de los registros A raíz y CNAME www que se sustituyeron. Esta operación requiere retirar primero la vinculación de dominios personalizados del Worker y recrear únicamente esos dos registros; no importar registros de correo ni modificar los nameservers. No restaurar los archivos históricos de PocketBase en el repositorio.

## Comprobaciones previas completadas

La comprobación local pasa con 37 pruebas de aplicación, 19 comprobaciones SQL/RLS, 100 archivos sin errores/advertencias/indicaciones y 49 comprobaciones HTTP, incluidas las redirecciones mediante un proxy HTTPS de ensayo. El rastreo cubre 68 destinos y anclas en 34 páginas/estados. La construcción Cloudflare se ha completado con el prerenderizador Node; su entrada, recursos, flags cerrados y ausencia de aprovisionamiento adicional se han comprobado. El contenido y el dominio se verificaron también sobre el Worker remoto, como se detalla arriba.

La historia saneada contiene los 14 commits originales filtrados y el commit de implementación. Se conserva el mismo árbol de archivos de la implementación y no quedan rutas de PocketBase ni del log retirado alcanzables desde esa historia. El bundle local de recuperación tiene acceso restringido al usuario de Windows, administradores y sistema, y permanece excluido de Git. No se han revocado credenciales ni se afirma haber purgado cachés de GitHub o copias de terceros.

Referencias: [adaptador oficial de Astro](https://docs.astro.build/en/guides/integrations-guide/cloudflare/), [cuotas de Workers](https://developers.cloudflare.com/workers/platform/pricing/) y [dominios de Workers](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/).
