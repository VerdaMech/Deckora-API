/**
 * Page Object Model para la página de registro (/registro).
 * El selector de rol usa botones con clase selector-rol__option.
 */
export class RegistroPage {
  constructor(page) {
    this.page = page;
    this.inputNombreUsuario = page.getByLabel('Nombre de usuario');
    this.inputCorreo = page.getByLabel('Correo');
    this.inputPassword = page.locator('input[type="password"]').first();
    this.inputConfirmarPassword = page.locator('input[type="password"]').nth(1);
    this.btnCrearCuenta = page.locator('button[type="submit"]');
  }

  async goto() {
    await this.page.goto('/registro');
    await this.btnCrearCuenta.waitFor({ state: 'visible', timeout: 10_000 });
  }

  async seleccionarRol(rol) {
    // Los botones de rol tienen clase selector-rol__option y contienen el texto del rol
    await this.page.locator('.selector-rol__option', { hasText: rol }).first().click();
  }

  async llenarFormulario({ nombre_usuario, correo, password, rol }) {
    if (rol) await this.seleccionarRol(rol);
    await this.inputNombreUsuario.fill(nombre_usuario);
    await this.inputCorreo.fill(correo);
    await this.inputPassword.fill(password);
    await this.inputConfirmarPassword.fill(password);
  }

  async submit() {
    await this.btnCrearCuenta.click();
  }
}
