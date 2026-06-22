import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { JUGADOR_TEST, ORGANIZADOR_TEST } from '../fixtures/usuarios.fixture.js';
import {
  TOKEN_JUGADOR,
  TOKEN_ORGANIZADOR,
  configurarAuthMock,
  crearErrorConStatus,
} from '../helpers/api.helper.js';

// ═══════════════════════════════════════════════════════════════════════════
// OWASP A05:2025 — Inyección (SQLi + XSS)
//
// Objetivo: CONFIRMAR que la API rechaza o neutraliza payloads de inyección.
// Sequelize usa consultas parametrizadas por defecto y la validación con Zod
// acota los tipos de entrada, así que estos tests documentan y verifican que la
// mitigación existe — no buscan introducir un bug nuevo.
//
// Como las suites `*.api.test.js` mockean la capa de servicio, lo que se valida
// aquí es el comportamiento de la capa HTTP (validación, ruteo, manejo de error)
// y que los valores maliciosos viajan como DATOS (argumentos de servicio), nunca
// concatenados en SQL ni interpretados como HTML ejecutable.
// ═══════════════════════════════════════════════════════════════════════════

// ─── Mocks de módulos ─────────────────────────────────────────────────────────

vi.mock('../../src/config/supabase.js', () => ({
  default: { auth: { getUser: vi.fn() } },
}));

vi.mock('../../src/config/db.js', () => ({
  default: { transaction: vi.fn(), query: vi.fn() },
}));

vi.mock('../../src/modules/notificaciones/email.service.js', () => ({
  notificarSolicitudInscripcion: vi.fn(),
  notificarInscripcionAceptada: vi.fn(),
  notificarInscripcionRechazada: vi.fn(),
}));

vi.mock('../../src/models/index.js', () => ({
  default: {},
  Usuario: { findByPk: vi.fn() },
  Jugador: {},
  Organizador: {},
  Tienda: {},
  Mazo: {},
  MazoCarta: {},
  Carta: {},
  Torneo: {},
  Ronda: {},
  Enfrentamiento: {},
  EnfrentamientoParticipante: {},
  Inscripcion: {},
  Estadistica: {},
  SnapshotMazoInscripcion: {},
  sequelize: { transaction: vi.fn(), query: vi.fn() },
}));

vi.mock('../../src/modules/auth/auth.service.js', () => ({
  signup: vi.fn(),
  login: vi.fn(),
  eliminarCuenta: vi.fn(),
  logout: vi.fn(),
}));

vi.mock('../../src/modules/mazos/mazos.service.js', () => ({
  listar: vi.fn(),
  crear: vi.fn(),
  obtenerPorId: vi.fn(),
  actualizar: vi.fn(),
  eliminar: vi.fn(),
  agregarCarta: vi.fn(),
  actualizarCarta: vi.fn(),
  eliminarCarta: vi.fn(),
  validar: vi.fn(),
  importarLista: vi.fn(),
  autocompletar: vi.fn(),
  recomendarCartas: vi.fn(),
}));

vi.mock('../../src/modules/torneos/torneos.service.js', () => ({
  listar: vi.fn(),
  crear: vi.fn(),
  obtenerPorId: vi.fn(),
  actualizar: vi.fn(),
  cambiarEstado: vi.fn(),
  inscribir: vi.fn(),
  listarInscripciones: vi.fn(),
  obtenerTablaPosiciones: vi.fn(),
  misTorneos: vi.fn(),
  cancelarInscripcion: vi.fn(),
  listarPendientes: vi.fn(),
  aprobarInscripcion: vi.fn(),
  rechazarInscripcion: vi.fn(),
  obtenerSnapshotInscripcion: vi.fn(),
  cerrarTorneo: vi.fn(),
}));

vi.mock('../../src/modules/biblioteca/biblioteca.service.js', () => ({
  listarCartas: vi.fn(),
  listarSets: vi.fn(),
}));

// ─── Imports mockeados ────────────────────────────────────────────────────────

const { default: supabase } = await import('../../src/config/supabase.js');
const { Usuario } = await import('../../src/models/index.js');
const authService = await import('../../src/modules/auth/auth.service.js');
const mazosService = await import('../../src/modules/mazos/mazos.service.js');
const torneosService = await import('../../src/modules/torneos/torneos.service.js');
const bibliotecaService = await import('../../src/modules/biblioteca/biblioteca.service.js');
const { default: app } = await import('../../src/app.js');

beforeEach(() => {
  vi.clearAllMocks();
});

// ═══════════════════════════════════════════════════════════════════════════
// SQL Injection
// ═══════════════════════════════════════════════════════════════════════════

describe('A05 — SQL Injection', () => {
  it('TC-SEC-A05-001: nombre con "; DROP TABLE usuarios;-- en POST /api/mazos se trata como texto, no como SQL', async () => {
    configurarAuthMock(supabase, Usuario, JUGADOR_TEST);
    const payloadSqli = "'; DROP TABLE usuarios;--";
    mazosService.crear.mockResolvedValue({ id: 'mazo-1', nombre: payloadSqli });

    const res = await request(app)
      .post('/api/mazos')
      .set('Authorization', TOKEN_JUGADOR)
      .send({ nombre: payloadSqli, formato: 'STANDARD' });

    // Zod acepta cualquier string no vacío, así que devuelve 201 — pero el valor
    // llega al servicio como DATO (argumento), nunca interpolado en una query.
    expect(res.status).toBe(201);
    expect(mazosService.crear).toHaveBeenCalledWith(
      JUGADOR_TEST.id,
      expect.objectContaining({ nombre: payloadSqli }),
    );
    // El payload nunca debe provocar un error de base de datos (500).
    expect(res.status).not.toBe(500);
  });

  it("TC-SEC-A05-002: correo con ' OR '1'='1 en POST /api/auth/login devuelve 400 y no consulta credenciales", async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ correo: "' OR '1'='1", password: 'password123' });

    // loginSchema exige un email válido → Zod lo rechaza antes del controlador.
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Datos de entrada inválidos');
    // El servicio de autenticación nunca se invoca: no hay forma de filtrar datos
    // de otro usuario.
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('TC-SEC-A05-003: id con "1; DELETE FROM torneos" en GET /api/torneos/:id no ejecuta el DELETE', async () => {
    const payloadSqli = '1; DELETE FROM torneos';
    torneosService.obtenerPorId.mockRejectedValue(
      crearErrorConStatus('Torneo no encontrado', 404),
    );

    const res = await request(app).get(`/api/torneos/${encodeURIComponent(payloadSqli)}`);

    // El id viaja como parámetro opaco a repo.buscarPorId (findByPk, parametrizado).
    expect(res.status).toBe(404);
    expect(torneosService.obtenerPorId).toHaveBeenCalledWith(payloadSqli);
  });

  it("TC-SEC-A05-004: q con ' UNION SELECT * FROM usuarios-- en GET /api/biblioteca/cartas no filtra otras tablas", async () => {
    bibliotecaService.listarCartas.mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 50, total: 0, total_pages: 0 },
    });

    const res = await request(app)
      .get('/api/biblioteca/cartas')
      .query({ q: "' UNION SELECT * FROM usuarios--" });

    // `q` no es un parámetro reconocido por listarCartasSchema: Zod lo descarta.
    // El endpoint responde 200 con resultados normales, sin exponer otras tablas.
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(bibliotecaService.listarCartas).toHaveBeenCalledOnce();
  });

  it("TC-SEC-A05-005: formato malicioso en GET /api/biblioteca/cartas se rechaza por whitelist (protege el literal() SQL)", async () => {
    // biblioteca.service interpola `formato` dentro de un literal() de Sequelize
    // (legalities->>'<formato>'). La inyección se neutraliza porque el controlador
    // valida `formato` contra un enum cerrado antes de llegar al servicio.
    const res = await request(app)
      .get('/api/biblioteca/cartas')
      .query({ formato: "' OR 1=1--" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Datos de entrada inválidos');
    expect(bibliotecaService.listarCartas).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// XSS — la API almacena/devuelve contenido como texto plano (JSON), no como HTML
// ═══════════════════════════════════════════════════════════════════════════

describe('A05 — XSS (almacenamiento/devolución de scripts)', () => {
  it('TC-SEC-A05-006: <script> como nombre de mazo se conserva como texto, no como HTML ejecutable', async () => {
    configurarAuthMock(supabase, Usuario, JUGADOR_TEST);
    const payloadXss = "<script>alert('xss')</script>";
    mazosService.crear.mockResolvedValue({ id: 'mazo-1', nombre: payloadXss });
    mazosService.listar.mockResolvedValue([{ id: 'mazo-1', nombre: payloadXss }]);

    const resCrear = await request(app)
      .post('/api/mazos')
      .set('Authorization', TOKEN_JUGADOR)
      .send({ nombre: payloadXss, formato: 'STANDARD' });

    expect(resCrear.status).toBe(201);

    const resListar = await request(app)
      .get('/api/mazos')
      .set('Authorization', TOKEN_JUGADOR);

    // La respuesta es JSON (no text/html) y el valor se devuelve idéntico al de
    // entrada: la API lo trata como dato. El escape para render es responsabilidad
    // del frontend (cubierto por los tests de XSS de Deckora-Web).
    expect(resListar.status).toBe(200);
    expect(resListar.headers['content-type']).toMatch(/application\/json/);
    expect(resListar.body[0].nombre).toBe(payloadXss);
  });

  it('TC-SEC-A05-007: <img onerror=...> como descripción de torneo se conserva como texto plano', async () => {
    configurarAuthMock(supabase, Usuario, ORGANIZADOR_TEST);
    const payloadXss = '<img onerror=alert(1) src=x>';
    mazosService.crear.mockReset();
    torneosService.crear.mockResolvedValue({
      id: 'torneo-1',
      nombre: 'Torneo Test',
      descripcion: payloadXss,
    });

    const res = await request(app)
      .post('/api/torneos')
      .set('Authorization', TOKEN_ORGANIZADOR)
      .send({
        nombre: 'Torneo Test',
        fecha: '2099-12-31T00:00:00.000Z',
        formato: 'STANDARD',
        descripcion: payloadXss,
      });

    expect(res.status).toBe(201);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(torneosService.crear).toHaveBeenCalledWith(
      ORGANIZADOR_TEST.id,
      expect.objectContaining({ descripcion: payloadXss }),
    );
    expect(res.body.descripcion).toBe(payloadXss);
  });
});
