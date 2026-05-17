import { Resend } from 'resend';
import { solicitudInscripcion } from './templates/solicitudInscripcion.js';
import { inscripcionAceptada } from './templates/inscripcionAceptada.js';
import { inscripcionRechazada } from './templates/inscripcionRechazada.js';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? 'onboarding@resend.dev';

function send({ to, subject, html }) {
  return resend.emails.send({ from: FROM, to, subject, html });
}

export function notificarSolicitudInscripcion({ correoOrganizador, nombreJugador, nombreTorneo, nombreMazo }) {
  const { subject, html } = solicitudInscripcion({ nombreJugador, nombreTorneo, nombreMazo });
  return send({ to: correoOrganizador, subject, html });
}

export function notificarInscripcionAceptada({ correoJugador, nombreTorneo }) {
  const { subject, html } = inscripcionAceptada({ nombreTorneo });
  return send({ to: correoJugador, subject, html });
}

export function notificarInscripcionRechazada({ correoJugador, nombreTorneo }) {
  const { subject, html } = inscripcionRechazada({ nombreTorneo });
  return send({ to: correoJugador, subject, html });
}
