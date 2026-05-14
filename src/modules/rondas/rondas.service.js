import * as repo from './rondas.repository.js';
import { emparejadores } from './emparejadores/index.js';
import { Torneo, Enfrentamiento, EnfrentamientoParticipante } from '../../models/index.js';

function serializarRonda(ronda) {
  const r = ronda.toJSON ? ronda.toJSON() : ronda;
  return {
    ...r,
    enfrentamientos: (r.enfrentamientos ?? []).map((enf) => ({
      ...enf,
      participantes: (enf.participantes ?? []).map((p) => ({
        id: p.id,
        inscripcion_id: p.inscripcion_id,
        nombre_usuario: p.Inscripcion?.Jugador?.Usuario?.nombre_usuario ?? '—',
        resultado: p.resultado,
        puntos: p.puntos_obtenidos,
        mazo: p.Inscripcion?.Mazo
          ? {
              nombre: p.Inscripcion.Mazo.nombre,
              comandante: p.Inscripcion.Mazo.comandante ?? null,
            }
          : null,
      })),
    })),
  };
}

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

  const minJugadores = torneo.formato === 'COMMANDER' ? 3 : 2;
  if (inscripciones.length < minJugadores) {
    const err = new Error(
      `Se necesitan al menos ${minJugadores} inscripciones confirmadas para crear una ronda`
    );
    err.status = 400;
    throw err;
  }

  const emparejar = emparejadores[tipo_ronda];
  if (!emparejar) {
    const err = new Error(`Tipo de ronda desconocido: ${tipo_ronda}`);
    err.status = 400;
    throw err;
  }
  const mesas = emparejar(inscripciones, asignaciones, torneo.formato);

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

  return serializarRonda(await repo.buscarPorId(ronda.id));
}

export async function listarRondasDeTorneo(torneoId) {
  const rondas = await repo.listarPorTorneo(torneoId);
  return rondas.map(serializarRonda);
}

export async function obtenerRonda(rondaId) {
  const ronda = await repo.buscarPorId(rondaId);
  if (!ronda) {
    const err = new Error('Ronda no encontrada');
    err.status = 404;
    throw err;
  }
  return serializarRonda(ronda);
}

export async function eliminarRonda(torneoId, rondaId, usuarioId) {
  const torneo = await Torneo.findByPk(torneoId);
  if (!torneo) {
    const err = new Error('Torneo no encontrado');
    err.status = 404;
    throw err;
  }
  if (torneo.organizador_id !== usuarioId) {
    const err = new Error('No tienes permiso para eliminar rondas en este torneo');
    err.status = 403;
    throw err;
  }

  const ronda = await repo.buscarPorId(rondaId);
  if (!ronda) {
    const err = new Error('Ronda no encontrada');
    err.status = 404;
    throw err;
  }
  if (ronda.torneo_id !== torneoId) {
    const err = new Error('La ronda no pertenece a este torneo');
    err.status = 400;
    throw err;
  }

  const tieneFinalizados = (ronda.enfrentamientos ?? []).some((e) => e.estado === 'finalizado');
  if (tieneFinalizados) {
    const err = new Error('No se puede eliminar una ronda con enfrentamientos ya finalizados');
    err.status = 400;
    throw err;
  }

  await repo.eliminarRonda(rondaId);
}
