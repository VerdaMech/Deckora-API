import * as authService from './auth.service.js';

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

export async function me(req, res) {
  res.json(req.usuario);
}

export async function logout(req, res, next) {
  try {
    await authService.logout();
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
