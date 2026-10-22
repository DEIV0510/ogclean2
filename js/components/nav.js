/* Header dinámico (oculta al bajar, aparece al subir), barra de progreso
   de lectura, menú overlay accesible y botones flotantes. */

import { qs, qsa, rafThrottle } from '../utils/dom.js';

export function initHeader() {
  const header = qs('#header');
  const progress = qs('#progress');
  const waFloat = qs('#waFloat');
  const mobileBar = qs('#mobileBar');
  let ultimo = window.scrollY;

  const update = rafThrottle(() => {
    const y = window.scrollY;
    const alto = document.documentElement.scrollHeight - window.innerHeight;

    header.classList.toggle('is-solid', y > 40);
    header.classList.toggle('is-hidden', y > 420 && y > ultimo && !document.body.classList.contains('is-locked'));
    ultimo = y;

    if (progress) progress.style.transform = `scaleX(${alto > 0 ? y / alto : 0})`;
    if (waFloat) waFloat.classList.toggle('is-visible', y > 600);
    if (mobileBar) mobileBar.classList.toggle('is-visible', y > 600);
  });

  update();
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
}

export function initMenu() {
  const menu = qs('#menu');
  const burger = qs('#burger');
  const cerrar = qs('#menuClose');
  if (!menu || !burger) return;

  const abrir = () => {
    menu.classList.add('is-open');
    document.body.classList.add('is-locked', 'is-menu-open');
    burger.setAttribute('aria-expanded', 'true');
    const primero = qs('.menu__link', menu);
    if (primero) setTimeout(() => primero.focus({ preventScroll: true }), 320);
  };

  const salir = () => {
    menu.classList.remove('is-open');
    document.body.classList.remove('is-locked', 'is-menu-open');
    burger.setAttribute('aria-expanded', 'false');
  };

  burger.addEventListener('click', () => {
    menu.classList.contains('is-open') ? salir() : abrir();
  });
  if (cerrar) cerrar.addEventListener('click', salir);
  qsa('.menu__link, .menu__lines a', menu).forEach((a) => a.addEventListener('click', salir));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) salir();
  });
}

/** Marca el enlace del menú correspondiente a la sección visible. */
export function initScrollSpy() {
  const links = qsa('.menu__link');
  if (!links.length) return;
  const secciones = links
    .map((l) => ({ link: l, el: qs(l.getAttribute('href')) }))
    .filter((s) => s.el);

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      const s = secciones.find((x) => x.el === e.target);
      if (s && e.isIntersecting) {
        links.forEach((l) => l.classList.remove('is-current'));
        s.link.classList.add('is-current');
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });

  secciones.forEach((s) => io.observe(s.el));
}
