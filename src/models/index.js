import sequelize from '../config/db.js';

import Usuario from './Usuario.js';
import Jugador from './Jugador.js';
import Organizador from './Organizador.js';
import Tienda from './Tienda.js';
import Torneo from './Torneo.js';
import Inscripcion from './Inscripcion.js';
import SnapshotMazoInscripcion from './SnapshotMazoInscripcion.js';
import Ronda from './Ronda.js';
import Enfrentamiento from './Enfrentamiento.js';
import EnfrentamientoParticipante from './EnfrentamientoParticipante.js';
import Carta from './Carta.js';
import Coleccion from './Coleccion.js';
import ColeccionCarta from './ColeccionCarta.js';

// --- Usuario ↔ perfiles (1-1) ---

Usuario.hasOne(Jugador, { foreignKey: 'usuario_id', onDelete: 'CASCADE' });
Jugador.belongsTo(Usuario, { foreignKey: 'usuario_id' });

Usuario.hasOne(Organizador, { foreignKey: 'usuario_id', onDelete: 'CASCADE' });
Organizador.belongsTo(Usuario, { foreignKey: 'usuario_id' });

Usuario.hasOne(Tienda, { foreignKey: 'usuario_id', onDelete: 'CASCADE' });
Tienda.belongsTo(Usuario, { foreignKey: 'usuario_id' });

// --- Torneo ↔ Usuario (organizador) ---

Torneo.belongsTo(Usuario, { foreignKey: 'organizador_id', as: 'organizador' });
Usuario.hasMany(Torneo, { foreignKey: 'organizador_id', as: 'torneos_organizados' });

// --- Inscripcion ↔ Torneo / Jugador ---

Inscripcion.belongsTo(Torneo, { foreignKey: 'torneo_id' });
Torneo.hasMany(Inscripcion, { foreignKey: 'torneo_id' });

Inscripcion.belongsTo(Jugador, { foreignKey: 'usuario_id' });
Jugador.hasMany(Inscripcion, { foreignKey: 'usuario_id' });

// TODO: completar asociación Inscripcion ↔ Mazo cuando Persona B agregue Mazo

// --- SnapshotMazoInscripcion ↔ Inscripcion ---

SnapshotMazoInscripcion.belongsTo(Inscripcion, { foreignKey: 'inscripcion_id' });
Inscripcion.hasMany(SnapshotMazoInscripcion, { foreignKey: 'inscripcion_id' });

SnapshotMazoInscripcion.belongsTo(Carta, { foreignKey: 'carta_id' });
Carta.hasMany(SnapshotMazoInscripcion, { foreignKey: 'carta_id' });

// --- Ronda ↔ Torneo ---

Ronda.belongsTo(Torneo, { foreignKey: 'torneo_id' });
Torneo.hasMany(Ronda, { foreignKey: 'torneo_id' });

// --- Enfrentamiento ↔ Ronda ---

Enfrentamiento.belongsTo(Ronda, { foreignKey: 'ronda_id' });
Ronda.hasMany(Enfrentamiento, { foreignKey: 'ronda_id' });

// --- EnfrentamientoParticipante ↔ Enfrentamiento / Inscripcion ---

EnfrentamientoParticipante.belongsTo(Enfrentamiento, { foreignKey: 'enfrentamiento_id' });
Enfrentamiento.hasMany(EnfrentamientoParticipante, { foreignKey: 'enfrentamiento_id' });

EnfrentamientoParticipante.belongsTo(Inscripcion, { foreignKey: 'inscripcion_id' });
Inscripcion.hasMany(EnfrentamientoParticipante, { foreignKey: 'inscripcion_id' });

// --- Coleccion ↔ Jugador ---

Coleccion.belongsTo(Jugador, { foreignKey: 'usuario_id' });
Jugador.hasMany(Coleccion, { foreignKey: 'usuario_id' });

// --- Coleccion ↔ ColeccionCarta ↔ Carta ---

Coleccion.hasMany(ColeccionCarta, { foreignKey: 'coleccion_id' });
ColeccionCarta.belongsTo(Coleccion, { foreignKey: 'coleccion_id' });

ColeccionCarta.belongsTo(Carta, { foreignKey: 'carta_id' });
Carta.hasMany(ColeccionCarta, { foreignKey: 'carta_id' });

export {
  sequelize,
  Usuario,
  Jugador,
  Organizador,
  Tienda,
  Torneo,
  Inscripcion,
  SnapshotMazoInscripcion,
  Ronda,
  Enfrentamiento,
  EnfrentamientoParticipante,
  Carta,
  Coleccion,
  ColeccionCarta,
};
