import * as repo from './rondas.repository.js';
import { emparejadores } from './emparejadores/index.js';
import { Torneo, Enfrentamiento, EnfrentamientoParticipante } from '../../models/index.js';

export async function crearRonda(torneoId, { tipo_ronda, asignaciones }, usuarioId) {
  const torneo = await Torneo.findByPk(torneoId);
  if (!torneo) {
    const err = new Error('Torneo no encontrado');
    err.status = 404;
    throw err;
  }

  if (torneo.organizador_id !== usuarioId) {
    const err = new Error('No tienes permiso para crear rondas en este torneo');
    err.status = 403;
    throw err;
  }

  const inscripciones = await repo.obtenerInscripcionesConPuntos(torneoId);
  if (inscripciones.length < 2) {
    const err = new Error('Se necesitan al menos 2 inscripciones para crear una ronda');
    err.status = 400;
    throw err;
  }

  const emparejar = emparejadores[tipo_ronda];
  const mesas = emparejar(inscripciones, asignaciones);

  const totalRondas = await repo.contarRondasDeTorneo(torneoId);
  const numeroRonda = totalRondas + 1;

  const ronda = await repo.crear(torneoId, tipo_ronda, numeroRonda);

  for (let i = 0; i < mesas.length; i++) {
    const mesa = mesas[i];
    const enfrentamiento = await Enfrentamiento.create({
      ronda_id: ronda.id,
      numero_mesa: i + 1,
      estado: 'pendiente',
    });

    for (const inscripcionId of mesa) {
      await EnfrentamientoParticipante.create({
        enfrentamiento_id: enfrentamiento.id,
        inscripcion_id: inscripcionId,
        puntos_obtenidos: 0,
        resultado: null,
      });
    }
  }

  return repo.buscarPorId(ronda.id);
}

export function listarRondasDeTorneo(torneoId) {
  return repo.listarPorTorneo(torneoId);
}

export async function obtenerRonda(rondaId) {
  const ronda = await repo.buscarPorId(rondaId);
  if (!ronda) {
    const err = new Error('Ronda no encontrada');
    err.status = 404;
    throw err;
  }
  return ronda;
}
