import { vi } from 'vitest';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers para pruebas de integración de servicios.
//
// Estrategia (ver PLAN_TESTING.md §6.5, Opción C): se mockean los repositorios y
// la transacción de Sequelize. Ningún test toca la base de datos real, porque la
// instancia de dev/prod es compartida y la BD de testing aislada (decisión D1)
// aún está pendiente. Así se valida la lógica de negocio de los services de forma
// determinista y segura.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Transacción Sequelize simulada con commit/rollback espiables.
 */
export function crearTransaccionFake() {
  return {
    commit: vi.fn().mockResolvedValue(undefined),
    rollback: vi.fn().mockResolvedValue(undefined),
  };
}

/**
 * Convierte el array plano de cartas de un fixture (forma `{ nombre, tipo,
 * cantidad, es_tierra_basica, es_comandante }`) en la forma `MazoCartas` que
 * devuelve el repositorio real (`mc.Carta.*`, `mc.cantidad`, `mc.es_comandante`,
 * `mc.carta_id`), que es la que consumen los services.
 */
export function aMazoCartas(cartas = []) {
  return cartas.map((c, i) => ({
    carta_id: `carta-${i + 1}`,
    cantidad: c.cantidad,
    es_comandante: c.es_comandante ?? false,
    Carta: {
      nombre: c.nombre,
      tipo: c.tipo,
      costo_mana: c.costo_mana ?? null,
      es_tierra_basica: c.es_tierra_basica ?? false,
    },
  }));
}

/**
 * Torneo de prueba con valores por defecto coherentes. El organizador por
 * defecto coincide con ORGANIZADOR_TEST de las fixtures de usuarios.
 */
export function crearTorneoMock(overrides = {}) {
  return {
    id: 'torneo-1',
    nombre: 'Torneo de prueba',
    formato: 'STANDARD',
    estado: 'pendiente',
    organizador_id: 'test-org-uuid-0001',
    ...overrides,
  };
}
