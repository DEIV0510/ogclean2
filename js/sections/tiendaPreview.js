/* Vista previa de la tienda en el inicio: accesos por categoría y marca y salto a tienda.html.
   (La fila de productos «Una muestra de la tienda» se quitó el 2026-10-21, pedido del usuario.) */

import { qs } from '../utils/dom.js';
import { TODOS } from '../data/products.js';

const enlace = (params) => `tienda.html?${new URLSearchParams(params).toString()}`;

export function initTiendaPreview() {
  const cats = qs('#previewCategorias');
  const marcas = qs('#previewMarcas');
  if (!cats && !marcas) return;

  const cuenta = (g) => TODOS.filter((p) => p.grupos.includes(g)).length;

  if (cats) {
    const portada = {
      'Gorras cerradas': 'assets/img/caps/yankees-negro-oro-sm.webp',
      'Gorras ajustables': 'assets/img/gorras/los-angeles-dodgers-naranja-pespunte-sm.webp',
      'Básquetbol': 'assets/img/zapatos/jordan-air-jordan-4-blanco-rosa-sm.webp',
      'Zapatillas hombre': 'assets/img/zapatos/nike-dunk-low-blanco-negro-sm.webp',
      'Zapatillas dama': 'assets/img/zapatos/on-cloud-crema-rosa-sm.webp',
      Botas: 'assets/img/zapatos/timberland-bota-6-trigo-monograma-sm.webp',
      Guayos: 'assets/img/zapatos/nike-phantom-celeste-negro-fucsia-sm.webp',
      Zuecos: 'assets/img/zapatos/adidas-adimule-cafe-gamuza-sm.webp',
      Chanclas: 'assets/img/zapatos/adidas-adilette-negro-blanco-suela-negra-sm.webp',
    };
    // 8 accesos: en escritorio llenan la grilla de 3 (Básquetbol ocupa dos filas); una categoría sin
    // productos no se muestra
    cats.innerHTML = ['Básquetbol', 'Zapatillas hombre', 'Zapatillas dama', 'Kids', 'Gorras cerradas', 'Gorras ajustables', 'Guayos', 'Botas', 'Zuecos', 'Chanclas']
      .filter((g) => cuenta(g) > 0)
      .map((g) => `
      <a class="preview-cat" href="${enlace({ categoria: g })}">
        <img src="${portada[g] || TODOS.find((p) => p.grupos.includes(g))?.srcSm}" alt="" loading="lazy" decoding="async" width="560" height="560">
        <span class="preview-cat__txt">
          <span class="preview-cat__n mono">${cuenta(g)} productos</span>
          <span class="preview-cat__t">${g}</span>
        </span>
        <span class="preview-cat__flecha" aria-hidden="true">→</span>
      </a>`).join('');
  }

  if (marcas) {
    // Marca × género (dueño, 2026-10-04: «Adidas dama, Adidas hombre, Jordan dama, Jordan hombre…»).
    // Las unisex cuentan en los dos géneros; «Otras» (sin marca) no se lista.
    const conteo = {};
    const porGenero = {};
    TODOS.forEach((p) => {
      if (p.linea !== 'sneakers' || p.marca === 'Otras') return;
      conteo[p.marca] = (conteo[p.marca] || 0) + 1;
      const g = (porGenero[p.marca] = porGenero[p.marca] || { Hombre: 0, Dama: 0, Kids: 0 });
      p.generos.forEach((x) => { g[x] += 1; });
    });
    const generosHTML = (m, clase) => ['Hombre', 'Dama', 'Kids']
      .filter((g) => porGenero[m][g])
      .map((g) => `<a class="${clase}" href="${enlace({ marca: m, genero: g })}">${g} <b>${porGenero[m][g]}</b></a>`)
      .join('');
    // Portada curada por marca (una foto real y representativa, no "la primera que salga")
    const portadaMarca = {
      Nike: 'assets/img/sneakers/kyrie3-blanco-sm.webp',
      Adidas: 'assets/img/zapatos/adidas-trefoil-low-blanco-gris-sm.webp',
      Salomon: 'assets/img/zapatos/salomon-xt-6-crema-cafe-sm.webp',
      Jordan: 'assets/img/zapatos/jordan-air-jordan-11-blanco-negro-charol-sm.webp',
      'New Balance': 'assets/img/zapatos/new-balance-running-blanco-plata-sm.webp',
      On: 'assets/img/zapatos/on-cloud-blanco-gris-sm.webp',
    };
    const orden = Object.entries(conteo).sort((a, b) => b[1] - a[1]);
    const conFoto = orden.filter(([m]) => portadaMarca[m]).slice(0, 6).map(([m]) => m);
    // La tarjeta entera lleva a toda la marca; los botones de abajo, a hombre o dama
    marcas.innerHTML = conFoto
      .map((m) => `
        <div class="preview-cat preview-marca">
          <img src="${portadaMarca[m]}" alt="" loading="lazy" decoding="async" width="560" height="560">
          <a class="preview-marca__todo" href="${enlace({ marca: m })}" aria-label="Ver todo ${m} (${conteo[m]} productos)"></a>
          <span class="preview-cat__txt">
            <span class="preview-cat__n mono">${conteo[m]} productos</span>
            <span class="preview-cat__t">${m}</span>
            <span class="preview-marca__generos">${generosHTML(m, 'preview-marca__genero')}</span>
          </span>
          <span class="preview-cat__flecha" aria-hidden="true">→</span>
        </div>`)
      .join('');

    // El resto de marcas, cada una con su hombre/dama
    const lista = qs('#previewMarcasLista');
    if (lista) {
      lista.innerHTML = orden
        .filter(([m]) => !conFoto.includes(m))
        .map(([m, n]) => `
          <li class="marcas-lista__item">
            <a class="marcas-lista__marca" href="${enlace({ marca: m })}">${m} <span>${n}</span></a>
            <span class="marcas-lista__generos">${generosHTML(m, 'marcas-lista__genero')}</span>
          </li>`)
        .join('');
    }
  }

  const total = qs('#previewTotal');
  if (total) total.textContent = TODOS.length;
}
