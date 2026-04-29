import sequelize from '../config/db.js';

import Usuario from './Usuario.js';
import Jugador from './Jugador.js';
import Organizador from './Organizador.js';
import Tienda from './Tienda.js';

// --- Asociaciones Usuario ↔ perfiles (relaciones 1-1) ---

Usuario.hasOne(Jugador, { foreignKey: 'usuario_id', onDelete: 'CASCADE' });
Jugador.belongsTo(Usuario, { foreignKey: 'usuario_id' });

Usuario.hasOne(Organizador, { foreignKey: 'usuario_id', onDelete: 'CASCADE' });
Organizador.belongsTo(Usuario, { foreignKey: 'usuario_id' });

Usuario.hasOne(Tienda, { foreignKey: 'usuario_id', onDelete: 'CASCADE' });
Tienda.belongsTo(Usuario, { foreignKey: 'usuario_id' });

// TODO: completar asociaciones cuando Persona B agregue Carta, Coleccion, ColeccionCarta, Mazo, MazoCarta, Estadistica

export { sequelize, Usuario, Jugador, Organizador, Tienda };
