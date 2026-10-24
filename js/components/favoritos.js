/* Favoritos: un corazón en la tarjeta y en la ficha para guardar lo que más le
   gustó a alguien, y un apartado junto al carrito (botón ♥ del header) con todo
   lo guardado: ver cada pieza, quitarla o preguntar por todas por WhatsApp
   (el dueño lo pidió el 2026-10-01; antes era solo el corazón, sin panel).
   El estado vive en el navegador (localStorage). */

import { qs, qsa, rafThrottle } from '../utils/dom.js';
import { porId, tienePrecio } from '../data/products.js';
import { wa, precioCOP } from '../data/site.js';
import { abrirFicha } from './quickview.js';
import { registrarCapa, abrirCapa, cerrarCapa, soltarScroll } from '../utils/capas.js';

const CLAVE = 'ogclean:favoritos:v1';

let panel, listaEl, vacioEl, ctaEl, cuentaEl, boton;

function leer() {
  try {
    const datos = JSON.parse(localStorage.getItem(CLAVE) || '[]');
    // Fuera lo que ya no existe en el catálogo (productos retirados)
    return Array.isArray(datos) ? datos.filter((id) => porId(id)) : [];
  } catch {
    return [];
  }
}

function guardar(lista) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(lista));
  } catch {
    /* localStorage no disponible (privado/bloqueado): el corazón deja de recordar, no rompe nada */
  }
}

export function esFavorito(id) {
  return leer().includes(id);
}

/** Marca/desmarca un producto. Devuelve el nuevo estado (true = guardado). */
export function alternarFavorito(id) {
  const lista = leer();
  const i = lista.indexOf(id);
  const activo = i === -1;
  if (activo) lista.push(id);
  else lista.splice(i, 1);
  guardar(lista);
  return activo;
}

function pintar(btn) {
  const activo = esFavorito(btn.dataset.id);
  btn.classList.toggle('is-activo', activo);
  btn.setAttribute('aria-pressed', String(activo));
  btn.setAttribute('aria-label', activo ? 'Quitar de favoritos' : 'Guardar en favoritos');
}

const pintarTodos = () => qsa('.js-favorito').forEach(pintar);

/* ---------------- Apartado de favoritos ---------------- */

function mensaje(lista) {
  return [
    'Hola OGCLEAN, me interesan estos productos que guardé en favoritos:',
    ...lista.map((p) => `• ${p.name} (${p.tag}) — ${tienePrecio(p) ? precioCOP(p.precio) : 'precio a confirmar'}`),
  ].join('\n');
}

function pintarPanel() {
  // Lo último que guardó, arriba
  const lista = leer().reverse().map(porId);
  const n = lista.length;

  if (boton) {
    const badge = qs('.fav-badge', boton);
    if (badge) {
      badge.textContent = n;
      badge.classList.toggle('is-empty', n === 0);
    }
    boton.classList.toggle('has-favs', n > 0);
    boton.setAttribute('aria-label', n ? `Ver favoritos, ${n} guardado${n === 1 ? '' : 's'}` : 'Ver favoritos, ninguno guardado');
  }
  if (!listaEl) return;

  listaEl.innerHTML = lista.map((p) => `
    <li class="cart-item fav-item">
      <button class="cart-item__media fav-item__media" type="button" data-fav-ver="${p.id}" aria-label="Ver ${p.name}, ${p.tag}">
        <img src="${p.srcCard || p.srcSm}" alt="${p.alt}" width="120" height="120" loading="lazy" decoding="async">
      </button>
      <div class="cart-item__info">
        <p class="cart-item__name">${p.name}</p>
        <p class="cart-item__meta">${p.tag}</p>
        <p class="cart-item__price">${tienePrecio(p) ? precioCOP(p.precio) : 'Precio por WhatsApp'}</p>
      </div>
      <div class="cart-item__acciones">
        <button class="fav-item__ver" type="button" data-fav-ver="${p.id}">Ver y elegir talla</button>
        <button class="cart-item__quitar" type="button" data-fav-quitar="${p.id}">Quitar</button>
      </div>
    </li>`).join('');

  listaEl.hidden = n === 0;
  if (vacioEl) vacioEl.hidden = n > 0;
  if (cuentaEl) cuentaEl.textContent = n ? `${n} producto${n === 1 ? '' : 's'} guardado${n === 1 ? '' : 's'}` : 'Aún no guardas nada';
  if (ctaEl) {
    ctaEl.href = wa(mensaje(lista));
    ctaEl.classList.toggle('is-disabled', n === 0);
    ctaEl.setAttribute('aria-disabled', String(n === 0));
  }
}

export function abrirFavoritos() {
  if (!panel) return;
  pintarPanel();
  panel.classList.add('is-open');
  panel.setAttribute('aria-hidden', 'false');
  document.body.classList.add('is-locked');
  abrirCapa('favoritos'); // «atrás» lo cierra y deja la página donde estaba (utils/capas.js)
  qs('#favsClose')?.focus({ preventScroll: true });
}

let devolverFocoAlCerrar = true;

export function cerrarFavoritos({ devolverFoco = true } = {}) {
  if (!panel?.classList.contains('is-open')) return;
  devolverFocoAlCerrar = devolverFoco;
  cerrarCapa('favoritos');
}

function ocultarFavoritos() {
  panel.classList.remove('is-open');
  panel.setAttribute('aria-hidden', 'true');
  // La ficha y el carrito también bloquean el scroll: solo se suelta si no queda otra capa
  soltarScroll();
  if (devolverFocoAlCerrar) boton?.focus({ preventScroll: true });
  devolverFocoAlCerrar = true;
}

function initPanel() {
  panel = qs('#favs');
  boton = qs('#favBtn');
  listaEl = qs('#favsLista');
  vacioEl = qs('#favsVacio');
  ctaEl = qs('#favsCta');
  cuentaEl = qs('#favsCuenta');

  // Limpia de una vez lo guardado de productos que ya no están en el catálogo
  try {
    const crudo = JSON.parse(localStorage.getItem(CLAVE) || '[]');
    if (Array.isArray(crudo) && crudo.length !== leer().length) guardar(leer());
  } catch { /* nada que limpiar */ }

  pintarPanel();
  boton?.addEventListener('click', abrirFavoritos);
  if (!panel) return;
  registrarCapa('favoritos', ocultarFavoritos);

  panel.addEventListener('click', (e) => {
    if (e.target.closest('[data-fav-cerrar]')) { cerrarFavoritos({ devolverFoco: false }); return; }
    const ver = e.target.closest('[data-fav-ver]');
    if (ver) {
      // La ficha se abre encima del todo; al cerrarla se vuelve a la página
      cerrarFavoritos({ devolverFoco: false });
      abrirFicha(ver.dataset.favVer);
      return;
    }
    const quitar = e.target.closest('[data-fav-quitar]');
    if (quitar) {
      alternarFavorito(quitar.dataset.favQuitar);
      pintarTodos();
      pintarPanel();
      // Que el foco no se pierda al desaparecer la fila
      (qs('[data-fav-quitar]', panel) || qs('#favsClose'))?.focus({ preventScroll: true });
    }
  });
  qs('#favsClose')?.addEventListener('click', () => cerrarFavoritos());
  ctaEl?.addEventListener('click', (e) => { if (!leer().length) e.preventDefault(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel.classList.contains('is-open')) cerrarFavoritos();
  });
}

export function initFavoritos() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.js-favorito');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation(); // no abrir la ficha del producto al tocar el corazón
    const activo = alternarFavorito(btn.dataset.id);
    qsa(`.js-favorito[data-id="${btn.dataset.id}"]`).forEach((b) => {
      b.classList.toggle('is-activo', activo);
      b.setAttribute('aria-pressed', String(activo));
      b.setAttribute('aria-label', activo ? 'Quitar de favoritos' : 'Guardar en favoritos');
    });
    btn.classList.add('is-pop');
    setTimeout(() => btn.classList.remove('is-pop'), 260);
    pintarPanel();
    // El ♥ del header «recibe» lo guardado, como el carrito
    if (activo && boton) {
      boton.classList.remove('is-bump');
      void boton.offsetWidth; // reinicia la animación
      boton.classList.add('is-bump');
    }
  });

  initPanel();

  // Las tarjetas se repintan al filtrar/paginar/abrir la ficha: repintar corazones nuevos
  pintarTodos();
  new MutationObserver(rafThrottle(pintarTodos)).observe(document.body, { childList: true, subtree: true });

  // La tienda abierta en otra pestaña: mismos favoritos
  window.addEventListener('storage', (e) => {
    if (e.key !== CLAVE) return;
    pintarTodos();
    pintarPanel();
  });
}
