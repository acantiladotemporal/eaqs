# Datos, permisos y migraciones

La fuente de verdad es el conjunto ordenado de archivos de `supabase/migrations/`:

- `20261101112113_escuela_admision_aula.sql`.
- `20261101112458_hardening_school_access.sql`.

Ambas migraciones se han aplicado al proyecto de la escuela mediante `supabase_eaqs`.
Los nombres locales coinciden con las versiones registradas por Supabase. No contienen
usuarios, matrículas activas, vídeos ni fechas comerciales ficticias.

## Entorno local

Requisitos: Node según `package.json`, dependencias instaladas y Docker Desktop para
levantar el conjunto completo de Supabase.

```powershell
npx supabase start
npx supabase status
```

La configuración local usa PostgreSQL 17 y el sitio `http://127.0.0.1:4321`.
Los correos de Auth se capturan en el servidor local de pruebas, no se envían a
destinatarios reales. Usa los valores locales que devuelve `status` en `.env`.
No copies las credenciales de una cuenta de producción para ejecutar pruebas.

La primera cohorte tiene UUID `11111111-1111-4111-8111-111111111111` y admite
solicitudes. Sus diez módulos están sin publicar y sin fecha de apertura. Es una
estructura inicial, no una promesa de contenido disponible.

Para comprobar qué está aplicado:

```powershell
npx supabase migration list --local
```

Para reconstruir **solo una base local desechable**, consulta primero `npx supabase
db reset --help` y usa el modo local. Esta operación borra los datos locales; no la
uses para actualizar una base con alumnado. Para crear una nueva migración usa
`npx supabase migration new nombre_del_cambio` y conserva su historial.

## Antes de aplicar a una cuenta real

1. Crear una cuenta y proyecto propiedad de la escuela, definir región y verificar
   capacidad y presupuesto. No habilitar gastos automáticamente.
2. Hacer una copia de la base y los archivos existentes; ensayar su restauración.
3. Comparar el esquema real con la migración. El antiguo repositorio no documentaba
   `profiles` ni `posts`: si existen de manera manual, revisar sus columnas, datos y
   políticas antes de migrar. No ejecutar el SQL a ciegas sobre ese esquema.
4. Aplicar y verificar primero en un proyecto de pruebas, después con copia y ventana
   de mantenimiento. La CLI debe mostrar la misma lista de migraciones que Git.
5. Configurar dominio, redirección exacta `/auth/confirm`, SMTP de Auth con Resend y
   remitente verificado. Activar la confirmación de correo. Mantener el esquema
   `private` fuera de los esquemas expuestos por la Data API.
6. Ejecutar los asesores de Supabase y comprobar grants y RLS con usuarios reales
   de prueba de cada rol antes de abrir inscripciones.

Si se encuentra el antiguo esquema comercial, la migración conserva sus matrículas
y eventos de correo en `private.legacy_enrollments` y `private.legacy_email_events`.
No elimina esos registros ni los considera automáticamente matrículas del nuevo
curso. Las direcciones antiguas de newsletter permanecen sin confirmación; no se
presupone consentimiento para una nueva campaña.

## Reglas de autorización

- Los permisos administrativos proceden de `app_metadata.role = "admin"`, configurado
  por un administrador de Auth. Nunca de metadatos que pueda editar el alumnado.
- El servidor valida la identidad con Auth. El RPC `claim_application` vincula una
  solicitud al usuario únicamente con email confirmado; es exclusivo de servidor.
  También crea el perfil una sola vez y completa un nombre vacío desde la solicitud,
  sin sobrescribir un nombre ya guardado. La coincidencia por email solo permite leer
  solicitudes todavía sin usuario asociado: no transfiere registros ya vinculados a
  otra identidad aunque una dirección de correo cambie de propietario.
- Aceptar una solicitud crea una matrícula `pending_payment`. Ni aceptar ni visitar
  una página de retorno concede acceso al curso.
- Solo una matrícula `active` permite acceder al curso. El disparador de matrícula
  comprueba que existe admisión aceptada y bloquea la fila de cohorte para respetar
  las 20 plazas también ante operaciones concurrentes.
- Cada módulo exige publicación, fecha de apertura alcanzada y participación en
  los cuestionarios anteriores. Una fecha vacía significa **todavía cerrado**.
- Las respuestas se guardan como objeto `{ "UUID-pregunta": "respuesta" }`.
  Si `options` está vacío, se admite una reflexión no vacía de hasta 5.000 caracteres;
  si contiene opciones, la respuesta debe ser una de ellas. Se exige responder a
  todas las preguntas, sin nota mínima ni una respuesta correcta predeterminada.
- El trabajo final solo aparece al publicarlo. La docente revisa la entrega; el
  participante no puede aprobarla ni editar una entrega ya aprobada.
- `issue_certificate` exige matrícula activa, diez módulos publicados y completados
  y trabajo final aprobado. La emisión repetida conserva el mismo certificado.
- El foro y sus respuestas se aíslan por cohorte; la moderación es administrativa.
- Newsletter, cola de correo y límites de solicitudes son de servidor, sin lectura
  directa para visitantes o alumnado. Solo se marca un correo como enviado tras
  confirmación del proveedor.

La confirmación de newsletter no puede volver a pendiente por un formulario antiguo
que termine más tarde. Cada cambio de estado o de token crea una nueva
`subscription_version`; la sincronización de contactos debe actualizar el resultado
solo si sigue siendo esa misma versión. Los eventos verificados del proveedor solo
pueden dar de baja, nunca confirmar una dirección. El RPC correspondiente es exclusivo
de servidor y descarta eventos repetidos, de otro contacto o anteriores al último
consentimiento/confirmación. Un webhook no puede deshacer una nueva suscripción con
un evento atrasado de la anterior.

Todas las tablas expuestas tienen RLS y grants explícitos. Los pocos helpers
`SECURITY DEFINER` están en `private`, con `search_path` vacío y una identidad
fijada al usuario autenticado. Evitan recursión en políticas; no son operaciones
genéricas para leer datos de otros usuarios. Los RPC públicos de admisión y
certificación usan `SECURITY INVOKER` y vuelven a comprobar el rol administrativo.

## Archivos

Los buckets `course-materials` y `assignments` son privados. Los materiales se
relacionan con un módulo; no basta con conocer su ruta para leerlos. Las entregas
usan rutas `UUID-usuario/archivo` y solo admiten lectura propia o administrativa.
Un documento adjunto a una entrega no puede borrarse por el participante.

`resources.storage_provider` distingue `supabase` y `r2`. R2 debe ser también
privado: la aplicación comprueba permiso sobre el registro antes de emitir una
URL firmada temporal. Los materiales R2 no habilitan lectura de objetos con el
mismo nombre en Supabase. Una URL firmada ya emitida puede seguir funcionando
hasta su caducidad; mantener ese plazo corto. Ningún sistema impide grabar la
pantalla o compartir una descarga ya obtenida.

Antes de cargar el curso, medir tamaño total, formatos y calidad. Mantener copia
independiente de los originales; una copia SQL no incluye los objetos de los
buckets ni los archivos de R2.

## Verificación ejecutada

```powershell
node --test tests/sql/rls.test.mjs
```

Estas pruebas ejecutan la migración y las políticas en PostgreSQL mediante PGlite.
Recrean únicamente el contrato mínimo de `auth` y `storage`: prueban RLS real,
aislamiento entre cohortes, visitantes, solicitantes, aceptados sin pagar,
participación, trabajo final, certificados, revocación, archivos y control de cupo.
También exportan y restauran una copia del PostgreSQL local de pruebas y comprueban
que se mantienen los registros y las políticas. Esto no prueba la recuperación de
los archivos reales de un bucket ni sustituye el ensayo de restauración del proyecto.
No sustituyen las pruebas de GoTrue, SMTP, Storage HTTP y permisos del proyecto
remoto. En esta máquina no se encontró un servidor de Supabase en el puerto 54322;
por eso la lista de migraciones local y los asesores del servidor no se han podido
verificar contra el stack completo. No se accedió a datos de alumnado ni a una
base remota.

## Copias y recuperación

En Free, programar copias cifradas de datos y archivos bajo control de la escuela.
Consultar `npx supabase db dump --help` para la versión instalada; guardar esquemas,
datos y roles fuera de Git y de `public/`. No incluir secretos en argumentos de
terminal ni en capturas. Ensayar una restauración en un proyecto aislado antes de
aceptar alumnado; comprobar identidades, matrícula, progreso, entregas, archivos y
certificados con las mismas pruebas de permisos.

Referencias oficiales: [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security),
[copias](https://supabase.com/docs/guides/platform/backups),
[almacenamiento privado](https://supabase.com/docs/guides/storage/security/access-control).

## Proyecto seleccionado por la escuela

El proyecto indicado es `bgmkkvgcaygtcfphkvlv` ([panel](https://supabase.com/dashboard/project/bgmkkvgcaygtcfphkvlv)). El servidor independiente `supabase_eaqs` ya ha permitido verificar su API y consultar su estructura. No usar la conexión antigua de AD Alcorcón.

La inspección del 1 de noviembre de 2026 encontró PostgreSQL 17.6, cero tablas de aplicación, cero usuarios, cero buckets y ninguna migración. Los asesores de seguridad y rendimiento no devolvieron avisos antes de instalar el esquema. El inventario sin datos personales está en `supabase-preflight.json`.

Se aplicaron las dos migraciones y volvieron a pasar las 19 pruebas locales de RLS. La segunda migración añade dos índices de claves foráneas, evita reevaluar el JWT por cada fila, combina las ramas administrativas sin cambiar los permisos y desactiva la extensión GraphQL que esta aplicación no utiliza.

La verificación remota confirma 19 tablas con RLS, una cohorte, diez módulos sin publicar, dos buckets privados, cero usuarios y cero matrículas. El asesor de seguridad ya no devuelve avisos. En rendimiento solo quedan 17 avisos informativos de [índices aún sin uso](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index); se conservan porque todavía no hay tráfico de alumnado.

También se han ejecutado ocho lecturas HTTP contra PostgREST con la clave publicable: la cohorte responde 200 y las tablas privadas responden 401 al visitante. El detalle está en `supabase-verification.json`. Esta comprobación no crea usuarios ni sustituye las pruebas pendientes de Auth/SMTP y de cada rol con cuentas de ensayo.

Para repetir estas lecturas remotas explícitamente, desde la carpeta del proyecto:

```powershell
node --env-file=.env scripts/verify-supabase-readonly.mjs
```

El `.env` local ignorado contiene la URL y una clave publicable moderna de EAQS. Las claves de servidor y Resend siguen vacías, y `LEGAL_READY` permanece desactivado. Configurar la clave publicable no habilita la captación ni los cobros.

