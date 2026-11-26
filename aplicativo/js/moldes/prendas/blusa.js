// Molde: blusa básica (delantero al doblez, espalda con cierre, manga corta)
// Método de los afiches del taller: busto ÷ 4, cintura ÷ 4 + pinza, cadera ÷ 4, cuello ÷ 6,
// ancho de espalda ÷ 2, busto a busto ÷ 2, alto de busto, talles.
// ⚠️ PROVISIONAL: reemplazar FORMULAS por las del docente del CEA.
import { punto as P, largoTramo } from '../geometria.js';
import { numero as n } from '../../utilidades/formato.js';

export const FORMULAS = {
  holguraBusto: 1.5,      // 1,5 cm por cuarto = 6 cm en total (los libros dejan de 5 a 8 cm en un cuerpo con manga;
                          // el cuaderno usa busto ÷ 4 exacto, que queda pegado al cuerpo)
  sisaExtra: 11,          // profundidad de sisa = busto ÷ 8 + sisaExtra
  holguraCadera: 1,       // 1 cm por cuarto = 4 cm en total (igual que la falda)
  pinzaCintura: 3,        // ancho de la pinza de cintura (delantero y espalda)
  escoteEspalda: 2,       // profundidad del escote de espalda
  escoteDelantero: 1,     // se suma a cuello ÷ 6 para la profundidad del escote delantero
  caidaHombro: { espalda: 4, delantero: 4.5 },
  hombroExtra: { espalda: 1.5, delantero: 1 }, // se suma a ancho de espalda ÷ 2
  holguraBrazo: 6,        // cm que se suman al contorno de brazo
  facilidadManga: 1.5,    // la copa mide un poco más que la sisa (se embebe)
  margen: { escote: 1, hombro: 1.5, sisa: 1, costado: 1.5, ruedo: 2, centroEspalda: 2, manga: 2.5 },
};
// F son las fórmulas en uso; cuerpo() puede cambiarlas por un momento (ej. la camisa usa más holgura)
let F = FORMULAS;

// Punto del costado a cierta altura (entre dos puntos)
const entre = (a, b, y) => P(a.x + (b.x - a.x) * ((y - a.y) / (b.y - a.y)), y);

// Costado: sisa → cintura → cadera → ruedo (si la blusa es corta, termina antes)
function costado(S, cintura, cadera, yRuedo) {
  if (yRuedo <= cintura.y) return [S, entre(S, cintura, yRuedo)];
  if (yRuedo <= cadera.y) return [S, cintura, entre(cintura, cadera, yRuedo)];
  return [S, cintura, cadera, P(cadera.x, yRuedo)];
}

const base = (m) => {
  const c6 = m.cuello / 6;
  const ancho = m.busto / 4 + F.holguraBusto;
  const ys = m.busto / 8 + F.sisaExtra;                     // línea de busto / profundidad de sisa
  const yCinturaEspalda = F.escoteEspalda + m['talle-espalda'];
  const largoBajoCintura = F.escoteEspalda + m['largo-blusa'] - yCinturaEspalda;
  return { c6, ancho, ys, yCinturaEspalda, largoBajoCintura };
};

function espalda(m, b) {
  const { c6, ancho, ys } = b;
  const A = P(0, F.escoteEspalda), B = P(c6, 0);
  const C = P(m['ancho-espalda'] / 2 + F.hombroExtra.espalda, F.caidaHombro.espalda);
  const D = P(ancho, ys);
  const yW = b.yCinturaEspalda, yH = yW + m['altura-cadera'], yR = yW + b.largoBajoCintura;
  const E = P(m.cintura / 4 + F.pinzaCintura, yW), Fc = P(m.cadera / 4 + F.holguraCadera, yH);
  const lado = costado(D, E, Fc, yR);
  const R = lado.at(-1), R0 = P(0, yR);
  const sisa = { a: C, c: P(m['ancho-espalda'] / 2 + 0.5, ys * 0.6), c2: P(m['ancho-espalda'] / 2 + 1.5, ys), b: D };
  const escote = { a: A, c: P(c6 * 0.8, F.escoteEspalda), b: B };
  const xp = m['ancho-espalda'] / 4 + 1, p2 = F.pinzaCintura / 2;
  const finPinza = F.pinzaInterna
    ? Math.min(yW + F.pinzaInterna.largoInferior, yH - 4, yR - F.pinzaInterna.separacionRuedo)
    : Math.min(yH - 4, yR - 3);
  const rombo = F.pinzaInterna ? finPinza > yW + 1 : yR > yW + 3;
  const pinza = (F.pinzaInterna ? rombo && ys + 3 < yW : yR >= yW)
    ? [{ paso: 5, tipo: 'pinza', p: [P(xp - p2, yW), P(xp, ys + 3), P(xp + p2, yW)] },
      ...(rombo ? [{ paso: 5, tipo: 'pinza', p: [P(xp - p2, yW), P(xp, finPinza), P(xp + p2, yW)] }] : [])]
    : [];

  return {
    pieza: {
      nombre: 'Espalda', cortar: 'Cortar 2', alDoblez: false, centro: 'CENTRO ESPALDA · CIERRE',
      elementos: [
        { paso: 0, tipo: 'linea', p: [A, R0] }, { paso: 0, tipo: 'punto', p: [A], nombre: 'A' },
        { paso: 1, tipo: 'curva', p: [escote.a, escote.c, escote.b] }, { paso: 1, tipo: 'punto', p: [B], nombre: 'B', der: true },
        { paso: 2, tipo: 'linea', p: [B, C] }, { paso: 2, tipo: 'punto', p: [C], nombre: 'C', der: true },
        { paso: 3, tipo: 'linea', p: [P(0, ys), D], puntos: true },
        { paso: 3, tipo: 'curva', p: [sisa.a, sisa.c, sisa.c2, sisa.b] }, { paso: 3, tipo: 'punto', p: [D], nombre: 'D', der: true },
        ...lado.slice(1).map((q, i) => ({ paso: 4, tipo: 'linea', p: [lado[i], q] })),
        { paso: 4, tipo: 'linea', p: [R, R0] },
        ...(yR >= yW ? [{ paso: 4, tipo: 'punto', p: [E], nombre: 'E', der: true }] : []),
        ...pinza,
      ],
      pasos: [
        `Traza la línea del centro de la espalda: desde A baja ${n(yR - A.y)} cm (largo de la blusa).`,
        `Escote: arriba, marca hacia la derecha cuello ÷ 6 = ${n(c6)} cm (punto B), ${n(F.escoteEspalda)} cm más arriba que A. Une A con B con una curva suave.`,
        `Hombro: desde el centro mide ancho de espalda ÷ 2 + ${n(F.hombroExtra.espalda)} = ${n(C.x)} cm y baja ${n(F.caidaHombro.espalda)} cm: punto C. Une B con C.`,
        `Línea de busto: baja busto ÷ 8 + ${n(F.sisaExtra)} = ${n(ys)} cm y mide hacia la derecha busto ÷ 4 + ${n(F.holguraBusto)} = ${n(ancho)} cm: punto D. Une C con D con la curva de la sisa.`,
        `Costado: desde A baja el talle de espalda (${n(m['talle-espalda'])} cm) y mide cintura ÷ 4 + ${n(F.pinzaCintura)} = ${n(E.x)} cm (punto E). ${yR > yW ? `${n(m['altura-cadera'])} cm más abajo mide cadera ÷ 4 + ${n(F.holguraCadera)} = ${n(Fc.x)} cm. Une D, E y la cadera, y cierra el ruedo.` : 'Une D con E: aquí termina el cuerpo y se une a la falda.'}`,
        pinza.length
          ? `Pinza de cintura: a ${n(xp)} cm del centro, ${n(F.pinzaCintura)} cm de ancho en la cintura. Sube hasta ${n(ys + 3)} cm${rombo ? ` y termina abajo ${n(finPinza - yW)} cm después de la cintura, a ${n(yR - finPinza)} cm del ruedo (rombo cerrado)` : ''}.`
          : 'No hay espacio suficiente para la pinza de cintura: se omite.',
        `Agrega el margen: ${n(F.margen.escote)} cm en el escote, ${n(F.margen.hombro)} en el hombro, ${n(F.margen.sisa)} en la sisa, ${n(F.margen.costado)} en el costado, ${n(F.margen.ruedo)} en el ruedo y ${n(F.margen.centroEspalda)} en el centro (cierre).`,
      ],
      contorno: [
        { ...escote, margen: F.margen.escote }, { a: B, b: C, margen: F.margen.hombro }, { ...sisa, margen: F.margen.sisa },
        ...lado.slice(1).map((q, i) => ({ a: lado[i], b: q, margen: F.margen.costado })),
        { a: R, b: R0, margen: F.margen.ruedo }, { a: R0, b: A, margen: F.margen.centroEspalda },
      ],
      rotulo: P(ancho / 2, ys + (yR - ys) * 0.55),
      hilo: [P(ancho * 0.7, ys + 4), P(ancho * 0.7, Math.max(ys + 10, yR - 5))],
    },
    sisa: largoTramo(sisa),
  };
}

function delantero(m, b) {
  const { c6, ancho, ys } = b;
  const prof = c6 + F.escoteDelantero;
  const B = P(c6, 0), A = P(0, prof);
  const C = P(m['ancho-espalda'] / 2 + F.hombroExtra.delantero, F.caidaHombro.delantero);
  const D = P(ancho, ys);
  const Pb = P(m['busto-a-busto'] / 2, m['alto-busto']);
  const yW = m['talle-delantero'], yH = yW + m['altura-cadera'], yR = yW + b.largoBajoCintura;
  const E = P(m.cintura / 4 + F.pinzaCintura, yW), Fc = P(m.cadera / 4 + F.holguraCadera, yH);
  const lado = costado(D, E, Fc, yR);
  const R = lado.at(-1), R0 = P(0, yR);
  const sisa = { a: C, c: P(m['ancho-espalda'] / 2 - 0.5, ys * 0.6), c2: P(m['ancho-espalda'] / 2, ys), b: D };
  const escote = { a: B, c: P(c6, prof), b: A };

  // Pinza de costado: el delantero es más largo que la espalda por el busto
  const exceso = (yW - ys) - (b.yCinturaEspalda - ys);
  const hayCostado = exceso >= 0.5 && yR > ys + 6 + exceso;
  const sobreLado = (y) => entre(D, lado[1], y);
  const pinzaCostado = hayCostado
    ? [{ paso: 6, tipo: 'pinza', p: [sobreLado(ys + 4), P(Pb.x + 3, Pb.y), sobreLado(ys + 4 + exceso)] }] : [];
  const p2 = F.pinzaCintura / 2;
  const finPinza = F.pinzaInterna
    ? Math.min(yW + F.pinzaInterna.largoInferior, yH - 4, yR - F.pinzaInterna.separacionRuedo)
    : Math.min(yH - 4, yR - 3);
  const rombo = F.pinzaInterna ? finPinza > yW + 1 : yR > yW + 3;
  const pinzaCintura = (F.pinzaInterna ? rombo && Pb.y + 2 < yW : yR >= yW)
    ? [{ paso: 6, tipo: 'pinza', p: [P(Pb.x - p2, yW), P(Pb.x, Pb.y + 2), P(Pb.x + p2, yW)] },
      ...(rombo ? [{ paso: 6, tipo: 'pinza', p: [P(Pb.x - p2, yW), P(Pb.x, finPinza), P(Pb.x + p2, yW)] }] : [])]
    : [];

  return {
    pieza: {
      nombre: 'Delantero', cortar: 'Cortar 1 al doblez', alDoblez: true, centro: 'DOBLEZ', lineaCentro: { a: A, b: R0 },
      elementos: [
        { paso: 0, tipo: 'linea', p: [A, R0] }, { paso: 0, tipo: 'punto', p: [A], nombre: 'A' },
        { paso: 1, tipo: 'curva', p: [escote.a, escote.c, escote.b] }, { paso: 1, tipo: 'punto', p: [B], nombre: 'B', der: true },
        { paso: 2, tipo: 'linea', p: [B, C] }, { paso: 2, tipo: 'punto', p: [C], nombre: 'C', der: true },
        { paso: 3, tipo: 'linea', p: [P(0, ys), D], puntos: true },
        { paso: 3, tipo: 'curva', p: [sisa.a, sisa.c, sisa.c2, sisa.b] }, { paso: 3, tipo: 'punto', p: [D], nombre: 'D', der: true },
        { paso: 4, tipo: 'punto', p: [Pb], nombre: 'P', der: true },
        ...lado.slice(1).map((q, i) => ({ paso: 5, tipo: 'linea', p: [lado[i], q] })),
        { paso: 5, tipo: 'linea', p: [R, R0] },
        ...(yR >= yW ? [{ paso: 5, tipo: 'punto', p: [E], nombre: 'E', der: true }] : []),
        ...pinzaCostado, ...pinzaCintura,
      ],
      pasos: [
        `Traza la línea del centro (irá al doblez de la tela), desde A hacia abajo.`,
        `Escote: marca hacia la derecha cuello ÷ 6 = ${n(c6)} cm (punto B) y baja por el centro cuello ÷ 6 + ${n(F.escoteDelantero)} = ${n(prof)} cm (punto A). Une A con B con una curva.`,
        `Hombro: mide ancho de espalda ÷ 2 + ${n(F.hombroExtra.delantero)} = ${n(C.x)} cm y baja ${n(F.caidaHombro.delantero)} cm: punto C. Une B con C.`,
        `Línea de busto: baja busto ÷ 8 + ${n(F.sisaExtra)} = ${n(ys)} cm y mide busto ÷ 4 + ${n(F.holguraBusto)} = ${n(ancho)} cm: punto D. Une C con D con la curva de la sisa (más honda que en la espalda).`,
        `Punto de busto P: desde B baja el alto de busto (${n(m['alto-busto'])} cm) y desde el centro mide busto a busto ÷ 2 = ${n(Pb.x)} cm.`,
        `Costado: desde B baja el talle delantero (${n(yW)} cm) y mide cintura ÷ 4 + ${n(F.pinzaCintura)} = ${n(E.x)} cm (punto E). ${yR > yW ? `${n(m['altura-cadera'])} cm más abajo, cadera ÷ 4 + ${n(F.holguraCadera)}. Une D, E y la cadera, y cierra el ruedo.` : 'Une D con E: aquí termina el cuerpo y se une a la falda.'}`,
        [hayCostado ? `Pinza de costado: ${n(exceso)} cm de ancho, 4 cm debajo de la sisa, apuntando al busto (termina 3 cm antes de P).` : '',
          pinzaCintura.length ? `Pinza de cintura: debajo de P, ${n(F.pinzaCintura)} cm de ancho en la cintura, desde 2 cm bajo P hasta ${rombo ? `${n(finPinza - yW)} cm debajo de la cintura. Termina a ${n(yR - finPinza)} cm del ruedo, formando un rombo cerrado` : 'la cintura'}.` : '',
        ].join(' ').trim() || 'Con estas medidas no hacen falta pinzas.',
        `Agrega el margen: ${n(F.margen.escote)} cm en el escote, ${n(F.margen.hombro)} en el hombro, ${n(F.margen.sisa)} en la sisa, ${n(F.margen.costado)} en el costado y ${n(F.margen.ruedo)} en el ruedo. El doblez no lleva margen.`,
      ],
      contorno: [
        { ...escote, margen: F.margen.escote }, { a: A, b: R0, margen: 0 }, { a: R0, b: R, margen: F.margen.ruedo },
        ...lado.slice(1).map((q, i) => ({ a: lado[lado.length - 1 - i], b: lado[lado.length - 2 - i], margen: F.margen.costado })),
        { a: D, c: sisa.c2, c2: sisa.c, b: C, margen: F.margen.sisa }, { a: C, b: B, margen: F.margen.hombro },
      ],
      rotulo: P(ancho / 2 + 2, ys + (yR - ys) * 0.6),
      hilo: [P(ancho * 0.8, ys + 4), P(ancho * 0.8, Math.max(ys + 10, yR - 5))],
    },
    sisa: largoTramo(sisa),
  };
}

// Manga corta: la altura de la copa se busca para que la copa mida lo mismo que la sisa (+ facilidad)
export function manga(m, sisaTotal, opciones = {}) {
  const o = { holgura: F.holguraBrazo, facilidad: F.facilidadManga, largo: m['largo-manga'], anchoAbajo: null,
    abertura: false, margenRuedo: F.margen.manga, ...opciones };
  let A = m['contorno-brazo'] + o.holgura;
  const L = o.largo;
  const objetivo = (sisaTotal + o.facilidad) / 2;
  const media = (h) => ({ a: P(0, h), c: P(A * 0.2, h), c2: P(A * 0.3, 0), b: P(A / 2, 0) });
  let bajo = 2, alto = Math.max(3, L - 2);
  for (let i = 0; i < 30; i++) {
    const h = (bajo + alto) / 2;
    if (largoTramo(media(h)) < objetivo) bajo = h; else alto = h;
  }
  let h = (bajo + alto) / 2;
  let izq = media(h);
  let der = { a: P(A / 2, 0), c: P(A * 0.7, 0), c2: P(A * 0.8, h), b: P(A, h) };
  if (o.sisas) {
    // Ajuste camisero: bajar la copa y ampliar bíceps manteniendo cada costura.
    // Kenneth D. King, Threads, "A Fresh Way to Fit a Sleeve", opción 2:
    // https://www.threadsmagazine.com/2021/07/22/a-fresh-way-to-fit-a-sleeve-2
    // 0,75 es nuestra reducción inicial de diseño, no una regla de la fuente.
    h *= 0.75;
    const minimo = A;
    const mitad = (ancho, trasera) => ({ a: P(0, h),
      c: P(ancho * (trasera ? 0.38 : 0.45), h),
      c2: P(ancho * (trasera ? 0.58 : 0.65), 0), b: P(ancho, 0) });
    const ajustar = (sisa, trasera) => {
      const meta = sisa + o.facilidad / 2;
      let lo = 0, hi = meta;
      for (let i = 0; i < 45; i++) {
        const w = (lo + hi) / 2;
        if (largoTramo(mitad(w, trasera), 200) < meta) lo = w; else hi = w;
      }
      return mitad((lo + hi) / 2, trasera);
    };
    for (let i = 0; i < 80; i++) {
      izq = ajustar(o.sisas.espalda, true);
      const frontal = ajustar(o.sisas.delantero, false);
      A = izq.b.x + frontal.b.x;
      const espejo = (p) => P(A - p.x, p.y);
      der = { a: izq.b, c: espejo(frontal.c2), c2: espejo(frontal.c), b: espejo(frontal.a) };
      if (A >= minimo && h < Math.min(o.sisas.espalda, o.sisas.delantero)) break;
      h *= 0.95;
    }
  }
  const entra = o.anchoAbajo ? (A - o.anchoAbajo) / 2 : 1;
  const U1 = P(0, h), U2 = P(A, h), B1 = P(entra, L), B2 = P(A - entra, L), T = izq.b;
  const xa = B1.x + (B2.x - B1.x) * 0.25; // abertura del puño, del lado de atrás
  // Cada par de marcas se superpone al coser: consume 2 cm, 4 cm entre ambos.
  // La abertura es un corte independiente, no una marca del pliegue.
  const pliegues = [1, 4].flatMap((desplazamiento) => {
    const inicio = xa + desplazamiento;
    const fin = inicio + 2;
    return [
      ...[inicio, fin].map((x) => ({ paso: 4, tipo: 'linea', p: [P(x, L), P(x, L - 4)], puntos: true })),
      { paso: 4, tipo: 'linea', p: [P(inicio, L - 3), P(fin, L - 3)] },
      { paso: 4, tipo: 'linea', p: [P(fin - .4, L - 3.3), P(fin, L - 3)] },
      { paso: 4, tipo: 'linea', p: [P(fin - .4, L - 2.7), P(fin, L - 3)] },
      { paso: 4, tipo: 'texto', p: [P(inicio + 1, L - 4.5)], tam: .65, texto: '2 cm' },
    ];
  });
  const abertura = o.abertura ? [
    { paso: 4, tipo: 'linea', p: [P(xa, L), P(xa, L - 12)] },
    ...pliegues,
  ] : [];

  return {
    nombre: 'Manga', cortar: 'Cortar 2', alDoblez: false,
    elementos: [
      { paso: 0, tipo: 'linea', p: [U1, U2] }, { paso: 0, tipo: 'punto', p: [U1], nombre: 'A' }, { paso: 0, tipo: 'punto', p: [U2], nombre: 'B', der: true },
      { paso: 1, tipo: 'linea', p: [P(T.x, h), T], puntos: true }, { paso: 1, tipo: 'punto', p: [T], nombre: 'C', der: true },
      ...(o.sisas ? [
        { paso: 2, tipo: 'texto', p: [P(A * 0.2, h + 3)], texto: 'ESPALDA', tam: 1 },
        { paso: 2, tipo: 'texto', p: [P(A * 0.65, h + 3)], texto: 'DELANTERO', tam: 1 },
        { paso: 2, tipo: 'linea', p: [T, P(T.x, T.y + 0.7)] },
      ] : []),
      { paso: 2, tipo: 'curva', p: [izq.a, izq.c, izq.c2, izq.b] }, { paso: 2, tipo: 'curva', p: [der.a, der.c, der.c2, der.b] },
      { paso: 3, tipo: 'linea', p: [U1, B1] }, { paso: 3, tipo: 'linea', p: [U2, B2] }, { paso: 3, tipo: 'linea', p: [B1, B2] },
      ...abertura,
    ],
    pasos: [
      o.sisas ? `Traza A–B = ${n(A)} cm: ancho ajustado para una copa camisera más baja, con ${n(A - m['contorno-brazo'])} cm de holgura sobre el brazo.` : `Traza una línea A–B del ancho de la manga: contorno de brazo + ${n(o.holgura)} = ${n(A)} cm.`,
      `Desde A mide ${n(T.x)} cm hacia B y sube ${n(h)} cm para marcar C (altura de copa). La sisa del cuerpo mide ${n(sisaTotal)} cm.`,
      o.sisas ? `Traza las curvas impresas: A–C va a la espalda y C–B al delantero; C coincide con la costura del hombro. La copa lleva ${n(o.facilidad)} cm adicionales en total para embeber suavemente, sin fruncir. Corta las dos mangas en espejo y prueba una hilvanada antes de la costura definitiva.` : 'Une A con C y C con B con curvas suaves: hacia adentro cerca de A y B, y redondeada arriba (la copa).',
      `Desde la altura de C mide hacia abajo ${n(L)} cm${o.abertura ? ' (largo de manga menos el puño)' : ' (largo de manga)'}. Desde A y B hasta esa línea quedan ${n(L - h)} cm; entra ${n(entra)} cm a cada lado y une abajo.`,
      ...(o.abertura ? ['Abertura: a un cuarto del ancho de abajo (lado de atrás) sube 12 cm; solo esta línea se corta. Los pliegues llevan dos pares de marcas punteadas, separados 2 cm dentro de cada par. Junta las marcas de cada par siguiendo la flecha y sujeta: recoges 2 cm por pliegue, 4 cm en total. El espacio entre los pares no se recoge.'] : []),
      `Agrega el margen: ${n(F.margen.sisa)} cm en la copa, ${n(F.margen.costado)} en los costados y ${n(o.margenRuedo)} en el ruedo.`,
    ],
    contorno: [
      { ...izq, margen: F.margen.sisa }, { ...der, margen: F.margen.sisa },
      { a: U2, b: B2, margen: F.margen.costado }, { a: B2, b: B1, margen: o.margenRuedo }, { a: B1, b: U1, margen: F.margen.costado },
    ],
    rotulo: P(A / 2, h + (L - h) * 0.45 + 1),
    hilo: [P(A / 2, h + 1), P(A / 2, Math.max(h + 3, L - (o.abertura ? 7 : 2)))],
    alturaCopa: h, ancho: A,
  };
}

// Cuerpo (delantero + espalda) y sisa, para reutilizar en el vestido
export function cuerpo(m, cambios = {}) {
  const antes = F;
  F = { ...FORMULAS, ...cambios };
  try {
    const b = base(m);
    const del = delantero(m, b), esp = espalda(m, b);
    return { b, delantero: del.pieza, espalda: esp.pieza, sisa: del.sisa + esp.sisa,
      sisas: { delantero: del.sisa, espalda: esp.sisa }, formulas: F };
  } finally {
    F = antes;
  }
}

export function construir(m) {
  const b = base(m);
  const del = delantero(m, b), esp = espalda(m, b);
  const sisaTotal = del.sisa + esp.sisa;
  const mangaCorta = manga(m, sisaTotal);
  return {
    calculos: [
      { nombre: 'Ancho en el busto', formula: `busto ÷ 4 + ${n(F.holguraBusto)}`, valor: b.ancho },
      { nombre: 'Profundidad de sisa', formula: `busto ÷ 8 + ${n(F.sisaExtra)}`, valor: b.ys },
      { nombre: 'Ancho de cintura', formula: `cintura ÷ 4 + ${n(F.pinzaCintura)} (pinza)`, valor: m.cintura / 4 + F.pinzaCintura },
      { nombre: 'Ancho de cadera', formula: `cadera ÷ 4 + ${n(F.holguraCadera)}`, valor: m.cadera / 4 + F.holguraCadera },
      { nombre: 'Escote', formula: 'cuello ÷ 6', valor: b.c6 },
      { nombre: 'Busto a busto ÷ 2', formula: 'tu medida ÷ 2', valor: m['busto-a-busto'] / 2 },
      { nombre: 'Sisa (delantero + espalda)', formula: 'medida en el molde', valor: sisaTotal },
      { nombre: 'Altura de copa de la manga', formula: 'calculada para calzar en la sisa', valor: mangaCorta.alturaCopa },
    ],
    piezas: [del.pieza, esp.pieza, mangaCorta],
    rectangulos: [],
  };
}
