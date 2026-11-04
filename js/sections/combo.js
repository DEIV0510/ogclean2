/* "Arma tu combo": configurador gorra + calzado con total real y pedido
   precargado en WhatsApp (modelos, tallas y total). Muestra todo el catálogo
   (el dueño pidió que "salgan todas las gorras y todos los zapatos"), repartido
   en las mismas categorías de la tienda para poder recorrerlo: cada fila tiene
   flechas y sus fotos cargan solo cuando se asoman. */

import { qs, qsa } from '../utils/dom.js';
import { LINEAS, tienePrecio, porId } from '../data/products.js';
import { wa, precioCOP } from '../data/site.js';
import { agregar } from '../components/cart.js';
import { initFila } from '../components/fila.js';

const CATEGORIAS = {
  caps: [['Gorras cerradas', 'Cerradas'], ['Gorras ajustables', 'Ajustables']],
  sneakers: [['Básquetbol', 'Básquetbol'], ['Zapatillas hombre', 'Hombre'], ['Zapatillas dama', 'Dama'],
    ['Guayos', 'Guayos'], ['Botas', 'Botas'], ['Zuecos', 'Zuecos'], ['Chanclas', 'Chanclas'], ['Sandalias', 'Sandalias']],
};
const itemsDe = (linea, grupo) => LINEAS[linea].items.filter((p) => p.grupos.includes(grupo));

/* Con qué arranca el combo (las mismas piezas que ya trae el HTML) */
const INICIO = { caps: 'caps-mets-rojo', sneakers: 'sneakers-kyrie4-negro' };

/* En el pedido cada pieza de calzado se nombra por lo que es */
const piezaCalzado = (p) => (p.tipo && p.tipo !== 'Zapatillas' ? p.tipo : 'Zapatillas');

const estado = {
  caps: { item: null, talla: '', grupo: '' },
  sneakers: { item: null, talla: '', grupo: '' },
};

/* Hay cientos de miniaturas: cada foto se pide solo cuando se asoma en su fila */
const vigias = new WeakMap();
function vigilarFotos(cont) {
  const pendientes = qsa('img[data-src]', cont);
  if (!('IntersectionObserver' in window)) {
    pendientes.forEach((img) => { img.src = img.dataset.src; });
    return;
  }
  let io = vigias.get(cont);
  if (!io) {
    io = new IntersectionObserver((entradas) => entradas.forEach((en) => {
      if (!en.isIntersecting) return;
      const img = en.target;
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
      io.unobserve(img);
    }), { root: cont, rootMargin: '0px 320px' });
    vigias.set(cont, io);
  }
  io.disconnect();
  pendientes.forEach((img) => io.observe(img));
}

function pintarCats(cont, linea) {
  if (!cont) return;
  const activa = estado[linea].grupo;
  cont.innerHTML = CATEGORIAS[linea]
    .map(([grupo, label]) => ({ grupo, label, n: itemsDe(linea, grupo).length }))
    .filter((c) => c.n)
    .map((c) => `
      <button class="combo__cat${c.grupo === activa ? ' is-active' : ''}" type="button"
              data-grupo="${c.grupo}" aria-pressed="${c.grupo === activa}">${c.label} <span>${c.n}</span></button>`)
    .join('');
}

function pintarThumbs(cont, linea) {
  const { grupo, item } = estado[linea];
  cont.innerHTML = itemsDe(linea, grupo)
    .map((p) => `
      <button class="combo__thumb${p === item ? ' is-active' : ''}" type="button" role="option"
              aria-selected="${p === item}" data-id="${p.id}" title="${p.name} — ${p.tag}">
        <img data-src="${p.srcCard || p.srcSm}" alt="${p.alt}" loading="lazy" decoding="async" width="120" height="120">
      </button>`)
    .join('');
  vigilarFotos(cont);
  // Que se vea la miniatura elegida aunque no sea de las primeras
  const activa = qs('.combo__thumb.is-active', cont);
  cont.scrollLeft = activa ? activa.offsetLeft - cont.clientWidth / 2 + activa.offsetWidth / 2 : 0;
}

function pintarTallas(cont, linea) {
  const { item, talla } = estado[linea];
  cont.innerHTML = item.tallas
    .map((t) => `<button class="size${t === talla ? ' is-active' : ''}" type="button" data-talla="${t}">${t}${item.unidad}</button>`)
    .join('');
}

export function initCombo() {
  const capThumbs = qs('#comboCapThumbs');
  const sneThumbs = qs('#comboSneThumbs');
  if (!capThumbs || !sneThumbs) return;

  const refs = {
    caps: { thumbs: capThumbs, cats: qs('#comboCapCats'), sizes: qs('#comboCapSizes'), img: qs('#comboCapImg'), name: qs('#comboCapName'), tag: qs('#comboCapTag') },
    sneakers: { thumbs: sneThumbs, cats: qs('#comboSneCats'), sizes: qs('#comboSneSizes'), img: qs('#comboSneImg'), name: qs('#comboSneName'), tag: qs('#comboSneTag') },
  };
  const totalEl = qs('#comboTotal');
  const cta = qs('#comboCta');

  const piezas = () => [estado.caps.item, estado.sneakers.item].filter(Boolean);
  const total = () => piezas().reduce((n, p) => n + (tienePrecio(p) ? p.precio : 0), 0);
  const sinPrecio = () => piezas().filter((p) => !tienePrecio(p));
  const textoTotal = () => {
    const faltan = sinPrecio().map((p) => (p.linea === 'caps' ? 'gorra' : piezaCalzado(p).toLowerCase()));
    return faltan.length ? `${precioCOP(total())} + ${faltan.join(' y ')} por cotizar` : precioCOP(total());
  };

  const mensaje = () => {
    const c = estado.caps.item;
    const s = estado.sneakers.item;
    const lineas = ['Hola OGCLEAN, quiero este combo:'];
    if (c) lineas.push(`• Gorra ${c.name} (${c.tag})${estado.caps.talla ? ` talla ${estado.caps.talla}` : ''} — ${precioCOP(c.precio)}`);
    if (s) lineas.push(`• ${piezaCalzado(s)} ${s.name} (${s.tag})${estado.sneakers.talla ? ` talla ${estado.sneakers.talla}${s.unidad}` : ''} — ${tienePrecio(s) ? precioCOP(s.precio) : 'precio a confirmar'}`);
    lineas.push(`Total: ${textoTotal()}`);
    return lineas.join('\n');
  };

  const refrescar = () => {
    if (totalEl) {
      totalEl.textContent = textoTotal();
      totalEl.classList.toggle('is-long', sinPrecio().length > 0);
    }
    if (cta) cta.href = wa(mensaje());
  };

  const setItem = (linea, item) => {
    if (!item) return;
    const e = estado[linea];
    e.item = item;
    // La talla elegida se conserva si la nueva pieza la tiene; si solo hay una, va sola
    if (!item.tallas.includes(e.talla)) e.talla = '';
    if (item.tallas.length === 1) e.talla = item.tallas[0];
    pintarTallas(refs[linea].sizes, linea);

    const r = refs[linea];
    const preview = r.img?.parentElement;
    if (preview) preview.classList.add('is-swapping');
    setTimeout(() => {
      r.img.src = item.srcCard || item.srcSm;
      r.img.alt = item.alt;
      r.name.textContent = item.name;
      r.tag.textContent = `${item.tag} · ${precioCOP(item.precio)}`;
      if (preview) preview.classList.remove('is-swapping');
    }, 160);
    refrescar();
  };

  initFila(capThumbs, { etiqueta: 'gorras' });
  initFila(sneThumbs, { etiqueta: 'pares' });

  ['caps', 'sneakers'].forEach((linea) => {
    const r = refs[linea];
    const primero = porId(INICIO[linea]) || LINEAS[linea].items[0];
    estado[linea].grupo = primero.grupo;
    setItem(linea, primero);
    pintarCats(r.cats, linea);
    pintarThumbs(r.thumbs, linea);

    // Otra categoría: se muestran sus piezas y se elige la primera
    r.cats?.addEventListener('click', (e) => {
      const b = e.target.closest('[data-grupo]');
      if (!b || b.dataset.grupo === estado[linea].grupo) return;
      estado[linea].grupo = b.dataset.grupo;
      setItem(linea, itemsDe(linea, b.dataset.grupo)[0]);
      pintarCats(r.cats, linea);
      pintarThumbs(r.thumbs, linea);
    });

    r.thumbs.addEventListener('click', (e) => {
      const b = e.target.closest('.combo__thumb');
      if (!b) return;
      qsa('.combo__thumb', r.thumbs).forEach((t) => {
        const activo = t === b;
        t.classList.toggle('is-active', activo);
        t.setAttribute('aria-selected', String(activo));
      });
      setItem(linea, porId(b.dataset.id));
    });

    r.sizes.addEventListener('click', (e) => {
      const b = e.target.closest('.size');
      if (!b) return;
      qsa('.size', r.sizes).forEach((s) => s.classList.toggle('is-active', s === b));
      estado[linea].talla = b.dataset.talla;
      refrescar();
    });
  });

  // Manda el combo completo al carrito (una línea por pieza)
  const add = qs('#comboAdd');
  if (add) {
    add.addEventListener('click', () => {
      const faltaTalla = !estado.caps.talla || !estado.sneakers.talla;
      if (faltaTalla) {
        [refs.caps.sizes, refs.sneakers.sizes].forEach((cont, i) => {
          const falta = i === 0 ? !estado.caps.talla : !estado.sneakers.talla;
          if (!cont || !falta) return;
          cont.classList.add('is-hint');
          setTimeout(() => cont.classList.remove('is-hint'), 900);
        });
        return;
      }
      agregar(estado.caps.item.id, estado.caps.talla);
      agregar(estado.sneakers.item.id, estado.sneakers.talla);
      const original = add.textContent;
      add.classList.add('is-added');
      add.textContent = '✓ Combo agregado';
      setTimeout(() => { add.classList.remove('is-added'); add.textContent = original; }, 1400);
    });
  }
}
