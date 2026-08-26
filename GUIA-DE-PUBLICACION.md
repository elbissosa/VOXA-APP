# Guía para publicar VOXA con datos reales

Este proyecto ya incluye:
- La app principal de VOXA (`public/index.html`) conectada a un servidor real.
- El panel de administrador (`public/admin.html`) con control total del sistema.
- Base de datos real (usuarios, planes, errores, actividad).
- Pagos reales con Stripe (suscripciones mensuales).

## Paso 1 — Sube el proyecto a Netlify
1. Descarga esta carpeta completa (`voxa-app`) a tu computadora.
2. Ve a [app.netlify.com](https://app.netlify.com) y crea un sitio nuevo arrastrando la carpeta, o conectándola a un repositorio de GitHub.
3. Netlify detectará automáticamente las funciones en `netlify/functions`.

## Paso 2 — Activa la base de datos
1. En el panel de tu sitio en Netlify, ve a la pestaña **Database**.
2. Actívala (Netlify crea la base de datos automáticamente).
3. Corre la migración: Netlify aplicará el archivo en `netlify/database/migrations/` la primera vez que despliegues.

## Paso 3 — Configura Stripe
En Netlify, ve a **Site configuration → Environment variables** y agrega:
- `STRIPE_SECRET_KEY` — tu llave secreta de Stripe (empieza con `sk_live_` o `sk_test_` para pruebas).
- `STRIPE_WEBHOOK_SECRET` — la obtienes al crear un webhook en Stripe apuntando a:
  `https://TU-SITIO.netlify.app/api/billing/webhook`
  (elige los eventos: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`)

## Paso 4 — Crea tu cuenta de administrador
1. En Netlify, agrega una variable de entorno temporal: `SETUP_SECRET` con cualquier palabra secreta que tú inventes (ejemplo: `voxa-clave-2026-xyz`).
2. Vuelve a desplegar el sitio para que tome la variable.
3. Abre una sola vez esta dirección con una herramienta como Postman, o pídeme a mí que la ejecute contigo, enviando:
   - URL: `https://TU-SITIO.netlify.app/api/setup-admin`
   - Método: POST
   - Cuerpo JSON: `{ "secret": "TU_SETUP_SECRET", "email": "tu@correo.com", "password": "TU_CONTRASEÑA", "podcastName": "VOXA Admin" }`
4. Con eso tu cuenta queda marcada como administrador con plan Estudio Pro activo.
5. **Importante:** después de crear tu cuenta, borra la variable `SETUP_SECRET` de Netlify para que nadie más pueda usar esa función.

## Paso 5 — Entra a tu panel
Ve a `https://TU-SITIO.netlify.app/admin.html` e inicia sesión con el correo y contraseña que creaste en el paso 4.

Desde ahí puedes:
- Ver cuántos usuarios hay y cuántas suscripciones están activas.
- Cambiar los precios de los 3 planes en cualquier momento.
- Ver los errores recientes del sistema.
- Prender, apagar, o poner en mantenimiento la plataforma completa.


## Paso extra — Recuperar contraseña (opcional pero recomendado)
Ya se agregó al sitio la opción "¿Olvidaste tu contraseña?". Para que el enlace llegue por correo:
1. Crea una cuenta gratis en [resend.com](https://resend.com) (o el proveedor de correo que prefieras).
2. En Netlify, agrega la variable de entorno `RESEND_API_KEY` con tu llave.
3. Opcional: agrega `EMAIL_FROM` con el remitente que quieras mostrar.

Si no configuras esto todavía, el sistema sigue funcionando: el enlace de recuperación se guarda en los errores del sistema (visibles en tu panel de administrador) para que puedas dárselo manualmente a quien lo necesite mientras conectas el correo.
