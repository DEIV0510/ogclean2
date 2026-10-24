/* Lo que comparten todas las páginas: WhatsApp, header, menú, carrito,
   ficha de producto, cursor y reveals. */

import { qs, qsa } from './utils/dom.js';
import { wa } from './data/site.js';
import { initReveals, initMarquees } from './utils/motion.js';
import { initHeader, initMenu, initBuscador } from './components/nav.js';
import { initCursor, initMagnetic } from './components/cursor.js';
import { initQuickView } from './components/quickview.js';
import { initCart } from './components/cart.js';
import { initVisor } from './components/visor.js';
import { initFirma } from './components/firma.js';
import { initFavoritos } from './components/favoritos.js';
import { initEncuadre } from './components/productCard.js';
import { restaurarCapas } from './utils/capas.js';

/** Enlaza todos los CTA de WhatsApp con la única línea de atención. */
export function initWhatsApp(raiz = document) {
  qsa('.js-wa', raiz).forEach((el) => {
    el.href = wa(el.dataset.wa || 'Hola OGCLEAN, quiero más información.');
    el.target = '_blank';
    el.rel = 'noopener';
  });
}

function initAnio() {
  const y = qs('#year');
  if (y) y.textContent = new Date().getFullYear();
}

/** Arranque común. Cada página añade encima sus secciones propias. */
export function initComun() {
  initWhatsApp();
  initAnio();
  initMarquees();
  initCart();
  initQuickView();
  initVisor();
  initFirma();
  initFavoritos();
  initEncuadre();
  initHeader();
  initMenu();
  initBuscador();
  initCursor();
  initMagnetic();
  initReveals();
  // Recargada (o vuelta sin la caché del navegador) sobre una entrada con la ficha abierta: se reabre
  restaurarCapas();
}

export function alCargar(fn) {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true });
  else fn();
}
