/* Pasarela horizontal de destacados.
   Móvil: scroll nativo con snap. Escritorio: pin + scrub con GSAP. */

import { qs, mq, reducedMotion } from '../utils/dom.js';
import { DESTACADOS, descuento } from '../data/products.js';
import { precioCOP } from '../data/site.js';
import { tilt } from '../utils/motion.js';

function itemHTML(p, i) {
  const n = String(i + 1).padStart(2, '0');
  return `
    <article class="runway__item">
      <div class="runway__media" data-tilt>
        <span class="runway__idx">${n}</span>
        <img src="${p.srcSm}" srcset="${p.srcSm} 500w, ${p.src} 1000w" sizes="(max-width: 900px) 74vw, 360px"
             alt="${p.alt}" loading="lazy" decoding="async" width="500" height="500">
      </div>
      <div class="runway__info">
        <div>
          <p class="runway__name">${p.name}</p>
          <p class="runway__tag">${p.tag}</p>
        </div>
        <p class="runway__price">${precioCOP(p.precio)}${descuento(p) ? `<s class="runway__antes"><span class="sr-only">Antes </span>${precioCOP(descuento(p).antes)}</s>` : ''}</p>
      </div>
      <button class="runway__link js-quick" type="button" data-id="${p.id}" data-cursor="VER" aria-label="Ver ficha de ${p.name}"></button>
    </article>`;
}

export function initRunway(gsap) {
  const track = qs('#runwayTrack');
  const pin = qs('#runwayPin');
  const seccion = qs('#runway');
  if (!track) return;

  track.innerHTML = DESTACADOS.slice(0, 8).map(itemHTML).join('');
  track.querySelectorAll('[data-tilt]').forEach((el) => tilt(el, { max: 7, scale: 1.01 }));

  if (!gsap || reducedMotion || !mq('(min-width: 900px)')) return;

  seccion.classList.add('is-pinned');
  const distancia = () => Math.max(track.scrollWidth - window.innerWidth + 80, 0);

  gsap.to(track, {
    x: () => -distancia(),
    ease: 'none',
    scrollTrigger: {
      trigger: seccion,
      start: 'top top',
      end: () => `+=${distancia()}`,
      pin: pin,
      scrub: 0.6,
      invalidateOnRefresh: true,
      anticipatePin: 1,
    },
  });
}
