# El Arbol Que Suena - Web Cohorte 01

Web de lanzamiento para la Escuela Internacional de Neuroeducacion Musical.

## Stack

- Astro 5 + Tailwind
- Supabase (auth + datos)
- Stripe Checkout (pago)
- Resend (emails)
- Vercel adapter (runtime server)

## Variables de entorno

Copia `.env.example` a `.env` y completa:

- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`
- `PUBLIC_SITE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_ID` (opcional, si no se usa se crea precio inline a 390 EUR)
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `CRON_SECRET`

## Base de datos

Ejecuta `supabase/launch_schema.sql` en el SQL editor de Supabase.

## Scripts

- `npm run dev`
- `npm run build`
- `npm run preview`

## Endpoints implementados

- `GET /api/launch/status`
- `POST /api/newsletter/subscribe`
- `POST /api/checkout/create-session`
- `GET /api/checkout/status?session_id=...`
- `POST /api/stripe/webhook`
- `POST /api/cron/campaign?kind=weekly|conversion|closing&token=...`

## Flujo principal

1. Home -> `/registro`
2. `/registro` valida disponibilidad (fecha/plazas) y crea Stripe Checkout
3. Stripe redirige a `/gracias?session_id=...`
4. `/gracias` valida pago real y activa onboarding
5. Login -> Dashboard -> Modulos -> Quiz

## Cohorte 01 (2026)

- Precio lanzamiento: 390 EUR
- Precio posterior: 490 EUR
- Plazas: 20
- Cierre carrito: 12 abril 2026, 23:59 (Europe/Madrid)
- Itinerario: 10 modulos con apertura por calendario y quiz por modulo
