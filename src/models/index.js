import sequelize from '../config/db.js';

import Usuario from './Usuario.js';
import Jugador from './Jugador.js';
import Organizador from './Organizador.js';
import Tienda from './Tienda.js';
import Torneo from './Torneo.js';
import Inscripcion from './Inscripcion.js';
import SnapshotMazoInscripcion from './SnapshotMazoInscripcion.js';

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

// TODO: completar asociación SnapshotMazoInscripcion ↔ Carta cuando Persona B agregue Carta

export {
  sequelize,
  Usuario,
  Jugador,
  Organizador,
  Tienda,
  Torneo,
  Inscripcion,
  SnapshotMazoInscripcion,
};
