// serve.js (servidor local) no se cae con direcciones raras ni entrega archivos ocultos o de fuera.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUERTO = 5600 + Math.floor(Math.random() * 300);
let servidor;

// Petición «tal cual» (sin que el cliente normalice ../ ni %XX)
const pedir = (ruta) => new Promise((ok, mal) => {
  const req = http.request({ host: '127.0.0.1', port: PUERTO, path: ruta, method: 'GET' }, (res) => {
    let cuerpo = '';
    res.setEncoding('utf8');
    res.on('data', (d) => { cuerpo += d; });
    res.on('end', () => ok({ codigo: res.statusCode, cuerpo }));
  });
  req.on('error', mal);
  req.end();
});

before(async () => {
  servidor = spawn(process.execPath, ['serve.js'], { cwd: RAIZ, env: { ...process.env, PORT: String(PUERTO) }, stdio: 'ignore' });
  for (let i = 0; i < 50; i++) {
    try { await pedir('/'); return; } catch { await new Promise((r) => setTimeout(r, 100)); }
  }
  throw new Error('serve.js no arrancó');
});
after(() => servidor?.kill());

test('sirve la portada', async () => {
  const r = await pedir('/');
  assert.equal(r.codigo, 200);
  assert.match(r.cuerpo, /<!DOCTYPE html>/i);
});

test('una dirección mal codificada da 400 y el servidor sigue vivo', async () => {
  assert.equal((await pedir('/%E0%A4%A')).codigo, 400);
  assert.equal((await pedir('/')).codigo, 200);
});

test('.git y los archivos ocultos dan 403', async () => {
  assert.equal((await pedir('/.git/config')).codigo, 403);
  assert.equal((await pedir('/js/../.git/HEAD')).codigo, 403);
});

test('no se puede salir de la carpeta del sitio', async () => {
  assert.equal((await pedir('/../ogclean-wp/README.md')).codigo, 403);
  assert.equal((await pedir('/..%2F..%2Fetc%2Fhosts')).codigo, 403);
});

test('el 404 no ejecuta lo que venga en la dirección', async () => {
  const r = await pedir('/no-existe%3Cscript%3Ealert(1)%3C%2Fscript%3E');
  assert.equal(r.codigo, 404);
  assert.ok(!r.cuerpo.includes('<script>'));
});
