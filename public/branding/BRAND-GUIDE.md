# Swapy — Your next chapter starts here.

Propuesta de identidad · 18 septiembre 2026

## Idea de marca

Swapy conecta el final de un viaje con el comienzo del siguiente. Un marketplace de vehículos en Nueva Zelanda cercano, joven y claro. La energía viene de las personas y del viaje; la profesionalidad, de una interfaz ordenada y mensajes precisos.

Personalidad: optimista, directa, abierta y práctica. Hablar de tú, con frases cortas y sin exagerar. No prometer seguridad, verificación o garantías que el producto no ofrezca.

## Sistema visual

Se conserva el logotipo existente de Swapy y sus flechas de intercambio. Dejar alrededor un espacio equivalente a la mitad del símbolo. No deformarlo, añadir sombras ni colocarlo sobre fotografía con mucho detalle.

| Color | Código | Uso |
| --- | --- | --- |
| Menta | #14BC7D | Identidad, acentos, botones con texto oscuro |
| Bosque | #101815 | Titulares y contraste |
| Blanco cálido | #F3F7F1 | Fondo principal |
| Blanco | #FFFFFF | Tarjetas y formularios |
| Verde profundo | #0A8F5D | Botones con texto blanco |
| Azul petróleo | #1F7A8C | Enlaces y detalles secundarios |

Usar aproximadamente 70% de neutros, 20% de tonos oscuros y 10% de acentos. Inter como familia tipográfica: titulares 700–800, texto 400–500 y botones 600–700. Titulares breves, espacio generoso, bordes redondeados de 16–24 px y sombras discretas. Comprobar contraste en cada uso real, especialmente sobre fotografías.

## Mensajes para la web

- Lema: **Your next chapter starts here.**
- Home: **Find your ride. Start your story.**
- Apoyo: **Explore campervans and vehicles for your next New Zealand adventure.**
- Botón principal: **Explore vehicles**
- Vendedores: **Pass on the keys. Keep the memories.**
- Botón de publicación: **List your vehicle**

## Imágenes entregadas

| Archivo | Uso recomendado | Composición |
| --- | --- | --- |
| swapy-coast-hero.png | Banner principal de home | Texto a la izquierda; vehículo a la derecha |
| swapy-community-banner.png | Comunidad, presentación o sección de venta | Texto sobre zona tranquila izquierda; viajeros a la derecha |
| swapy-mint-background.png | Login, registro y fondos de campañas | Formulario sobre tarjeta clara; centro despejado |

Los tres originales son PNG de 1536 × 1024. Fotografía generada con IA, inspirada en Nueva Zelanda; no representa anuncios reales ni lugares documentados. No usarla como fotografía de vehículos en venta. Los textos y botones deben añadirse como elementos HTML, no incrustarse en las imágenes.

Integración de prueba: home con costa, How it works y publicación con comunidad, y login/registro/recuperación con fondo menta. Se mantiene la distribución del buscador y una capa oscura para leer sus textos. El encuadre móvil prioriza el lateral derecho. Se usan versiones WebP optimizadas (319 KB, 232 KB y 57 KB aproximadamente); los PNG originales y las fotos anteriores de `src/assets` se conservan.

## Generación y prompts

### Variante soft v3 — banner actual

`swapy-soft-background-v3.png` y versión web `swapy-soft-background-v3.webp`. Generada con image_gen integrado; 1672×941. Composición simplificada de origen, sin capa blanca añadida en CSS. Todas las versiones anteriores conservadas.

Prompt: Single finished website banner background for Swapy, modern youthful professional travel brand. Very subtle minimalist abstract composition, wide landscape 16:9. Warm off-white occupies 80 percent of the canvas. Only two or three broad gently undulating matte paper-like layers along the lower edge and far right, with very low relief, muted pale sage green, dusty pale blue and desaturated light turquoise. Broad quiet horizontal center, generous empty space. Restrained editorial design, softly diffused light, barely perceptible paper texture, feather-soft shadows. No saturated colours, no dramatic sculptural ribbons, no spirals, no sweeping high contrast waves, no busy framing on every edge. No mountains, landscape, sea, objects, text, logos or UI. The forms themselves should be sparse, simple and subtle, not a vivid image with a white overlay. Request high resolution 3840x2160.

### Variante ocean v2 integrada en Home

Archivo: `swapy-ocean-background-v2.webp`, original `swapy-ocean-background-v2.png`. Paleta azul, verde, turquesa y blanco; buscador con cristal oscuro translúcido. Resolución real 1672×941, WebP de 105 KB. Se solicitó 4K y se reintentó, pero la herramienta integrada devolvió el mismo tamaño; no se presenta como 4K. Las variantes anteriores siguen conservadas.

Prompt final de la imagen seleccionada: Create a high resolution 3840x2160 landscape website hero background for Swapy, a youthful modern professional travel marketplace. Abstract premium sculptural flowing ribbons and layered coastal hill forms, refined matte paper texture with subtle soft shadows. Palette: warm white #F3F7F1, vivid mint green #14BC7D, turquoise #28C7C5, ocean blue #287CB5, small deep teal accents. Broad graceful curves concentrated along the bottom and right edges, smaller blue curves on the far left edge, very pale white and pale aqua spacious CENTER area for dark heading and translucent glass search bar added later. Keep center quiet and bright; let turquoise blue and green colours be clearly visible across outer third of composition. Elegant tactile editorial 3D illustration, fresh contemporary professional design, not overly busy, finely resolved texture. Entire single continuous image, no text, no logo, no UI, no watermark, no collage. Designed for wide banner cropping with coloured forms visible in middle horizontal band as well as edges.

Generadas con la herramienta integrada image_gen, sin referencias de terceros. Prompts finales empleados:

### Costa

Create a premium photorealistic website hero banner for Swapy, a youthful modern professional New Zealand campervan marketplace. Wide panoramic 3:2 image suitable for cropping to 2.4:1. Beautiful coastal New Zealand landscape with deep teal sea, rolling green headlands, soft warm late afternoon sun. A tasteful unbranded off-white compact campervan parked safely in a scenic gravel turnout on the RIGHT third, fully visible, realistic wheels and geometry. Left 55 percent is calm low-detail ocean and hazy sky with abundant negative space for a dark headline added later. Fresh editorial travel campaign photography, natural restrained colours with mint-green landscape accents, warm ivory, deep forest greens, subtle film texture, crisp premium quality, aspirational but approachable. No text, no logos, no watermarks, no collage, no UI. Generate a single finished banner.

### Comunidad

Use case ads-marketing. Single photorealistic landscape banner for Swapy New Zealand campervan marketplace, youthful modern professional editorial campaign. Two casually dressed young adult travellers seen at medium distance from behind standing beside the open sliding door of a simple unbranded cream campervan at an established lakeside campsite, vehicle and people entirely in RIGHT 45 percent. Turquoise alpine lake and Southern Alps inspired distant mountains, fresh bright soft daylight, relaxed authentic spontaneous travel moment, tasteful mint green clothing accent. LEFT half is quiet lake and atmospheric pale sky with negative space for a heading added in the website. Wide 3:2 composition, premium natural photography, restrained teal mint ivory forest palette, realistic anatomy and vehicle. No text, no logo, no watermark, no collage, no graphics.

### Fondo

Use case ads-marketing. Create a single premium abstract brand background for Swapy, youthful modern professional New Zealand travel and campervan marketplace. Landscape 3:2 canvas. Warm off-white #F3F7F1 dominates center and left two-thirds as very quiet negative space for website login form or editorial text. Along bottom and right edges only, elegant broad flowing sculptural ribbons suggesting winding roads and rolling coastal hills, matte mint #14BC7D, pale sage and small deep forest #101815 accents. Sophisticated restrained tactile paper-like 3D editorial design, subtle fine grain and soft ambient shadows, fresh playful energy but business-quality minimal composition. No literal roads or cars, no map symbols, no typography, no logo, no watermark, no panels, no collage. Large clean quiet center. Finished usable background image.
