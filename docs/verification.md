# Verificación local — 1 de noviembre de 2026

Implementación en la rama `codex/escuela-admision-aula`. La web no está publicada. Las dos migraciones están aplicadas al Supabase de la escuela; ver `supabase-verification.json`.

## Resultado ejecutado

- 30 pruebas de aplicación: permisos, formularios, rutas, enlaces privados R2, newsletter y firma Redsys.
- 19 pruebas PostgreSQL/PGlite: migración, roles, aislamiento de cohortes, participación, revisión, certificados, consentimiento y restauración.
- 30 comprobaciones HTTP sobre servidor de producción: páginas públicas, redirección de zonas privadas, rutas de archivos, formularios cerrados sin configuración, destino seguro de los dos formularios de newsletter y bloqueo de las rutas de demostración en producción.
- `astro check`: 0 errores, 0 advertencias, 0 hints.
- Construcción de producción correcta con Astro 7.4.4 y adaptador Node 11.1.9.
- Auditoría npm: 0 vulnerabilidades conocidas en las dependencias verificadas.
- Revisión visual en navegador: portada y solicitud de escritorio, portada móvil 390px sin desbordamiento horizontal y lección ilustrativa de desarrollo.

## Límites de esta verificación

Las pruebas locales de PostgreSQL usan los roles y funciones de autenticación/almacenamiento simulados en el harness. Se han añadido ocho lecturas anónimas reales de PostgREST y comprobaciones remotas del esquema, RLS y buckets. No acreditan GoTrue, SMTP, sesiones autenticadas remotas, reproducción prolongada de vídeo real, R2 remoto, entrega de correo ni cobros bancarios.

La conexión de Supabase disponible pertenece a otra organización y no se ha utilizado para instalar la escuela. Solo se consultaron metadatos para descartar ese destino. Debe conectarse el proyecto correcto antes de aplicar la migración y completar las pruebas integradas.

`LEGAL_READY=false` y el cierre de pagos permanecen activos. No se han enviado campañas ni creado matrículas reales de demostración. Redsys incluye un módulo de firma/verificación contrastado con el vector oficial, sin endpoints ni activación de cobros; conciliación y devoluciones dependen de la última fase bancaria.

La retirada de PocketBase en la copia actual no elimina el historial público original. Consultar `security-review.md` antes de subir o publicar cambios.

## Revisión narrativa y traslado local — 1 de noviembre de 2026

- Copia principal en `D:\El Árbol Que Suena`, conservando `img/`. Los 122 archivos de código y documentación coincidían por SHA-256 con el origen antes de aplicar los nuevos cambios.
- Portada centrada en el relato: contexto docente, propuesta, programa, acompañamiento, precio y solicitud. Sin imágenes protagonistas.
- Footer adaptado a la referencia: fondo oscuro cálido, símbolo original por recorte CSS sin editar sus píxeles, marca centrada y newsletter con consentimiento.
- Revisión visual en escritorio (1440 px) y móvil (390 px), sin desbordamiento horizontal. Precio con jerarquía tipográfica corregida.
- Build y 25 comprobaciones HTTP correctos. La conexión del proyecto Supabase indicado sigue pendiente de acceso; no se han aplicado cambios remotos.

