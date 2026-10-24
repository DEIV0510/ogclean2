/* Tienda: todos los productos con filtros combinables, búsqueda, orden,
   paginación y URL compartible (tienda.html?categoria=Gorras+ajustables&liga=MLB). */

import { qs, qsa } from '../utils/dom.js';
import { TODOS, ORDEN_COLORES, tienePrecio } from '../data/products.js';
import { renderCards } from '../components/productCard.js';
import { initCompraRapida } from '../components/compraRapida.js';
import { initFila } from '../components/fila.js';
import { escaparHTML as esc } from '../utils/texto.js';
import { guardarPosicionAlSalir, posicionGuardada, volverA } from '../utils/volver.js';
import { registrarCapa, abrirCapa, cerrarCapa, soltarScroll } from '../utils/capas.js';

const POR_PAGINA = 24;
const GRUPOS_TODOS = ['Gorras cerradas', 'Gorras ajustables', 'Básquetbol', 'Zapatillas hombre', 'Zapatillas dama', 'Guayos', 'Botas', 'Zuecos', 'Chanclas'];
// Una categoría sin productos no se muestra como pestaña
const GRUPOS = GRUPOS_TODOS.filter((g) => TODOS.some((p) => p.grupos.includes(g)));

/* Enlaces viejos siguen funcionando: ?categoria=Gorras muestra las dos líneas de gorras;
   ?categoria=Zapatillas muestra hombre+dama+básquetbol (las zapatillas: ni botas, ni guayos, ni zuecos).
   Las unisex están en dos categorías a la vez (p.grupos). */
const esGrupo = (p, g) => p.grupos.includes(g)
  || (g === 'Gorras' && p.linea === 'caps')
  || (g === 'Zapatillas' && p.linea === 'sneakers' && p.tipo === 'Zapatillas');

/* Filtros de casillas. Añadir uno nuevo = una línea aquí + su bloque en tienda.html.
   `orden` fija el orden de las opciones; si no, se ordenan por cantidad. */
const FACETAS = [
  // Género del calzado (las unisex están en los dos; las gorras no tienen): «Adidas dama», «Jordan hombre»…
  { id: 'genero', campo: 'generos', param: 'genero', orden: ['Hombre', 'Dama'] },
  { id: 'lineaGorra', campo: 'lineaGorra', param: 'linea', orden: ['Clásica', 'Exclusiva'] },
  { id: 'liga', campo: 'liga', param: 'liga', orden: ['MLB', 'NBA', 'NFL', 'NHL', 'NCAA', 'World Baseball Classic', 'Marcas', 'Otras'],
    etiqueta: (v) => ({ Marcas: 'Marcas (Supreme, Jordan…)', Otras: 'Otras' }[v] || v) },
  { id: 'equipo', campo: 'equipo', param: 'equipo' },
  { id: 'marca', campo: 'marca', param: 'marca', etiqueta: (v) => (v === 'Otras' ? 'Otras (sin marca)' : v) },
];

/* Estado de filtros. Los conjuntos permiten marcar varias opciones a la vez. */
const estado = {
  q: '',
  grupo: 'todo',
  sel: Object.fromEntries(FACETAS.map((f) => [f.id, new Set()])),
  colores: new Set(),
  precio: 'todos', // todos | con | cotizar
  orden: 'destacados',
  visibles: POR_PAGINA,
};

const normal = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const etiquetaDe = (faceta, v) => (faceta.etiqueta ? faceta.etiqueta(v) : v);

let refs = {};

/* ---------------- Filtrado ---------------- */

/** Aplica todos los filtros menos `ignorar` (sirve para contar opciones de esa faceta). */
function filtrar(ignorar = '') {
  const palabras = normal(estado.q).split(/\s+/).filter(Boolean);
  return TODOS.filter((p) => {
    if (ignorar !== 'grupo' && estado.grupo !== 'todo' && !esGrupo(p, estado.grupo)) return false;
    for (const f of FACETAS) {
      if (ignorar === f.id) continue;
      const set = estado.sel[f.id];
      if (set.size && ![].concat(p[f.campo] ?? []).some((v) => set.has(v))) return false;
    }
    if (ignorar !== 'colores' && estado.colores.size && !p.colores.some((c) => estado.colores.has(c))) return false;
    if (ignorar !== 'precio') {
      if (estado.precio === 'con' && !tienePrecio(p)) return false;
      if (estado.precio === 'cotizar' && tienePrecio(p)) return false;
    }
    if (palabras.length) {
      const texto = normal([p.name, p.tag, p.color, p.marca, ...p.grupos, p.genero === 'unisex' ? 'unisex' : '', p.tipo, p.equipo, p.liga, p.cierre, p.lineaGorra]
        .filter(Boolean).join(' '));
      if (!palabras.every((w) => texto.includes(w))) return false;
    }
    return true;
  });
}

function ordenar(lista) {
  const copia = [...lista];
  const nombre = (a, b) => a.name.localeCompare(b.name, 'es') || a.tag.localeCompare(b.tag, 'es');
  if (estado.orden === 'az') copia.sort(nombre);
  if (estado.orden === 'za') copia.sort((a, b) => nombre(b, a));
  if (estado.orden === 'precio') {
    // Con precio primero (de menor a mayor); lo que se cotiza, al final
    copia.sort((a, b) => {
      const pa = tienePrecio(a) ? a.precio : Infinity;
      const pb = tienePrecio(b) ? b.precio : Infinity;
      return pa - pb || nombre(a, b);
    });
  }
  return copia;
}

const contar = (lista, clave) => lista.reduce((acc, p) => {
  const valores = Array.isArray(p[clave]) ? p[clave] : [p[clave]];
  valores.filter(Boolean).forEach((v) => { acc[v] = (acc[v] || 0) + 1; });
  return acc;
}, {});

/* ---------------- Pintado de filtros ---------------- */

const idSeguro = (t) => normal(String(t)).replace(/[^a-z0-9]+/g, '-');

function opcionCheck(nombre, valor, label, n, marcado) {
  const id = `f-${nombre}-${idSeguro(valor)}`;
  return `
    <label class="filtro-op${n ? '' : ' is-cero'}" for="${id}">
      <input type="checkbox" id="${id}" name="${nombre}" value="${valor}"${marcado ? ' checked' : ''}${!n && !marcado ? ' disabled' : ''}>
      <span class="filtro-op__caja" aria-hidden="true"></span>
      <span class="filtro-op__txt">${label}</span>
      <span class="filtro-op__n">${n}</span>
    </label>`;
}

function pintarFiltros() {
  // Categorías (pestañas grandes arriba)
  // Por `grupos`: una unisex suma en hombre y en dama, pero en «Todo» cuenta una sola vez
  const sinGrupo = filtrar('grupo');
  const porGrupo = contar(sinGrupo, 'grupos');
  const totalGrupo = sinGrupo.length;
  refs.grupos.innerHTML = [['todo', 'Todo', totalGrupo], ...GRUPOS.map((g) => [g, g, porGrupo[g] || 0])]
    .map(([id, label, n]) => `
      <button class="tienda-cat${estado.grupo === id ? ' is-active' : ''}" type="button" data-grupo="${id}" aria-pressed="${estado.grupo === id}">
        ${label} <span>${n}</span>
      </button>`)
    .join('');

  // Facetas de casillas: solo se muestran si aplican a lo que se está viendo
  FACETAS.forEach((f) => {
    const cont = qs(`#filtro-${f.id}`);
    const bloque = qs(`#bloque-${f.id}`);
    if (!cont || !bloque) return;
    const conteo = contar(filtrar(f.id), f.campo);
    const set = estado.sel[f.id];
    let valores = [...new Set([...Object.keys(conteo), ...set])];
    if (f.orden) valores = f.orden.filter((v) => valores.includes(v)).concat(valores.filter((v) => !f.orden.includes(v)));
    else valores.sort((a, b) => (a === 'Otras') - (b === 'Otras') || (conteo[b] || 0) - (conteo[a] || 0) || a.localeCompare(b, 'es'));
    cont.innerHTML = valores.map((v) => opcionCheck(f.id, v, etiquetaDe(f, v), conteo[v] || 0, set.has(v))).join('');
    bloque.hidden = valores.length < (set.size ? 1 : 2); // una sola opción no filtra nada
  });

  // Colores como muestras
  const porColor = contar(filtrar('colores'), 'colores');
  refs.colores.innerHTML = ORDEN_COLORES
    .filter((c) => porColor[c] || estado.colores.has(c))
    .map((c) => {
      const activo = estado.colores.has(c);
      const clase = normal(c).replace(/[^a-z]+/g, '-');
      return `
        <button class="filtro-color${activo ? ' is-active' : ''}" type="button" data-color="${c}" aria-pressed="${activo}">
          <span class="filtro-color__muestra filtro-color__muestra--${clase}" aria-hidden="true"></span>
          <span>${c}</span><span class="filtro-op__n">${porColor[c] || 0}</span>
        </button>`;
    })
    .join('');

  // Precio
  const basePrecio = filtrar('precio');
  const con = basePrecio.filter(tienePrecio).length;
  refs.precio.innerHTML = [['todos', 'Todos', basePrecio.length], ['con', 'Con precio publicado', con], ['cotizar', 'Precio por WhatsApp', basePrecio.length - con]]
    .map(([id, label, n]) => `
      <label class="filtro-op filtro-op--radio${n || estado.precio === id ? '' : ' is-cero'}">
        <input type="radio" name="precio" value="${id}"${estado.precio === id ? ' checked' : ''}${!n && estado.precio !== id ? ' disabled' : ''}>
        <span class="filtro-op__caja" aria-hidden="true"></span>
        <span class="filtro-op__txt">${label}</span>
        <span class="filtro-op__n">${n}</span>
      </label>`)
    .join('');
}

/* ---------------- Resultados ---------------- */

/* La búsqueda llega de la dirección (?q=): los filtros activos se escriben con esc() (utils/texto.js), nunca
   como HTML. Sin esto, un enlace como tienda/?q=<img onerror=…> ejecutaba código en la página de quien lo abriera. */

function chipsActivos() {
  const chips = [];
  if (estado.q.trim()) chips.push(['q', estado.q.trim(), `“${estado.q.trim()}”`]);
  if (estado.grupo !== 'todo') chips.push(['grupo', estado.grupo, estado.grupo]);
  FACETAS.forEach((f) => estado.sel[f.id].forEach((v) => chips.push([f.id, v, etiquetaDe(f, v)])));
  estado.colores.forEach((c) => chips.push(['color', c, c]));
  if (estado.precio !== 'todos') chips.push(['precio', estado.precio, estado.precio === 'con' ? 'Con precio' : 'Precio por WhatsApp']);
  return chips;
}

function pintarResultados({ mantenerScroll = false } = {}) {
  const lista = ordenar(filtrar());
  const pagina = lista.slice(0, estado.visibles);

  // Las 4 primeras fotos son las que se ven al abrir la tienda: van con prioridad
  renderCards(refs.grid, pagina, { sizes: '(max-width: 620px) 46vw, (max-width: 1100px) 30vw, 260px', prioridad: 4 });
  refs.grid.classList.remove('is-cargando'); // quita el alto reservado antes del JS (ver shop.css)

  const n = lista.length;
  refs.total.textContent = n;
  refs.resumen.textContent = n
    ? `Mostrando ${pagina.length} de ${n} ${n === 1 ? 'producto' : 'productos'}`
    : 'Sin resultados';
  refs.vacio.hidden = n > 0;
  refs.mas.hidden = estado.visibles >= n;
  refs.masTexto.textContent = `Ver más productos (${n - pagina.length})`;

  const chips = chipsActivos();
  refs.activos.innerHTML = chips.map(([tipo, valor, label]) => `
    <button class="filtro-activo" type="button" data-quitar="${esc(tipo)}" data-valor="${esc(valor)}" aria-label="Quitar filtro ${esc(label)}">
      ${esc(label)} <span aria-hidden="true">✕</span>
    </button>`).join('') + (chips.length ? '<button class="filtro-limpiar" type="button" data-limpiar>Limpiar todo</button>' : '');
  refs.activosBloque.hidden = !chips.length;

  // Contador del botón "Filtros" en móvil
  const cuantos = chips.filter(([t]) => t !== 'q').length;
  refs.contadorMovil.textContent = cuantos ? `(${cuantos})` : '';
  refs.verResultados.textContent = `Ver ${n} ${n === 1 ? 'resultado' : 'resultados'}`;

  pintarFiltros();
  guardarEnUrl();

  if (!mantenerScroll && refs.inicioResultados.getBoundingClientRect().top < 0) {
    refs.inicioResultados.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/* ---------------- URL (enlaces compartibles y atrás/adelante) ---------------- */

function guardarEnUrl() {
  const u = new URLSearchParams();
  if (estado.q.trim()) u.set('q', estado.q.trim());
  if (estado.grupo !== 'todo') u.set('categoria', estado.grupo);
  FACETAS.forEach((f) => { if (estado.sel[f.id].size) u.set(f.param, [...estado.sel[f.id]].join(',')); });
  if (estado.colores.size) u.set('color', [...estado.colores].join(','));
  if (estado.precio !== 'todos') u.set('precio', estado.precio);
  if (estado.orden !== 'destacados') u.set('orden', estado.orden);
  const texto = u.toString();
  // Conserva el estado de la entrada (la ficha abierta lo usa para que «atrás» la cierre)
  history.replaceState(history.state, '', `${location.pathname}${texto ? `?${texto}` : ''}`);
}

function leerUrl() {
  const u = new URLSearchParams(location.search);
  const lista = (k) => (u.get(k) || '').split(',').map((s) => s.trim()).filter(Boolean);
  estado.q = u.get('q') || '';
  const cat = u.get('categoria');
  // ?tipo=Ajustable|Cerrada (enlaces anteriores) se traduce a su categoría
  const tipo = u.get('tipo');
  estado.grupo = GRUPOS.includes(cat) || cat === 'Gorras' || cat === 'Zapatillas' ? cat : 'todo';
  if (tipo === 'Ajustable') estado.grupo = 'Gorras ajustables';
  if (tipo === 'Cerrada') estado.grupo = 'Gorras cerradas';
  FACETAS.forEach((f) => {
    const validos = new Set(TODOS.flatMap((p) => [].concat(p[f.campo] ?? [])).filter(Boolean));
    estado.sel[f.id] = new Set(lista(f.param).filter((v) => validos.has(v)));
  });
  estado.colores = new Set(lista('color').filter((c) => ORDEN_COLORES.includes(c)));
  estado.precio = ['con', 'cotizar'].includes(u.get('precio')) ? u.get('precio') : 'todos';
  estado.orden = ['az', 'za', 'precio'].includes(u.get('orden')) ? u.get('orden') : 'destacados';
}

/* ---------------- Panel de filtros en móvil ---------------- */

function abrirPanel() {
  refs.panel.classList.add('is-open');
  refs.fondo.hidden = false;
  document.body.classList.add('is-locked');
  abrirCapa('filtros'); // «atrás» cierra el panel y deja la tienda (utils/capas.js)
  refs.botonFiltros.setAttribute('aria-expanded', 'true');
  qs('.tienda-filtros__cerrar', refs.panel)?.focus({ preventScroll: true });
}

function cerrarPanel() {
  if (refs.panel.classList.contains('is-open')) cerrarCapa('filtros');
}

function ocultarPanel() {
  refs.panel.classList.remove('is-open');
  refs.fondo.hidden = true;
  soltarScroll();
  refs.botonFiltros.setAttribute('aria-expanded', 'false');
  // Los filtros cambiaron la URL de la entrada del panel; al volver a la de la lista se reescribe con los de ahora
  guardarEnUrl();
}

/* ---------------- Arranque ---------------- */

export function initShop() {
  refs = {
    grid: qs('#tiendaGrid'),
    grupos: qs('#tiendaGrupos'),
    colores: qs('#filtroColores'),
    precio: qs('#filtroPrecio'),
    buscar: qs('#tiendaBuscar'),
    orden: qs('#tiendaOrden'),
    total: qs('#tiendaTotal'),
    resumen: qs('#tiendaResumen'),
    vacio: qs('#tiendaVacio'),
    mas: qs('#tiendaMas'),
    masTexto: qs('#tiendaMas span'),
    activos: qs('#filtrosActivos'),
    activosBloque: qs('#bloqueActivos'),
    panel: qs('#tiendaFiltros'),
    fondo: qs('#tiendaFondo'),
    botonFiltros: qs('#abrirFiltros'),
    contadorMovil: qs('#contadorFiltros'),
    verResultados: qs('#verResultados'),
    inicioResultados: qs('#resultados'),
  };
  if (!refs.grid) return;
  registrarCapa('filtros', ocultarPanel);

  // Las categorías no caben en una línea: flechas para correr la fila (pedido del dueño)
  initFila(refs.grupos, { etiqueta: 'categorías', sangrado: true });

  // Alto real del header para que la barra y los filtros fijos no queden debajo
  const header = qs('#header');
  const medirHeader = () => {
    if (header) document.documentElement.style.setProperty('--alto-header', `${Math.round(header.offsetHeight)}px`);
  };
  medirHeader();
  window.addEventListener('resize', medirHeader);

  leerUrl();
  refs.buscar.value = estado.q;
  refs.orden.value = estado.orden;

  const reiniciar = () => { estado.visibles = POR_PAGINA; };
  const toggle = (set, valor) => (set.has(valor) ? set.delete(valor) : set.add(valor));
  const enPanel = () => refs.panel.classList.contains('is-open');

  const limpiar = () => {
    estado.q = '';
    refs.buscar.value = '';
    estado.grupo = 'todo';
    FACETAS.forEach((f) => estado.sel[f.id].clear());
    estado.colores.clear();
    estado.precio = 'todos';
    reiniciar();
    pintarResultados();
  };

  // Búsqueda con pequeña espera para no repintar en cada letra
  let t = 0;
  refs.buscar.addEventListener('input', () => {
    clearTimeout(t);
    t = setTimeout(() => {
      estado.q = refs.buscar.value;
      reiniciar();
      pintarResultados({ mantenerScroll: true });
    }, 180);
  });
  qs('#tiendaBuscarForm')?.addEventListener('submit', (e) => { e.preventDefault(); refs.buscar.blur(); });

  refs.orden.addEventListener('change', () => {
    estado.orden = refs.orden.value;
    reiniciar();
    pintarResultados();
  });

  refs.grupos.addEventListener('click', (e) => {
    const b = e.target.closest('[data-grupo]');
    if (!b) return;
    estado.grupo = b.dataset.grupo;
    // Al cambiar de categoría se sueltan los filtros que ya no aplican (ej. equipo en zapatillas)
    FACETAS.forEach((f) => {
      const validos = new Set(filtrar(f.id).map((p) => p[f.campo]));
      estado.sel[f.id].forEach((v) => { if (!validos.has(v)) estado.sel[f.id].delete(v); });
    });
    reiniciar();
    pintarResultados();
  });

  refs.panel.addEventListener('change', (e) => {
    const input = e.target;
    const faceta = FACETAS.find((f) => f.id === input.name);
    if (faceta) toggle(estado.sel[faceta.id], input.value);
    else if (input.name === 'precio') estado.precio = input.value;
    else return;
    reiniciar();
    pintarResultados({ mantenerScroll: enPanel() });
  });

  refs.panel.addEventListener('click', (e) => {
    const color = e.target.closest('[data-color]');
    if (color) {
      toggle(estado.colores, color.dataset.color);
      reiniciar();
      pintarResultados({ mantenerScroll: enPanel() });
      return;
    }
    if (e.target.closest('[data-limpiar-panel]')) limpiar();
    if (e.target.closest('.tienda-filtros__cerrar') || e.target.closest('#verResultados')) cerrarPanel();
  });

  refs.activos.addEventListener('click', (e) => {
    if (e.target.closest('[data-limpiar]')) { limpiar(); return; }
    const b = e.target.closest('[data-quitar]');
    if (!b) return;
    const { quitar, valor } = b.dataset;
    if (quitar === 'q') { estado.q = ''; refs.buscar.value = ''; }
    else if (quitar === 'grupo') estado.grupo = 'todo';
    else if (quitar === 'color') estado.colores.delete(valor);
    else if (quitar === 'precio') estado.precio = 'todos';
    else estado.sel[quitar]?.delete(valor);
    reiniciar();
    pintarResultados({ mantenerScroll: true });
  });

  qs('#tiendaVacioLimpiar')?.addEventListener('click', limpiar);

  refs.mas.addEventListener('click', () => {
    const antes = estado.visibles;
    estado.visibles += POR_PAGINA;
    pintarResultados({ mantenerScroll: true });
    qsa('.card', refs.grid)[antes]?.querySelector('.card__buy')?.focus({ preventScroll: true });
  });

  refs.botonFiltros.addEventListener('click', abrirPanel);
  refs.fondo.addEventListener('click', cerrarPanel);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && refs.panel.classList.contains('is-open')) cerrarPanel();
  });
  // Si pasan a escritorio con el panel abierto, se suelta el bloqueo
  window.matchMedia('(min-width: 1000px)').addEventListener('change', (m) => { if (m.matches) cerrarPanel(); });

  // «Atrás» desde otra página: los mismos productos cargados («Ver más») y el mismo punto de la lista
  const vuelta = posicionGuardada();
  if (vuelta?.visibles > POR_PAGINA) estado.visibles = vuelta.visibles;
  guardarPosicionAlSalir(() => ({ visibles: estado.visibles }));

  initCompraRapida(refs.grid);
  pintarResultados({ mantenerScroll: true });
  if (vuelta) volverA(vuelta.y);

  // Si llegan con una categoría marcada (ej. desde el inicio), que se vea la pestaña activa
  const activa = qs('.tienda-cat.is-active', refs.grupos);
  if (activa) refs.grupos.scrollLeft = activa.offsetLeft - refs.grupos.clientWidth / 2 + activa.offsetWidth / 2;
}
