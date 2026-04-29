import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const MazoCarta = sequelize.define('MazoCarta', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  mazo_id: {
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
  es_comandante: {
    // Solo aplica en formato Commander
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'mazo_cartas',
  timestamps: false,
  indexes: [
    {
      // Una carta no puede aparecer dos veces en el mismo mazo; para eso está cantidad
      unique: true,
      fields: ['mazo_id', 'carta_id'],
    },
  ],
});

export default MazoCarta;
