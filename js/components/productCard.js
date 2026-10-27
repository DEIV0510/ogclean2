/* Tarjeta de producto reutilizable (inicio, tienda, pasarela y relacionados).
   Limpia, como la referencia que mandó el dueño (26-oct): foto → nombre → color → precio y, si hay
   precio anterior real, «Oferta» en la foto y el precio de antes tachado. El ojo (abajo al centro de la foto) abre
   las fotos en grande sin salir de la lista (el dueño pidió dejarlo, 28-oct). Las tallas no van aquí:
   se eligen al abrir el producto (toda la tarjeta abre la ficha). `rapida: true` vuelve a poner
   las tallas y los botones de compra rápida bajo el precio. */

import { precioCOP } from '../data/site.js';
import { descuento, tienePrecio } from '../data/products.js';

const ojo = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" width="20" height="20" aria-hidden="true"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" stroke-linejoin="round"/><circle cx="12" cy="12" r="3"/></svg>';
const bolsa = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15" aria-hidden="true"><path d="M2.5 3.5h2.4l2.3 11.1a1.6 1.6 0 0 0 1.6 1.3h8.6a1.6 1.6 0 0 0 1.6-1.2l1.6-6.9H6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9.3" cy="19.8" r="1.3"/><circle cx="17.3" cy="19.8" r="1.3"/></svg>';
const corazon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="16" height="16" aria-hidden="true"><path d="M12 20.3 4.6 13C2.5 10.9 2.4 7.6 4.4 5.6c1.9-1.9 5-1.9 6.9 0l.7.7.7-.7c1.9-1.9 5-1.9 6.9 0 2 2 1.9 5.3-.2 7.4L12 20.3Z" stroke-linejoin="round"/></svg>';

/** Botón de favorito, igual en tarjeta y ficha: mismo marcado, el corazón lo pinta favoritos.js. */
export const favoritoHTML = (p, clase = 'card') =>
  `<button class="${clase}__fav js-favorito" type="button" data-id="${p.id}" aria-pressed="false" aria-label="Guardar en favoritos">${corazon}</button>`;

const TALLAS_A_LA_VISTA = 5;

/** Precio principal arriba y, si hay precio anterior real, tachado debajo. */
export function precioHTML(p, clase = 'card') {
  const d = descuento(p);
  if (!tienePrecio(p)) return `<p class="${clase}__price is-cotizar">${precioCOP(p.precio)}</p>`;
  return `
    <div class="${clase}__precios">
      <p class="${clase}__price">${precioCOP(p.precio)} <span class="${clase}__cop">COP</span></p>
      ${d ? `<p class="${clase}__antes"><span class="sr-only">Antes </span><s>${precioCOP(d.antes)}</s></p>` : ''}
    </div>`;
}

/** Devuelve el HTML de una tarjeta. `rapida: false` la deja como enlace simple (relacionados). */
export function cardHTML(p, { sizes = '(max-width: 700px) 46vw, (max-width: 1100px) 30vw, 22vw', rapida = false, prioridad = false } = {}) {
  const d = descuento(p);
  const tallasPanel = p.tallas
    .map((t) => `<button class="card__size" type="button" data-talla="${t}">${t}</button>`)
    .join('');
  const visibles = p.tallas.slice(0, TALLAS_A_LA_VISTA);
  const resto = p.tallas.length - visibles.length;
  const chips = visibles
    .map((t) => `<button class="card__chip" type="button" data-talla="${t}" aria-pressed="false" aria-label="Talla ${t}${p.unidad}">${t}</button>`)
    .join('') + (resto > 0 ? `<button class="card__chip card__chip--mas" type="button" data-rapida aria-label="Ver las ${p.tallas.length} tallas">+${resto}</button>` : '');

  return `
    <article class="card${rapida ? ' has-rapida' : ''}" data-id="${p.id}" data-cat="${p.cat}" data-idx="${p.idx}">
      <div class="card__media">
        ${d ? `<span class="card__desc">Oferta<span class="sr-only"> -${d.porcentaje}%</span></span>` : ''}
        <img src="${p.srcCard || p.srcSm}" ${p.srcCard ? '' : `srcset="${p.srcSm} 560w, ${p.src} 1000w" sizes="${sizes}"`}
             alt="${p.alt}" ${prioridad ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" width="560" height="560">
        <button class="card__ojo js-visor" type="button" data-id="${p.id}" aria-label="Ver fotos de ${p.name} en grande">${ojo}</button>
        ${favoritoHTML(p)}
      </div>
      <div class="card__body">
        <h3 class="card__name">${p.name}</h3>
        <p class="card__meta">${p.color}</p>
        ${precioHTML(p)}
        ${rapida ? `
        <div class="card__chips" role="group" aria-label="Tallas${p.escala ? ` ${p.escala}` : ''}">${chips}</div>
        <div class="card__acciones">
          <button class="card__ver js-quick" type="button" data-id="${p.id}">Ver producto</button>
          <button class="card__buy" type="button" data-agregar aria-label="Agregar ${p.name} al carrito">${bolsa} Agregar</button>
        </div>` : ''}
      </div>
      <button class="card__btn js-quick" type="button" data-id="${p.id}" aria-label="Ver ficha de ${p.name}, ${p.tag}"></button>
      ${rapida ? `
      <div class="card__rapida" role="group" aria-label="Elige tu talla de ${p.name}">
        <div class="card__rapida-top">
          <span class="mono">Elige tu talla${p.escala ? ` (${p.escala})` : ''}</span>
          <button class="card__rapida-x" type="button" data-rapida-cerrar aria-label="Cerrar tallas">✕</button>
        </div>
        <div class="card__sizes">${tallasPanel}</div>
        <p class="card__rapida-nota mono">Toca una talla y se agrega al carrito</p>
        <a class="btn btn--primary btn--sm btn--block" data-pedir-ya href="#" target="_blank" rel="noopener" hidden>Pedir ya</a>
      </div>` : ''}
    </article>`;
}

/* Fotos de forma extrema (muy verticales o muy anchas): con «cover» la caja les cortaría el
   producto («que no queden mochas las imágenes», dueño 2026-10-01). Esas se muestran enteras
   (contain) sobre el fondo blanco de la caja; las demás siguen llenándola como siempre. */
const CAJAS = [['.card__media', 1], ['.cart-item__media', 1], ['.runway__media', 0.8]];
const RECORTE_MAX = 0.21; // lo que se puede perder de la foto sin que el zapato quede cortado

export function encuadrar(img) {
  if (!img.naturalWidth || !img.naturalHeight) return;
  const caja = CAJAS.find(([sel]) => img.parentElement?.matches(sel));
  if (!caja) return;
  const forma = img.naturalWidth / img.naturalHeight;
  const recorte = 1 - Math.min(forma / caja[1], caja[1] / forma);
  img.classList.toggle('is-entera', recorte > RECORTE_MAX);
}

/** Encuadra cada foto al cargar, también las de tarjetas que se pintan después (filtros, ficha…). */
export function initEncuadre() {
  // `load` no burbujea: se escucha en captura
  document.addEventListener('load', (e) => { if (e.target.tagName === 'IMG') encuadrar(e.target); }, true);
  document.querySelectorAll('.card__media img, .cart-item__media img, .runway__media img')
    .forEach((img) => { if (img.complete) encuadrar(img); });
}

/** Pinta una lista de productos dentro de un contenedor. `prioridad: n` = las primeras n
    fotos se piden de una y con prioridad alta (las que se ven al abrir la página: LCP). */
export function renderCards(cont, items, opciones = {}) {
  if (!cont) return;
  const { prioridad = 0, ...resto } = opciones;
  cont.innerHTML = items.map((p, i) => cardHTML(p, { ...resto, prioridad: i < prioridad })).join('');
}
