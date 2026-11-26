// Ejecutar: node --experimental-vm-modules scripts/verificar-pwa.mjs
import vm from 'node:vm';
import fs from 'node:fs';
import assert from 'node:assert/strict';

const codigo = fs.readFileSync('aplicativo/js/utilidades/pwa.js', 'utf8');
function eventos(base = {}) {
  const listeners = {};
  return Object.assign(base, {
    addEventListener(nombre, fn) { (listeners[nombre] ??= []).push(fn); },
    emitir(nombre) { for (const fn of listeners[nombre] ?? []) fn({}); },
  });
}
async function escenario({ instalada = false, primera = false, editando = false, esperando = true, offline = false } = {}) {
  let recargas = 0, mensajes = 0, consultas = 0;
  const nueva = eventos({ state: 'installed', postMessage(m) { assert.equal(m, 'actualizar'); mensajes++; } });
  const registro = eventos({ active: {}, waiting: esperando ? nueva : null, installing: null, update() { consultas++; return Promise.resolve(); } });
  const workers = eventos({ controller: primera ? null : {}, register() { return Promise.resolve(registro); } });
  const doc = eventos({ body: { classList: { toggle() {} } }, hidden: false,
    createElement() { throw new Error('No debe aparecer un aviso de actualización'); } });
  const win = eventos();
  const ctx = vm.createContext({ navigator: { userAgent: '', onLine: !offline, serviceWorker: workers },
    document: doc, window: win, matchMedia: () => ({ matches: instalada }),
    location: { hostname: 'tallerdigitalberk.github.io', reload() { recargas++; } } });
  const mod = new vm.SourceTextModule(codigo, { context: ctx });
  await mod.link(() => { throw new Error('Import inesperado'); });
  await mod.evaluate();
  mod.namespace.iniciarPwa();
  await Promise.resolve();
  await Promise.resolve();
  if (offline) assert.equal(consultas, 0);
  if (!esperando) {
    registro.installing = nueva;
    registro.emitir('updatefound');
    nueva.emitir('statechange');
  }
  assert.equal(mensajes, primera ? 0 : 1);
  if (editando) doc.emitir('input');
  workers.controller = nueva;
  workers.emitir('controllerchange');
  assert.equal(recargas, primera || editando ? 0 : 1);
  if (editando && !primera) {
    win.emitir('hashchange');
    assert.equal(recargas, 1);
  }
  workers.emitir('controllerchange');
  assert.ok(recargas <= 1, 'Sin bucles de recarga');
}
for (const instalada of [false, true]) {
  await escenario({ instalada });
  await escenario({ instalada, esperando: false });
  await escenario({ instalada, editando: true });
  await escenario({ instalada, primera: true, esperando: false });
  await escenario({ instalada, offline: true });
}

// La versión nueva solo se activa después de descargar todos sus archivos.
const swCodigo = fs.readFileSync('aplicativo/sw.js', 'utf8');
for (const falla of [false, true]) {
  let instalada = false, activaciones = 0, tarea;
  const worker = eventos({ skipWaiting() { assert.ok(instalada); activaciones++; } });
  // Capturar waitUntil del evento real de instalación.
  const listeners = {};
  worker.addEventListener = (nombre, fn) => { listeners[nombre] = fn; };
  vm.runInNewContext(swCodigo, { self: worker, Request: class {},
    caches: { open: async () => ({ addAll: async () => { if (falla) throw new Error('sin red'); instalada = true; } }) } });
  listeners.install({ waitUntil(p) { tarea = p; } });
  if (falla) await assert.rejects(tarea); else await tarea;
  assert.equal(activaciones, falla ? 0 : 1);
}
console.log('OK: actualización automática, primera visita, edición, desconexión y descarga incompleta.');
