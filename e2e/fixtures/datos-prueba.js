// ─── Usuarios de prueba ───────────────────────────────────────────────────────

export const JUGADOR_E2E = {
  id: 'test-jugador-e2e-0001',
  nombre_usuario: 'jugador_e2e',
  correo: 'jugador@e2e.local',
  rol: 'jugador',
  activo: true,
  perfil: { puntos_totales: 0 },
};

export const ORGANIZADOR_E2E = {
  id: 'test-org-e2e-0001',
  nombre_usuario: 'org_e2e',
  correo: 'org@e2e.local',
  rol: 'organizador',
  activo: true,
  perfil: {},
};

// ─── Datos de formularios ─────────────────────────────────────────────────────

export const CREDENCIALES_JUGADOR = {
  correo: 'jugador@e2e.local',
  password: 'password123',
};

export const DATOS_REGISTRO_JUGADOR = {
  nombre_usuario: 'jugador_e2e',
  correo: 'jugador@e2e.local',
  password: 'password123',
  rol: 'Jugador',
};

// ─── Mazo de prueba ───────────────────────────────────────────────────────────

export const MAZO_E2E = {
  id: 'mazo-e2e-0001',
  nombre: 'Mazo Commander E2E',
  formato: 'COMMANDER',
  usuario_id: JUGADOR_E2E.id,
  publico: false,
  descripcion: '',
};

// ─── Torneo de prueba ─────────────────────────────────────────────────────────

export const TORNEO_E2E = {
  id: 'torneo-e2e-0001',
  nombre: 'Torneo E2E Test',
  formato: 'COMMANDER',
  estado: 'pendiente',
  organizador_id: ORGANIZADOR_E2E.id,
  fecha_inicio: '2027-01-15T10:00:00.000Z',
  ubicacion: 'Santiago, Chile',
  latitud: -33.4,
  longitud: -70.6,
  cupo_maximo: null,
  precio_inscripcion: 0,
  publico: true,
};

export const TORNEO_EN_CURSO_E2E = {
  ...TORNEO_E2E,
  estado: 'en_curso',
};

// ─── Inscripción de prueba ────────────────────────────────────────────────────

export const INSCRIPCION_E2E = {
  id: 'inscripcion-e2e-0001',
  torneo_id: TORNEO_E2E.id,
  jugador_id: JUGADOR_E2E.id,
  mazo_id: MAZO_E2E.id,
  estado: 'PENDIENTE',
};

export const INSCRIPCION_APROBADA_E2E = {
  ...INSCRIPCION_E2E,
  estado: 'CONFIRMADA',
};
