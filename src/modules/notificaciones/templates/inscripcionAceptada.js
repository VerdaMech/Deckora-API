export function inscripcionAceptada({ nombreTorneo }) {
  return {
    subject: `Tu inscripción en ${nombreTorneo} fue aceptada`,
    html: `
      <p>¡Buenas noticias! Tu inscripción en el torneo <strong>${nombreTorneo}</strong> ha sido <strong>aprobada</strong>.</p>
      <p>Prepara tu mazo y hasta la próxima ronda.</p>
    `,
  };
}
