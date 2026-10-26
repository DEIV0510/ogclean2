/* Manifiesto: el texto se ilumina palabra por palabra con el scroll.
   Además carga el video del hero solo cuando conviene y arma la tira social. */

import { qs, qsa, splitWords, reducedMotion, rafThrottle, mq } from '../utils/dom.js';
import { TODOS } from '../data/products.js';

export function initManifiesto() {
  const el = qs('#manifiestoText');
  if (!el) return;
  const palabras = splitWords(el);
  if (!palabras.length) return;
  el.classList.add('words-in'); // las palabras entran de una: aquí el efecto es el color

  if (reducedMotion) {
    palabras.forEach((w) => w.classList.add('is-lit'));
    return;
  }

  const update = rafThrottle(() => {
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight;
    // 0 cuando el bloque entra por abajo, 1 cuando pasa el centro
    const progreso = (vh * 0.85 - r.top) / (r.height + vh * 0.35);
    const hasta = Math.round(progreso * palabras.length);
    palabras.forEach((w, i) => w.classList.toggle('is-lit', i < hasta));
  });

  update();
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
}

/** El video del hero se carga solo si hay ancho y conexión razonables. */
export function initHeroVideo() {
  const video = qs('#heroVideo');
  if (!video) return;

  // Con ahorro de datos activo queda el póster: no gastamos el plan del visitante
  const conexion = navigator.connection;
  if (conexion && (conexion.saveData || /(^|-)2g$/.test(conexion.effectiveType || ''))) return;

  // En celular el hero lleva una foto (hero-movil.webp, ≈40 KB, maqueta del cliente): el video solo en pantallas
  // anchas. Si una tablet carga en vertical y se gira, al pasar a ancho se pone el póster y arranca el video.
  const ancho = window.matchMedia('(min-width: 768px)');
  if (!ancho.matches) {
    ancho.addEventListener('change', () => { if (ancho.matches) initHeroVideo(); }, { once: true });
    return;
  }
  if (!video.poster) video.poster = (window.OG ? window.OG.base : '') + 'assets/video/hero-poster.jpg';
  const base = 'assets/video/hero';

  video.muted = true;          // requisito para el autoplay en todos los navegadores
  video.defaultMuted = true;
  video.playsInline = true;

  if (video.dataset.cargado !== '1') {
    video.dataset.cargado = '1';
    video.innerHTML = `
      <source src="${base}.webm" type="video/webm">
      <source src="${base}.mp4" type="video/mp4">`;
    video.load();
  }

  const reproducir = () => {
    if (!video.paused) return;
    const intento = video.play();
    if (intento && intento.catch) intento.catch(() => {});
  };

  reproducir();
  video.addEventListener('loadeddata', reproducir);
  video.addEventListener('canplay', reproducir);

  // Si el navegador bloquea el autoplay, el primer gesto del visitante lo destraba
  const alPrimerGesto = () => {
    reproducir();
    ['pointerdown', 'touchstart', 'keydown', 'scroll'].forEach((ev) =>
      window.removeEventListener(ev, alPrimerGesto));
  };
  ['pointerdown', 'touchstart', 'keydown', 'scroll'].forEach((ev) =>
    window.addEventListener(ev, alPrimerGesto, { once: false, passive: true }));

  // Al volver a la pestaña algunos navegadores lo dejan pausado
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) reproducir();
  });
}

/** Sección de Instagram: 6 piezas reales del catálogo en cuadrícula, como un perfil. Todas llevan a @ogclean.co. */
export function initSocialFeed() {
  const feed = qs('#socialFeed');
  if (!feed) return;
  const muestra = [...TODOS].sort(() => 0.5 - Math.random()).slice(0, 6);
  const icono = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" class="social__post-ig" aria-hidden="true"><rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5"/><circle cx="12" cy="12" r="4.1"/><circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" stroke="none"/></svg>';
  feed.innerHTML = muestra
    .map((p) => `<span class="social__post${p.srcCard ? '' : ' social__post--entera'}"><img src="${p.srcCard || p.srcSm}" alt="" loading="lazy" decoding="async" width="300" height="300">${icono}</span>`)
    .join('');
  // La mitad de las fotos de calzado no son cuadradas: esas se ven enteras con margen. Las casi
  // cuadradas llenan el recuadro (recortarlas no corta nada del producto).
  feed.querySelectorAll('.social__post--entera img').forEach((img) => {
    const ajustar = () => {
      const r = img.naturalWidth / img.naturalHeight;
      if (r > 0.9 && r < 1.1) img.parentElement.classList.remove('social__post--entera');
    };
    if (img.complete && img.naturalWidth) ajustar();
    else img.addEventListener('load', ajustar, { once: true });
  });
}

/** Paneles de líneas: activa el panel al pasar el mouse o enfocarlo. */
export function initLineas() {
  // Accesos de categorías que pueden no tener productos todavía (Kids): salen solo si hay
  qsa('[data-solo-si-hay]').forEach((a) => {
    a.hidden = !TODOS.some((p) => p.grupos.includes(a.dataset.soloSiHay));
  });
  const paneles = qsa('.linea');
  paneles.forEach((panel) => {
    const activar = () => paneles.forEach((p) => p.classList.toggle('is-active', p === panel));
    panel.addEventListener('mouseenter', activar);
    panel.addEventListener('focus', activar);
  });
}
