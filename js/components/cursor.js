/* Cursor personalizado con etiqueta contextual y botones magnéticos.
   Se activa solo en punteros finos y respeta prefers-reduced-motion. */

import { qs, qsa, finePointer, reducedMotion, lerp } from '../utils/dom.js';

export function initCursor() {
  if (!finePointer || reducedMotion) return;
  const cursor = qs('#cursor');
  const ring = qs('#cursorRing');
  const label = qs('#cursorLabel');
  if (!cursor || !ring) return;

  let mx = window.innerWidth / 2, my = window.innerHeight / 2;
  let rx = mx, ry = my;

  window.addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });

  const loop = () => {
    rx = lerp(rx, mx, 0.18);
    ry = lerp(ry, my, 0.18);
    cursor.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
    ring.style.transform = `translate3d(${rx - mx}px, ${ry - my}px, 0)`;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  const HOT = 'a, button, .card, .runway__item, .combo__thumb, .size, .chip';
  document.addEventListener('mouseover', (e) => {
    const hot = e.target.closest(HOT);
    cursor.classList.toggle('is-hot', !!hot);
    if (label) label.textContent = hot ? (hot.dataset.cursor || '') : '';
  });
}

export function initMagnetic() {
  if (!finePointer || reducedMotion) return;
  qsa('.js-magnetic').forEach((el) => {
    let raf = 0;
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.transform = `translate(${x * 0.22}px, ${y * 0.3}px)`;
      });
    });
    el.addEventListener('mouseleave', () => {
      cancelAnimationFrame(raf);
      el.style.transform = '';
    });
  });
}
