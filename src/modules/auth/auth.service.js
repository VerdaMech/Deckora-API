import { UniqueConstraintError } from 'sequelize';
import supabase from '../../config/supabase.js';
import { Usuario, Jugador, Organizador, Tienda, Estadistica } from '../../models/index.js';

export async function signup({ nombre_usuario, correo, password, rol }) {
  const { data, error } = await supabase.auth.signUp({ email: correo, password });

  if (error) {
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
        await Tienda.create({ usuario_id: data.user.id });
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
