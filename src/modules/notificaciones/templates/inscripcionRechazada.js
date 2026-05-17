export function inscripcionRechazada({ nombreTorneo }) {
  return {
    subject: `Tu inscripción en ${nombreTorneo} fue rechazada`,
    html: `
      <p>Lamentamos informarte que tu inscripción en el torneo <strong>${nombreTorneo}</strong> ha sido <strong>rechazada</strong>.</p>
      <p>Si tienes dudas, contacta al organizador del torneo.</p>
    `,
  };
}
