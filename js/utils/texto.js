/* Texto seguro dentro de HTML: lo que llega de la dirección (?q=) o de quien escribe se pinta como
   texto, nunca como código. Sin dependencias del navegador, para poder probarlo con `npm test`. */

const ENTIDADES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export const escaparHTML = (s) => String(s).replace(/[&<>"']/g, (c) => ENTIDADES[c]);
