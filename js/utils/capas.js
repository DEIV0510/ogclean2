/* Capas a pantalla completa (ficha, visor de fotos, carrito, favoritos y filtros en celular) con su propia
   entrada en el historial: «atrás» —el botón del celular o del navegador— cierra la de arriba y deja la
   página donde estaba, en vez de sacarte de ella. Cerrar con su botón o con Escape también vuelve atrás,
   así no quedan pasos «atrás» que no hacen nada. Cada módulo registra cómo se oculta su capa (y, si
   puede, cómo reabrirla desde la entrada: la ficha guarda qué producto mostraba). */

const capas = new Map(); // nombre → { ocultar, reabrir }
const abiertas = []; // las que están en pantalla, de abajo hacia arriba
const despues = []; // qué hacer cuando llegue el popstate de un history.back() nuestro
let volviendo = 0; // history.back() pedidos cuyo popstate aún no llega

const enEntrada = () => history.state?.ogCapas || [];
const ultima = (lista) => lista[lista.length - 1];

export function registrarCapa(nombre, ocultar, reabrir = null) {
  capas.set(nombre, { ocultar, reabrir });
}

/** Suelta el scroll de la página solo si no queda ninguna capa ni el menú abiertos. */
export function soltarScroll() {
  if (!abiertas.length && !document.body.classList.contains('is-menu-open')) document.body.classList.remove('is-locked');
}

function quitar(nombre) {
  const i = abiertas.indexOf(nombre);
  if (i < 0) return;
  abiertas.splice(i, 1);
  capas.get(nombre)?.ocultar();
}

/** Al abrir: suma una entrada al historial. Si ya está abierta (otra ficha desde un relacionado), la reemplaza.
    Reabrir desde una entrada (reabrir()) no pasa por aquí: lo anota restaurarCapas o el popstate. */
export function abrirCapa(nombre, datos = {}) {
  // Con un «atrás» nuestro en camino, se espera a su popstate: si no, el back se llevaría esta entrada
  if (volviendo) {
    despues.push(() => abrirCapa(nombre, datos));
    return;
  }
  if (abiertas.includes(nombre)) {
    history.replaceState({ ...history.state, ...datos }, '');
    return;
  }
  abiertas.push(nombre);
  history.pushState({ ...history.state, ...datos, ogCapas: [...abiertas] }, '');
}

/** Al cerrar con su botón o con Escape. `luego` corre cuando la capa ya se ocultó. */
export function cerrarCapa(nombre, luego = null) {
  if (!abiertas.includes(nombre)) return;
  if (volviendo) {
    if (luego) despues.push(luego);
    return;
  }
  const entrada = enEntrada();
  if (ultima(abiertas) === nombre && ultima(entrada) === nombre) {
    volviendo += 1;
    if (luego) despues.push(luego);
    history.back();
    return;
  }
  // No es la de arriba (o la entrada no es suya): se oculta directo y se saca de la entrada actual
  quitar(nombre);
  history.replaceState({ ...history.state, ogCapas: entrada.filter((n) => n !== nombre) }, '');
  luego?.();
}

window.addEventListener('popstate', (e) => {
  if (volviendo) volviendo -= 1;
  const quedan = e.state?.ogCapas || [];
  // Atrás: se cierran, de arriba hacia abajo, las que esta entrada ya no tiene
  for (const nombre of [...abiertas].reverse()) if (!quedan.includes(nombre)) quitar(nombre);
  // Adelante: se reabren las que saben hacerlo (la ficha)
  for (const nombre of quedan) {
    if (!abiertas.includes(nombre) && capas.get(nombre)?.reabrir?.(e.state)) abiertas.push(nombre);
  }
  if (!volviendo) despues.splice(0).forEach((fn) => fn());
});

/** Al cargar sobre una entrada con capas (recarga, o atrás sin la caché del navegador): se reabre lo que se
    pueda y, si quedó alguna que no, se vuelve a la entrada de abajo para no dejar pasos muertos. */
export function restaurarCapas() {
  const habia = enEntrada();
  if (!habia.length) return;
  for (const nombre of habia) {
    if (capas.get(nombre)?.reabrir?.(history.state)) abiertas.push(nombre);
    else break; // lo que estaba encima de una que no se pudo reabrir tampoco tiene sentido
  }
  if (abiertas.length < habia.length) {
    volviendo += 1;
    history.back();
  }
}
