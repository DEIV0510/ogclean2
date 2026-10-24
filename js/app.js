/* ============================================================
   OGCLEAN · INICIO
   Orquesta la experiencia: primero lo que se ve, luego lo pesado.
   El catálogo completo vive aparte, en tienda.html (js/tienda.js).
   ============================================================ */

import { whenGsap, reducedMotion } from './utils/dom.js';
import { guardarPosicionAlSalir, posicionGuardada, volverA } from './utils/volver.js';
import { initCounters, initParallax } from './utils/motion.js';
import { initLoader } from './components/loader.js';
import { initScrollSpy } from './components/nav.js';
import { initComun, alCargar } from './comun.js';
import { initTiendaPreview } from './sections/tiendaPreview.js';
import { initCombo } from './sections/combo.js';
import { initGuiaTallas } from './components/guiaTallas.js';
import { initRunway } from './sections/runway.js';
import { initFocus } from './sections/focus.js';
import { initManifiesto, initHeroVideo, initSocialFeed, initLineas } from './sections/storytelling.js';

// Los pins del runway y del focus suman alto al armarse. Si se entró con un ancla (p. ej. /#resenas al
// volver de enviar una reseña), el navegador ya saltó antes y quedó corto: se lleva de nuevo al destino.
function volverAlAncla() {
  const id = decodeURIComponent(location.hash.slice(1));
  const destino = id && document.getElementById(id);
  if (destino) destino.scrollIntoView({ block: 'start', behavior: 'instant' });
}

function arrancar() {
  // 1 · Contenido y estructura (barato, inmediato)
  initHeroVideo(); // cuanto antes arranque, antes se ve el hero en movimiento
  initTiendaPreview();
  initCombo();
  initGuiaTallas();
  initSocialFeed();
  initLineas();

  // 2 · Lo común a todas las páginas (header, menú, carrito, ficha, reveals…)
  initComun();
  initScrollSpy();

  // 3 · Movimiento propio del inicio
  initCounters();
  initParallax();
  initManifiesto();

  // 4 · Lo pesado, cuando el navegador esté libre. Con «atrás», al terminar se vuelve al punto donde estaba
  const vuelta = posicionGuardada();
  guardarPosicionAlSalir();
  const pesado = () => {
    whenGsap().then((gsap) => {
      if (gsap && !reducedMotion) {
        gsap.registerPlugin(window.ScrollTrigger);
        initRunway(gsap);
        initFocus(gsap);
        window.ScrollTrigger.refresh();
        if (vuelta) volverA(vuelta.y);
        else volverAlAncla();
      } else {
        initRunway(null);
        initFocus(null);
      }
    });
  };

  if ('requestIdleCallback' in window) requestIdleCallback(pesado, { timeout: 900 });
  else setTimeout(pesado, 300);
}

initLoader();
alCargar(arrancar);
