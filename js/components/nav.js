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

/** Buscador del header. Desde 1024 px el campo está a la vista y busca al dar Enter; en celular
    la lupa primero abre el campo (y con el campo vacío lo cierra). Va a la tienda con ?q=. */
export function initBuscador() {
  const form = qs('#buscador');
  const campo = form && qs('.buscador__campo', form);
  const boton = form && qs('.buscador__btn', form);
  if (!form || !campo || !boton) return;

  // En la tienda ya hay un buscador grande (#tiendaBuscar): la lupa del header lleva a ese en vez de abrir
  // otra barra encima (el dueño vio dos barras a la vez, 27-oct)
  const propio = qs('#tiendaBuscar');
  if (propio) {
    form.classList.add('is-atajo');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      propio.focus({ preventScroll: true }); // en el mismo toque: así el celular abre el teclado
      propio.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
    return;
  }

  const ancho = window.matchMedia('(min-width: 1024px)');

  const marcar = (abierto) => {
    form.classList.toggle('is-open', abierto);
    if (!ancho.matches) boton.setAttribute('aria-expanded', String(abierto));
  };
  if (!ancho.matches) boton.setAttribute('aria-expanded', 'false');
  ancho.addEventListener('change', () => {
    marcar(false);
    if (ancho.matches) boton.removeAttribute('aria-expanded');
    else boton.setAttribute('aria-expanded', 'false');
  });

  form.addEventListener('submit', (e) => {
    const q = campo.value.trim();
    if (!ancho.matches && !form.classList.contains('is-open')) {
      e.preventDefault();
      marcar(true);
      campo.focus();
      return;
    }
    if (!q) {
      e.preventDefault();
      if (ancho.matches) campo.focus();
      else { boton.focus(); marcar(false); } // el foco vuelve a la lupa, no se pierde
      return;
    }
    campo.value = q;
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && form.classList.contains('is-open')) {
      const adentro = form.contains(document.activeElement);
      marcar(false);
      if (adentro) boton.focus();
    }
  });
  document.addEventListener('click', (e) => {
    if (form.classList.contains('is-open') && !form.contains(e.target)) marcar(false);
  });
  // Con el teclado: al salir del buscador (Tab hacia ♥, carrito…) el campo se cierra
  form.addEventListener('focusout', (e) => {
    if (form.classList.contains('is-open') && !form.contains(e.relatedTarget)) marcar(false);
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
