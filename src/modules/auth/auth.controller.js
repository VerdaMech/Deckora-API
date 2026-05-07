import * as authService from './auth.service.js';
import { Usuario, Jugador, Organizador, Tienda } from '../../models/index.js';

export async function signup(req, res, next) {
  try {
    const resultado = await authService.signup(req.body);
    res.status(201).json(resultado);
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const resultado = await authService.login(req.body);
    res.status(200).json(resultado);
  } catch (err) {
    next(err);
  }
}

export async function me(req, res, next) {
  try {
    const { id, rol } = req.usuario;
    const modeloPerfil = { jugador: Jugador, organizador: Organizador, tienda: Tienda }[rol];

    const usuario = await Usuario.findByPk(id, {
      include: modeloPerfil ? [{ model: modeloPerfil }] : [],
    });

    const data = usuario.toJSON();
    const perfil = data.Jugador ?? data.Organizador ?? data.Tienda ?? null;
    delete data.Jugador;
    delete data.Organizador;
    delete data.Tienda;

    res.json({ ...data, perfil });
  } catch (err) {
    next(err);
  }
}

export async function logout(req, res, next) {
  try {
    await authService.logout();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
