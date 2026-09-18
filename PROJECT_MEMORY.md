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
## 2026-09-17 — Preparación de lanzamiento, datos reales y seguridad

### Estado y alcance

Cambios locales implementados; **no desplegados ni aplicados a la base de producción**.
Se conservaron los cambios previos en `useVehicles.js`, `Chat.jsx`, `ProductDetail.jsx`
y `Profile.jsx`. La validación en PostgreSQL local no sustituye las pruebas con dos
cuentas en Supabase real. Las decisiones de esta entrada sustituyen las anteriores
que habilitaban DEV en Vercel o mezclaban datos de demostración.

### Separación DEV / datos reales

- DEV solo se habilita con el servidor de desarrollo; un build de producción no
  puede activarlo aunque exista una bandera antigua en sessionStorage.
- No se mezclan listas reales y mock. La carga dinámica de vehículos mock queda
  fuera del build de producción.
- Favoritos DEV usan sessionStorage separado. Los favoritos reales y las búsquedas
  guardadas pertenecen a la cuenta y usan tablas protegidas por RLS.
- Crear/editar anuncios, avatares, perfiles y denuncias en DEV no escribe datos reales.
  Una barrera en el transporte de Supabase rechaza REST/Storage durante una sesión DEV,
  incluso si quedó una sesión real abierta.
- Se eliminó el falso éxito del cliente sin configuración. Ahora devuelve errores
  manejables; también implementa la suscripción de sesión para evitar un crash.
- Se evita reactivar una sesión antigua por una respuesta tardía y se desmontan
  pantallas privadas al cambiar de cuenta. Se difiere la migración de favoritos
  fuera del callback de autenticación para evitar bloqueos.

### Mapa y ubicación exacta — decisión expresa del usuario

- Leaflet incluido como dependencia local con carga diferida; se eliminó la carga
  de código desde un CDN y el fallo de `leafletPromise` sin declarar.
- Coordenadas nulas/vacías no se convierten en 0; se validan rangos y valores finitos.
- Se exige **el punto exacto del vehículo**, no un centro de ciudad ni un punto de
  encuentro. El formulario permite pin en mapa a nivel de calle, coordenadas conocidas
  o geolocalización de alta precisión. Cambiar ciudad/coordenadas invalida la confirmación.
- El vendedor debe confirmar expresamente que el pin corresponde al vehículo y
  que se publicará. Se conserva la precisión numérica elegida; los seis decimales
  de la tarjeta son solo formato visual.
- GPS: se muestra la precisión reportada y se rechazan muestras con error superior
  a 50 m. Esto NO demuestra que el dispositivo esté junto al vehículo ni garantiza
  exactitud física absoluta. La confirmación del vendedor sigue siendo necesaria.
- La base comprueba coordenadas, origen y confirmación antes de publicar. Los
  borradores/pausados pueden estar incompletos; no son anuncios públicos.
- Los anuncios anteriores quedan sin confirmación por defecto y dejan de aparecer
  públicamente hasta que su propietario revise el punto. **No se inventan ubicaciones**
  ni se borran anuncios. El dueño puede seguir editándolos desde su perfil.

### Vendedores, mensajes, ofertas y soporte

- La ficha lee la identidad/reputación desde `public_profiles`, sin email/teléfono.
- El login conserva los parámetros del enlace de contacto y rechaza destinos externos.
- `start_conversation` verifica dueño y disponibilidad; reutiliza conversaciones,
  incluidas las directas y las aperturas repetidas/concurrentes.
- Mensajes: solo se muestran enviados tras confirmación del guardado, se conserva el
  texto si falla y se actualizan periódicamente. Se evita duplicar envíos por doble clic.
- Ofertas persistidas en `offers`; solo el vendedor puede aceptar/rechazar y no puede
  alterar el importe. Una oferta pendiente por conversación.
- El formulario de soporte ya no guarda datos personales localmente fingiendo un envío.
  Exige sesión y guarda en `support_requests`. El equipo debe revisar esa tabla;
  no se ha configurado un servicio de correo ni avisos automáticos al equipo.
- Los fallos de cargas/guardados se muestran; la home diferencia error de red de
  ausencia de resultados. Hay página 404 y recuperación ante errores de renderizado.

### Integridad y seguridad

- Fotos y datos del anuncio se confirman con una actualización: un trigger sincroniza
  `product_images` en la misma transacción. Si falla, la edición anterior permanece.
- Los anuncios nuevos reservan un borrador privado antes de subir fotos; reintentar
  reutiliza ese ID. Los objetos subidos antes de un fallo pueden quedar sin referencia:
  queda pendiente una limpieza programada tras definir retención, sin borrar a ciegas.
- RLS y privilegios por columna protegen perfiles, chats, mensajes, ofertas, favoritos,
  búsquedas y soporte. El cliente no puede cambiar email, reputación, ventas,
  participantes, autor/contenido de mensajes recibidos ni importes de ofertas.
- Favoritos recuperan ID UUID y clave ajena a anuncios. IDs mock inválidos detienen
  la migración para revisión explícita; no se eliminan datos automáticamente.
- Storage limita formatos a JPEG/PNG/WebP y tamaños (4 MB avatar, 8 MB anuncio).
- URLs con UUID opacos y comprobación de permisos en servidor. HTTPS cifra el tráfico;
  no se implementó una falsa “encriptación de URLs” en el cliente. No hay credenciales,
  emails ni teléfonos en las rutas creadas. `Referrer-Policy: no-referrer` evita
  enviar rutas a proveedores externos.
- Cabeceras CSP, HSTS, anti-iframe y nosniff en Vercel. CSP asume Supabase hospedado
  en `*.supabase.co`; adaptar antes de usar un dominio de API propio.
- El build rechaza claves privadas y URLs de API sin HTTPS. Las contraseñas siguen
  gestionadas por Supabase Auth; no se guardan en las tablas de la aplicación.
- Avatares y fotos de anuncios son públicos por diseño; no subir documentos privados.
  Un archivo ya accesible por URL pública no se vuelve privado al pausar un anuncio.
- Actualizaciones compatibles de dependencias: auditoría pasó de 9 vulnerabilidades
  conocidas a 0. No se usó actualización forzada de versiones mayores.

### Migraciones y comprobaciones

Consultar `LAUNCH_READINESS.md` para orden de aplicación, pruebas y asuntos pendientes.
Las pruebas automatizadas viven en `tests/` y se ejecutan con `npm test`.
El script `scripts/audit-public.mjs` solo hace lecturas con una clave pública y
muestra conteos/códigos, nunca filas privadas ni credenciales.

Referencias de implementación: [permisos por columna](https://supabase.com/docs/guides/database/postgres/column-level-security),
[funciones de base de datos](https://supabase.com/docs/guides/database/functions),
[callback de sesión](https://supabase.com/docs/reference/javascript/auth-onauthstatechange).

### Cierre de validación y recuperación de cuenta

- Se añadió recuperación de contraseña mediante Supabase Auth: pantallas
  `/forgot-password` y `/reset-password`, mensajes que no enumeran cuentas y bloqueo
  de operaciones reales de recuperación en DEV. Requiere configurar y probar SMTP y
  la URL de retorno en Supabase antes del lanzamiento.
- La previsualización del anuncio ya no permite guardar un favorito inexistente ni
  navegar a un anuncio llamado `preview`.
- Las páginas secundarias se descargan bajo demanda; el build ya no advierte de un
  bloque inicial superior a 500 kB.
- Pruebas de navegador adicionales: producción sin panel DEV; ID mock `/product/1`
  rechazado; recuperación abre sin enviar correo; un pin manual confirmado conserva
  los seis decimales elegidos en la edición local DEV.
- La barrera de datos DEV tiene pruebas independientes: bloquea REST y Storage con
  un token real preexistente y permite cerrar la sesión Auth.

### Resultado final de las comprobaciones locales

- `npm test`: **17 pruebas superadas, 0 fallos**.
- `npm run lint`: correcto, sin errores ni avisos.
- `npm run build`: correcto; sin bloque de datos `mockVehicles` en producción.
- `git diff --check`: correcto.
- Auditoría de dependencias tras las actualizaciones: **0 vulnerabilidades conocidas**.
- Las pruebas de cuentas remotas, envío real de correos, configuración de Auth/Storage,
  carga y despliegue siguen pendientes según `LAUNCH_READINESS.md`. Estas comprobaciones
  locales no certifican ausencia absoluta de fallos ni una producción ya protegida.

## 2026-09-17 — Ubicación compacta al publicar y editar

Petición posterior del usuario: eliminar el mapa y la confirmación, con una interacción sencilla tipo marketplace. Esta decisión sustituye la interfaz de pin manual descrita anteriormente.

- Se quitan mapa, casilla, entradas de latitud/longitud y tarjeta duplicada de coordenadas, incluida la previsualización. El buscador mantiene una altura de 48 px sin estirar la fila.
- Campo accesible con sugerencias de direcciones (calle y número) y opción My location. El filtro de búsqueda de la home conserva las sugerencias de localidades. Una ciudad no pasa a considerarse un punto exacto.
- Seleccionar una dirección resuelta guarda sus coordenadas automáticamente; escribir de nuevo invalida las anteriores. GPS exige precisión informada de hasta 50 m y descarta respuestas antiguas si se edita la ubicación mientras espera. Los errores de permiso y precisión se muestran junto al campo.
- Sin confirmación adicional: location_confirmed sigue siendo el indicador interno de selección resuelta, no una prueba de presencia física. La dirección identifica el inmueble; ni el geocodificador ni el GPS garantizan el punto físico exacto del vehículo.
- Migración adicional 2026-09-17-location-search.sql, después de launch-hardening, admite la fuente address y mantiene el resto de restricciones. No aplicada al Supabase remoto.
- Validación: revisión visual en navegador del formulario DEV, campo compacto sin mapa/casilla; prueba de PostgreSQL admite address y rechaza coordenadas incompletas/GPS impreciso; prueba de geocodificación separa direcciones de centros de ciudad.

- Resultado de esta revisión: 18 pruebas superadas; lint, build y comprobación de diferencias correctos. En navegador se buscó una dirección pública, se seleccionó y se guardó el anuncio DEV sin mapa ni confirmación; el detalle mostró la nueva dirección. No se modificaron anuncios reales.

## 2026-09-17 — Error real de publicación: columnas de ubicación ausentes

- El usuario recibió PGRST204 para location_accuracy_m. Comprobación de solo lectura contra la API configurada, con clave pública y limit=0: location_accuracy_m, location_confirmed y location_source responden 400 / 42703; lat, lng e images responden 200. Por tanto, no basta con recargar la caché: faltan columnas en la base conectada.
- Causa: el frontend incorporaba las columnas de migraciones todavía no aplicadas. No es un error en los datos introducidos por el usuario.
- Preparado supabase/2026-09-17-publication-location.sql: actualización atómica e idempotente de las tres columnas, fuentes incluyendo address, precisión GPS y coordenadas válidas para nuevas/actualizadas publicaciones; recarga de la caché PostgREST y consulta final de verificación. Conserva filas y permisos; no marca coordenadas históricas como precisas. No sustituye la migración completa de seguridad.
- El formulario comprueba el esquema antes de reservar borrador o subir fotos. Si falta, mantiene los datos y muestra un mensaje comprensible; no omite metadatos ni finge que el anuncio se guardó. DEV queda fuera de esta consulta.
- Añadido scripts/check-publication-schema.mjs para comprobar las columnas sin leer datos ni exponer claves.
- No hay CLI, conexión administrativa ni sesión de navegador Supabase disponible. La actualización remota sigue pendiente de ejecutar en SQL Editor. No afirmar que la publicación real ya está arreglada hasta que se aplique y verifique.

- Verificación local de esta corrección: 20 pruebas superadas, lint y build correctos. La prueba SQL ejecuta la reparación dos veces y conserva las filas previas; verificación remota posterior a la reparación pendiente.

## 2026-09-17 — Simplificación solicitada: ciudades y sin precisión GPS

- El usuario pide quitar location_accuracy_m y que se reconozca Auckland. Se elimina del estado, consultas y payload, junto con la dependencia de location_confirmed/location_source. Se conserva únicamente la localidad y lat/lng válidos.
- La publicación vuelve a usar sugerencias de ciudades/localidades; se elimina el filtro de calle y número que descartaba Auckland. Es obligatorio seleccionar una sugerencia, no basta texto libre. Las coordenadas de ciudad representan la localidad, no el vehículo exacto; esta petición posterior sustituye el requisito anterior de exactitud física.
- Quitado el límite de precisión GPS y el componente obsoleto LocationPicker. Home y perfil público ya no consultan location_confirmed.
- Para la base antigua comprobada anteriormente no se necesitan las tres columnas nuevas para publicar. No ejecutar la reparación anterior para crearlas solo por este formulario. Si ya se aplicaron las migraciones anteriores, ejecutar 2026-09-17-simple-location.sql al final: elimina accuracy y adapta las restricciones, la política y el contacto existentes al uso de lat/lng. No se ha ejecutado remotamente.
- Se actualizan las pruebas de localidades, publicación sin metadatos, rango de coordenadas y compatibilidad con las migraciones de seguridad.

- Verificación final: 20 pruebas superadas; lint, build y diff correctos. En navegador se escribió auckland, apareció Auckland en las sugerencias, se seleccionó y se guardó correctamente el anuncio DEV. No se publicó ningún anuncio real.

## 2026-09-17 — Un mismo buscador para localidades y direcciones

- Aclaración del usuario: debe aceptar ciudad/pueblo y también calle con todos los detalles. Se amplía el filtro del geocodificador para admitir ambos tipos simultáneamente, incluyendo calles y direcciones con número.
- El formulario conserva la etiqueta completa de las direcciones (número/unidad, calle, ciudad y código postal disponibles), sin recortar los datos al guardar. Las localidades conservan su nombre.
- No se reintroducen mapas de edición, confirmaciones ni precisión GPS. Ambos tipos requieren una sugerencia resuelta con coordenadas válidas.
- Pruebas de regresión para ciudad, pueblo, calle, dirección completa, datos postales y coordenadas inválidas.

## 2026-09-17 — Búsqueda general de ubicaciones

- El usuario pide una interacción de búsqueda como Google/Apple Maps. Se retiran filtros de país/bbox NZ y de tipo para admitir localidades, direcciones y lugares con nombre disponibles en Photon/OpenStreetMap a nivel mundial. País y código postal se incluyen en el contexto para distinguir resultados.
- El mismo campo admite coordenadas decimales latitud,longitud (también separadas con punto y coma): se validan y resuelven localmente, sin enviarlas al proveedor. No se inventan puntos para pares fuera de rango.
- Se conserva selección de sugerencias, sin mapa ni confirmación extra ni campo de precisión. La cobertura y disponibilidad del servicio público Photon no equivalen a Google/Apple ni se garantizan para cualquier dirección; ver https://github.com/komoot/photon.
- El cambio es frontend y no requiere nuevas columnas o migraciones.

### Restricción vigente: solo Nueva Zelanda

- El usuario corrige el alcance durante el trabajo: por ahora solo NZ. Se conserva todo tipo de dirección/localidad/lugar, pero se envía countrycode=NZ a Photon y se descartan resultados sin país NZ. La ampliación mundial anterior queda descartada.
- Coordenadas decimales y GPS del dispositivo se limitan a recintos regionales NZ principal y Chatham; estos recintos son una validación regional, no polígonos de frontera. La búsqueda textual usa el país del proveedor.
- Pruebas: NZ acepta ciudades, direcciones y museos; resultados extranjeros descartados; coordenadas de Madrid y cero/cero rechazadas; NZ/Chatham conservan sus decimales.
## 2026-09-17 — Búsquedas guardadas ausentes en Supabase

- La API real devuelve 200 para `products` y 404/PGRST205 para `saved_searches`: los anuncios y las búsquedas guardadas son recursos independientes. Recargar no puede crear la tabla ausente.
- Se añade `2026-09-17-saved-searches.sql`, idempotente, con FK a `auth.users`, límites de tamaño/cantidad, RLS por propietario, permisos solo para usuarios autenticados y recarga del esquema PostgREST.
- La interfaz muestra un mensaje no bloqueante y veraz cuando falta el servicio; la búsqueda y los resultados actuales siguen funcionando.
- La carga inicial de la home falla de forma silenciosa si solo falta `saved_searches`; el aviso aparece al intentar usar el botón de guardar, para no presentar listings sanos como si estuvieran rotos.
- La migración remota sigue pendiente de aplicar en el SQL Editor.
## 2026-09-17 — Contact seller abre Mensajes vacío

- La API real confirma que `chats` y `messages` existen, pero `start_conversation` devuelve 404/PGRST202 y `offers` devuelve 404/PGRST205. El enlace del anuncio era correcto; faltaba la parte de base de datos que crea/recupera el chat y la pantalla fallaba antes de seleccionarlo.
- Se añade `2026-09-17-messaging.sql`: crea de forma idempotente las piezas ausentes, instala la función transaccional `start_conversation`, evita conversaciones duplicadas, aplica RLS para que solo comprador y vendedor lean el chat/mensajes, restringe escritura y recarga PostgREST.
- El flujo esperado es una conversación persistente ya seleccionada, con cero mensajes y el cuadro de escritura visible. Crear el chat no envía ningún mensaje al vendedor.
- Pendiente aplicar la migración al Supabase remoto y verificar con dos cuentas reales.
- Decisión posterior del usuario: se elimina “Message seller” del perfil y la ruta de chat directo. La única entrada es Contact seller desde un anuncio; toda conversación requiere `product_id`, muestra View listing y permite ofertas. Chats directos históricos con `product_id` nulo no se muestran.
- Compatibilidad remota: la primera ejecución comunicada falló porque `messages` ya existía sin `read_at`; `CREATE TABLE IF NOT EXISTS` no amplía tablas existentes. La migración añade explícitamente `messages.read_at`, `messages.created_at` y `chats.updated_at` con `ADD COLUMN IF NOT EXISTS`. Al estar dentro de una transacción, la ejecución fallida anterior quedó revertida y se puede repetir el archivo completo.
## 2026-09-17 — Jerarquía y enlaces de la cabecera del chat

- View listing pasa a una fila superior y ocupa el ancho de las acciones; Make an offer queda debajo con botón ghost, texto y altura más discretos.
- La miniatura del anuncio enlaza a `/product/:id` con texto alternativo y foco; el nombre del otro participante enlaza a su perfil público. Los IDs proceden de los participantes del chat, no de texto visible manipulable.
### Chat estilo WhatsApp: fechas y confirmaciones de lectura (2026-09-17)

- La cabecera del chat compacta el bloque de anuncio/oferta: `View listing` reduce su padding, mantiene fondo blanco y una sombra suave para destacar sobre la oferta secundaria.
- Cada mensaje muestra únicamente una hora local legible, sin exponer el timestamp ISO completo. La conversación inserta separadores `Today`, `Yesterday` o la fecha correspondiente cuando cambia el día.
- Los mensajes enviados muestran un tic cuando han sido guardados y dos tics azules cuando `messages.read_at` confirma que el destinatario abrió la conversación.
- Al abrir un chat real, el cliente marca como leídos solo los mensajes recibidos que todavía no tienen `read_at`; las políticas RLS siguen limitando esta actualización al destinatario.
### Foto real del vendedor en el anuncio (2026-09-17)

- La tarjeta `Seller` de la ficha del anuncio muestra `public_profiles.avatar_url` cuando existe y conserva la inicial como fallback si el vendedor no ha subido foto.
- La carga del perfil admite tanto el propietario actual `products.user_id` como el campo heredado `seller_id` para no perder nombre, avatar ni reputación en anuncios antiguos.
### Contador real de ventas del perfil (2026-09-17)

- Se elimina `Listings` del resumen del perfil. Antes reutilizaba por error `profiles.total_sales` y daba una cifra que no representaba los anuncios visibles.
- `Sales` cuenta exclusivamente los anuncios reales con estado `sold`, manteniendo coherencia automática cuando cambia el estado de un anuncio.
### Anuncios relacionados en la ficha (2026-09-17)

- Debajo de `Seller`, la ficha muestra hasta tres anuncios públicos disponibles relacionados y excluye siempre el anuncio actual y los vendidos.
- La relevancia prioriza, por orden y peso: mismo tipo de vehículo, misma condición de vehículo camperizado, mismo modelo normalizado y misma marca. La comparación de modelo admite tanto `Hiace` como `Toyota Hiace`.
- La condición camperizada reutiliza los tipos del formulario (`campervan`, `motorhome`, `van`, `car-camper`) para evitar reglas contradictorias entre publicación, filtros y recomendaciones.
- En DEV se recomiendan únicamente datos mock; con una sesión normal se consultan únicamente productos reales de Supabase.
### Estados y borrado de anuncios propios (2026-09-17)

- El control `Self-contained` aparece junto a su fecha de expiración dentro del mismo bloque; en móvil ambos se apilan para conservar legibilidad.
- Al crear un anuncio, el preview permite únicamente `Active` o `Draft`. Los estados operativos posteriores se gestionan desde el menú del anuncio propio.
- Las tarjetas propias muestran distintivos `Draft` y `Paused`. Un borrador ofrece `Activate listing` en el menú de tres puntos.
- El menú propio incluye `Delete listing` y siempre abre una confirmación explícita antes de borrar. La consulta filtra por `user_id`, además de la política RLS que solo permite eliminar al propietario.
- En DEV el borrado solo modifica el catálogo mock de la sesión y nunca toca Supabase.
### Adjuntos, cierre de venta y reseñas verificadas (2026-09-17)

- El Inbox deja crecer el contenido de cada conversación y solo muestra scroll vertical cuando la lista supera el alto disponible.
- Los participantes pueden adjuntar JPEG, PNG, WebP, PDF o Word hasta 10 MB. Los archivos viven en el bucket privado `chat-attachments`; las URLs son temporales y las políticas de Storage verifican que quien accede participa en el chat.
- El vendedor puede usar `Mark as sold` desde la cabecera. La función SQL `mark_listing_sold` verifica que sea el vendedor, marca el producto como `sold` y registra `chats.sold_at`.
- Tras completar la venta, comprador y vendedor pueden emitir una única valoración mutua de 1 a 5 estrellas vinculada al chat y al anuncio. La base de datos impide reseñas sin venta o dirigidas a terceros.
- Las valoraciones recibidas aparecen en `Reviews` del perfil y un trigger recalcula la media pública del usuario.
- Migración requerida: `supabase/2026-09-17-chat-completion.sql`.
### Pantalla de carga con branding (2026-09-17)

- `LoadingScreen` reutiliza el símbolo de Swapy: el cuadrado y el nombre permanecen estables mientras las dos flechas giran. Respeta `prefers-reduced-motion` sustituyendo el giro por un pulso.
- Se usa como fallback global de rutas diferidas, durante la comprobación de sesión y durante la carga inicial de la portada.
- La lista de resultados de la home reutiliza el mismo loader mientras obtiene y prepara los anuncios, manteniendo visibles el buscador y los filtros.
- El Inbox mantiene un estado `chatsLoading` independiente: mientras consulta Supabase muestra el loader y solo enseña `No conversations yet` después de confirmar que la bandeja está realmente vacía.
### Compatibilidad del chat antes de aplicar migraciones (2026-09-17)

- La carga principal de `messages` y `offers` ya no depende de que existan `reviews` o `chats.sold_at`: si la migración de cierre de venta aún no se ha aplicado, el historial y el envío de texto continúan funcionando.
- Los mensajes sin adjunto envían únicamente las columnas históricas; las columnas de adjuntos se incluyen solo cuando el usuario selecciona un archivo.
- Los fallos temporales del refresco automático no muestran un aviso global ni sustituyen el contenido de la conversación.
- Las filas del Inbox ocupan el ancho completo y no reservan un margen permanente para el scrollbar; la barra aparece únicamente cuando hay desbordamiento vertical.
### Compatibilidad con la tabla legacy `reviews` (2026-09-17)

- La base remota ya contenía una tabla `reviews` anterior sin `chat_id`, lo que hacía fallar la migración de cierre de venta con PostgreSQL `42703`.
- `2026-09-17-chat-completion.sql` ahora añade con `IF NOT EXISTS` los campos transaccionales que falten, migra `reviewed_id` a `reviewed_user_id` sin borrar reseñas antiguas y crea el índice único solo para reseñas vinculadas a un chat.
- La migración elimina las políticas legacy antes de crear las verificadas; así una política antigua no puede permitir reseñas sin una venta completada.
- El archivo permanece dentro de una transacción: la ejecución fallida anterior se revirtió y se puede ejecutar de nuevo completo.
### Esquema remoto real recibido del usuario (2026-09-17)

- Fuente de verdad guardada en `docs/REMOTE_DATABASE_SCHEMA_2026-09-17.sql`. Es una fotografía de contexto y no debe ejecutarse como migración.
- `reviews` es una tabla híbrida: conserva `reviewed_id` y ya contiene `chat_id` y `reviewed_user_id`. Toda migración debe ampliar y migrar datos con `ADD COLUMN IF NOT EXISTS`, nunca asumir una tabla nueva.
- `messages` contiene tanto `is_read` como `read_at`, además de las cuatro columnas de adjuntos. El frontend actual usa `read_at`; no debe eliminarse `is_read` sin una migración explícita de datos.
- `chats` contiene `last_message`, `last_message_at`, `updated_at` y `sold_at`; `buyer_id` y `seller_id` aparecen anulables en el esquema remoto aunque el flujo actual exige ambos participantes.
- `products` usa los campos camelCase del frontend y coordenadas `lat/lng`; no contiene `location_confirmed`, `location_source` ni `location_accuracy_m`. El modelo vigente de ubicación depende solo de nombre resuelto y coordenadas válidas.
- Las FK remotas mostradas no declaran acciones `ON DELETE` para `product_images`, `chats`, `reviews` o `reports`. Antes de ampliar el borrado de anuncios debe contemplarse esta diferencia para no provocar errores por referencias existentes.
- `favorites.product_id` continúa siendo `text` y no muestra FK a `products`; no se debe asumir tipo UUID en consultas o migraciones sin alinear primero los datos existentes.
- Las vistas, funciones, triggers, índices, grants, buckets y políticas RLS no aparecen en este volcado de tablas. Deben auditarse por separado cuando una funcionalidad dependa de ellos.
- Auditoría cruzada con el frontend: `docs/DATABASE_SCHEMA_AUDIT.md`. Los riesgos prioritarios son borrados bloqueados por FK, nulabilidad de participantes, falta visible de checks GPS/unicidad de chats, favoritos sin FK, timestamps mezclados y doble fuente de imágenes.
### Alineación integral del esquema remoto (2026-09-17)

- Se añade `supabase/2026-09-17-remote-schema-alignment.sql`, ejecutable después de las migraciones de mensajería y cierre de venta. Se validó ejecutándolo dos veces seguidas para garantizar repetibilidad.
- Los borrados quedan definidos: imágenes y favoritos se eliminan con el anuncio; chats y reseñas conservan el historial poniendo `product_id` a `NULL`; mensajes y ofertas se eliminan con su chat; los datos privados dependientes se eliminan con la cuenta.
- `favorites.product_id` pasa de texto a UUID después de limpiar IDs mock y huérfanos, y obtiene FK real a `products`. Esto evita volver a guardar favoritos inexistentes.
- Se normalizan fechas legacy a `timestamptz`, se protegen los rangos y pares de coordenadas y se impide publicar sin ubicación válida. Los checks `NOT VALID` bloquean datos nuevos incorrectos sin ocultar que puede haber filas antiguas que revisar.
- Se sincronizan temporalmente `reviews.reviewed_id/reviewed_user_id` y `messages.is_read/read_at`, evitando romper clientes o datos legacy durante la transición.
- El último mensaje y su fecha se derivan al insertar mensajes. `profiles.total_sales` se recalcula exclusivamente desde anuncios `sold`, incluido el backfill inicial y posteriores cambios de estado o propietario.
- La tabla/política de `support_requests` queda alineada con el formulario real (`topic`) y limitada al usuario autenticado que crea la solicitud.
- La prueba de base comprueba aislamiento entre cuentas, publicación GPS, mensajería, ofertas, venta, reseñas, favoritos, contador de ventas y borrado de anuncios conservando el historial. Resultado: 27/27 pruebas.
- La base remota rechazó inicialmente el cambio de tipo de `profiles.created_at` porque `public_profiles` depende de esa columna (`0A000`). La migración captura esa dependencia y omite únicamente la conversión afectada, preservando la vista; al estar toda la ejecución fallida dentro de `BEGIN/COMMIT`, se puede repetir el archivo corregido completo.
### Loader completo en Messages y Likes (2026-09-17)

- `Messages` y `Saved vehicles` muestran ahora el loader de Swapy a página completa mientras cargan sus datos iniciales, igual que `Profile`.
- La cabecera, los contadores vacíos y los paneles del Inbox solo aparecen cuando la consulta ha terminado, evitando saltos visuales y estados vacíos momentáneos.
- La página de `Messages` incluye el Footer global debajo del Inbox una vez cargado, igual que el resto de las páginas principales.
### Teselas del mapa bloqueadas en Vercel (2026-09-17)

- OpenStreetMap devolvía imágenes 403 porque `vercel.json` enviaba `Referrer-Policy: no-referrer`; el servidor de teselas exige un referente válido para identificar sitios web.
- La política pasa a `strict-origin-when-cross-origin`: las teselas reciben únicamente el origen público de Swapy, mientras las rutas y parámetros de navegación continúan ocultos a dominios externos.
- Como el dominio desplegado continuó recibiendo 403 después de corregir el referente, la home deja de solicitar teselas a los servidores comunitarios de OSM. Leaflet usa CARTO Positron (`basemaps.cartocdn.com`) como mapa base para los marcadores y conserva atribuciones visibles a OpenStreetMap y CARTO.
### Variables de Supabase en Vercel (2026-09-17)

- El despliegue del commit `368684d` se detuvo correctamente porque el entorno de Vercel no proporcionó una URL HTTPS y una clave pública de Supabase válidas al build.
- La validación de Vite mantiene el bloqueo de seguridad y ahora distingue entre URL ausente o inválida y clave pública ausente o inválida. No se permite `service_role` ni ninguna clave `sb_secret_` en variables expuestas al navegador.
- Vercel debe definir `VITE_SUPABASE_URL`, `VITE_SUPABASE_KEY` y `VITE_SITE_URL` para Production y Preview si se despliegan ramas; cambiar variables requiere un nuevo deployment.
- La integración existente de Vercel ya proporciona `SUPABASE_URL` y `SUPABASE_ANON_KEY`. El build y el cliente aceptan ahora esos dos nombres además de los alias `VITE_*`; `envPrefix` enumera únicamente ambas variables públicas y nunca expone el prefijo completo `SUPABASE_`, la contraseña Postgres, `service_role` ni secretos.
- Se recupera el comportamiento anterior para ramas Preview sin base enlazada: la ausencia total de Supabase no bloquea la compilación y el cliente muestra servicio no disponible. Si aparece cualquiera de las dos variables, el build exige el par completo, HTTPS y una clave pública válida; Production sigue usando las variables de su integración.

## 2026-09-18 — Fondo de mapa configurable

- Sustituido CARTO sin clave por OpenFreeMap Positron mediante MapLibre y su adaptador Leaflet, cargados bajo demanda. Se conservan precios, fichas y coordenadas.
- VITE_MAP_STYLE_URL permite cambiar a otro estilo compatible; los dominios nuevos deben autorizarse en CSP. Worker empaquetado localmente. Guía: docs/maps.md.
- Añadidos aviso de fallo, reintento y ajuste al tamaño del contenedor. OpenFreeMap no ofrece SLA ni se ha configurado failover. Photon sigue siendo independiente y requiere evaluación antes de escalar.
- Validación local: build y lint correctos, 27 pruebas pasan; mapa con 78 anuncios mock, zoom y popup comprobados en navegador. No desplegado ni sometido a prueba de carga.
