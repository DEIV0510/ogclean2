/* Vista previa de la tienda en el inicio: accesos por categoría y salto a tienda.html.
   (La fila de productos «Una muestra de la tienda» se quitó el 2026-10-21 y el bloque «Comprar por marca»
   el 3-nov, pedidos del dueño: en el inicio solo van las categorías.) */

import { qs } from '../utils/dom.js';
import { TODOS } from '../data/products.js';

const enlace = (params) => `tienda.html?${new URLSearchParams(params).toString()}`;

export function initTiendaPreview() {
  const cats = qs('#previewCategorias');
  if (!cats) return;

  const cuenta = (g) => TODOS.filter((p) => p.grupos.includes(g)).length;

  const portada = {
    'Gorras cerradas': 'assets/img/caps/yankees-negro-oro-sm.webp',
    'Gorras ajustables': 'assets/img/gorras/los-angeles-dodgers-naranja-pespunte-sm.webp',
    'Básquetbol': 'assets/img/zapatos/jordan-air-jordan-4-blanco-rosa-sm.webp',
    'Zapatillas hombre': 'assets/img/zapatos/nike-dunk-low-blanco-negro-sm.webp',
    'Zapatillas dama': 'assets/img/zapatos/on-cloud-crema-rosa-sm.webp',
    Botas: 'assets/img/zapatos/timberland-bota-6-trigo-monograma-sm.webp',
    Guayos: 'assets/img/zapatos/nike-phantom-celeste-negro-fucsia-sm.webp',
    Zuecos: 'assets/img/zapatos/adidas-adimule-cafe-gamuza-sm.webp',
    Chanclas: 'assets/img/zapatos/adidas-adilette-negro-blanco-suela-negra-sm.webp',
  };
  // 8 accesos: en escritorio llenan la grilla de 3 (Básquetbol ocupa dos filas); una categoría sin
  // productos no se muestra
  cats.innerHTML = ['Básquetbol', 'Zapatillas hombre', 'Zapatillas dama', 'Kids', 'Gorras cerradas', 'Gorras ajustables', 'Guayos', 'Botas', 'Zuecos', 'Chanclas', 'Sandalias']
    .filter((g) => cuenta(g) > 0)
    .map((g) => `
    <a class="preview-cat" href="${enlace({ categoria: g })}">
      <img src="${portada[g] || TODOS.find((p) => p.grupos.includes(g))?.srcSm}" alt="" loading="lazy" decoding="async" width="560" height="560">
      <span class="preview-cat__txt">
        <span class="preview-cat__n mono">${cuenta(g)} productos</span>
        <span class="preview-cat__t">${g}</span>
      </span>
      <span class="preview-cat__flecha" aria-hidden="true">→</span>
    </a>`).join('');

  const total = qs('#previewTotal');
  if (total) total.textContent = TODOS.length;
}
