import { UniqueConstraintError } from 'sequelize';
import supabase from '../../config/supabase.js';
import { Usuario, Jugador, Organizador, Tienda, Estadistica } from '../../models/index.js';

export async function signup({ nombre_usuario, correo, password, rol, nombre_tienda }) {
  let data, error;
  try {
    ({ data, error } = await supabase.auth.signUp({ email: correo, password }));
  } catch {
    // El servicio de autenticación lanzó (red caída, servicio no disponible): se
    // devuelve un error controlado 503 en lugar de un 500 genérico con stack trace.
    const err = new Error(
      'El servicio de autenticación no está disponible. Intenta nuevamente en unos momentos.',
    );
    err.status = 503;
    throw err;
  }

  if (error) {
    // Rate limit de Supabase: se propaga como 429 con un mensaje claro en vez de un 400 ambiguo.
    if (error.status === 429 || /rate limit/i.test(error.message ?? '')) {
      const err = new Error('Se alcanzó el límite de registros. Intenta en unos minutos.');
      err.status = 429;
      throw err;
    }
    const err = new Error(error.message);
    err.status = 400;
    throw err;
  }

  let usuario;
  try {
    usuario = await Usuario.create({
      id: data.user.id,
      nombre_usuario,
      correo,
      rol,
    });

    switch (rol) {
      case 'jugador':
        await Jugador.create({ usuario_id: data.user.id });
        await Estadistica.create({
          usuario_id: data.user.id,
          partidas_ganadas: 0,
          partidas_perdidas: 0,
          partidas_empatadas: 0,
          torneos_participados: 0,
        });
        break;
      case 'organizador':
        await Organizador.create({ usuario_id: data.user.id });
        break;
      case 'tienda':
        await Tienda.create({ usuario_id: data.user.id, nombre_tienda: nombre_tienda ?? null });
        break;
    }
  } catch (dbError) {
    try {
      await supabase.auth.admin.deleteUser(data.user.id);
    } catch {
      // rollback best-effort: si falla el borrado en Supabase, igual propagamos el error original
    }

    if (dbError instanceof UniqueConstraintError) {
      const err = new Error('El correo ya está registrado');
      err.status = 409;
      throw err;
    }

    const err = new Error('Error al crear el perfil de usuario');
    err.status = 422;
    throw err;
  }

  return { usuario, access_token: data.session?.access_token ?? null };
}

export async function login({ correo, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: correo,
    password,
  });

  if (error) {
    const err = new Error('Usuario o contraseña incorrectos');
    err.status = 401;
    throw err;
  }

  return { access_token: data.session.access_token, usuario: data.user };
}

export async function eliminarCuenta(usuarioId) {
  await Usuario.update({ activo: false }, { where: { id: usuarioId } });
}

export async function logout() {
  await supabase.auth.signOut();
}
