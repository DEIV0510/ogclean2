/* Carrito de compra: estado en localStorage, panel lateral y pedido
   completo precargado en WhatsApp. Sin pasarela: el cierre es por chat. */

import { qs, qsa } from '../utils/dom.js';
import { porId, tienePrecio } from '../data/products.js';
import { SITE, wa, precioCOP } from '../data/site.js';
import { registrarCapa, abrirCapa, cerrarCapa, soltarScroll } from '../utils/capas.js';

const LLAVE = 'ogclean:carrito:v1';

/* Una línea del carrito: producto + talla. La misma pieza en otra talla
   es otra línea distinta. */
const claveLinea = (id, talla) => `${id}|${talla}`;

let lineas = [];      // [{ id, talla, cant }]
let hidratado = false; // guardia: no guardar antes de leer (si no, se borra al recargar)
let panel, listaEl, totalEl, ctaEl, badgeEls, vacioEl;

/* ---------------- Estado ---------------- */

function leer() {
  try {
    const crudo = localStorage.getItem(LLAVE);
    const datos = crudo ? JSON.parse(crudo) : [];
    lineas = Array.isArray(datos)
      // Fuera lo que ya no existe: productos retirados o tallas que dejaron de ofrecerse
      ? datos.filter((l) => l && porId(l.id) && Number(l.cant) > 0
          && (!l.talla || porId(l.id).tallas.includes(String(l.talla))))
        .map((l) => ({ id: l.id, talla: String(l.talla || ''), cant: Math.min(Number(l.cant), 20) }))
      : [];
  } catch (err) {
    lineas = [];
  }
  hidratado = true;
}

function guardar() {
  if (!hidratado) return;
  try {
    localStorage.setItem(LLAVE, JSON.stringify(lineas));
  } catch (err) { /* modo privado o almacenamiento lleno: el carrito vive en memoria */ }
}

export const totalUnidades = () => lineas.reduce((n, l) => n + l.cant, 0);

const totalPesos = () => lineas.reduce((n, l) => {
  const p = porId(l.id);
  return n + (tienePrecio(p) ? p.precio * l.cant : 0);
}, 0);

/** Pares cuyo precio aún se confirma por chat (no suman al total). */
const unidadesPorCotizar = () => lineas.reduce((n, l) => (tienePrecio(porId(l.id)) ? n : n + l.cant), 0);

const precioLinea = (p, cant) => (tienePrecio(p) ? precioCOP(p.precio * cant) : 'Precio por WhatsApp');

/** Texto del total: suma lo confirmado y avisa lo que falta cotizar. */
function textoTotal() {
  const pendientes = unidadesPorCotizar();
  const confirmado = totalPesos();
  if (!pendientes) return precioCOP(confirmado);
  const cola = `${pendientes} por cotizar`;
  return confirmado ? `${precioCOP(confirmado)} + ${cola}` : cola.charAt(0).toUpperCase() + cola.slice(1);
}

/* ---------------- Mensaje de WhatsApp ---------------- */

function mensajePedido() {
  if (!lineas.length) return 'Hola OGCLEAN, quiero hacer un pedido.';
  const filas = lineas.map((l) => {
    const p = porId(l.id);
    const talla = l.talla ? (l.talla === 'Ajustable' ? ' (ajustable)' : ` talla ${l.talla}${p.unidad}`) : '';
    const cant = l.cant > 1 ? ` x${l.cant}` : '';
    return `• ${p.name} (${p.tag})${talla}${cant} — ${tienePrecio(p) ? precioCOP(p.precio * l.cant) : 'precio a confirmar'}`;
  });
  return [
    'Hola OGCLEAN, quiero pedir:',
    ...filas,
    `Total: ${textoTotal()}`,
    `Envío: ${SITE.envios}`,
  ].join('\n');
}

/* ---------------- Pintado ---------------- */

function pintarBadges() {
  const n = totalUnidades();
  badgeEls.forEach((b) => {
    b.textContent = n;
    b.classList.toggle('is-empty', n === 0);
  });
  const etiqueta = n ? `Ver carrito, ${n} artículo${n === 1 ? '' : 's'}` : 'Ver carrito, vacío';
  const boton = qs('#cartBtn');
  if (boton) boton.setAttribute('aria-label', etiqueta);
  // la barra inferior del celular muestra el número con aria-hidden: que también lo diga en voz
  const barra = qs('.mobile-bar .js-cart-open');
  if (barra) barra.setAttribute('aria-label', etiqueta);
}

function pintar() {
  if (!listaEl) return;

  listaEl.innerHTML = lineas.map((l) => {
    const p = porId(l.id);
    const clave = claveLinea(l.id, l.talla);
    return `
      <li class="cart-item" data-linea="${clave}">
        <div class="cart-item__media">
          <img src="${p.srcCard || p.srcSm}" alt="${p.alt}" width="120" height="120" loading="lazy" decoding="async">
        </div>
        <div class="cart-item__info">
          <p class="cart-item__name">${p.name}</p>
          <p class="cart-item__meta">${p.tag}${l.talla ? (l.talla === 'Ajustable' ? ' · Ajustable' : ` · Talla ${l.talla}${p.unidad}`) : ''}</p>
          <p class="cart-item__price">${precioLinea(p, l.cant)}</p>
        </div>
        <div class="cart-item__acciones">
          <div class="qty" role="group" aria-label="Cantidad de ${p.name}">
            <button class="qty__btn" type="button" data-cart="menos" data-linea="${clave}" aria-label="Quitar una unidad">−</button>
            <span class="qty__n">${l.cant}</span>
            <button class="qty__btn" type="button" data-cart="mas" data-linea="${clave}" aria-label="Agregar una unidad">+</button>
          </div>
          <button class="cart-item__quitar" type="button" data-cart="quitar" data-linea="${clave}">Quitar</button>
        </div>
      </li>`;
  }).join('');

  const vacio = lineas.length === 0;
  if (vacioEl) vacioEl.hidden = !vacio;
  listaEl.hidden = vacio;
  if (totalEl) {
    totalEl.textContent = textoTotal();
    totalEl.classList.toggle('is-long', unidadesPorCotizar() > 0);
  }
  if (ctaEl) {
    ctaEl.href = wa(mensajePedido());
    ctaEl.classList.toggle('is-disabled', vacio);
    ctaEl.setAttribute('aria-disabled', String(vacio));
  }
  pintarBadges();
  guardar();
}

/* ---------------- Acciones ---------------- */

/* Doble clic en «Agregar» o «Comprar ahora»: el segundo toque llega en menos de 0,7 s y sumaría
   otra unidad sin que el cliente lo quiera. Se ignora (vale para todos los botones que agregan). */
let ultimoAgregado = { clave: '', t: 0 };

/** Agrega una pieza al carrito. Devuelve false si falta la talla. */
export function agregar(id, talla, cant = 1) {
  const p = porId(id);
  if (!p) return false;
  const clave = claveLinea(id, talla);
  const ahora = Date.now();
  if (clave === ultimoAgregado.clave && ahora - ultimoAgregado.t < 700) return true;
  ultimoAgregado = { clave, t: ahora };
  const existente = lineas.find((l) => claveLinea(l.id, l.talla) === clave);
  if (existente) existente.cant = Math.min(existente.cant + cant, 20);
  else lineas.push({ id, talla, cant });
  pintar();
  animarBadge();
  document.dispatchEvent(new CustomEvent('og:agregado', { detail: { id, talla } }));
  return true;
}

function cambiar(clave, delta) {
  const linea = lineas.find((l) => claveLinea(l.id, l.talla) === clave);
  if (!linea) return;
  linea.cant += delta;
  if (linea.cant < 1) lineas = lineas.filter((l) => l !== linea);
  pintar();
}

function quitar(clave) {
  lineas = lineas.filter((l) => claveLinea(l.id, l.talla) !== clave);
  pintar();
}

function animarBadge() {
  const boton = qs('#cartBtn');
  if (!boton) return;
  boton.classList.remove('is-bump');
  void boton.offsetWidth; // reinicia la animación
  boton.classList.add('is-bump');
}

/* ---------------- Aviso "agregado" ---------------- */

let avisoTimer = 0;

/** Confirma lo agregado sin sacar al visitante de donde está. */
export function aviso(p, talla, cant = 1) {
  const el = qs('#aviso');
  if (!el || !p) return;
  qs('#avisoImg', el).src = p.srcCard || p.srcSm;
  qs('#avisoImg', el).alt = '';
  qs('#avisoNombre', el).textContent = p.name;
  qs('#avisoMeta', el).textContent = `${p.tag}${talla ? (talla === 'Ajustable' ? ' · Ajustable' : ` · Talla ${talla}${p.unidad}`) : ''}${cant > 1 ? ` · x${cant}` : ''}`;
  el.hidden = false;
  requestAnimationFrame(() => el.classList.add('is-visible'));
  clearTimeout(avisoTimer);
  avisoTimer = setTimeout(ocultarAviso, 4200);
}

function ocultarAviso() {
  const el = qs('#aviso');
  if (!el) return;
  el.classList.remove('is-visible');
  setTimeout(() => { if (!el.classList.contains('is-visible')) el.hidden = true; }, 350);
}

/* ---------------- Panel ---------------- */

export function abrirCarrito() {
  if (!panel) return;
  panel.classList.add('is-open');
  panel.setAttribute('aria-hidden', 'false');
  document.body.classList.add('is-locked');
  abrirCapa('carrito'); // «atrás» lo cierra y deja la página donde estaba (utils/capas.js)
  qs('#cartClose')?.focus({ preventScroll: true });
}

export function cerrarCarrito() {
  if (panel?.classList.contains('is-open')) cerrarCapa('carrito');
}

function ocultarCarrito() {
  panel.classList.remove('is-open');
  panel.setAttribute('aria-hidden', 'true');
  // La ficha de producto también bloquea el scroll: solo se suelta si no queda otra capa
  soltarScroll();
}

/* ---------------- Arranque ---------------- */

export function initCart() {
  panel = qs('#cart');
  listaEl = qs('#cartLista');
  totalEl = qs('#cartTotal');
  ctaEl = qs('#cartCta');
  vacioEl = qs('#cartVacio');
  badgeEls = qsa('.cart-badge');
  if (!panel) return;
  registrarCapa('carrito', ocultarCarrito);

  leer();
  pintar();

  qs('#cartBtn')?.addEventListener('click', abrirCarrito);
  qs('#avisoVer')?.addEventListener('click', () => { ocultarAviso(); abrirCarrito(); });
  qs('#avisoCerrar')?.addEventListener('click', ocultarAviso);
  qs('#cartClose')?.addEventListener('click', cerrarCarrito);
  qs('#cartFondo')?.addEventListener('click', cerrarCarrito);
  qsa('.js-cart-open').forEach((el) => el.addEventListener('click', (e) => { e.preventDefault(); abrirCarrito(); }));

  panel.addEventListener('click', (e) => {
    if (e.target.closest('[data-cart-cerrar]')) { cerrarCarrito(); return; }
    const btn = e.target.closest('[data-cart]');
    if (!btn) return;
    const { cart: accion, linea } = btn.dataset;
    if (accion === 'mas') cambiar(linea, 1);
    else if (accion === 'menos') cambiar(linea, -1);
    else if (accion === 'quitar') quitar(linea);
  });

  ctaEl?.addEventListener('click', (e) => {
    if (!lineas.length) e.preventDefault();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel.classList.contains('is-open')) cerrarCarrito();
  });

  // Si el visitante tiene la tienda abierta en dos pestañas, se mantienen iguales
  window.addEventListener('storage', (e) => {
    if (e.key !== LLAVE) return;
    leer();
    pintar();
  });
}
