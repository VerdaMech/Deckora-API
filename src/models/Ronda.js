import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Ronda = sequelize.define(
  'Ronda',
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    torneo_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    numero_ronda: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    tipo_ronda: {
      type: DataTypes.ENUM('swiss', 'eliminacion_directa', 'final'),
      allowNull: true,
      validate: {
        isIn: [['swiss', 'eliminacion_directa', 'final']],
      },
    },
  },
  {
    tableName: 'rondas',
    timestamps: false,
  }
);

export default Ronda;
