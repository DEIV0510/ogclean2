/* Volver con «atrás» al mismo punto. Si el navegador no guardó la página en memoria, la arma de nuevo:
   los productos se pintan con JS y los pins del inicio suman alto, así que su propio salto queda corto
   (o arriba del todo). Al salir se guarda la posición de esta entrada del historial y se repone cuando la
   página ya está armada. Va por entrada y no por URL: dos visitas a la misma tienda no se pisan. */

const nuevoId = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;

/** Marca la entrada actual con un id propio (las de las anclas # llegan sin estado). */
function marcar() {
  if (history.state?.ogEntrada) return;
  try { history.replaceState({ ...history.state, ogEntrada: nuevoId() }, ''); } catch { /* sin historial: queda la URL */ }
}
marcar();
window.addEventListener('hashchange', marcar);

const clave = () => `og-pos:${history.state?.ogEntrada || location.pathname + location.search}`;

/** Guarda la posición (y lo que diga `extra`, p. ej. cuántos productos había cargados) al salir. */
export function guardarPosicionAlSalir(extra = () => ({})) {
  window.addEventListener('pagehide', () => {
    try { sessionStorage.setItem(clave(), JSON.stringify({ y: Math.round(window.scrollY), ...extra() })); } catch { /* sin almacenamiento: el navegador hace lo suyo */ }
  });
}

/** Lo guardado para esta entrada, solo si se llegó con atrás/adelante. */
export function posicionGuardada() {
  if (performance.getEntriesByType('navigation')[0]?.type !== 'back_forward') return null;
  try { return JSON.parse(sessionStorage.getItem(clave()) || 'null'); } catch { return null; }
}

/** Lleva a `y` ya y otra vez al terminar de cargar (fotos y letras pueden mover el alto), salvo que la persona ya se haya movido. */
export function volverA(y) {
  const ir = () => window.scrollTo({ top: y, behavior: 'instant' });
  ir();
  if (document.readyState === 'complete') return;
  let movio = false;
  const marcarMovimiento = () => { movio = true; };
  ['wheel', 'touchstart', 'keydown'].forEach((ev) => window.addEventListener(ev, marcarMovimiento, { once: true, passive: true }));
  window.addEventListener('load', () => { if (!movio) ir(); }, { once: true });
}
