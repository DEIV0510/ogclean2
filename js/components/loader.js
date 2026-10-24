/* Pantalla de carga: progreso real (imágenes críticas) con tope de tiempo
   para que nunca se vuelva un cuello de botella. */

import { qs, reducedMotion } from '../utils/dom.js';
import { soltarScroll } from '../utils/capas.js';

const CRITICAS = [
  'assets/img/brand/logo.webp',
  'assets/img/caps/padres-cafe-sm.webp',
  'assets/img/sneakers/kyrie7-verde-azul-sm.webp',
];

const MAX_MS = 1600; // techo duro: la web entra sí o sí

export function initLoader() {
  const loader = qs('#loader');
  if (!loader) return Promise.resolve();

  const bar = qs('#loaderBar');
  const pct = qs('#loaderPct');
  let progreso = 0;
  let listas = 0;

  const pintar = (v) => {
    progreso = Math.max(progreso, Math.min(Math.round(v), 100));
    if (bar) bar.style.width = `${progreso}%`;
    if (pct) pct.textContent = progreso;
  };

  const precargar = (src) => new Promise((res) => {
    const img = new Image();
    img.onload = img.onerror = () => {
      listas += 1;
      pintar((listas / CRITICAS.length) * 92);
      res();
    };
    img.src = src;
  });

  const salir = () => {
    pintar(100);
    soltarScroll(); // si al recargar se reabrió la ficha, la página de atrás sigue quieta
    if (reducedMotion) {
      loader.classList.add('is-done');
      loader.setAttribute('aria-hidden', 'true');
      return;
    }
    loader.classList.add('is-out');
    setTimeout(() => {
      loader.classList.add('is-done');
      loader.setAttribute('aria-hidden', 'true');
    }, 620);
  };

  document.body.classList.add('is-locked');

  // Progreso "vivo" mientras cargan los recursos reales
  const tick = setInterval(() => pintar(progreso + 3), 90);

  const carga = Promise.all(CRITICAS.map(precargar));
  const tope = new Promise((res) => setTimeout(res, MAX_MS));

  return Promise.race([carga, tope]).then(() => {
    clearInterval(tick);
    return new Promise((res) => {
      setTimeout(() => { salir(); res(); }, 180);
    });
  });
}
