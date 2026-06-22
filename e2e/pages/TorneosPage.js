/**
 * Page Object Model para la cartelera de torneos (/torneos) y
 * la página de detalle de torneo (/torneos/:id).
 */
export class TorneosPage {
  constructor(page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/torneos');
    await this.page.waitForLoadState('load');
  }

  async gotoDetalle(torneoId) {
    await this.page.goto(`/torneos/${torneoId}`);
    await this.page.waitForLoadState('load');
  }

  async gotoCrear() {
    await this.page.goto('/organizador/torneos/nuevo');
    await this.page.waitForLoadState('load');
  }

  async llenarFormularioCrear({ nombre, formato, fechaInicio, ubicacion }) {
    await this.page.getByLabel('Nombre').fill(nombre);
    await this.page.getByLabel('Formato').selectOption(formato);
    await this.page.locator('#ft-fecha-inicio').fill(fechaInicio);
    // Llenar ubicación por placeholder (el label puede no estar accesible con useId)
    const inputUbicacion = this.page.getByPlaceholder(/providencia|ubicaci/i);
    if (await inputUbicacion.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await inputUbicacion.fill(ubicacion);
      await this.page.keyboard.press('Escape');
    }
  }

  async submitCrear() {
    await this.page.getByRole('button', { name: /crear torneo|guardar/i }).click();
  }

  torneoPorNombre(nombre) {
    return this.page.getByText(nombre, { exact: false });
  }
}
