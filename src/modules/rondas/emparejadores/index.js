import { emparejar as emparejarSwiss } from './swiss.emparejador.js';
import { emparejar as emparejarAleatorio } from './aleatorio.emparejador.js';
import { emparejar as emparejarManual } from './manual.emparejador.js';

export const emparejadores = {
  swiss: emparejarSwiss,
  eliminacion_directa: emparejarManual,
  final: emparejarManual,
};
