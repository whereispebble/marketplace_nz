# Auditoría del esquema remoto — 2026-09-17

El frontend y las tablas coinciden en los nombres principales, pero el esquema no está completamente alineado ni endurecido para lanzamiento.

## Corrección preparada

La migración `supabase/2026-09-17-remote-schema-alignment.sql` corrige los puntos aplicables de esta auditoría sobre el esquema remoto recibido: acciones de borrado, favoritos UUID con FK, fechas UTC, coordenadas, participantes, compatibilidad de reseñas y lectura de mensajes, resumen del Inbox, contador derivado de ventas, soporte e índices. Puede repetirse sin duplicar objetos y se ha ejecutado dos veces seguidas en PostgreSQL de pruebas.

Si una fecha legacy está expuesta por una vista de PostgreSQL, la conversión a `timestamptz` se omite con un aviso. Alterar el tipo directamente invalidaría vistas como `public_profiles`; conservar la vista y su contrato público tiene prioridad. Esas columnas pueden migrarse posteriormente recreando la vista en una ventana de mantenimiento.

Los checks históricos se crean como `NOT VALID`: protegen inmediatamente todas las inserciones y modificaciones nuevas, pero permiten revisar primero las filas antiguas. La consulta final de la migración enumera exactamente las filas que deben repararse antes de validar esas restricciones.

## Cambios prioritarios

1. **Borrado de anuncios.** Las FK de `product_images`, `chats`, `reviews` y `reports` no muestran acciones `ON DELETE`. Un producto con referencias puede impedir `Delete listing`. Conviene usar cascade para imágenes, `SET NULL` para chats/reseñas/reportes y conservar el historial.
2. **Integridad de ubicación.** `products` contiene `lat/lng`, pero el volcado no muestra checks de rango ni la regla que impide publicar sin coordenadas. Deben existir `products_coords_check` y `products_published_location_check`.
3. **Chats y mensajes.** `buyer_id`, `seller_id`, `messages.chat_id` y `messages.sender_id` aparecen anulables, aunque el frontend y las políticas asumen que siempre existen. La migración impide nuevas filas incompletas mediante checks; las filas históricas devueltas por el diagnóstico deben corregirse antes de convertir físicamente las columnas a `NOT NULL`.
4. **Conversaciones duplicadas.** El volcado no muestra unicidad para `(product_id,buyer_id,seller_id)`. Debe existir una constraint o índice único para que `start_conversation` sea realmente idempotente.
5. **Reseñas legacy.** Coexisten `reviewed_id` y `reviewed_user_id`. El frontend usa el segundo. Tras migrar los datos antiguos debe retirarse el primero en una fase posterior, no inmediatamente.
6. **Favoritos.** `favorites.product_id` es `text` y no tiene FK. Esto permite favoritos huérfanos. Debe convertirse a UUID solo después de limpiar IDs mock/antiguos y añadirse FK con `ON DELETE CASCADE`.
7. **Fechas.** Varias fechas usan `timestamp without time zone`, mientras otras usan `timestamptz`. Para mensajes, chats, productos y perfiles conviene normalizar a `timestamptz` con una zona de origen explícita.
8. **Doble fuente de imágenes.** `products.image/images` y `product_images` duplican información. El trigger `sync_product_images` debe existir y ser la única vía de sincronización, o una de las dos representaciones debe eliminarse más adelante.

## Elementos no visibles en el volcado

Este archivo no demuestra la existencia o corrección de RLS, grants, vistas (`public_profiles`, `public_reviews`), funciones (`start_conversation`, `mark_listing_sold`), triggers, índices parciales ni buckets de Storage. Deben auditarse por separado antes del lanzamiento.

## Compatibilidad actual del frontend

- Coinciden `products`, `profiles`, `chats`, `messages`, `offers`, `saved_searches`, `user_reports` y sus columnas usadas directamente.
- El frontend depende además de `public_profiles`, `public_reviews`, `support_requests`, los buckets `avatars`, `product-images`, `chat-attachments` y las dos funciones RPC citadas arriba.
- El modelo de ubicación vigente usa nombre resuelto y `lat/lng`; no requiere `location_accuracy_m`, `location_confirmed` ni `location_source`.
