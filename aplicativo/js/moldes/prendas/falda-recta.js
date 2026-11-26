// Molde: falda recta (delantero al doblez, espalda con cierre, pretina)
// Método del cuaderno del taller («Patrón de falda tubular»): cadera ÷ 4, cintura ÷ 4 + 3 (pinza),
// subir 1 cm en el costado, pinza de 3 cm (8 cm adelante, 11 cm atrás), entrar 2 cm en el ruedo,
// margen +2 en costados y cierre, +3 en el ruedo, cierre de 15 cm, pretina = cintura + 3 cm para el ojal.
import { punto as P } from '../geometria.js';
import { numero as n } from '../../utilidades/formato.js';

export const FORMULAS = {
  holguraCadera: 1,        // 1 cm por cuarto = 4 cm en total: lo mínimo para sentarse y caminar
                           // (el cuaderno usa cadera ÷ 4 exacto; los libros de patronaje dejan 4 cm)
  pinzaMaxima: 3,          // ancho máximo de la pinza
  subidaCostado: 1,        // cuánto sube la cintura en el costado
  bajadaEspalda: 1,        // referencia A1 original, 1 cm debajo de A
  subidaDesdeA1: 3,       // corrección docente: elevar el centro trasero desde A1
  largoPinza: { delantero: 8, espalda: 11 },
  entradaRuedo: 2,         // falda tubular: el costado entra 2 cm abajo
  abertura: 18,            // con el ruedo cerrado hace falta una abertura atrás para caminar
  margen: { cintura: 1, costado: 2, ruedo: 3, centroEspalda: 2 },
  pretina: { ancho: 3, cruce: 3, margen: 1 },
};

const F = FORMULAS;

export function construir(m) {
  const ancho = m.cadera / 4 + F.holguraCadera;
  const pinza = Math.min(F.pinzaMaxima, Math.max(0, ancho - m.cintura / 4));
  const cintura = m.cintura / 4 + pinza;
  const pretina = { largo: m.cintura + F.pretina.cruce + 2 * F.pretina.margen, alto: 2 * F.pretina.ancho + 2 * F.pretina.margen };

  return {
    calculos: [
      { nombre: 'Ancho de cadera', formula: `cadera ÷ 4 + ${n(F.holguraCadera)}`, valor: ancho },
      { nombre: 'Ancho de cintura', formula: 'cintura ÷ 4 + pinza', valor: cintura },
      { nombre: 'Pinza', formula: `lo que sobra, hasta ${n(F.pinzaMaxima)} cm`, valor: pinza },
      { nombre: 'Altura de cadera', formula: 'tu medida', valor: m['altura-cadera'] },
      { nombre: 'Largo', formula: 'tu medida', valor: m['largo-falda'] },
    ],
    piezas: [mitad('delantero', m, ancho, cintura, pinza), mitad('espalda', m, ancho, cintura, pinza)],
    rectangulos: [{ nombre: 'Pretina', cortar: 'Cortar 1', alDoblez: true, ...pretina,
      texto: `Rectángulo de ${n(pretina.largo)} × ${n(pretina.alto)} cm (ya incluye margen). No hace falta imprimirla.` }],
  };
}

function mitad(cual, m, ancho, cintura, pinza) {
  const espalda = cual === 'espalda';
  const L = m['largo-falda'], AC = m['altura-cadera'];
  const A = P(0, 0), B = P(0, L), D = P(0, AC), E = P(ancho, AC), Fp = P(ancho - F.entradaRuedo, L);
  const A1 = espalda ? P(0, F.bajadaEspalda) : A;
  const inicioCintura = espalda ? P(0, A1.y - F.subidaDesdeA1) : A;
  const G = P(cintura, -F.subidaCostado);
  const control = P(ancho, G.y + (E.y - G.y) * 0.4);
  const mg = F.margen;

  // Pinza en el medio de la cintura
  const enCintura = (x) => P(x, inicioCintura.y + (G.y - inicioCintura.y) * (x / cintura));
  const xp = cintura / 2;
  const hayPinza = pinza >= 0.5;
  const largoPinza = F.largoPinza[cual];
  // Conservar la punta original y prolongar la pinza hasta la cintura corregida.
  const puntaPinza = P(xp, (A1.y + G.y) / 2 + largoPinza);

  const elementos = [
    { paso: 0, tipo: 'linea', p: [A, B] },
    { paso: 0, tipo: 'punto', p: [A], nombre: 'A' }, { paso: 0, tipo: 'punto', p: [B], nombre: 'B' },
    { paso: 1, tipo: 'linea', p: [D, E] },
    { paso: 1, tipo: 'punto', p: [D], nombre: 'D' }, { paso: 1, tipo: 'punto', p: [E], nombre: 'E', der: true },
    { paso: 2, tipo: 'linea', p: [B, Fp] }, { paso: 2, tipo: 'linea', p: [E, Fp] },
    { paso: 2, tipo: 'punto', p: [Fp], nombre: 'F', der: true },
    { paso: 3, tipo: 'linea', p: [inicioCintura, G] },
    { paso: 3, tipo: 'punto', p: [G], nombre: 'G', der: true },
    ...(espalda ? [{ paso: 3, tipo: 'punto', p: [A1], nombre: 'A1', der: true },
      { paso: 3, tipo: 'punto', p: [inicioCintura], nombre: 'A2', der: true }] : []),
    { paso: 4, tipo: 'curva', p: [G, control, E] },
    ...(espalda && F.entradaRuedo > 0 ? [{ paso: 6, tipo: 'linea', p: [P(0, L - F.abertura), P(4, L - F.abertura)] },
      { paso: 6, tipo: 'texto', p: [P(5, L - F.abertura / 2)], texto: 'ABERTURA', tam: 1.4 }] : []),
    ...(hayPinza ? [{ paso: 5, tipo: 'pinza', p: [enCintura(xp - pinza / 2), puntaPinza, enCintura(xp + pinza / 2)] }] : []),
  ];

  const pasos = [
    `Traza una línea recta hacia abajo, de A a B, del largo de la falda: ${n(L)} cm. ${espalda ? 'Es el centro de la espalda, donde va el cierre.' : 'Es el centro del delantero: irá al doblez de la tela.'}`,
    `Desde A, baja ${n(AC)} cm (altura de cadera) y marca D. Desde D, traza hacia la derecha D–E = cadera ÷ 4 + ${n(F.holguraCadera)} = ${n(ancho)} cm.`,
    `Desde B, traza hacia la derecha ${n(ancho)} cm y entra ${n(F.entradaRuedo)} cm: punto F (${n(Fp.x)} cm). Une E con F: es el costado, un poco cerrado abajo como falda tubular.`,
    `Desde A, mide hacia la derecha cintura ÷ 4 + pinza = ${n(cintura)} cm y sube ${n(F.subidaCostado)} cm para marcar G. ${espalda ? `Baja ${n(F.bajadaEspalda)} cm desde A y marca la referencia A1. Desde A1 sube ${n(F.subidaDesdeA1)} cm y marca A2: es la cintura corregida en el centro de la espalda. Une A2 con G.` : 'Une A con G: es la cintura.'}`,
    'Une G con E con una curva suave hacia afuera: es la curva de la cadera.',
    hayPinza
      ? `Pinza: en el medio de la cintura marca ${n(pinza)} cm de ancho. ${espalda ? `Ubica la punta ${n(largoPinza)} cm debajo de la línea original A1–G y une esa punta con las marcas de la nueva cintura A2–G.` : `Baja ${n(largoPinza)} cm por el centro y une las marcas con la punta.`}`
      : 'Con estas medidas no hace falta pinza: la cintura y la cadera son casi iguales.',
    `Agrega el margen de costura: ${n(mg.cintura)} cm en la cintura, ${n(mg.costado)} cm en el costado y ${n(mg.ruedo)} cm en el ruedo. ${espalda ? `En el centro de la espalda, ${n(mg.centroEspalda)} cm para el cierre arriba y para la abertura abajo: deja sin coser los últimos ${n(F.abertura)} cm desde el ruedo, así se puede caminar.` : 'El doblez no lleva margen.'} Recorta por la línea de afuera.`,
  ];

  return {
    nombre: espalda ? 'Espalda' : 'Delantero',
    cortar: espalda ? 'Cortar 2' : 'Cortar 1 al doblez',
    alDoblez: !espalda,
    centro: espalda ? 'CENTRO ESPALDA · CIERRE' : 'DOBLEZ',
    // En la espalda el texto va arriba, donde va el cierre (abajo está la abertura)
    ...(espalda ? { lineaCentro: { a: inicioCintura, b: P(0, L - F.abertura) } } : {}),
    elementos,
    pasos,
    contorno: [
      { a: inicioCintura, b: G, margen: mg.cintura },
      { a: G, c: control, b: E, margen: mg.costado },
      { a: E, b: Fp, margen: mg.costado },
      { a: Fp, b: B, margen: mg.ruedo },
      { a: B, b: inicioCintura, margen: espalda ? mg.centroEspalda : 0 },
    ],
    rotulo: P(ancho / 2, AC + (L - AC) * 0.3),
    hilo: [P(ancho * 0.75, AC + 4), P(ancho * 0.75, L - 6)],
  };
}
