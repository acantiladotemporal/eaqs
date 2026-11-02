# Revisión de seguridad del repositorio

Revisión local inicial de la copia pública del repositorio, 1 de noviembre de 2026. Este documento describe hallazgos y límites; no acredita una auditoría de los servicios desplegados.

## Archivos de ejecución publicados

El repositorio original incluía PocketBase, su ejecutable, migraciones antiguas y archivos de base de datos dentro de `pb_data/`. La inspección se limitó a estructura e inventario; no se muestran direcciones, contraseñas, hashes, tokens, identificadores personales ni contenido de conversaciones.

Inventario agregado de los archivos inspeccionados:

| Tabla o categoría | Registros |
| --- | ---: |
| `_superusers` | 1 |
| `users` | 1 |
| `posts` | 2 |
| Registros de log | 61 |
| `authOrigins` | 2 |

La presencia de una cuenta administrativa y una cuenta de usuario hace que esta exposición deba tratarse como real hasta esclarecer su uso. No se ha comprobado si corresponden a cuentas de prueba, si sus credenciales se reutilizaron ni si siguen siendo válidas en un servicio accesible.

## Cambios en esta copia de trabajo

- Los archivos de ejecución y los restos de PocketBase se retiran del árbol de trabajo.
- `.gitignore` excluye bases, logs, copias locales, ejecutables de PocketBase y archivos de entorno.
- Se sustituye la identidad ficticia por validación de sesión y autorización en servidor.
- Se incorporan permisos de base de datos y almacenamiento privado para el nuevo modelo del aula.
- Se retira la integración de cobro anterior y todos los cobros permanecen cerrados.

Retirar un archivo de la versión actual y añadirlo a `.gitignore` **no lo elimina del historial**. La copia local conserva el historial original para poder revisar los cambios; el remoto original y cualquier clon previo pueden conservar también los archivos.

En la revisión inicial no se reescribió el historial, cambió la visibilidad del repositorio remoto, revocaron credenciales ni realizó un push.

## Acciones que requieren completar la revisión

1. Restringir temporalmente el acceso al remoto mientras la escuela determina el alcance. Que se vuelva privado no deshace descargas anteriores.
2. Confirmar con la escuela si los usuarios y los secretos encontrados estaban en uso y si alguna credencial se reutilizó.
3. Si hubo reutilización, sustituir esas credenciales en los servicios afectados y revocar sesiones o accesos según corresponda. No basta con borrar el archivo.
4. Preparar una copia restringida y un procedimiento de limpieza del historial. Coordinar la reescritura con las personas que utilicen el repositorio; no ejecutarla silenciosamente.
5. Revisar qué referencias históricas quedan accesibles, actualizar clones y documentar el resultado.
6. Verificar la retirada de los archivos históricos antes de publicar el nuevo código.

## Autorización y preparación del 2 de noviembre de 2026

La escuela declara que PocketBase ya no tiene utilidad y autoriza retirarlo. Se prepara una limpieza de los 14 commits históricos, conservando el resto del código y una copia local de recuperación excluida de Git. `scripts/prepare-clean-history.mjs` compara el árbol actual, filtra los archivos de ejecución y comprueba que no quedan objetos históricos de esos archivos en las referencias preparadas. No publica ni mueve el checkout por sí solo.

La actualización remota utilizará el SHA esperado de `main` y una operación con lease. El resultado concreto se registrará en `docs/deployment.md`. No se afirma haber verificado reutilización de contraseñas, revocado credenciales ni borrado objetos cacheados o copias que terceros pudieran haber descargado. La limpieza de referencias no puede garantizar esa eliminación; si existen credenciales reutilizadas, deben sustituirse en sus servicios.

La limpieza se ejecutó y la historia saneada se publicó utilizando el SHA remoto esperado. El árbol de la implementación se conservó idéntico y la comprobación posterior no encontró las rutas retiradas en los objetos alcanzables desde las referencias locales actualizadas. El bundle de recuperación permanece exclusivamente en `work/`, ignorado y con permisos locales restringidos. Los límites anteriores sobre credenciales, cachés y copias de terceros siguen vigentes.

## Límites de la comprobación

No se han consultado datos de alumnado ni contenido de registros remotos. Después de esta revisión local inicial se inspeccionó el proyecto Supabase independiente de la escuela: estaba vacío y se aplicaron las dos migraciones. Se verificaron RLS, buckets privados y lecturas anónimas de la API; el asesor de seguridad no devolvió avisos. Esto no acredita el despliegue web anterior ni la entrega de correo. Las claves privadas, Resend, el catálogo de archivos y el banco siguen pendientes de configuración o verificación bajo control de la escuela.

Las pruebas SQL de la aplicación ejecutan la migración y RLS en PostgreSQL local mediante PGlite. Deben complementarse con pruebas del proyecto real, autenticación, correo, archivos y restauración antes de abrir matrículas.

No incorporar a Git ni al paquete de entrega copias de las bases históricas, secretos o volcados de registros. El script local de inspección solo debe producir inventarios agregados y nunca ejecutarse contra servicios remotos.
