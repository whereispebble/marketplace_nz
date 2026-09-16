# Memoria del proyecto Swapy

Este archivo recoge los cambios funcionales realizados para conservar el
contexto del proyecto entre sesiones.

## 2026-09-15

### Modo de prueba disponible en Vercel

- El panel **DEV** y la sesión de prueba ahora están disponibles también en el
  despliegue de Vercel, además del entorno local.
- Los vehículos de ejemplo se cargan al activar la sesión de prueba tanto en
  local como en Vercel.
- Para ocultar el modo de prueba en cualquier entorno, configurar la variable
  de entorno `VITE_DEV_LOGIN=false`.
- Archivos modificados: `src/services/devAuth.js` y
  `src/services/devData.js`.

### Mensajes al crear una cuenta

- El formulario de registro comprueba si el nombre de usuario ya está en uso y
  muestra un mensaje específico antes de crear la cuenta.
- Detecta la respuesta de Supabase para un correo ya registrado y muestra un
  mensaje para iniciar sesión en su lugar.
- Se añadió un índice único sin distinguir mayúsculas de minúsculas para los
  nombres de usuario. Debe ejecutarse en Supabase el archivo
  `supabase/2026-09-username-uniqueness.sql`.
- Archivos modificados: `src/pages/Register.jsx` y
  `src/services/supabase.js`.

### Gestión y edición de anuncios

- La edición usa siempre un `update` del anuncio existente, filtrado por su ID
  y por el usuario propietario; no crea un anuncio nuevo.
- El formulario de edición es una página única con una previsualización viva y
  bloques plegables para título/precio, detalles, fotos y estado. Todos los
  campos siguen siendo editables, pero no se muestran decenas a la vez. El
  asistente por pasos se utiliza solo al crear un anuncio.
- Incluye un resumen del anuncio y botones fijos para cancelar o guardar.
- Al guardar, se sincronizan las fotos: conserva las existentes, sube las
  nuevas, respeta el orden y reemplaza las filas relacionadas en
  `product_images` para evitar duplicados.
- El estado activo se guarda como `available`, que es el valor admitido por la
  base de datos; también se pueden pausar y reactivar anuncios desde el menú
  de una tarjeta propia.
- La ficha de un anuncio propio muestra **Manage listing** en lugar de los
  botones de contactar al vendedor o guardar favoritos.
- Archivos modificados: `src/pages/NewProduct.jsx`,
  `src/components/ProductCard.jsx`, `src/pages/ProductDetail.jsx`,
  `src/pages/Profile.jsx`, `src/styles/publish.css` y
  `src/styles/responsive.css`.

## Convenciones pendientes

- Registrar aquí cada cambio funcional relevante, con fecha, resumen y archivos
  afectados.

### Edición de anuncios de prueba

- Los anuncios mock del modo DEV ya se pueden abrir en Edit listing y cargan
  todos sus datos sin consultar Supabase.
- Guardar una edición, cambiar el estado o añadir fotos en un mock solo escribe
  en `sessionStorage` de la pestaña actual. No crea listings ni cambia datos
  reales en Supabase.
- Los cambios se conservan mientras la pestaña esté abierta y se reflejan en
  las fichas y el perfil de prueba.
- Archivos modificados: `src/services/devData.js`, `src/pages/NewProduct.jsx`
  y `src/pages/Profile.jsx`.
