/**
 * Page Object Model para la página de login (/login).
 * El formulario usa labels asociados con React useId() — selectores por rol/label.
 */
export class LoginPage {
  constructor(page) {
    this.page = page;
    this.inputCorreo = page.getByLabel('Correo');
    this.inputPassword = page.locator('input[type="password"]');
    this.btnIniciar = page.locator('button[type="submit"]');
    this.alertError = page.getByRole('alert');
  }

  async goto() {
    await this.page.goto('/login');
    await this.inputCorreo.waitFor({ state: 'visible', timeout: 10_000 });
  }

  async llenarFormulario(correo, password) {
    await this.inputCorreo.fill(correo);
    await this.inputPassword.fill(password);
  }

  async submit() {
    await this.btnIniciar.click();
  }

  async login(correo, password) {
    await this.llenarFormulario(correo, password);
    await this.submit();
  }
}
