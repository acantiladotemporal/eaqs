# Publicación de la escuela

## Decisiones y alcance

El 2 de noviembre de 2026 la escuela autorizó publicar el proyecto y retirar PocketBase, ya obsoleto. Tras comprobar que Vercel usa Hobby, eligió priorizar coste cero y evaluar Cloudflare. GitHub sigue siendo `acantiladotemporal/eaqs`; la producción preferida es Cloudflare Workers dentro de las cuotas gratuitas, sin activar planes de pago.

La copia de trabajo sigue en `D:\El Árbol Que Suena`. `main` será la referencia de publicación. Los originales de `img/`, `.codex/`, los entornos locales, los paquetes construidos y `work/` no se publican en Git.

## Construcción reproducible

- `npm ci`: instala el lockfile.
- `npm run verify`: 36 pruebas de aplicación, 19 comprobaciones PostgreSQL/RLS, tipos, servidor Node y límites HTTP; utiliza datos y credenciales de ensayo.
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

Referencias: [adaptador oficial de Astro](https://docs.astro.build/en/guides/integrations-guide/cloudflare/), [cuotas de Workers](https://developers.cloudflare.com/workers/platform/pricing/) y [dominios de Workers](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/).
