import * as repo from './enfrentamientos.repository.js';
import { sequelize, Torneo, Ronda } from '../../models/index.js';

const PUNTOS = { ganador: 3, empate: 1, derrota: 0 };

// El enum del modelo usa 'perdedor'; la API acepta 'derrota'
const RESULTADO_A_DB = { ganador: 'ganador', empate: 'empate', derrota: 'perdedor' };

export async function obtenerEnfrentamiento(id) {
  const enfrentamiento = await repo.buscarPorId(id);
  if (!enfrentamiento) {
    const err = new Error('Enfrentamiento no encontrado');
    err.status = 404;
    throw err;
  }
  return enfrentamiento;
}

export async function registrarResultado(id, { resultados }, usuarioId) {
  const enfrentamiento = await repo.buscarPorId(id);
  if (!enfrentamiento) {
    const err = new Error('Enfrentamiento no encontrado');
    err.status = 404;
    throw err;
  }

  if (enfrentamiento.estado === 'finalizado') {
    const err = new Error('Este enfrentamiento ya tiene resultado registrado');
    err.status = 409;
    throw err;
  }

  const ronda = await Ronda.findByPk(enfrentamiento.ronda_id);
  const torneo = await Torneo.findByPk(ronda.torneo_id);
  if (torneo.organizador_id !== usuarioId) {
    const err = new Error('No tienes permiso para registrar resultados en este torneo');
    err.status = 403;
    throw err;
  }

  const participanteIds = enfrentamiento.participantes.map(
    (p) => p.inscripcion_id
  );
  const resultadoIds = resultados.map((r) => r.inscripcion_id);

  const mismoConjunto =
    participanteIds.length === resultadoIds.length &&
    resultadoIds.every((rid) => participanteIds.includes(rid));

  if (!mismoConjunto) {
    const err = new Error(
      'Los inscripcion_id no corresponden a los participantes de este enfrentamiento'
    );
    err.status = 400;
    throw err;
  }

  const ganadores = resultados.filter((r) => r.resultado === 'ganador');
  const conEmpate = resultados.filter((r) => r.resultado === 'empate');

  if (ganadores.length > 1) {
    const err = new Error('Solo puede haber un ganador por mesa');
    err.status = 400;
    throw err;
  }

  if (ganadores.length === 1 && conEmpate.length > 0) {
    const err = new Error('No puede haber empates si hay un ganador en la mesa');
    err.status = 400;
    throw err;
  }

  const t = await sequelize.transaction();
  try {
    for (const r of resultados) {
      const participante = enfrentamiento.participantes.find(
        (p) => p.inscripcion_id === r.inscripcion_id
      );
      const puntos = PUNTOS[r.resultado];
      const resultadoDB = RESULTADO_A_DB[r.resultado];

      await repo.actualizarParticipante(participante.id, resultadoDB, puntos, t);

      const jugadorId = participante.Inscripcion.usuario_id;
      await repo.buscarOCrearEstadistica(jugadorId, t);

      if (r.resultado === 'ganador') {
        await repo.actualizarEstadistica(jugadorId, 'partidas_ganadas', t);
      } else if (r.resultado === 'empate') {
        await repo.actualizarEstadistica(jugadorId, 'partidas_empatadas', t);
      } else {
        await repo.actualizarEstadistica(jugadorId, 'partidas_perdidas', t);
      }
    }

    await repo.actualizarEstado(id, 'finalizado', t);
    await t.commit();
  } catch (error) {
    await t.rollback();
    throw error;
  }

  return repo.buscarPorId(id);
}

export async function cambiarEstado(id, { estado }, usuarioId) {
  const enfrentamiento = await repo.buscarPorId(id);
  if (!enfrentamiento) {
    const err = new Error('Enfrentamiento no encontrado');
    err.status = 404;
    throw err;
  }

  const ronda = await Ronda.findByPk(enfrentamiento.ronda_id);
  const torneo = await Torneo.findByPk(ronda.torneo_id);
  if (torneo.organizador_id !== usuarioId) {
    const err = new Error('No tienes permiso para modificar este enfrentamiento');
    err.status = 403;
    throw err;
  }

  await repo.actualizarEstado(id, estado, null);
  return repo.buscarPorId(id);
}
