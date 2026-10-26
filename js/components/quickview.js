/* Ficha de producto a pantalla completa: galería con zoom al punto exacto,
   selector de talla, especificaciones y salto directo a WhatsApp. */

import { qs, qsa } from '../utils/dom.js';
import { porId, LINEAS, tienePrecio, descuento } from '../data/products.js';
import { SITE, wa, precioCOP } from '../data/site.js';
import { cardHTML, favoritoHTML } from './productCard.js';
import { agregar, aviso } from './cart.js';
import { guiaFichaHTML, guiaGorraHTML } from './guiaTallas.js';
import { registrarCapa, abrirCapa, cerrarCapa, soltarScroll } from '../utils/capas.js';

const waIcon = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2Zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20Zm4.4-5.6c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1-1.3-.6-2.1-1.1-3-2.5-.2-.4.2-.4.6-1.2.1-.1 0-.3 0-.4-.1-.1-.5-1.3-.7-1.7-.2-.5-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.2.9 2.4c.1.2 1.6 2.5 3.9 3.5.5.2.9.4 1.3.5.5.2 1 .1 1.3-.1.4-.2 1.4-.6 1.6-1.2.2-.6.2-1.1.1-1.2-.1-.1-.2-.2-.4-.3Z"/></svg>';

const bolsaIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M2.5 3.5h2.4l2.3 11.1a1.6 1.6 0 0 0 1.6 1.3h8.6a1.6 1.6 0 0 0 1.6-1.2l1.6-6.9H6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9.3" cy="19.8" r="1.3"/><circle cx="17.3" cy="19.8" r="1.3"/></svg>';

/* Pago a cuotas con Sistecrédito (dueño, 26-oct: el recuadro de Addi de deltaprimeco como ejemplo). Sale solo
   si la tienda lo activa en Productos → Ajustes OGCLEAN (window.OG.sistecredito): el cliente toca el recuadro
   y escribe por WhatsApp con el producto y la talla, y la tienda le gestiona el pago con su cupo. */
const conCuotas = () => window.OG?.sistecredito === true;
// Logo oficial (icono de su app en Shopify), recortado en assets/img/brand/sistecredito.webp
const logoSistecredito = () => `${window.OG ? window.OG.base : ''}assets/img/brand/sistecredito.webp`;
const cuotasHTML = () => `
      <a class="quick__cuotas" id="quickCuotas" href="#" target="_blank" rel="noopener">
        <span>Paga a cuotas con <img class="quick__cuotas-logo" src="${logoSistecredito()}" alt="Sistecrédito" width="131" height="16" decoding="async">.
        <u>Escríbenos y pide tu cupo</u></span>
      </a>`;

let modal, cuerpo, scroll, ultimoFoco = null;
let tallaElegida = '';
let cantidadElegida = 1;

/* Primero la misma marca, luego el resto de la línea */
function relacionados(p) {
  const otros = LINEAS[p.linea].items.filter((x) => x.id !== p.id);
  const misma = otros.filter((x) => p.marca && x.marca === p.marca);
  return [...misma, ...otros.filter((x) => !misma.includes(x))].slice(0, 8);
}

/* Varias fotos (galería del producto en WooCommerce): miniaturas bajo la foto grande */
function miniaturasHTML(p, fotos) {
  return `<div class="quick__fotos" role="group" aria-label="Fotos de ${p.name}">${fotos
    .map((f, i) => `<button class="quick__foto${i ? '' : ' is-active'}" type="button" data-foto="${f.src}" aria-label="Ver foto ${i + 1} de ${fotos.length}" aria-pressed="${i === 0}"><img src="${f.srcSm}" alt="" width="72" height="72" loading="lazy" decoding="async"></button>`)
    .join('')}</div>`;
}

function fichaHTML(p) {
  const tallas = p.tallas
    .map((t) => `<button class="size" type="button" data-talla="${t}">${t}${p.unidad}</button>`)
    .join('');

  const media = `
    <div class="quick__media${p.video ? ' has-video' : ''}" id="quickMedia">
      <img src="${p.src}" alt="${p.alt}" width="1000" height="1000" decoding="async">
      <span class="quick__hint">Clic para acercar</span>
      ${p.video ? `<video class="quick__video" src="${p.video}" poster="${p.src}" muted loop playsinline autoplay preload="metadata" aria-label="Video 360° de ${p.name}"></video><span class="quick__hint quick__hint--video">▶ Video 360°</span>` : ''}
      ${favoritoHTML(p, 'quick')}
    </div>`;

  // .quick__lado ocupa solo la fila de la ficha: lo fijo de adentro se suelta antes de los relacionados
  return `
    <div class="quick__lado">${p.fotos?.length > 1 ? `<div class="quick__galeria">${media}${miniaturasHTML(p, p.fotos)}</div>` : media}</div>

    <div class="quick__info">
      <p class="eyebrow">${p.tipo}${{ unisex: ' unisex', kids: ' kids' }[p.genero] || ''}${p.lineaGorra ? ` · Línea ${p.lineaGorra.toLowerCase()}` : ''}${p.escala ? ` · Talla ${p.escala}` : ''}</p>
      <h2 class="h2 quick__title">${p.name}</h2>
      <p class="lead">${p.tag}${p.tag.toLowerCase().includes(p.color.toLowerCase()) ? '' : ` · ${p.color}`}. ${p.linea === 'caps' ? (p.cierre === 'Ajustable' ? 'Ajustable, talla única.' : 'Cerrada, solo las tallas disponibles.') : `${p.marca}${p.genero === 'unisex' ? ', unisex (hombre y dama)' : ''}, talla ${p.escala}.`}</p>

      <p class="quick__price${tienePrecio(p) ? '' : ' is-cotizar'}" id="quickPrecio"><span id="quickPrecioN">${precioCOP(p.precio)}</span> <small>${tienePrecio(p) ? 'Precio confirmado' : 'Agrégalo y te lo confirmamos en el chat'}</small></p>
      ${descuento(p) ? `<p class="quick__antes">Antes <s>${precioCOP(descuento(p).antes)}</s> · Ahorras ${precioCOP(descuento(p).ahorro)} (-${descuento(p).porcentaje}%)</p>` : ''}
      ${conCuotas() ? cuotasHTML() : ''}

      <div>
        <p class="mono" style="margin-bottom:.5rem">${p.tallas.length === 1 ? 'Talla única' : `Elige tu talla${p.escala ? ` (${p.escala})` : ''}`}</p>
        <div class="sizes" id="quickSizes" role="group" aria-label="Tallas disponibles">${tallas}</div>
        ${p.linea === 'sneakers' ? (p.genero === 'kids' ? '' : guiaFichaHTML(p)) : p.cierre !== 'Ajustable' ? guiaGorraHTML(p) : ''}
      </div>

      <div>
        <p class="mono" style="margin-bottom:.5rem">Cantidad</p>
        <div class="qty" id="quickQty" role="group" aria-label="Cantidad">
          <button class="qty__btn" type="button" data-qty="menos" aria-label="Quitar una unidad">−</button>
          <span class="qty__n" id="quickQtyN">1</span>
          <button class="qty__btn" type="button" data-qty="mas" aria-label="Agregar una unidad">+</button>
        </div>
      </div>

      <button class="btn btn--dark btn--lg btn--block" id="quickAdd" type="button">
        ${bolsaIcon} Agregar al carrito
      </button>
      <a class="btn btn--primary btn--lg btn--block" id="quickCta" href="#" target="_blank" rel="noopener">
        ${waIcon} Pedir solo esta pieza
      </a>

      ${p.descripcion ? `
      <div class="quick__sobre">
        <p class="mono">Sobre el modelo</p>
        <p class="quick__desc">${p.descripcion}</p>
      </div>` : ''}

      <ul class="spec-list">
        <li><span class="k">Línea</span><span class="v">${p.linea === 'caps' ? [p.equipo, p.liga].filter(Boolean).join(' · ') || p.tipo : p.marca}</span></li>
        <li><span class="k">Referencia</span><span class="v">${p.tag}</span></li>
        <li><span class="k">Color</span><span class="v">${p.color}</span></li>
        <li><span class="k">Tallas</span><span class="v">${p.tallas[0]}${p.unidad} — ${p.tallas[p.tallas.length - 1]}${p.unidad}</span></li>
        <li><span class="k">Envío</span><span class="v">${SITE.envios}</span></li>
        <li><span class="k">Garantía</span><span class="v">15 días por despegue o descosido · talla: 5 días</span></li>
      </ul>
    </div>

    <section class="quick__related" aria-label="También te puede interesar">
      <h3 class="mono">También te puede interesar</h3>
      <div class="quick__related-track">
        ${relacionados(p).map((r) => cardHTML(r, { sizes: '(max-width: 860px) 42vw, 220px', rapida: false })).join('')}
      </div>
    </section>`;
}

function mensaje(p) {
  const partes = [`Hola OGCLEAN, quiero comprar: ${p.name} (${p.tag}) — ${tienePrecio(p) ? precioCOP(p.precio * cantidadElegida) : 'precio a confirmar'}.`];
  if (tallaElegida) partes.push(`Talla: ${tallaElegida}${p.unidad}.`);
  if (cantidadElegida > 1) partes.push(`Cantidad: ${cantidadElegida}.`);
  return partes.join(' ');
}

function activarZoom() {
  const media = qs('#quickMedia');
  if (!media) return;
  const img = qs('img', media);

  media.addEventListener('click', (e) => {
    // El corazón de favoritos vive dentro de la foto: no debe activar el zoom
    if (e.target.closest('.js-favorito')) return;
    // Con video 360°, el primer clic lo quita y deja la foto lista para acercar
    const video = qs('.quick__video', media);
    if (video && !video.hidden) {
      video.pause();
      video.hidden = true;
      qs('.quick__hint--video', media)?.remove();
      return;
    }
    const abierto = media.classList.toggle('is-zoom');
    if (!abierto) { img.style.transformOrigin = 'center center'; return; }
    const r = media.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    img.style.transformOrigin = `${x}% ${y}%`;
  });
}

/** Miniaturas: cambian la foto grande (sin zoom ni video 360° encima). También la usa la página de producto. */
export function activarGaleria(raiz) {
  const tira = qs('.quick__fotos', raiz);
  const media = qs('.quick__media', raiz);
  const img = media && qs('img', media);
  if (!tira || !img) return;
  tira.addEventListener('click', (e) => {
    const b = e.target.closest('.quick__foto');
    if (!b || b.classList.contains('is-active')) return;
    qsa('.quick__foto', tira).forEach((x) => {
      x.classList.toggle('is-active', x === b);
      x.setAttribute('aria-pressed', String(x === b));
    });
    media.classList.remove('is-zoom');
    img.style.transformOrigin = 'center center';
    const video = qs('.quick__video', media);
    if (video && !video.hidden) {
      video.pause();
      video.hidden = true;
      qs('.quick__hint--video', media)?.remove();
    }
    img.src = b.dataset.foto;
  });
}

export function abrirFicha(id, { historial = true } = {}) {
  const p = porId(id);
  if (!p || !modal) return;

  // Entrada propia en el historial (utils/capas.js): «atrás» cierra la ficha y deja la lista donde estaba.
  // Un relacionado reemplaza la entrada; al reabrir desde una entrada no se suma otra.
  if (historial) abrirCapa('ficha', { ogFicha: p.id });

  tallaElegida = '';
  cantidadElegida = 1;
  cuerpo.innerHTML = fichaHTML(p);
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('is-locked');
  if (scroll) scroll.scrollTop = 0;

  const cta = qs('#quickCta');
  const sizes = qs('#quickSizes');
  const qty = qs('#quickQty');
  const qtyN = qs('#quickQtyN');
  const precioN = qs('#quickPrecioN');

  const refrescarCta = () => { if (cta) cta.href = wa(mensaje(p)); };
  const cuotas = qs('#quickCuotas');
  const refrescarCuotas = () => { if (cuotas) cuotas.href = wa(`${mensaje(p)} Quiero pagarlo a cuotas con Sistecrédito.`); };
  refrescarCuotas();
  const refrescarPrecio = () => { if (precioN && tienePrecio(p)) precioN.textContent = precioCOP(p.precio * cantidadElegida); };
  refrescarCta();

  if (qty) {
    qty.addEventListener('click', (e) => {
      const b = e.target.closest('.qty__btn');
      if (!b) return;
      cantidadElegida = Math.min(20, Math.max(1, cantidadElegida + (b.dataset.qty === 'mas' ? 1 : -1)));
      if (qtyN) qtyN.textContent = cantidadElegida;
      refrescarPrecio();
      refrescarCta();
      refrescarCuotas();
    });
  }

  if (sizes) {
    sizes.addEventListener('click', (e) => {
      const b = e.target.closest('.size');
      if (!b) return;
      qsa('.size', sizes).forEach((s) => s.classList.remove('is-active'));
      b.classList.add('is-active');
      tallaElegida = b.dataset.talla;
      sizes.classList.remove('is-hint');
      refrescarCta();
      refrescarCuotas();
    });
  }

  /** Sin talla no se compra: la señalamos en vez de dejar pasar el pedido. */
  const pedirTalla = () => {
    if (tallaElegida || !sizes) return false;
    sizes.classList.add('is-hint');
    sizes.scrollIntoView({ block: 'center', behavior: 'smooth' });
    setTimeout(() => sizes.classList.remove('is-hint'), 900);
    return true;
  };

  if (cta) {
    cta.addEventListener('click', (e) => { if (pedirTalla()) e.preventDefault(); });
  }

  // Sistecrédito: sin talla elegida, primero se señala la talla (igual que «Comprar ahora»)
  cuotas?.addEventListener('click', (e) => { if (pedirTalla()) e.preventDefault(); });

  const add = qs('#quickAdd');
  if (add) {
    add.addEventListener('click', () => {
      // Doble clic: mientras dice «✓ Agregado» no vuelve a agregar (ni guarda ese texto como el original)
      if (add.classList.contains('is-added') || pedirTalla()) return;
      agregar(p.id, tallaElegida, cantidadElegida);
      aviso(p, tallaElegida, cantidadElegida);
      const original = add.innerHTML;
      add.classList.add('is-added');
      add.innerHTML = '✓ Agregado al carrito';
      setTimeout(() => {
        add.classList.remove('is-added');
        add.innerHTML = original;
      }, 1400);
    });
  }

  // Talla única (gorras ajustables): queda marcada de entrada
  if (sizes && p.tallas.length === 1) qs('.size', sizes)?.click();

  activarZoom();
  activarGaleria(cuerpo);
  qs('#quickClose')?.focus({ preventScroll: true });
}

export function cerrarFicha(luego) {
  if (modal?.classList.contains('is-open')) cerrarCapa('ficha', luego);
}

function ocultarFicha() {
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  soltarScroll();
  cuerpo.innerHTML = '';
  if (ultimoFoco && document.contains(ultimoFoco)) ultimoFoco.focus({ preventScroll: true });
}

export function initQuickView() {
  modal = qs('#quick');
  cuerpo = qs('#quickBody');
  scroll = qs('#quickScroll');
  if (!modal) return;

  // Delegación global: cualquier .js-quick abre la ficha, incluso los relacionados
  document.addEventListener('click', (e) => {
    const disparador = e.target.closest('.js-quick');
    if (!disparador) return;
    e.preventDefault();
    if (!modal.classList.contains('is-open')) ultimoFoco = disparador;
    abrirFicha(disparador.dataset.id);
  });

  qs('#quickClose')?.addEventListener('click', () => cerrarFicha());
  qs('#quickVolver')?.addEventListener('click', () => cerrarFicha());
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) cerrarFicha();
  });

  // El logo lleva al inicio. Si ya estamos en el inicio no recarga: cierra la ficha y sube arriba
  qs('.quick__logo')?.addEventListener('click', (e) => {
    if (new URL(e.currentTarget.href, location.href).pathname !== location.pathname) return;
    e.preventDefault();
    // Al volver atrás el navegador repone la posición de la lista justo después del popstate: se sube en el cuadro siguiente
    cerrarFicha(() => requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'instant' })));
  });

  // Atrás la cierra; adelante, o al recargar sobre su entrada, se vuelve a abrir con el mismo producto
  registrarCapa('ficha', ocultarFicha, (estado) => {
    if (!porId(estado?.ogFicha)) return false;
    abrirFicha(estado.ogFicha, { historial: false });
    return true;
  });
}
