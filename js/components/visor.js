/* Visor de fotos a pantalla completa (el "ojo" de cada tarjeta).
   Foto entera en grande, zoom al tocar, deslizar entre los productos de la
   misma grilla y salto directo a elegir talla. */

import { qs, qsa } from '../utils/dom.js';
import { porId, tienePrecio } from '../data/products.js';
import { precioCOP } from '../data/site.js';
import { abrirFicha } from './quickview.js';
import { registrarCapa, abrirCapa, cerrarCapa, soltarScroll } from '../utils/capas.js';

let visor, escena, img, video, lista = [], pos = 0, ultimoFoco = null;
let zoom = false;

const flecha = (d) => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="${d}" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function crear() {
  visor = document.createElement('div');
  visor.className = 'visor';
  visor.id = 'visor';
  visor.setAttribute('role', 'dialog');
  visor.setAttribute('aria-modal', 'true');
  visor.setAttribute('aria-label', 'Fotos del producto');
  visor.hidden = true;
  visor.innerHTML = `
    <div class="visor__top">
      <span class="visor__cuenta mono" id="visorCuenta"></span>
      <button class="visor__cerrar" type="button" data-visor-cerrar aria-label="Cerrar fotos">
        ${flecha('M6 6l12 12M18 6L6 18')}
      </button>
    </div>
    <div class="visor__escena" id="visorEscena">
      <img class="visor__img" id="visorImg" alt="" decoding="async">
      <video class="visor__video" id="visorVideo" muted loop playsinline preload="none" hidden></video>
      <span class="visor__pista mono" id="visorPista">Toca para acercar</span>
    </div>
    <button class="visor__nav visor__nav--prev" type="button" data-visor-prev aria-label="Producto anterior">${flecha('M15 5l-7 7 7 7')}</button>
    <button class="visor__nav visor__nav--next" type="button" data-visor-next aria-label="Producto siguiente">${flecha('M9 5l7 7-7 7')}</button>
    <div class="visor__pie">
      <div class="visor__info">
        <p class="visor__nombre" id="visorNombre"></p>
        <p class="visor__meta mono" id="visorMeta"></p>
      </div>
      <button class="btn btn--primary visor__talla" type="button" data-visor-talla>Elegir talla</button>
    </div>`;
  document.body.appendChild(visor);
  escena = qs('#visorEscena', visor);
  img = qs('#visorImg', visor);
  video = qs('#visorVideo', visor);
}

/* ---------------- Zoom ---------------- */

function origenDesde(x, y) {
  const r = img.getBoundingClientRect();
  const px = Math.min(Math.max(((x - r.left) / r.width) * 100, 0), 100);
  const py = Math.min(Math.max(((y - r.top) / r.height) * 100, 0), 100);
  img.style.transformOrigin = `${px}% ${py}%`;
}

function ponerZoom(activo, x, y) {
  zoom = activo;
  visor.classList.toggle('is-zoom', zoom);
  if (zoom && x !== undefined) origenDesde(x, y);
  if (!zoom) img.style.transformOrigin = 'center center';
  qs('#visorPista', visor).textContent = zoom ? 'Mueve para recorrer · toca para alejar' : 'Toca para acercar';
}

/* ---------------- Mostrar producto ---------------- */

function mostrar(i) {
  if (!lista.length) return;
  pos = (i + lista.length) % lista.length;
  const p = lista[pos];
  ponerZoom(false);

  img.classList.add('is-cargando');
  const nueva = new Image();
  nueva.onload = nueva.onerror = () => {
    img.src = p.src;
    img.alt = p.alt;
    img.classList.remove('is-cargando');
  };
  nueva.src = p.src;

  if (p.video) {
    video.src = p.video;
    video.poster = p.src;
    video.hidden = false;
    const intento = video.play();
    if (intento && intento.catch) intento.catch(() => {});
  } else {
    video.pause();
    video.removeAttribute('src');
    video.hidden = true;
  }

  qs('#visorNombre', visor).textContent = p.name;
  qs('#visorMeta', visor).textContent = `${p.color} · ${tienePrecio(p) ? precioCOP(p.precio) : 'Precio por WhatsApp'}`;
  qs('#visorCuenta', visor).textContent = lista.length > 1 ? `${pos + 1} / ${lista.length}` : '';
  visor.classList.toggle('is-solo', lista.length < 2);

  // Precarga la foto de al lado para que deslizar sea instantáneo
  [pos + 1, pos - 1].forEach((j) => {
    const vecino = lista[(j + lista.length) % lista.length];
    if (vecino) new Image().src = vecino.src;
  });
}

export function abrirVisor(id, ids = []) {
  if (!visor) crear();
  lista = (ids.length ? ids : [id]).map(porId).filter(Boolean);
  const inicio = Math.max(lista.findIndex((p) => p.id === id), 0);
  ultimoFoco = document.activeElement;
  visor.hidden = false;
  requestAnimationFrame(() => visor.classList.add('is-open'));
  document.body.classList.add('is-locked');
  abrirCapa('visor'); // «atrás» cierra el visor y deja lo de abajo (utils/capas.js)
  mostrar(inicio);
  qs('[data-visor-cerrar]', visor).focus({ preventScroll: true });
}

export function cerrarVisor() {
  if (visor && !visor.hidden) cerrarCapa('visor');
}

function ocultarVisor() {
  visor.classList.remove('is-open');
  video.pause();
  ponerZoom(false);
  // Solo suelta el scroll si no queda otra capa abierta debajo (ficha o carrito)
  soltarScroll();
  setTimeout(() => { visor.hidden = true; }, 250);
  if (ultimoFoco && document.contains(ultimoFoco)) ultimoFoco.focus({ preventScroll: true });
}

/* ---------------- Arranque ---------------- */

export function initVisor() {
  registrarCapa('visor', ocultarVisor);
  // Delegación: cualquier ojo de cualquier grilla abre el visor con sus vecinos
  document.addEventListener('click', (e) => {
    const ojo = e.target.closest('.js-visor');
    if (ojo) {
      e.preventDefault();
      e.stopPropagation();
      const grilla = ojo.closest('.catalogo__grid, .quick__related-track, #runwayTrack') || document;
      const ids = [...new Set(qsa('.card[data-id]', grilla).map((c) => c.dataset.id))];
      abrirVisor(ojo.dataset.id, ids);
      return;
    }
    if (!visor || visor.hidden) return;
    if (e.target.closest('[data-visor-cerrar]')) cerrarVisor();
    else if (e.target.closest('[data-visor-prev]')) mostrar(pos - 1);
    else if (e.target.closest('[data-visor-next]')) mostrar(pos + 1);
    else if (e.target.closest('[data-visor-talla]')) {
      const id = lista[pos]?.id;
      cerrarVisor();
      if (id) abrirFicha(id);
    }
  }, true);

  document.addEventListener('keydown', (e) => {
    if (!visor || visor.hidden) return;
    if (e.key === 'Escape') cerrarVisor();
    else if (e.key === 'ArrowRight') mostrar(pos + 1);
    else if (e.key === 'ArrowLeft') mostrar(pos - 1);
  });

  // Gestos sobre la foto: toque = zoom, arrastre con zoom = recorrer, deslizar sin zoom = cambiar
  let inicioX = 0, inicioY = 0, movio = false, activo = false;

  document.addEventListener('pointerdown', (e) => {
    if (!visor || visor.hidden || !e.target.closest('#visorEscena')) return;
    activo = true;
    movio = false;
    inicioX = e.clientX;
    inicioY = e.clientY;
  });

  document.addEventListener('pointermove', (e) => {
    if (!visor || visor.hidden) return;
    if (zoom && (e.pointerType === 'mouse' || activo)) origenDesde(e.clientX, e.clientY);
    if (activo && Math.hypot(e.clientX - inicioX, e.clientY - inicioY) > 10) movio = true;
  });

  document.addEventListener('pointerup', (e) => {
    if (!activo) return;
    activo = false;
    const dx = e.clientX - inicioX;
    const dy = e.clientY - inicioY;
    // Si hay video, el primer toque lo quita y deja la foto
    if (!video.hidden && !movio) {
      video.pause();
      video.hidden = true;
      return;
    }
    if (!zoom && movio && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      mostrar(pos + (dx < 0 ? 1 : -1));
      return;
    }
    if (!movio) ponerZoom(!zoom, e.clientX, e.clientY);
  });
}
