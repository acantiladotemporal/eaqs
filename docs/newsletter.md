# Newsletter: confirmación y sincronización de preferencias

## Comportamiento

- La portada ofrece dos formularios, uno después del hero y otro en el footer. Usan identificadores distintos y consentimiento explícito para ideas y novedades de las formaciones.
- La respuesta de alta vuelve al formulario correspondiente con `newsletter_source=home` o `newsletter_source=footer`; solo ese formulario muestra el mensaje. Los destinos están fijados en el servidor, nunca se toma una URL de redirección del cliente.
- Solicitar el alta guarda un consentimiento pendiente y envía un enlace de confirmación de 24 horas. Abrir el enlace no modifica datos: el usuario confirma mediante POST.
- La confirmación verificada se conserva en Supabase. Un cambio de estado o de token de confirmación cambia `subscription_version` y deja la sincronización pendiente de forma atómica.
- Las bajas se guardan primero en Supabase y se propagan a Resend. Si el proveedor no está disponible, la interfaz explica que la baja ya está registrada y que su propagación sigue pendiente.
- Una nueva solicitud de alta no cancela una baja anterior mientras espera confirmación. Las bajas o eliminaciones que ya existen en Resend nunca se revierten automáticamente, ni mediante un reintento administrativo.
- Los contactos pendientes de confirmación no se crean en el proveedor. Un contacto confirmado se crea solo si no existe y no consta un identificador anterior eliminado.
- Una notificación del proveedor solo puede retirar consentimiento; nunca puede confirmar o reactivar por sí sola una suscripción local.
- No hay ninguna ruta que envíe campañas o Broadcasts automáticamente.

## Activación

La integración de marketing está desactivada por defecto. Los mensajes transaccionales de confirmación tienen su configuración independiente.

Variables privadas necesarias:

```dotenv
RESEND_API_KEY=
RESEND_WEBHOOK_SECRET=
NEWSLETTER_MARKETING_ENABLED=false
```

1. Aplicar la migración de Supabase y verificar la autenticación de los dominios de envío en Resend.
2. Configurar en Resend un webhook HTTPS hacia `/api/newsletter/provider-webhook`, suscrito a `contact.updated` y `contact.deleted`.
3. Guardar su secreto de firma en `RESEND_WEBHOOK_SECRET`; este secreto es distinto de la API key y nunca debe publicarse ni añadirse al navegador.
4. Probar en un entorno controlado un alta propia confirmada, una baja desde la web y una baja desde Resend. Verificar los estados en Supabase y Resend.
5. Activar `NEWSLETTER_MARKETING_ENABLED=true` solo después de completar esas comprobaciones. En Administración → Correo, sincronizar los estados pendientes.
6. Antes de lanzar cualquier campaña manual desde el proveedor, verificar que todas las altas confirmadas y las bajas estén actualizadas. No enviar una campaña mientras haya errores o retiradas de consentimiento pendientes.

La tabla del panel prioriza estados fallidos o pendientes; una nueva solicitud sin confirmar no aparece como contacto listo para marketing. La sincronización se activa mediante una acción administrativa protegida y se registra por suscriptor.

## Webhook y reintentos

El endpoint verifica la firma Svix sobre el cuerpo original, su antigüedad y el tamaño máximo de 128 KiB. No usa autenticación de usuario ni validación de formularios porque su identidad procede de la firma del proveedor. No registra el cuerpo del evento en logs.

`apply_newsletter_provider_event` solo permite acceso del servicio. Descarta eventos repetidos, antiguos respecto a una nueva confirmación/solicitud, de otra identidad de contacto o con fecha futura. La baja y su orden temporal se aplican en una sola operación de base de datos.

La función `syncNewsletterSubscriber(id)` devuelve `true` únicamente cuando registra una sincronización válida de la versión actual. Si la configuración falta, la llamada falla o el consentimiento cambia concurrentemente, mantiene un estado pendiente/fallido y devuelve `false`. El panel permite reintentar; los reintentos nunca envían una campaña.

Una baja o eliminación previa del proveedor requiere revisar las preferencias y el consentimiento con la persona. No se debe forzar su reactivación mediante una sincronización administrativa.

## Pruebas

```powershell
node --import tsx --test tests/newsletter-provider.test.ts
npm run test:db
npm run check
```

Las pruebas usan peticiones simuladas y firmas de ejemplo, sin credenciales ni contactos reales. Incluyen confirmación pendiente, baja previa, contacto eliminado, fallos HTTP, sincronización desactivada, cuerpo alterado, firma inválida/caducada/futura y límite de tamaño. Los casos SQL verifican la monotonía y los permisos de los eventos.

Documentación oficial consultada:

- https://resend.com/docs/api-reference/contacts/create-contact
- https://resend.com/docs/api-reference/contacts/update-contact
- https://resend.com/docs/webhooks/verify-webhooks-requests
- https://resend.com/docs/webhooks/contacts/updated
- https://resend.com/docs/webhooks/contacts/deleted
