# Pagos — preparación aislada de Redsys

Los cobros permanecen cerrados. Este módulo prepara la firma y verificación del
protocolo; no contiene credenciales de la escuela, no inicia operaciones, no llama
a Redsys y no confirma matrículas por sí mismo.

## Contrato del módulo

`src/lib/server/redsys.ts` exporta:

- `buildPaymentRequest(config, input)`: devuelve `endpoint`, `signatureVersion`,
  `merchantParameters` y `signature` para un formulario de redirección alojado.
- `verifyNotification(config, paramsBase64, signatureVersion, signature)`:
  comprueba integridad y formato de una notificación de venta; devuelve campos
  normalizados o lanza `RedsysValidationError`.
- `createSignature(secretKey, order, merchantParameters)`: función pura, exportada
  también para contrastar el vector oficial de interoperabilidad. No usarla para
  aceptar notificaciones sin pasar por `verifyNotification`.

`RedsysConfig` incluye código de comercio, terminal, clave y entorno. El
`siteOrigin` opcional es configuración de servidor; nunca debe tomarse de campos
de formulario o cabeceras reenviadas sin una política de confianza. Por defecto
es el dominio de la escuela en producción y localhost en sandbox.

`PaymentInput` exige pedido de doce dígitos, importe entero en céntimos, moneda
978 y tres URLs: notificación, retorno correcto y retorno fallido. El módulo
mantiene las URLs en el origen configurado y exige HTTPS para producción.
Los doce dígitos son una decisión más restrictiva de la escuela; Redsys admite
pedidos alfanuméricos de cuatro a doce posiciones.

El pedido, importe y URLs se construyen a partir de una matrícula aceptada y datos
del servidor. No confiar en un importe, estado de admisión o referencia enviados
por el navegador.

La verificación devuelve:

```text
order, amountCents, currency, merchantCode, terminal,
responseCode, transactionType, authorized, raw
```

El terminal se normaliza a tres posiciones. Solo se admiten notificaciones de
venta de tipo 0 en EUR. Un resultado autenticado denegado devuelve
`authorized: false`; una firma correcta no implica autorización ni conciliación.

## Protocolo verificado

Se ha implementado exclusivamente `HMAC_SHA512_V2`, publicado por Redsys.
La diversificación usa AES-128-CBC con IV cero y la clave literal del terminal
recortada o completada con caracteres cero hasta dieciséis posiciones. El
resultado codificado en Base64 se usa como clave textual del HMAC-SHA512 sobre
los parámetros recibidos sin recodificarlos. La firma resultante es Base64URL.

No se descodifica la clave del terminal desde Base64. No se acepta un algoritmo
diferente ni una firma con tamaño incorrecto. Se comparan los bytes mediante
`timingSafeEqual` y se limita el tamaño de los parámetros antes de descodificar.

Las notificaciones comprueban comercio, terminal, moneda y estructura del
importe. Rechazan campos ambiguos por diferencias de mayúsculas. El identificador
público de pruebas no se admite como clave de producción.

Fuentes oficiales consultadas:
[Firma y vector de interoperabilidad](https://pagosonline.redsys.es/desarrolladores-inicio/documentacion-operativa/firmar-una-operacion/),
[redirección y notificación](https://pagosonline.redsys.es/desarrolladores-inicio/documentacion-operativa/autorizacion/),
[parámetros y resultados](https://pagosonline.redsys.es/desarrolladores-inicio/integrate-con-nosotros/parametros-de-entrada-y-salida/).

## Pruebas locales

```powershell
node --import tsx --test tests/redsys.test.ts
```

El conjunto contrasta la firma publicada por Redsys y comprueba alteraciones de
importe, pedido y firma; cambio de algoritmo; respuestas denegadas; comercio y
terminal equivocados; parámetros malformados o sobredimensionados; formatos de
importe y URLs de otro origen. Utiliza únicamente la clave pública del ejemplo
oficial y datos ficticios.

Estas pruebas no validan el contrato bancario, la aceptación del terminal, la
conectividad de la notificación ni un pago real en sandbox.

## Requisitos para conectar endpoints

1. Disponer de banco, contrato TPV y credenciales sandbox propiedad de la escuela.
   Guardar la clave exclusivamente en secretos del servidor.
2. Registrar cada pedido con matrícula, importe esperado, moneda, estado y entorno.
   Generar referencias únicas; no reutilizar el mismo pedido para otro cobro.
3. Preparar el formulario de redirección solo para una solicitud aceptada, con
   capacidad disponible y sin matrícula ya cobrada.
4. Recibir únicamente notificaciones POST en el endpoint dedicado. Verificar la
   firma con este módulo y cotejar pedido, importe y moneda con el registro
   pendiente; no basta con que el importe tenga un formato correcto.
5. Aplicar el resultado con una transacción y una clave de idempotencia, respetando
   el límite de plazas. Una repetición del mismo aviso no debe generar otra
   matrícula, certificado ni correo.
6. Mostrar el retorno del navegador como información de estado. No confirmar un
   pago mediante los parámetros GET ni porque se visite una página de éxito.
7. Probar el terminal bancario en sandbox: autorización, rechazo, cancelación,
   notificación retrasada o repetida, abandono de la pantalla y errores.
8. Mantener conciliación y procedimientos de devolución. Las operaciones de
   devolución y anulación no están implementadas por este módulo de venta;
   no interpretar esos avisos como una nueva autorización.
9. Habilitar producción solo después de las comprobaciones y de completar
   titularidad, condiciones de venta y recuperación de datos.

## Transferencia

La vía bancaria directa se añadirá al disponer de una cuenta. Debe llevar una
referencia de matrícula y confirmarse al recibir los fondos, no al subir un
justificante. Su confirmación administrativa tendrá las mismas comprobaciones
de admisión, cupo y duplicados que la tarjeta.

No se presupone una tarifa bancaria ni se ha contratado o activado un servicio.
