import * as repo from './usuarios.repository.js';

export async function obtenerPorUsername(username) {
  const usuario = await repo.buscarPorUsername(username);

  if (!usuario) {
    const error = new Error('Usuario no encontrado');
    error.status = 404;
    throw error;
  }

  const data = usuario.toJSON();
  const perfil = data.Jugador ?? data.Organizador ?? data.Tienda ?? {};

  return {
    id: data.id,
    nombre_usuario: data.nombre_usuario,
    correo: data.correo,
    rol: data.rol,
    ...perfil,
  };
}
