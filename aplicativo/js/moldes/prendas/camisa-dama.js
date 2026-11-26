// Molde: camisa de dama = cuerpo de la blusa con más holgura, botones adelante,
// espalda al doblez, manga larga con puño, pie de cuello y cuello.
// ⚠️ PROVISIONAL: usa blusa.js y camisa-comun.js.
import { cuerpo, manga } from './blusa.js';
import { agregarBotones, espaldaAlDoblez, cuelloYPuno, mitadEscote } from './camisa-comun.js';

export const FORMULAS = {
  holguraBusto: 2,      // más holgura que la blusa
  holguraCuello: 2,     // el escote se agranda un poco para el cuello camisero
  holguraBrazo: 8,
  facilidadManga: 1,
};

export function construir(m) {
  const medidas = { ...m, cuello: m.cuello + FORMULAS.holguraCuello, 'largo-blusa': m['largo-camisa'] };
  const c = cuerpo(medidas, { holguraBusto: FORMULAS.holguraBusto });
  const espalda = espaldaAlDoblez(c.espalda);
  const { a: A, b: R0 } = c.delantero.lineaCentro;
  const delantero = agregarBotones(c.delantero, A.y + 1.5, R0.y - 10);
  const extras = cuelloYPuno(mitadEscote(c.delantero, c.espalda), m.muneca);
  const mangaLarga = manga(m, c.sisa, {
    sisas: c.sisas,
    holgura: FORMULAS.holguraBrazo, facilidad: FORMULAS.facilidadManga,
    largo: m['largo-manga-larga'] - extras.anchoPuno, anchoAbajo: extras.largoPuno + 4, abertura: true, margenRuedo: 1,
  });

  return {
    calculos: [
      { nombre: 'Ancho en el busto', formula: `busto ÷ 4 + ${FORMULAS.holguraBusto}`, valor: c.b.ancho },
      { nombre: 'Profundidad de sisa', formula: 'busto ÷ 8 + 11', valor: c.b.ys },
      { nombre: 'Escote', formula: `(cuello + ${FORMULAS.holguraCuello}) ÷ 6`, valor: c.b.c6 },
      { nombre: 'Largo del escote completo', formula: 'medido en el molde', valor: extras.escote },
      { nombre: 'Largo del puño', formula: 'muñeca + 3', valor: extras.largoPuno },
      { nombre: 'Altura de copa de la manga', formula: 'calculada para calzar en la sisa', valor: mangaLarga.alturaCopa },
    ],
    piezas: [delantero, espalda, mangaLarga],
    rectangulos: extras.rectangulos,
    botones: delantero.botones + 3, // + pie de cuello y puños
  };
}
