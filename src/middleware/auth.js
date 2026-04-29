import supabase from '../config/supabase.js';
import { Usuario } from '../models/index.js';

export default async function auth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no provisto' });
  }

  const token = authHeader.slice(7);

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return res.status(401).json({ error: 'Token inválido' });
  }

  const usuario = await Usuario.findByPk(data.user.id);
  if (!usuario) {
    return res.status(401).json({
      error: 'Usuario autenticado pero no registrado en el sistema',
    });
  }

  req.usuarioAuth = data.user;
  req.usuario = usuario;
  next();
}
