/* ============================================================
   OGCLEAN · INICIO
   Orquesta la experiencia: primero lo que se ve, luego lo pesado.
   El catálogo completo vive aparte, en tienda.html (js/tienda.js).
   ============================================================ */

import { whenGsap, reducedMotion } from './utils/dom.js';
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

  // 4 · Lo pesado, cuando el navegador esté libre
  const pesado = () => {
    whenGsap().then((gsap) => {
      if (gsap && !reducedMotion) {
        gsap.registerPlugin(window.ScrollTrigger);
        initRunway(gsap);
        initFocus(gsap);
        window.ScrollTrigger.refresh();
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
