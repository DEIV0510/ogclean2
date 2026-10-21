// El catálogo (js/data/) está completo y bien armado: ids únicos, tallas, precios y fotos que existen.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TODOS } from '../js/data/products.js';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('hay productos en el catálogo', () => {
  assert.ok(TODOS.length > 900, `solo hay ${TODOS.length} productos`);
});

test('cada producto tiene un id único', () => {
  const vistos = new Set();
  for (const p of TODOS) {
    assert.ok(p.id, 'producto sin id');
    assert.ok(!vistos.has(p.id), `id repetido: ${p.id}`);
    vistos.add(p.id);
  }
});

test('cada producto tiene nombre y al menos una talla', () => {
  for (const p of TODOS) {
    assert.ok(p.name && p.name.trim(), `${p.id} sin nombre`);
    assert.ok(Array.isArray(p.tallas) && p.tallas.length > 0, `${p.id} sin tallas`);
  }
});

test('los precios son positivos o null («Precio por WhatsApp»)', () => {
  for (const p of TODOS) {
    assert.ok(p.precio === null || (Number.isFinite(p.precio) && p.precio > 0), `${p.id}: precio ${p.precio}`);
  }
});

test('todas las fotos del catálogo existen en el disco', () => {
  const faltan = [];
  for (const p of TODOS) {
    for (const rel of [p.src, p.srcSm, p.srcCard].filter(Boolean)) {
      if (!fs.existsSync(path.join(RAIZ, rel))) faltan.push(`${p.id}: ${rel}`);
    }
  }
  assert.deepEqual(faltan, [], `faltan ${faltan.length} fotos`);
});
