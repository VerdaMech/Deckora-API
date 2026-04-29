import * as repo from './torneos.repository.js';
import * as mazosRepo from '../mazos/mazos.repository.js';

export function listar() {
  return repo.listar();
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

  return inscripcion;
}

export function listarInscripciones(torneoId) {
  return repo.listarInscripciones(torneoId);
}