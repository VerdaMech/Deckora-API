import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/models/index.js', () => ({
  Organizador: {
    findOne: vi.fn(),
    update: vi.fn(),
  },
}));

const { Organizador } = await import('../../../src/models/index.js');
const repo = await import('../../../src/modules/organizadores/organizadores.repository.js');

describe('organizadores.repository', () => {
  beforeEach(() => vi.clearAllMocks());

  it('TC-REPO-ORG-001: buscarPorId llama Organizador.findOne con usuario_id', async () => {
    const organizador = { usuario_id: 7, descripcion: 'Org test' };
    Organizador.findOne.mockResolvedValue(organizador);

    const result = await repo.buscarPorId(7);

    expect(Organizador.findOne).toHaveBeenCalledWith({ where: { usuario_id: 7 } });
    expect(result).toEqual(organizador);
  });

  it('TC-REPO-ORG-002: buscarPorId retorna null si no existe', async () => {
    Organizador.findOne.mockResolvedValue(null);

    const result = await repo.buscarPorId(999);

    expect(Organizador.findOne).toHaveBeenCalledWith({ where: { usuario_id: 999 } });
    expect(result).toBeNull();
  });

  it('TC-REPO-ORG-003: actualizar llama Organizador.update con datos y where usuario_id', async () => {
    Organizador.update.mockResolvedValue([1]);
    const datos = { descripcion: 'Nueva descripcion' };

    const result = await repo.actualizar(7, datos);

    expect(Organizador.update).toHaveBeenCalledWith(datos, { where: { usuario_id: 7 } });
    expect(result).toEqual([1]);
  });

  it('TC-REPO-ORG-004: actualizar sin cambios retorna [0]', async () => {
    Organizador.update.mockResolvedValue([0]);

    const result = await repo.actualizar(7, {});

    expect(Organizador.update).toHaveBeenCalledWith({}, { where: { usuario_id: 7 } });
    expect(result).toEqual([0]);
  });
});
