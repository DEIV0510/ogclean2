# OGCLEAN

Tienda de gorras y calzado multimarca con envíos a toda Colombia.

**La tienda en línea es https://ogcleann.com** (WordPress + WooCommerce + Mercado Pago, alojada en Hostinger).
`ogclean.vercel.app` redirige ahí con 301 para que Google y los visitantes lleguen a una sola tienda.

## Qué es este repositorio

El diseño original del sitio en HTML, CSS y JavaScript (sin compilar). De estos archivos se genera el tema
«OGCLEAN» de WordPress. Los productos de `js/data/` son el catálogo con el que se cargó la tienda:
**los productos y precios vigentes viven en WooCommerce**, no aquí.

## Actualizar productos y precios

Se hace en el panel de WordPress: https://ogcleann.com/wp-admin (o en Hostinger: hPanel → «Admin WordPress»).
La tienda se actualiza sola al guardar.

| Quiero… | Dónde |
| --- | --- |
| Cambiar un precio | Productos → abrir el producto → «Precio normal» → Actualizar |
| Poner una oferta | Mismo lugar → «Precio rebajado» (la tienda muestra el precio anterior tachado) |
| Agregar un producto | Productos → Añadir nuevo: nombre, precio normal, foto principal y categoría. En «Datos del producto» → General, el bloque OGCLEAN: variante o color, tallas disponibles, género (calzado) y liga (gorras). La marca va en «Marcas» |
| Marcar una talla agotada | Abrir el producto → desmarcarla en «Tallas disponibles» |
| Marcar un producto agotado | Abrir el producto → Inventario → Estado del inventario → Agotado (sale de la tienda) |

## Pedidos, envío y pagos

- **Pedidos:** WooCommerce → Pedidos. «Procesando» = ya pagó → empacar y enviar → cambiar a «Completado».
- **Envío:** WooCommerce → Ajustes → Envío → zona «Colombia» (tarifa fija). Las preguntas frecuentes, Términos y el carrito muestran ese valor solos.
- **Pagos:** WooCommerce → Mercado Pago (cuenta vinculada, modo de cobros reales).
- **Modo de compra** (pago en línea o pedido por WhatsApp): Productos → Ajustes OGCLEAN.

**No cambiar** WooCommerce → Ajustes → General (vender y enviar solo a Colombia) ni usar el asistente
«Continuar la configuración» de Hostinger: el 20 de octubre de 2026 vació la lista de países y nadie podía pagar.
Si el panel muestra el aviso rojo «OGCLEAN: los clientes no pueden pagar en la tienda», corregir lo que indica.

## Ver este diseño en el computador

```
node serve.js
```

Abre http://localhost:5321. Es solo para desarrollo: no sirve archivos ocultos (`.git`) ni fuera de esta carpeta.

## Pruebas

```
npm test
```

Revisa sin instalar nada (Node 20 o más nuevo): que el catálogo tenga ids únicos, tallas, precios válidos y
todas sus fotos; que la búsqueda escriba como texto lo que llega en la dirección; que `serve.js` no se caiga
con direcciones raras ni entregue `.git` o archivos de fuera; y que `vercel.json` redirija a ogcleann.com.
Correrlas antes de subir cambios.

## Seguridad

- La búsqueda de la tienda (`?q=`) se escribe como texto, nunca como HTML.
- Cabeceras de seguridad: `vercel.json` (junto con la redirección) y el plugin «OGCLEAN Tienda» en WordPress
  (HSTS, nosniff, la tienda no se deja enmarcar en otras páginas).
