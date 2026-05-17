import * as repo from './torneos.repository.js';
import * as mazosRepo from '../mazos/mazos.repository.js';
import { sequelize } from '../../models/index.js';
import * as emailService from '../notificaciones/email.service.js';

export function listar(filtros = {}) {
  return repo.listar({
    organizadorId: filtros.organizadorId,
    formato: filtros.formato,
    estado: filtros.estado,
    desde: filtros.desde,
    hasta: filtros.hasta,
    q: filtros.q,
  });
}

export function misTorneos(organizadorId) {
  return repo.listar({ organizadorId, incluirTodos: true });
}

export async function crear(organizadorId, datos) {
  return repo.crear({ ...datos, organizador_id: organizadorId });
}

export async function obtenerPorId(id) {
  const torneo = await repo.buscarPorId(id);
  if (!torneo) {
    const error = new Error('Torneo no encontrado');
    error.status = 404;
    throw error;
  }
  return torneo;
}

export async function actualizar(id, usuarioId, datos) {
  const torneo = await repo.buscarPorId(id);
  if (!torneo) {
    const error = new Error('Torneo no encontrado');
    error.status = 404;
    throw error;
  }
  if (torneo.organizador_id !== usuarioId) {
    const error = new Error('Solo el organizador puede editar este torneo');
    error.status = 403;
    throw error;
  }
  if (torneo.estado !== 'pendiente') {
    const error = new Error('Solo se puede editar un torneo en estado pendiente');
    error.status = 400;
    throw error;
  }
  return repo.actualizar(id, datos);
}

export async function inscribir(torneoId, jugadorId, mazoId) {
  const torneo = await repo.buscarPorId(torneoId);
  if (!torneo) {
    const error = new Error('Torneo no encontrado');
    error.status = 404;
    throw error;
  }
  if (torneo.estado !== 'pendiente') {
    const error = new Error('El torneo no está abierto para inscripciones');
    error.status = 400;
    throw error;
  }

  const inscripcionExistente = await repo.buscarInscripcion(torneoId, jugadorId);
  if (inscripcionExistente) {
    const error = new Error('Ya estás inscrito en este torneo');
    error.status = 409;
    throw error;
  }

  const mazoInscrito = await repo.buscarInscripcionPorMazo(torneoId, mazoId);
  if (mazoInscrito) {
    const error = new Error('Este mazo ya está inscrito en el torneo');
    error.status = 409;
    throw error;
  }

  const mazo = await mazosRepo.buscarPorId(mazoId);
  if (!mazo) {
    const error = new Error('Mazo no encontrado');
    error.status = 404;
    throw error;
  }
  if (mazo.usuario_id !== jugadorId) {
    const error = new Error('No puedes inscribir un mazo que no te pertenece');
    error.status = 403;
    throw error;
  }

  const inscripcion = await repo.crearInscripcion({
    torneo_id: torneoId,
    usuario_id: jugadorId,
    mazo_id: mazoId,
    fecha_inscripcion: new Date(),
    confirmado: false,
  });

  const cartasMazo = mazo.MazoCartas ?? [];
  await Promise.all(
    cartasMazo.map((mc) =>
      repo.crearSnapshot({
        inscripcion_id: inscripcion.id,
        carta_id: mc.carta_id,
        cantidad: mc.cantidad,
        es_foil: false,
      }),
    ),
  );

  Promise.all([
    repo.buscarUsuarioPorId(torneo.organizador_id),
    repo.buscarUsuarioPorId(jugadorId),
  ]).then(([organizador, jugador]) => {
    if (organizador?.correo) {
      emailService.notificarSolicitudInscripcion({
        correoOrganizador: organizador.correo,
        nombreJugador: jugador?.nombre_usuario ?? 'Jugador',
        nombreTorneo: torneo.nombre,
        nombreMazo: mazo.nombre,
      }).catch((err) => console.error('[email] solicitudInscripcion:', err.message));
    }
  }).catch((err) => console.error('[email] solicitudInscripcion fetch:', err.message));

  return inscripcion;
}

export function listarInscripciones(torneoId) {
  return repo.listarInscripciones(torneoId);
}

export async function cancelarInscripcion(torneoId, inscripcionId, jugadorId, rolUsuario) {
  const inscripcion = await repo.buscarInscripcionPorId(inscripcionId);
  if (!inscripcion) {
    const err = new Error('Inscripción no encontrada');
    err.status = 404;
    throw err;
  }
  if (inscripcion.torneo_id !== torneoId) {
    const err = new Error('La inscripción no corresponde a este torneo');
    err.status = 400;
    throw err;
  }
  if (rolUsuario === 'organizador' || rolUsuario === 'tienda') {
    const torneo = await repo.buscarPorId(torneoId);
    if (!torneo || torneo.organizador_id !== jugadorId) {
      const err = new Error('No tienes permiso para cancelar esta inscripción');
      err.status = 403;
      throw err;
    }
  } else {
    if (inscripcion.usuario_id !== jugadorId) {
      const err = new Error('No puedes cancelar una inscripción que no te pertenece');
      err.status = 403;
      throw err;
    }
  }
  await repo.eliminarInscripcion(inscripcionId);
}

export async function listarPendientes(torneoId, usuarioId) {
  const torneo = await repo.buscarPorId(torneoId);
  if (!torneo) {
    const err = new Error('Torneo no encontrado');
    err.status = 404;
    throw err;
  }
  if (torneo.organizador_id !== usuarioId) {
    const err = new Error('No tienes permiso para ver las inscripciones pendientes');
    err.status = 403;
    throw err;
  }
  return repo.listarInscripcionesPendientes(torneoId);
}

export async function aprobarInscripcion(torneoId, inscripcionId, usuarioId) {
  const torneo = await repo.buscarPorId(torneoId);
  if (!torneo) {
    const err = new Error('Torneo no encontrado');
    err.status = 404;
    throw err;
  }
  if (torneo.organizador_id !== usuarioId) {
    const err = new Error('No tienes permiso para aprobar inscripciones');
    err.status = 403;
    throw err;
  }
  const inscripcion = await repo.buscarInscripcionPorId(inscripcionId);
  if (!inscripcion || inscripcion.torneo_id !== torneoId) {
    const err = new Error('Inscripción no encontrada');
    err.status = 404;
    throw err;
  }
  const resultado = await repo.aprobarInscripcion(inscripcionId);

  repo.buscarUsuarioPorId(inscripcion.usuario_id).then((jugador) => {
    if (jugador?.correo) {
      emailService.notificarInscripcionAceptada({
        correoJugador: jugador.correo,
        nombreTorneo: torneo.nombre,
      }).catch((err) => console.error('[email] inscripcionAceptada:', err.message));
    }
  }).catch((err) => console.error('[email] inscripcionAceptada fetch:', err.message));

  return resultado;
}

export async function rechazarInscripcion(torneoId, inscripcionId, usuarioId) {
  const torneo = await repo.buscarPorId(torneoId);
  if (!torneo) {
    const err = new Error('Torneo no encontrado');
    err.status = 404;
    throw err;
  }
  if (torneo.organizador_id !== usuarioId) {
    const err = new Error('No tienes permiso para rechazar inscripciones');
    err.status = 403;
    throw err;
  }
  const inscripcion = await repo.buscarInscripcionPorId(inscripcionId);
  if (!inscripcion || inscripcion.torneo_id !== torneoId) {
    const err = new Error('Inscripción no encontrada');
    err.status = 404;
    throw err;
  }

  repo.buscarUsuarioPorId(inscripcion.usuario_id).then((jugador) => {
    if (jugador?.correo) {
      emailService.notificarInscripcionRechazada({
        correoJugador: jugador.correo,
        nombreTorneo: torneo.nombre,
      }).catch((err) => console.error('[email] inscripcionRechazada:', err.message));
    }
  }).catch((err) => console.error('[email] inscripcionRechazada fetch:', err.message));

  await repo.eliminarInscripcion(inscripcionId);
}

export async function obtenerTablaPosiciones(torneoId) {
  const torneo = await repo.buscarPorId(torneoId);
  if (!torneo) {
    const error = new Error('Torneo no encontrado');
    error.status = 404;
    throw error;
  }

  const inscripciones = await repo.obtenerTablaPosiciones(torneoId);

  const tabla = inscripciones.map((ins) => {
    const data = ins.toJSON();
    const participantes = data.EnfrentamientoParticipantes ?? [];
    const puntos_totales = participantes.reduce(
      (sum, ep) => sum + (ep.puntos_obtenidos ?? 0),
      0,
    );
    const victorias = participantes.filter(
      (ep) => ep.resultado === 'ganador',
    ).length;
    const nombre_usuario = data.Jugador?.Usuario?.nombre_usuario ?? null;
    return {
      inscripcion_id: data.id,
      jugador_id: data.usuario_id,
      nombre_usuario,
      puntos_totales,
      victorias,
    };
  });

  tabla.sort((a, b) => {
    if (b.puntos_totales !== a.puntos_totales)
      return b.puntos_totales - a.puntos_totales;
    return b.victorias - a.victorias;
  });

  return tabla.map((e, i) => ({ ...e, posicion: i + 1 }));
}

const MIN_JUGADORES = { COMMANDER: 3 };
const MIN_DEFAULT = 2;

export async function cambiarEstado(torneoId, usuarioId, { estado }) {
  const torneo = await repo.buscarPorId(torneoId);
  if (!torneo) {
    const error = new Error('Torneo no encontrado');
    error.status = 404;
    throw error;
  }
  if (torneo.organizador_id !== usuarioId) {
    const error = new Error('Solo el organizador puede cambiar el estado de este torneo');
    error.status = 403;
    throw error;
  }
  if (torneo.estado === 'finalizado' || torneo.estado === 'cancelado') {
    const error = new Error('No se puede cambiar el estado de un torneo ya finalizado o cancelado');
    error.status = 409;
    throw error;
  }
  if (estado === 'en_curso') {
    const min = MIN_JUGADORES[torneo.formato] ?? MIN_DEFAULT;
    const confirmados = await repo.contarInscripcionesConfirmadas(torneoId);
    if (confirmados < min) {
      const error = new Error(
        `No se puede iniciar el torneo: se necesitan al menos ${min} jugadores confirmados (hay ${confirmados})`
      );
      error.status = 400;
      throw error;
    }
  }
  if (estado === 'finalizado') {
    const pendientes = await repo.verificarEnfrentamientosPendientes(torneoId);
    if (pendientes > 0) {
      const error = new Error(
        'No se puede finalizar el torneo: hay enfrentamientos sin resultado registrado'
      );
      error.status = 409;
      throw error;
    }
  }
  return repo.actualizar(torneoId, { estado });
}

export async function cerrarTorneo(torneoId, usuarioId) {
  const torneo = await repo.buscarPorId(torneoId);
  if (!torneo) {
    const error = new Error('Torneo no encontrado');
    error.status = 404;
    throw error;
  }

  if (torneo.organizador_id !== usuarioId) {
    const error = new Error('No tienes permiso para cerrar este torneo');
    error.status = 403;
    throw error;
  }

  if (torneo.estado === 'finalizado' || torneo.estado === 'cancelado') {
    const error = new Error('El torneo ya está cerrado o cancelado');
    error.status = 409;
    throw error;
  }

  const pendientes = await repo.verificarEnfrentamientosPendientes(torneoId);
  if (pendientes > 0) {
    const error = new Error(
      'No se puede cerrar el torneo: hay enfrentamientos sin resultado registrado',
    );
    error.status = 409;
    throw error;
  }

  const jugadoresIds = await repo.obtenerJugadoresInscritos(torneoId);

  await sequelize.transaction(async (t) => {
    await Promise.all(
      jugadoresIds.map((jugadorId) =>
        repo.incrementarTorneosParticipados(jugadorId, t),
      ),
    );
    await repo.cerrarTorneo(torneoId, t);
  });

  return repo.buscarPorId(torneoId);
}