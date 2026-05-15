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
import Mazo from './Mazo.js';
import MazoCarta from './MazoCarta.js';
import Estadistica from './Estadistica.js';

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

Inscripcion.belongsTo(Mazo, { foreignKey: 'mazo_id' });
Mazo.hasMany(Inscripcion, { foreignKey: 'mazo_id' });
// TODO: completar asociación Inscripcion ↔ Mazo cuando Persona B agregue Mazo

// --- SnapshotMazoInscripcion ↔ Inscripcion ---

SnapshotMazoInscripcion.belongsTo(Inscripcion, { foreignKey: 'inscripcion_id' });
Inscripcion.hasMany(SnapshotMazoInscripcion, { foreignKey: 'inscripcion_id' });

SnapshotMazoInscripcion.belongsTo(Carta, { foreignKey: 'carta_id' });
Carta.hasMany(SnapshotMazoInscripcion, { foreignKey: 'carta_id' });
// TODO: completar asociación SnapshotMazoInscripcion ↔ Carta cuando Persona B agregue Carta

// --- Ronda ↔ Torneo ---

Ronda.belongsTo(Torneo, { foreignKey: 'torneo_id' });
Torneo.hasMany(Ronda, { foreignKey: 'torneo_id' });

// --- Enfrentamiento ↔ Ronda ---

Enfrentamiento.belongsTo(Ronda, { foreignKey: 'ronda_id' });
Ronda.hasMany(Enfrentamiento, { foreignKey: 'ronda_id', as: 'enfrentamientos' });

// --- EnfrentamientoParticipante ↔ Enfrentamiento / Inscripcion ---

EnfrentamientoParticipante.belongsTo(Enfrentamiento, { foreignKey: 'enfrentamiento_id' });
Enfrentamiento.hasMany(EnfrentamientoParticipante, { foreignKey: 'enfrentamiento_id', as: 'participantes' });

EnfrentamientoParticipante.belongsTo(Inscripcion, { foreignKey: 'inscripcion_id' });
Inscripcion.hasMany(EnfrentamientoParticipante, { foreignKey: 'inscripcion_id' });

// --- Mazo ↔ Jugador ---

Mazo.belongsTo(Jugador, { foreignKey: 'usuario_id' });
Jugador.hasMany(Mazo, { foreignKey: 'usuario_id' });

// --- Mazo ↔ MazoCarta ↔ Carta ---

Mazo.hasMany(MazoCarta, { foreignKey: 'mazo_id', as: 'MazoCartas' });
MazoCarta.belongsTo(Mazo, { foreignKey: 'mazo_id' });

MazoCarta.belongsTo(Carta, { foreignKey: 'carta_id', as: 'Carta' });
Carta.hasMany(MazoCarta, { foreignKey: 'carta_id', as: 'MazoCartas' });

// --- Estadistica ↔ Jugador (1-1) ---

Jugador.hasOne(Estadistica, { foreignKey: 'usuario_id' });
Estadistica.belongsTo(Jugador, { foreignKey: 'usuario_id' });

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
  Mazo,
  MazoCarta,
  Estadistica,
};
