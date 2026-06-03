/**
 * Page Object Model para la gestión de torneos (/organizador/torneos/:id/gestion).
 */
export class GestionTorneoPage {
  constructor(page) {
    this.page = page;
  }

  async goto(torneoId) {
    await this.page.goto(`/organizador/torneos/${torneoId}/gestion`);
    await this.page.waitForLoadState('networkidle');
  }

  // Botón "Publicar torneo" — aparece cuando el torneo está en PENDIENTE
  async publicarTorneo() {
    const btn = this.page.getByRole('button', { name: /publicar torneo/i });
    await btn.click();
  }

  // Botón "Finalizar torneo" — aparece cuando el torneo está EN_CURSO
  async finalizarTorneo() {
    const btn = this.page.getByRole('button', { name: /finalizar torneo/i });
    await btn.click();
  }

  // Botón "Aprobar" en BandejaInscripciones
  async aprobarPrimeraInscripcion() {
    const btn = this.page.getByRole('button', { name: /aprobar/i }).first();
    await btn.click();
  }

  estadoTorneo() {
    return this.page.getByText(/EN_CURSO|en curso/i, { exact: false });
  }
}
