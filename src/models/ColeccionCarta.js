import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const ColeccionCarta = sequelize.define('ColeccionCarta', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  coleccion_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  carta_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  cantidad: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
  es_foil: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'coleccion_cartas',
  timestamps: false,
  indexes: [
    {
      // Misma carta foil y no-foil son filas distintas, pero no se duplican
      unique: true,
      fields: ['coleccion_id', 'carta_id', 'es_foil'],
    },
  ],
});

export default ColeccionCarta;
