// Lo que llega de la dirección se escribe como texto, y vercel.json manda todo a la tienda con cabeceras.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { escaparHTML } from '../js/utils/texto.js';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('escaparHTML neutraliza etiquetas y comillas', () => {
  const ataque = '<img src=x onerror="alert(1)">';
  const limpio = escaparHTML(ataque);
  assert.ok(!limpio.includes('<') && !limpio.includes('>') && !limpio.includes('"'));
  assert.equal(limpio, '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
});

test('escaparHTML deja el texto normal igual y convierte números', () => {
  assert.equal(escaparHTML('Nike Air Jordan 4'), 'Nike Air Jordan 4');
  assert.equal(escaparHTML('Dolce & Gabbana'), 'Dolce &amp; Gabbana');
  assert.equal(escaparHTML(42), '42');
});

test('la tienda (shop.js) pinta los filtros activos escapados', () => {
  const shop = fs.readFileSync(path.join(RAIZ, 'js/sections/shop.js'), 'utf8');
  assert.match(shop, /import \{ escaparHTML as esc \} from '\.\.\/utils\/texto\.js'/);
  assert.match(shop, /data-valor="\$\{esc\(valor\)\}"/);
  assert.match(shop, /\$\{esc\(label\)\} <span aria-hidden="true">/);
});

test('vercel.json redirige con 301 a ogcleann.com y trae cabeceras de seguridad', () => {
  const v = JSON.parse(fs.readFileSync(path.join(RAIZ, 'vercel.json'), 'utf8'));
  const destino = (origen) => v.redirects.find((r) => r.source === origen);
  assert.equal(destino('/').destination, 'https://ogcleann.com/');
  assert.equal(destino('/tienda.html').destination, 'https://ogcleann.com/tienda/');
  assert.equal(destino('/terminos.html').destination, 'https://ogcleann.com/terminos/');
  assert.ok(v.redirects.every((r) => r.statusCode === 301));
  const claves = v.headers.flatMap((h) => h.headers.map((x) => x.key.toLowerCase()));
  for (const c of ['strict-transport-security', 'x-content-type-options', 'x-frame-options']) assert.ok(claves.includes(c), `falta ${c}`);
});
