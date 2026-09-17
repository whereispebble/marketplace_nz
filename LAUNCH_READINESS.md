# Preparación de lanzamiento — 17 de septiembre de 2026

## Estado

**No declarar la aplicación lista para producción todavía.** El código local incluye
las correcciones; las migraciones no se han aplicado al proyecto Supabase remoto y
no se ha desplegado esta versión. El frontend nuevo depende de las migraciones nuevas.

## Modelo de ubicación vigente

El formulario guarda localidades y lat/lng, sin location_accuracy_m, location_confirmed ni location_source. No necesita crear estos campos en la base antigua. Si se aplicaron las migraciones de ubicación anteriores, ejecutar 2026-09-17-simple-location.sql al final; elimina la precisión y adapta las restricciones sin omitir la validación de coordenadas. No aplicar publication-location.sql por separado como reparación del frontend actual.

## Cambios y validación

- Detalle en `PROJECT_MEMORY.md`, entrada 2026-09-17.
- `npm test`: PostgreSQL real en memoria mediante PGlite, con infraestructura mínima
  auth/storage para simular los roles de Supabase. Comprueba aislamiento entre tres
  usuarios, perfiles privados, conversaciones idempotentes, mensajes, ofertas,
  favoritos, búsquedas, soporte y validación de ubicación. Ejecuta la migración nueva
  dos veces para comprobar que puede repetirse. No simula el servicio Storage ni Auth.
- `npm run lint`: revisión estática de la aplicación.
- `npm run build`: paquete de producción y validación de configuración pública.
- `npm audit`: auditoría de dependencias. Resultado durante esta intervención: cero
  vulnerabilidades conocidas tras actualizar dependencias compatibles.
- Navegador local: mapa con cartografía y marcadores; edición DEV con buscador compacto de dirección, sin mapa ni confirmación. No equivale a una prueba completa con cuentas reales.
- API configurada en `.env`, solo lectura: `public_profiles` disponible; consultas
  anónimas a perfiles privados/mensajes/chats/favoritos devuelven cero filas; `offers`
  devuelve 404. Dos anuncios públicos muestreados tienen coordenadas dentro de rango.
  No se han probado permisos autenticados en ese proyecto ni la exactitud física.

## Aplicación en una base existente

1. Obtener copia de seguridad y verificar restauración. Usar primero un proyecto de
   pruebas representativo. No pegar claves service_role en variables VITE/NEXT_PUBLIC.
2. Ejecutar `supabase/2026-09-17-preflight.sql` en lectura y revisar resultados.
3. Comparar el esquema existente. Aplicar `2026-09-17-schema-compat.sql` si corresponde;
   después aplicar `2026-09-17-launch-hardening.sql` completo,
   `2026-09-17-location-search.sql`, `2026-09-17-simple-location.sql`,
   `2026-09-17-messaging.sql`, `2026-09-17-chat-completion.sql` y finalmente
   `2026-09-17-remote-schema-alignment.sql`. La migración principal
   usa una transacción. No ejecutar bloques sueltos para “saltarse” un error.
4. Si hay IDs mock, informes inválidos, coordenadas incompletas, nombres duplicados
   o referencias huérfanas, resolver cada caso sobre copia de seguridad. La migración
   no borra ni corrige estas filas por su cuenta.
5. El propietario de cada anuncio antiguo debe seleccionar una localidad o usar GPS
   desde su perfil. Hasta entonces, esos anuncios quedan fuera de las lecturas públicas.
   Los borradores no necesitan ubicación completa, pero no pueden publicarse así.
6. Validar las restricciones pendientes, indicadas al final de `preflight.sql`, cuando
   estén reparados los datos históricos. Revisar también conversaciones antiguas cuyo
   seller_id no corresponda al dueño del anuncio.
7. Desplegar frontend y cabeceras después de la migración. Mantener versión anterior
   disponible para un rollback planificado; no reaplicar políticas históricas para
   deshacer cambios porque podría reabrir accesos.

**No ejecutar indiscriminadamente `2026-09-align-with-frontend.sql` en producción:**
es un script histórico que depende de tablas externas al esquema inicial y contiene
borrados de anuncios sin propietario. No forma parte de la secuencia nueva probada.
Tampoco reaplicar las políticas antiguas después de las nuevas: son más permisivas.

## Base vacía: secuencia comprobada en las pruebas

1. `swapy-persistence.sql`
2. `2026-08-extra-filters.sql`
3. `2026-08-user-reports.sql`
4. `2026-09-17-schema-compat.sql`
5. `2026-09-security-and-integrity.sql`
6. `2026-09-username-uniqueness.sql`
7. `2026-09-17-launch-hardening.sql`
8. `2026-09-17-location-search.sql`
9. `2026-09-17-publication-location.sql`
10. `2026-09-17-simple-location.sql`
11. `2026-09-17-messaging.sql`
12. `2026-09-17-chat-completion.sql`
13. `2026-09-17-remote-schema-alignment.sql`

La base Supabase ya debe proporcionar sus esquemas `auth` y `storage` y sus roles.
La emulación de pruebas no debe copiarse a Supabase.

## Pruebas imprescindibles en staging

Con vendedor A, comprador B, tercero C y visitante anónimo:

- Registro, confirmación por correo, contraseña incorrecta, inicio/cierre de sesión,
  recuperación de cuenta y proveedores OAuth realmente configurados.
- Publicar con localidad seleccionada o GPS; bloquear texto sin seleccionar y coordenadas
  nulas, vacías o fuera de rango. Cambiar el texto invalida la selección previa.
- Confirmar anuncios históricos. Verificar que un tercero no puede ver borradores
  ni anuncios con ubicación pendiente mediante la API, aunque conozca el UUID.
- Publicar/editar fotos y reordenarlas; simular fallo de red a mitad de subida.
  Confirmar que no se publica un anuncio parcial ni se duplican anuncios al reintentar.
- Contactar desde ficha, perfil y después de iniciar sesión; enviar y recibir mensajes
  con dos navegadores; probar rechazos de remitente falsificado e ID de chat ajeno.
- Crear oferta, recargar y aceptarla como vendedor; rechazar intento del comprador
  de aceptarla o modificar importe/participantes.
- Favoritos y búsquedas persisten en la cuenta, no aparecen en otra. Alternar DEV/real
  localmente y comprobar que no hay peticiones REST/Storage reales durante DEV.
- Denuncia y soporte: confirmar filas privadas y errores visibles cuando falla la API.
- Revisar móvil, teclado, mapa, geocodificación, red lenta y almacenamiento bloqueado.
- Confirmar en el despliegue las cabeceras CSP/HSTS y que OAuth, mapas y fotos siguen
  funcionando. `vite preview` no aplica por sí solo las cabeceras de Vercel.

## Pendiente antes de lanzar

- Acceso a staging y aplicación real de migraciones; no se recibió un proyecto de
  pruebas ni acceso administrativo en esta intervención.
- Configuración Supabase de confirmación de email, contraseñas filtradas, SMTP,
  proveedores OAuth y URLs de retorno. No se verificó desde el panel administrativo.
- Probar el nuevo flujo de recuperación con correo real y añadir `/reset-password`
  a los redirects permitidos de Supabase. No se enviaron correos de prueba.
- Antispam/rate limiting y observabilidad con alertas del servidor. Las validaciones
  de campos y RLS no sustituyen límites de abuso. Revisión humana de denuncias/soporte.
- Revisar datos legales reales (la web aún contiene NZBN y domicilio pendientes).
- Prueba de carga: las listas se leen con el límite configurado de PostgREST y el chat
  hace polling cada 4 segundos mientras está abierto; no se ha dimensionado producción.
- Retención y limpieza de archivos huérfanos; fotos/avatares siguen en buckets públicos.
  No son un lugar para documentos privados, y conocer la URL permite leer el archivo.
- Las coordenadas se guardan sin aproximarlas a la ciudad. La aplicación no puede
  demostrar la ubicación física del vehículo: la elige el vendedor mediante dirección o GPS. Una dirección representa un inmueble.
  Más decimales no garantizan más exactitud del GPS.

## URLs y privacidad

HTTPS cifra el transporte. UUID evita IDs secuenciales y RLS verifica autorización
independientemente de conocer la URL. No hay “cifrado de URL” que sustituya estos
controles. Las contraseñas pertenecen a Supabase Auth; los mensajes no tienen cifrado
extremo a extremo y un administrador del servicio puede acceder a ellos.

## Resultado local final

27 pruebas superadas, lint correcto y build de producción correcto. `git diff --check`
sin incidencias. La versión compilada no incluye el módulo de vehículos mock.
