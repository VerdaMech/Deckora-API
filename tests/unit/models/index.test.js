import { describe, it, expect, vi } from 'vitest';

/* ------------------------------------------------------------------ */
/*  Stubs creados en vi.hoisted para que estén disponibles en mocks    */
/*  Capturamos las llamadas de asociación manualmente porque           */
/*  clearMocks:true limpia vi.fn() antes de cada test.                 */
/* ------------------------------------------------------------------ */
const { stubs, fakeSequelize, calls } = vi.hoisted(() => {
  // Registro manual de llamadas a métodos de asociación
  const calls = {
    hasOne: [],
    belongsTo: [],
    hasMany: [],
    belongsToMany: [],
  };

  const makeModelStub = (name) => ({
    name,
    hasOne: (...args) => calls.hasOne.push({ caller: name, args }),
    belongsTo: (...args) => calls.belongsTo.push({ caller: name, args }),
    hasMany: (...args) => calls.hasMany.push({ caller: name, args }),
    belongsToMany: (...args) => calls.belongsToMany.push({ caller: name, args }),
    findAll: vi.fn(),
    findByPk: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
  });

  const stubs = {
    Usuario: makeModelStub('Usuario'),
    Jugador: makeModelStub('Jugador'),
    Organizador: makeModelStub('Organizador'),
    Tienda: makeModelStub('Tienda'),
    Torneo: makeModelStub('Torneo'),
    Inscripcion: makeModelStub('Inscripcion'),
    SnapshotMazoInscripcion: makeModelStub('SnapshotMazoInscripcion'),
    Ronda: makeModelStub('Ronda'),
    Enfrentamiento: makeModelStub('Enfrentamiento'),
    EnfrentamientoParticipante: makeModelStub('EnfrentamientoParticipante'),
    Carta: makeModelStub('Carta'),
    Mazo: makeModelStub('Mazo'),
    MazoCarta: makeModelStub('MazoCarta'),
    Estadistica: makeModelStub('Estadistica'),
  };

  const fakeSequelize = {
    define: vi.fn((name) => stubs[name] ?? makeModelStub(name)),
    transaction: vi.fn(),
  };

  return { stubs, fakeSequelize, calls };
});

/* ------------------------------------------------------------------ */
/*  Mocks                                                              */
/* ------------------------------------------------------------------ */
vi.mock('../../../src/config/db.js', () => ({ default: fakeSequelize }));

vi.mock('../../../src/models/Usuario.js', () => ({ default: stubs.Usuario }));
vi.mock('../../../src/models/Jugador.js', () => ({ default: stubs.Jugador }));
vi.mock('../../../src/models/Organizador.js', () => ({ default: stubs.Organizador }));
vi.mock('../../../src/models/Tienda.js', () => ({ default: stubs.Tienda }));
vi.mock('../../../src/models/Torneo.js', () => ({ default: stubs.Torneo }));
vi.mock('../../../src/models/Inscripcion.js', () => ({ default: stubs.Inscripcion }));
vi.mock('../../../src/models/SnapshotMazoInscripcion.js', () => ({ default: stubs.SnapshotMazoInscripcion }));
vi.mock('../../../src/models/Ronda.js', () => ({ default: stubs.Ronda }));
vi.mock('../../../src/models/Enfrentamiento.js', () => ({ default: stubs.Enfrentamiento }));
vi.mock('../../../src/models/EnfrentamientoParticipante.js', () => ({ default: stubs.EnfrentamientoParticipante }));
vi.mock('../../../src/models/Carta.js', () => ({ default: stubs.Carta }));
vi.mock('../../../src/models/Mazo.js', () => ({ default: stubs.Mazo }));
vi.mock('../../../src/models/MazoCarta.js', () => ({ default: stubs.MazoCarta }));
vi.mock('../../../src/models/Estadistica.js', () => ({ default: stubs.Estadistica }));

/* ------------------------------------------------------------------ */
/*  Import bajo test (después de los mocks)                            */
/* ------------------------------------------------------------------ */
const models = await import('../../../src/models/index.js');

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
const findCall = (type, callerName, targetStub, fkKey) =>
  calls[type].find(
    (c) =>
      c.caller === callerName &&
      c.args[0] === targetStub &&
      c.args[1]?.foreignKey === fkKey,
  );

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */
describe('models/index.js', () => {
  const expectedModelNames = [
    'Usuario',
    'Jugador',
    'Organizador',
    'Tienda',
    'Torneo',
    'Inscripcion',
    'SnapshotMazoInscripcion',
    'Ronda',
    'Enfrentamiento',
    'EnfrentamientoParticipante',
    'Carta',
    'Mazo',
    'MazoCarta',
    'Estadistica',
  ];

  it('exporta los 14 modelos esperados', () => {
    for (const name of expectedModelNames) {
      expect(models[name]).toBeDefined();
      expect(models[name]).toBe(stubs[name]);
    }
  });

  it('exporta la instancia de sequelize', () => {
    expect(models.sequelize).toBe(fakeSequelize);
  });

  it('configura asociaciones hasOne correctamente', () => {
    // Usuario -> Jugador, Organizador, Tienda
    expect(findCall('hasOne', 'Usuario', stubs.Jugador, 'usuario_id')).toBeTruthy();
    expect(findCall('hasOne', 'Usuario', stubs.Organizador, 'usuario_id')).toBeTruthy();
    expect(findCall('hasOne', 'Usuario', stubs.Tienda, 'usuario_id')).toBeTruthy();
    // Jugador -> Estadistica
    expect(findCall('hasOne', 'Jugador', stubs.Estadistica, 'usuario_id')).toBeTruthy();
  });

  it('configura asociaciones belongsTo correctamente', () => {
    // Perfiles -> Usuario
    expect(findCall('belongsTo', 'Jugador', stubs.Usuario, 'usuario_id')).toBeTruthy();
    expect(findCall('belongsTo', 'Organizador', stubs.Usuario, 'usuario_id')).toBeTruthy();
    expect(findCall('belongsTo', 'Tienda', stubs.Usuario, 'usuario_id')).toBeTruthy();
    // Torneo -> Usuario (organizador)
    expect(findCall('belongsTo', 'Torneo', stubs.Usuario, 'organizador_id')).toBeTruthy();
    // Inscripcion -> Torneo, Jugador, Mazo
    expect(findCall('belongsTo', 'Inscripcion', stubs.Torneo, 'torneo_id')).toBeTruthy();
    expect(findCall('belongsTo', 'Inscripcion', stubs.Jugador, 'usuario_id')).toBeTruthy();
    expect(findCall('belongsTo', 'Inscripcion', stubs.Mazo, 'mazo_id')).toBeTruthy();
    // Ronda -> Torneo
    expect(findCall('belongsTo', 'Ronda', stubs.Torneo, 'torneo_id')).toBeTruthy();
    // Enfrentamiento -> Ronda
    expect(findCall('belongsTo', 'Enfrentamiento', stubs.Ronda, 'ronda_id')).toBeTruthy();
    // EnfrentamientoParticipante -> Enfrentamiento, Inscripcion
    expect(findCall('belongsTo', 'EnfrentamientoParticipante', stubs.Enfrentamiento, 'enfrentamiento_id')).toBeTruthy();
    expect(findCall('belongsTo', 'EnfrentamientoParticipante', stubs.Inscripcion, 'inscripcion_id')).toBeTruthy();
    // SnapshotMazoInscripcion -> Inscripcion, Carta
    expect(findCall('belongsTo', 'SnapshotMazoInscripcion', stubs.Inscripcion, 'inscripcion_id')).toBeTruthy();
    expect(findCall('belongsTo', 'SnapshotMazoInscripcion', stubs.Carta, 'carta_id')).toBeTruthy();
    // MazoCarta -> Mazo, Carta
    expect(findCall('belongsTo', 'MazoCarta', stubs.Mazo, 'mazo_id')).toBeTruthy();
    expect(findCall('belongsTo', 'MazoCarta', stubs.Carta, 'carta_id')).toBeTruthy();
    // Mazo -> Jugador
    expect(findCall('belongsTo', 'Mazo', stubs.Jugador, 'usuario_id')).toBeTruthy();
    // Estadistica -> Jugador
    expect(findCall('belongsTo', 'Estadistica', stubs.Jugador, 'usuario_id')).toBeTruthy();
  });

  it('configura asociaciones hasMany correctamente', () => {
    // Usuario -> Torneo
    expect(findCall('hasMany', 'Usuario', stubs.Torneo, 'organizador_id')).toBeTruthy();
    // Torneo -> Inscripcion, Ronda
    expect(findCall('hasMany', 'Torneo', stubs.Inscripcion, 'torneo_id')).toBeTruthy();
    expect(findCall('hasMany', 'Torneo', stubs.Ronda, 'torneo_id')).toBeTruthy();
    // Jugador -> Inscripcion, Mazo
    expect(findCall('hasMany', 'Jugador', stubs.Inscripcion, 'usuario_id')).toBeTruthy();
    expect(findCall('hasMany', 'Jugador', stubs.Mazo, 'usuario_id')).toBeTruthy();
    // Ronda -> Enfrentamiento
    expect(findCall('hasMany', 'Ronda', stubs.Enfrentamiento, 'ronda_id')).toBeTruthy();
    // Enfrentamiento -> EnfrentamientoParticipante
    expect(findCall('hasMany', 'Enfrentamiento', stubs.EnfrentamientoParticipante, 'enfrentamiento_id')).toBeTruthy();
    // Inscripcion -> SnapshotMazoInscripcion, EnfrentamientoParticipante
    expect(findCall('hasMany', 'Inscripcion', stubs.SnapshotMazoInscripcion, 'inscripcion_id')).toBeTruthy();
    expect(findCall('hasMany', 'Inscripcion', stubs.EnfrentamientoParticipante, 'inscripcion_id')).toBeTruthy();
    // Mazo -> Inscripcion, MazoCarta
    expect(findCall('hasMany', 'Mazo', stubs.Inscripcion, 'mazo_id')).toBeTruthy();
    expect(findCall('hasMany', 'Mazo', stubs.MazoCarta, 'mazo_id')).toBeTruthy();
    // Carta -> SnapshotMazoInscripcion, MazoCarta
    expect(findCall('hasMany', 'Carta', stubs.SnapshotMazoInscripcion, 'carta_id')).toBeTruthy();
    expect(findCall('hasMany', 'Carta', stubs.MazoCarta, 'carta_id')).toBeTruthy();
  });
});
