/**
 * Page Object Model para la sección de mazos.
 * La creación de mazos usa la ruta /mazos/nuevo (no un modal desde /mazos).
 */
export class MazosPage {
  constructor(page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/mazos');
    await this.page.waitForLoadState('load');
  }

  async gotoCrear() {
    await this.page.goto('/mazos/nuevo');
    await this.page.waitForLoadState('load');
  }

  async llenarFormularioCrear({ nombre, formato }) {
    await this.page.getByLabel('Nombre').waitFor({ state: 'visible', timeout: 10_000 });
    await this.page.getByLabel('Nombre').fill(nombre);
    await this.page.getByLabel('Formato').selectOption(formato);
  }

  async submitCrear() {
    await this.page.getByRole('button', { name: 'Crear mazo' }).click();
  }

  mazoPorNombre(nombre) {
    return this.page.getByText(nombre, { exact: false });
  }
}
