# El Árbol Que Suena

Carpeta local principal: `D:\El Árbol Que Suena`. Los originales de la escuela se conservan en `img/` y no se incluyen en Git.

Web y aula de la Escuela Internacional de Neuroeducación Musical. Primera edición online en español para docentes de 0–6 años, especialmente 3–6: 10 módulos, hasta 20 plazas y 390 € de lanzamiento (referencia posterior: 490 €).

La publicación se prepara desde `main`, conservando Node para desarrollo local y usando Cloudflare Workers como opción preferida por coste cero. Las dos migraciones están instaladas en el Supabase de la escuela, con RLS y buckets privados verificados. Siguen pendientes las claves de servidor, SMTP, sesiones reales, materiales y pagos. El estado de publicación y su procedimiento están en [docs/deployment.md](docs/deployment.md); las verificaciones de datos están en [docs/supabase-verification.json](docs/supabase-verification.json).

## Arranque local

Para recorrer toda la web antes de ajustar el diseño, abrir `http://127.0.0.1:4321/vista-previa` con el servidor de desarrollo activo. Incluye las páginas públicas y pantallas privadas de ejemplo; ver [docs/revision-web.md](docs/revision-web.md).

Requisitos: Node.js 22 LTS desde 22.12 o Node.js 24 LTS y npm. Usar el lockfile versionado; no actualizar paquetes indiscriminadamente. En PowerShell se puede usar `npm.cmd` si la política de ejecución no permite `npm.ps1`.

```powershell
npm ci
Copy-Item .env.example .env
npm run dev
```

El servidor muestra su dirección local, normalmente `http://127.0.0.1:4321`. Las páginas públicas se pueden revisar sin credenciales. Las funciones que dependen de Supabase responden como no disponibles hasta configurar el servicio. No existe un usuario ficticio que conceda acceso al aula.

Mantener `LEGAL_READY=false`: bloquea solicitudes y newsletter reales mientras se completan los datos de titularidad y las políticas. No activarlo para evitar un mensaje de configuración.

## Comprobaciones

| Comando | Finalidad |
| --- | --- |
| `npm run check` | Tipos de TypeScript y componentes Astro |
| `npm test` | Validación, seguridad y contratos de materiales |
| `npm run test:db` | Migración y permisos SQL en PostgreSQL local mediante PGlite |
| `npm run build` | Comprobación de tipos y construcción de producción |
| `npm run verify` | Pruebas de aplicación, base de datos y construcción |
| `npm run dev` | Desarrollo con recarga local |
| `npm run preview` | Arranque del servidor Node construido en `dist/` |

En entornos restringidos, puede establecerse `ASTRO_TELEMETRY_DISABLED=1` para que la CLI no intente guardar configuración de telemetría fuera del proyecto.

Las pruebas SQL recrean el contrato mínimo de Auth y Storage; no sustituyen pruebas del stack completo de Supabase, SMTP, Storage HTTP o servicios remotos. Ver [datos y permisos](docs/database.md).

## Configuración

Copiar los nombres de `.env.example` a un archivo local ignorado o al gestor de secretos del alojamiento. No enviar valores de claves privadas al chat, no ponerlos en argumentos de comandos, Git, registros o capturas.

| Variable | Uso |
| --- | --- |
| `PUBLIC_SITE_URL` | Origen exacto del sitio. Local: `http://127.0.0.1:4321` |
| `PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clave publicable del proyecto |
| `SUPABASE_SECRET_KEY` | Clave secreta exclusiva del servidor |
| `RESEND_API_KEY` | Envío transaccional desde servidor |
| `RESEND_FROM_EMAIL` | Remitente del dominio verificado |
| `LEGAL_READY` | `false` hasta completar revisión legal y de titularidad |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` | Biblioteca privada R2, opcional hasta disponer del catálogo |

Solo la URL y la clave publicable de Supabase son públicas. Nunca anteponer `PUBLIC_` a una clave secreta. El código admite nombres de claves heredados por compatibilidad, pero la configuración nueva utiliza las claves publicable y secreta actuales.

## Base de datos y acceso

La migración reproducible está en `supabase/migrations/`. Contiene la primera cohorte sin fechas inventadas y con los módulos todavía sin publicar. No crea alumnado ni matrículas activas.

Para levantar el stack completo local es necesario Docker Desktop. Antes de utilizar la CLI, consultar `npx supabase --help`; el procedimiento y las limitaciones están en [docs/database.md](docs/database.md). No ejecutar una migración a ciegas sobre una base existente.

El inicio de sesión utiliza un enlace enviado al correo y cookies de servidor. Configurar en Supabase:

1. El origen de la aplicación y la redirección exacta `/auth/confirm`; en local, `http://127.0.0.1:4321/auth/confirm`. Añadir el origen definitivo solo cuando se publique.
2. Confirmación de correo y SMTP propio para destinatarios reales.
3. El rol de administración mediante `app_metadata.role = "admin"`, asignado desde una operación administrativa de Auth. No usar `user_metadata`.
4. Los grants y políticas de la migración, con `private` fuera de la Data API.

Aceptar una solicitud crea una matrícula pendiente de pago. No concede acceso. La autorización requiere una matrícula activa y se comprueba también en base de datos.

## Correo con Resend

Verificar el dominio de envío y sus registros DNS siguiendo las instrucciones de Resend. No sustituir ni eliminar registros de correo existentes sin revisar su función.

En Supabase Auth, configurar SMTP con `smtp.resend.com`, usuario `resend`, puerto TLS 465 y la clave de Resend como contraseña. Introducir esa contraseña directamente en el panel seguro, no en documentación ni chat. Usar un remitente del dominio verificado. La API transaccional de la aplicación usa `RESEND_API_KEY` y `RESEND_FROM_EMAIL`.

Probar con direcciones controladas por la escuela: enlace de acceso, expiración, confirmación/baja de newsletter, respuestas de admisión, errores y reintentos. El envío de una solicitud no se puede dar por completado si falla su persistencia. Un correo solo se marca como enviado tras confirmación del proveedor.

Fuentes: [SMTP de Resend](https://resend.com/docs/send-with-smtp), [SMTP de Supabase](https://supabase.com/docs/guides/auth/auth-smtp).

## Materiales y vídeo

Los buckets de Supabase y R2 deben ser privados. Las rutas se registran como recursos de un módulo; la aplicación comprueba matrícula, publicación y apertura antes de emitir enlaces temporales.

Antes de elegir el alojamiento del catálogo:

- Inventariar horas y tamaño total tras una compresión que preserve la calidad de voz y música.
- Revisar formatos, subtítulos, reproducción móvil, búsqueda temporal y caducidad del enlace.
- Mantener originales y copias independientes. Una copia SQL no contiene los vídeos ni documentos.
- Comprobar las cuotas vigentes; no prometer gratuidad ilimitada ni activar gastos automáticamente.

## Pagos: fase final

Todos los cobros están cerrados deliberadamente. La integración anterior se ha retirado. El destino acordado es **Redsys y transferencia**, después de disponer de cuenta bancaria, contrato de TPV y credenciales de pruebas.

La fase final deberá verificar firma y notificación en servidor, duplicados, cancelaciones, devoluciones, control concurrente de las 20 plazas y conciliación de transferencias por referencia. No se concede acceso por visitar una página de retorno ni por aportar un justificante sin confirmar el ingreso.

## Diseño y contenido

La paleta, el logo y el carácter del footer se conservan. La web utiliza DM Sans y DM Serif Display autoalojadas, con licencias en `public/fonts/`. No necesita descargar fuentes de terceros al navegar.

El programa de `/programa` es imprimible. Los artículos originales de prueba se conservan como borradores y no se publican. La documentación de las páginas legales, fotografía, credenciales y contenido pendiente está en [preparación editorial](docs/editorial-publication.md).

## Publicación y pendientes

La construcción local utiliza Astro 7 y el adaptador Node en modo standalone. `npm run build:release` prueba y construye la variante Cloudflare; `npm run deploy:cloudflare` publica con Wrangler. La escuela eligió priorizar coste cero frente al plan Pro de Vercel. Consultar el estado comprobado del dominio y el despliegue en [docs/deployment.md](docs/deployment.md).

Antes de publicar o captar datos reales:

- Resolver la exposición histórica documentada en [revisión de seguridad](docs/security-review.md).
- Disponer de cuentas propiedad de la escuela, credenciales y remitentes verificados.
- Completar titularidad, privacidad, condiciones de matrícula y correo de soporte; revisar `LEGAL_READY`.
- Incorporar materiales reales, calendario, preguntas y trabajo final; conservar una copia recuperable.
- Ejecutar las pruebas de cada rol contra el proyecto de pruebas real y ensayar recuperación de datos y archivos.
- Realizar la fase Redsys con su entorno de pruebas y revisar el presupuesto bancario antes de cobrar.
- Validar el alojamiento definitivo, HTTPS y redirecciones antes de conectar el dominio.

Para preparar Codex como proyecto local, ver [configuración de trabajo](docs/codex-setup.md).
