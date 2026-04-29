import { validar as validarCommander } from './commander.strategy.js';
import { validar as validarStandard } from './standard.strategy.js';
import { validar as validarModern } from './modern.strategy.js';
import { validar as validarPioneer } from './pioneer.strategy.js';
import { validar as validarLegacy } from './legacy.strategy.js';

export const estrategias = {
  COMMANDER: validarCommander,
  STANDARD: validarStandard,
  MODERN: validarModern,
  PIONEER: validarPioneer,
  LEGACY: validarLegacy,
};