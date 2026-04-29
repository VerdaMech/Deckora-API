import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Mazo = sequelize.define('Mazo', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  usuario_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  formato: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['COMMANDER', 'STANDARD', 'MODERN', 'PIONEER', 'LEGACY']],
    },
  },
  descripcion: {
    type: DataTypes.TEXT,
  },
  publico: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  slug: {
    // Para URLs públicas tipo /m/sol-ring-edh
    type: DataTypes.STRING,
    unique: true,
  },
  actualizado_en: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  fecha_creacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'mazos',
  timestamps: false,
});

export default Mazo;
