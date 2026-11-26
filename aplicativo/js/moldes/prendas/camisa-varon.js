// Molde: camisa de varón (cuerpo recto, canesú, botones, manga larga con puño, cuello)
// ⚠️ PROVISIONAL: reemplazar FORMULAS por las del docente del CEA.
import { punto as P, partirCurvaEnY, largoTramo } from '../geometria.js';
import { numero as n } from '../../utilidades/formato.js';
import { manga } from './blusa.js';
import { agregarBotones, cuelloYPuno, mitadEscote } from './camisa-comun.js';

export const FORMULAS = {
  holguraPecho: 3,        // cm que se suman a pecho ÷ 4
  sisaExtra: 12,          // profundidad de sisa = pecho ÷ 8 + sisaExtra
  holguraCuello: 2,
  holguraCadera: 3,
  escoteEspalda: 2,
  escoteDelantero: 1.5,   // se suma a cuello ÷ 6
  caidaHombro: 4.5,
  hombroExtra: 1.5,       // se suma a ancho de espalda ÷ 2
  canesu: 10,             // alto del canesú en el centro de la espalda
  faldon: 6,              // el costado es más corto: ruedo curvo de camisa
  holguraBrazo: 7,
  facilidadManga: 0.5,    // la camisa de varón lleva copa más plana
  margen: { escote: 1, hombro: 1.5, sisa: 1, costado: 1.5, ruedo: 1.5, canesu: 1 },
};
const F = FORMULAS;
const mg = F.margen;

function base(m) {
  const c6 = (m.cuello + F.holguraCuello) / 6;
  const ancho = m.pecho / 4 + F.holguraPecho;
  const ys = m.pecho / 8 + F.sisaExtra;
  const yR = F.escoteEspalda + m['largo-camisa'];
  const xRuedo = Math.max(ancho, m.cadera / 4 + F.holguraCadera);
  const hombro = P(m['ancho-espalda'] / 2 + F.hombroExtra, F.caidaHombro);
  return { c6, ancho, ys, yR, xRuedo, hombro };
}

// Costado recto y ruedo curvo (más largo al centro que al costado)
const ruedoCurvo = (b) => ({ a: P(0, b.yR), c: P(b.xRuedo * 0.55, b.yR), b: P(b.xRuedo, b.yR - F.faldon) });

function espaldaYCanesu(m, b) {
  const A = P(0, F.escoteEspalda), B = P(b.c6, 0), C = b.hombro, D = P(b.ancho, b.ys), R0 = P(0, b.yR);
  const escote = { a: A, c: P(b.c6 * 0.8, F.escoteEspalda), b: B };
  const sisa = { a: C, c: P(m['ancho-espalda'] / 2 + 0.5, b.ys * 0.6), c2: P(m['ancho-espalda'] / 2 + 1.5, b.ys), b: D };
  const yC = F.canesu;
  const [sisaArriba, sisaAbajo] = partirCurvaEnY(sisa, yC);
  const K0 = P(0, yC), K1 = sisaArriba.b;
  const ruedo = ruedoCurvo(b);
  const lado = ruedo.b;

  const espalda = {
    nombre: 'Espalda', cortar: 'Cortar 1 al doblez', alDoblez: true, centro: 'DOBLEZ', lineaCentro: { a: K0, b: R0 },
    elementos: [
      { paso: 0, tipo: 'linea', p: [A, R0] }, { paso: 0, tipo: 'punto', p: [A], nombre: 'A' },
      { paso: 1, tipo: 'curva', p: [escote.a, escote.c, escote.b] }, { paso: 1, tipo: 'punto', p: [B], nombre: 'B', der: true },
      { paso: 2, tipo: 'linea', p: [B, C] }, { paso: 2, tipo: 'punto', p: [C], nombre: 'C', der: true },
      { paso: 3, tipo: 'linea', p: [P(0, b.ys), D], puntos: true },
      { paso: 3, tipo: 'curva', p: [sisa.a, sisa.c, sisa.c2, sisa.b] }, { paso: 3, tipo: 'punto', p: [D], nombre: 'D', der: true },
      { paso: 4, tipo: 'linea', p: [K0, K1] }, { paso: 4, tipo: 'punto', p: [K1], nombre: 'K', der: true },
      { paso: 5, tipo: 'linea', p: [D, lado] }, { paso: 5, tipo: 'curva', p: [ruedo.a, ruedo.c, ruedo.b] },
    ],
    pasos: [
      `Traza la línea del centro de la espalda (irá al doblez): desde A baja ${n(b.yR - A.y)} cm (largo de camisa).`,
      `Escote: arriba marca (cuello + ${n(F.holguraCuello)}) ÷ 6 = ${n(b.c6)} cm (punto B), ${n(F.escoteEspalda)} cm más arriba que A. Une A con B con una curva.`,
      `Hombro: mide ancho de espalda ÷ 2 + ${n(F.hombroExtra)} = ${n(C.x)} cm y baja ${n(F.caidaHombro)} cm: punto C. Une B con C.`,
      `Línea de pecho: baja pecho ÷ 8 + ${n(F.sisaExtra)} = ${n(b.ys)} cm y mide pecho ÷ 4 + ${n(F.holguraPecho)} = ${n(b.ancho)} cm: punto D. Une C con D con la curva de la sisa.`,
      `Canesú: baja ${n(yC)} cm desde arriba y traza una línea recta hasta la sisa (punto K). Lo de arriba es el canesú (pieza aparte).`,
      `Costado: baja recto desde D hasta ${n(F.faldon)} cm antes del largo, con ${n(b.xRuedo)} cm de ancho (cadera ÷ 4 + ${n(F.holguraCadera)}). Une con el centro con una curva: el faldón de la camisa.`,
      `Agrega el margen: ${n(mg.canesu)} cm arriba (unión con el canesú), ${n(mg.sisa)} en la sisa, ${n(mg.costado)} en el costado y ${n(mg.ruedo)} en el ruedo. El centro va al doblez.`,
    ],
    contorno: [
      { a: R0, b: K0, margen: 0 }, { a: K0, b: K1, margen: mg.canesu }, { ...sisaAbajo, margen: mg.sisa },
      { a: D, b: lado, margen: mg.costado }, { a: lado, c: ruedo.c, b: ruedo.a, margen: mg.ruedo },
    ],
    rotulo: P(b.ancho / 2, b.ys + (b.yR - b.ys) * 0.45),
    hilo: [P(b.ancho * 0.7, b.ys + 4), P(b.ancho * 0.7, b.yR - 10)],
  };

  const canesu = {
    nombre: 'Canesú', cortar: 'Cortar 2 al doblez', alDoblez: true, cantidad: 2, centro: 'DOBLEZ', lineaCentro: { a: K0, b: A },
    elementos: [
      { paso: 0, tipo: 'curva', p: [escote.a, escote.c, escote.b] }, { paso: 0, tipo: 'linea', p: [B, C] },
      { paso: 0, tipo: 'curva', p: [sisaArriba.a, sisaArriba.c, sisaArriba.c2, sisaArriba.b] },
      { paso: 0, tipo: 'linea', p: [K0, K1] }, { paso: 0, tipo: 'linea', p: [K0, A] },
      { paso: 0, tipo: 'punto', p: [A], nombre: 'A' }, { paso: 0, tipo: 'punto', p: [C], nombre: 'C', der: true }, { paso: 0, tipo: 'punto', p: [K1], nombre: 'K', der: true },
    ],
    pasos: [
      `Calca de la espalda la parte de arriba de la línea del canesú: escote, hombro (B–C), sisa hasta K y la línea del canesú (${n(yC)} cm).`,
      `Agrega el margen: ${n(mg.escote)} cm en el escote, ${n(mg.hombro)} en el hombro, ${n(mg.sisa)} en la sisa y ${n(mg.canesu)} abajo. El centro va al doblez. Se cortan 2: canesú de afuera y de adentro.`,
    ],
    contorno: [
      { ...escote, margen: mg.escote }, { a: B, b: C, margen: mg.hombro }, { ...sisaArriba, margen: mg.sisa },
      { a: K1, b: K0, margen: mg.canesu }, { a: K0, b: A, margen: 0 },
    ],
    rotulo: P(K1.x / 2, yC * 0.62),
  };

  return { espalda, canesu, sisa };
}

function delantero(m, b) {
  const prof = b.c6 + F.escoteDelantero;
  const B = P(b.c6, 0), A = P(0, prof), C = P(b.hombro.x, b.hombro.y), D = P(b.ancho, b.ys), R0 = P(0, b.yR);
  const escote = { a: B, c: P(b.c6, prof), b: A };
  const sisa = { a: C, c: P(m['ancho-espalda'] / 2 - 0.5, b.ys * 0.6), c2: P(m['ancho-espalda'] / 2, b.ys), b: D };
  const ruedo = ruedoCurvo(b);
  const lado = ruedo.b;

  const pieza = {
    nombre: 'Delantero', cortar: 'Cortar 1 al doblez', alDoblez: true, centro: 'DOBLEZ', lineaCentro: { a: A, b: R0 },
    elementos: [
      { paso: 0, tipo: 'linea', p: [A, R0] }, { paso: 0, tipo: 'punto', p: [A], nombre: 'A' },
      { paso: 1, tipo: 'curva', p: [escote.a, escote.c, escote.b] }, { paso: 1, tipo: 'punto', p: [B], nombre: 'B', der: true },
      { paso: 2, tipo: 'linea', p: [B, C] }, { paso: 2, tipo: 'punto', p: [C], nombre: 'C', der: true },
      { paso: 3, tipo: 'linea', p: [P(0, b.ys), D], puntos: true },
      { paso: 3, tipo: 'curva', p: [sisa.a, sisa.c, sisa.c2, sisa.b] }, { paso: 3, tipo: 'punto', p: [D], nombre: 'D', der: true },
      { paso: 4, tipo: 'linea', p: [D, lado] }, { paso: 4, tipo: 'curva', p: [ruedo.a, ruedo.c, ruedo.b] },
    ],
    pasos: [
      'Traza la línea del centro del delantero, desde A hacia abajo.',
      `Escote: marca (cuello + ${n(F.holguraCuello)}) ÷ 6 = ${n(b.c6)} cm (punto B) y baja por el centro ${n(prof)} cm (punto A). Une A con B con una curva.`,
      `Hombro: igual que en la espalda, ${n(C.x)} cm y baja ${n(F.caidaHombro)} cm: punto C. Une B con C.`,
      `Línea de pecho: baja ${n(b.ys)} cm y mide ${n(b.ancho)} cm: punto D. Une C con D con la curva de la sisa (más honda que atrás).`,
      `Costado y faldón: igual que en la espalda, recto desde D y con el ruedo curvo.`,
      `Agrega el margen: ${n(mg.escote)} cm en el escote, ${n(mg.hombro)} en el hombro, ${n(mg.sisa)} en la sisa, ${n(mg.costado)} en el costado y ${n(mg.ruedo)} en el ruedo. El doblez no lleva margen.`,
    ],
    contorno: [
      { ...escote, margen: mg.escote }, { a: A, b: R0, margen: 0 }, { a: R0, c: ruedo.c, b: lado, margen: mg.ruedo },
      { a: lado, b: D, margen: mg.costado }, { a: D, c: sisa.c2, c2: sisa.c, b: C, margen: mg.sisa }, { a: C, b: B, margen: mg.hombro },
    ],
    rotulo: P(b.ancho / 2 + 2, b.ys + (b.yR - b.ys) * 0.5),
    hilo: [P(b.ancho * 0.75, b.ys + 4), P(b.ancho * 0.75, b.yR - 10)],
  };
  return { pieza: agregarBotones(pieza, prof + 1.5, b.yR - 12), sisa };
}

export function construir(m) {
  const b = base(m);
  const esp = espaldaYCanesu(m, b);
  const del = delantero(m, b);
  const sisaTotal = largoTramo(del.sisa) + largoTramo(esp.sisa);
  const extras = cuelloYPuno(mitadEscote(del.pieza, esp.canesu), m.muneca);
  const mangaLarga = manga(m, sisaTotal, {
    sisas: { delantero: largoTramo(del.sisa), espalda: largoTramo(esp.sisa) },
    holgura: F.holguraBrazo, facilidad: F.facilidadManga,
    largo: m['largo-manga-larga'] - extras.anchoPuno, anchoAbajo: extras.largoPuno + 4, abertura: true, margenRuedo: 1,
  });

  return {
    calculos: [
      { nombre: 'Ancho en el pecho', formula: `pecho ÷ 4 + ${n(F.holguraPecho)}`, valor: b.ancho },
      { nombre: 'Profundidad de sisa', formula: `pecho ÷ 8 + ${n(F.sisaExtra)}`, valor: b.ys },
      { nombre: 'Ancho abajo', formula: `cadera ÷ 4 + ${n(F.holguraCadera)} (o el del pecho)`, valor: b.xRuedo },
      { nombre: 'Escote', formula: `(cuello + ${n(F.holguraCuello)}) ÷ 6`, valor: b.c6 },
      { nombre: 'Largo del escote completo', formula: 'medido en el molde', valor: extras.escote },
      { nombre: 'Largo del puño', formula: 'muñeca + 3', valor: extras.largoPuno },
      { nombre: 'Altura de copa de la manga', formula: 'calculada para calzar en la sisa', valor: mangaLarga.alturaCopa },
    ],
    piezas: [del.pieza, esp.espalda, esp.canesu, mangaLarga],
    rectangulos: extras.rectangulos,
    botones: del.pieza.botones + 3,
  };
}
