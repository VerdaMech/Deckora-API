import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryTypes } from 'sequelize';

vi.mock('../../../src/models/index.js', () => ({
  sequelize: {
    query: vi.fn(),
  },
  Estadistica: {
    findOne: vi.fn(),
    findAll: vi.fn(),
  },
  Jugador: { name: 'Jugador' },
  Usuario: { name: 'Usuario' },
}));

const { sequelize, Estadistica, Jugador, Usuario } = await import('../../../src/models/index.js');
const repo = await import('../../../src/modules/estadisticas/estadisticas.repository.js');

describe('estadisticas.repository', () => {
  beforeEach(() => vi.clearAllMocks());

  // --- buscarPorJugador ---

  it('TC-REPO-EST-001: buscarPorJugador llama Estadistica.findOne con usuario_id', async () => {
    const stats = { usuario_id: 3, victorias: 10 };
    Estadistica.findOne.mockResolvedValue(stats);

    const result = await repo.buscarPorJugador(3);

    expect(Estadistica.findOne).toHaveBeenCalledWith({ where: { usuario_id: 3 } });
    expect(result).toEqual(stats);
  });

  // --- buscarPorJugadorPublico ---

  it('TC-REPO-EST-002: buscarPorJugadorPublico llama Estadistica.findOne con include Jugador > Usuario', async () => {
    const stats = { usuario_id: 3, victorias: 10, Jugador: { Usuario: { nombre_usuario: 'test' } } };
    Estadistica.findOne.mockResolvedValue(stats);

    const result = await repo.buscarPorJugadorPublico(3);

    expect(Estadistica.findOne).toHaveBeenCalledWith({
      where: { usuario_id: 3 },
      include: [
        {
          model: Jugador,
          include: [{ model: Usuario, attributes: ['nombre_usuario'] }],
        },
      ],
    });
    expect(result).toEqual(stats);
  });

  // --- buscarHistorialMeses ---

  it('TC-REPO-EST-003: buscarHistorialMeses llama sequelize.query con jugadorId y QueryTypes.SELECT', async () => {
    const meses = [{ mes: 'Jan', ganadas: 5, perdidas: 2 }];
    sequelize.query.mockResolvedValue(meses);

    const result = await repo.buscarHistorialMeses(3);

    expect(sequelize.query).toHaveBeenCalledWith(
      expect.stringContaining('DATE_TRUNC'),
      { replacements: { jugadorId: 3 }, type: QueryTypes.SELECT },
    );
    expect(result).toEqual(meses);
  });

  // --- buscarHistorialDias ---

  it('TC-REPO-EST-004: buscarHistorialDias llama sequelize.query con jugadorId, mesKey y QueryTypes.SELECT', async () => {
    const dias = [{ dia: '01', ganadas: 2, perdidas: 1 }];
    sequelize.query.mockResolvedValue(dias);

    const result = await repo.buscarHistorialDias(3, '2025-06');

    expect(sequelize.query).toHaveBeenCalledWith(
      expect.stringContaining('YYYY-MM'),
      { replacements: { jugadorId: 3, mesKey: '2025-06' }, type: QueryTypes.SELECT },
    );
    expect(result).toEqual(dias);
  });

  // --- buscarMazoMasJugado ---

  it('TC-REPO-EST-005: buscarMazoMasJugado llama sequelize.query con jugadorId', async () => {
    const mazo = [{ id: 1, nombre: 'Burn', veces: 8 }];
    sequelize.query.mockResolvedValue(mazo);

    const result = await repo.buscarMazoMasJugado(3);

    expect(sequelize.query).toHaveBeenCalledWith(
      expect.stringContaining('mazo_id'),
      { replacements: { jugadorId: 3 }, type: QueryTypes.SELECT },
    );
    expect(result).toEqual(mazo);
  });

  // --- obtenerRanking ---

  it('TC-REPO-EST-006: obtenerRanking llama Estadistica.findAll con include y limit 50', async () => {
    const ranking = [{ usuario_id: 1, victorias: 20 }];
    Estadistica.findAll.mockResolvedValue(ranking);

    const result = await repo.obtenerRanking();

    expect(Estadistica.findAll).toHaveBeenCalledWith({
      include: [
        {
          model: Jugador,
          include: [{ model: Usuario, attributes: ['nombre_usuario'] }],
        },
      ],
      limit: 50,
    });
    expect(result).toEqual(ranking);
  });
});
