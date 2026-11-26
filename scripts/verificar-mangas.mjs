// Ejecutar: node --experimental-vm-modules scripts/verificar-mangas.mjs
import vm from 'vm';
import fs from 'fs';
import path from 'path';
import assert from 'assert/strict';

const cache = new Map();
async function cargar(archivo) {
  archivo = path.resolve(archivo);
  if (cache.has(archivo)) return cache.get(archivo);
  const modulo = new vm.SourceTextModule(fs.readFileSync(archivo, 'utf8'), { identifier: archivo });
  cache.set(archivo, modulo);
  await modulo.link((s) => cargar(path.resolve(path.dirname(archivo), s)));
  return modulo;
}
async function importar(archivo) {
  const modulo = await cargar(archivo);
  if (modulo.status !== 'evaluated') await modulo.evaluate();
  return modulo.namespace;
}
const { TABLAS } = await importar('aplicativo/js/datos/tallas.js');
const { manga } = await importar('aplicativo/js/moldes/prendas/blusa.js');
const { largoTramo } = await importar('aplicativo/js/moldes/geometria.js');
let casos = 0;
for (const tipo of ['dama', 'varon']) {
  const { construir, FORMULAS } = await importar(`aplicativo/js/moldes/prendas/camisa-${tipo}.js`);
  for (const tabla of [tipo, 'ninos']) {
    for (const [talla, medidas] of Object.entries(TABLAS[tabla].medidas)) {
      const molde = construir(medidas);
      const actual = molde.piezas.find(p => p.nombre === 'Manga');
      const del = molde.piezas.find(p => p.nombre === 'Delantero');
      // La sisa del delantero es el último tramo curvo antes del hombro.
      const sisaDel = del.contorno.filter(t => t.c).at(-1);
      const curvaDel = largoTramo(sisaDel);
      const copaEsp = largoTramo(actual.contorno[0], 1000);
      const copaDel = largoTramo(actual.contorno[1], 1000);
      const sisaTotal = copaEsp + copaDel - FORMULAS.facilidadManga;
      const antigua = manga(medidas, sisaTotal, {
        holgura: FORMULAS.holguraBrazo, facilidad: FORMULAS.facilidadManga,
        largo: medidas['largo-manga-larga'] - 6,
      });
      assert.ok(actual.alturaCopa < antigua.alturaCopa * 0.76);
      assert.ok(actual.ancho >= medidas['contorno-brazo'] + FORMULAS.holguraBrazo);
      assert.ok(Math.abs(copaDel - curvaDel - FORMULAS.facilidadManga / 2) < 0.02);
      // Medir espalda real, incluida la porción de sisa del canesú.
      const esp = molde.piezas.find(p => p.nombre === 'Espalda');
      const canesu = molde.piezas.find(p => p.nombre === 'Canesú');
      const curvasEsp = esp.contorno.filter(t => t.c2);
      const curvasCanesu = canesu ? canesu.contorno.filter(t => t.c2) : [];
      const longitudEsp = [...curvasEsp, ...curvasCanesu].reduce((s, t) => s + largoTramo(t, 1000), 0);
      assert.ok(Math.abs(copaEsp - longitudEsp - FORMULAS.facilidadManga / 2) < 0.02, `Espalda ${tipo} ${tabla} ${talla}`);
      assert.ok(Math.abs(largoTramo(actual.contorno[2]) - largoTramo(actual.contorno[4])) < 1e-8);
      assert.deepEqual(actual.contorno[0].b, actual.contorno[1].a);
      for (const tramo of actual.contorno) {
        for (const k of ['a', 'b', 'c', 'c2']) if (tramo[k]) {
          assert.ok(Number.isFinite(tramo[k].x) && Number.isFinite(tramo[k].y));
        }
      }
      if (tabla === tipo && talla === 'M') console.log(`${tipo} M: copa ${antigua.alturaCopa.toFixed(2)} → ${actual.alturaCopa.toFixed(2)} cm; ancho ${antigua.ancho.toFixed(2)} → ${actual.ancho.toFixed(2)} cm`);
      casos++;
      if (tipo === 'dama') {
        for (const largo of [medidas['largo-camisa'], medidas['talle-espalda'] + 2, medidas['talle-espalda'] + 8]) {
          const variante = construir({ ...medidas, 'largo-camisa': largo });
          for (const pieza of variante.piezas.filter(p => ['Delantero', 'Espalda'].includes(p.nombre))) {
            const pinzas = pieza.elementos.filter(e => e.tipo === 'pinza' && e.p[0].y === e.p[2].y);
            assert.ok(pinzas.length === 0 || pinzas.length === 2, 'Las pinzas de cintura deben quedar cerradas');
            if (pinzas.length) {
              const ruedo = Math.max(...pieza.contorno.flatMap(t => [t.a.y, t.b.y]));
              assert.ok(pinzas.every(e => e.p.every(p => p.y <= ruedo - 5)), 'Separación mínima al ruedo');
              assert.deepEqual(pinzas[0].p[0], pinzas[1].p[0]);
              assert.deepEqual(pinzas[0].p[2], pinzas[1].p[2]);
              assert.ok(pinzas[1].p[1].y > pinzas[1].p[0].y, 'Punta inferior debajo de la cintura');
            }
          }
        }
      }
    }
  }
}
console.log(`OK: ${casos} combinaciones de mangas y 30 variantes de largos con pinzas interiores verificadas.`);
