export function solicitudInscripcion({ nombreJugador, nombreTorneo, nombreMazo }) {
  return {
    subject: `Nueva solicitud de inscripción — ${nombreTorneo}`,
    html: `
      <p>El jugador <strong>${nombreJugador}</strong> ha solicitado inscribirse en el torneo <strong>${nombreTorneo}</strong>.</p>
      <p>Mazo inscrito: <strong>${nombreMazo}</strong></p>
      <p>Ingresa a la plataforma para aprobar o rechazar la solicitud.</p>
    `,
  };
}
