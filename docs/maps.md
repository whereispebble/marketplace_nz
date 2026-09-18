# Mapas y cambio de proveedor

El fondo usa OpenFreeMap (estilo Positron), mediante MapLibre y su adaptador
para Leaflet. Los anuncios, precios y coordenadas siguen siendo datos propios.
La búsqueda de direcciones usa Photon y es un servicio independiente.

## Configuración y despliegue

Sin variables adicionales se usa https://tiles.openfreemap.org/styles/positron.
Para migrar a otro proveedor compatible con estilos MapLibre:

1. Contratar el servicio y obtener la URL HTTPS de su estilo JSON.
2. Definir `VITE_MAP_STYLE_URL` en el entorno local o en Vercel. Si contiene una
   clave, debe ser pública y estar restringida a los dominios de la aplicación.
3. Autorizar en `connect-src` de `vercel.json` todos los dominios que utiliza
   el estilo (JSON, teselas, fuentes y sprites). Mantener la atribución exigida.
4. Volver a compilar/desplegar y comprobar carga, zoom, precios y fichas.

Un proveedor con formato o autenticación diferente puede requerir adaptar la
integración. El cambio del fondo no exige migrar los anuncios ni sus coordenadas.

## Disponibilidad y crecimiento

OpenFreeMap permite uso comercial y anuncia uso gratuito sin límite de
solicitudes, pero no ofrece SLA: https://openfreemap.org/.
No se debe prometer disponibilidad garantizada con esta instancia pública.
Antes de necesitar garantías, contratar un proveedor compatible con SLA o
alojar la infraestructura propia con redundancia y monitorización.

El mapa carga bajo demanda y muestra un error con reintento ante fallos. No
existe un proveedor secundario contratado ni failover automático. La vista de
lista sigue disponible si falla el fondo. Supervisar errores, latencia y volumen
de peticiones reales antes de aumentar el tráfico. Una prueba local no es una
prueba de carga del servicio público.

El autocompletado de Photon requiere una evaluación separada de capacidad antes
de escalar: cambiar el fondo no cambia sus límites ni garantiza su disponibilidad.
