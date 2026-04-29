import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const EnfrentamientoParticipante = sequelize.define(
  'EnfrentamientoParticipante',
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    enfrentamiento_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    inscripcion_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    puntos_obtenidos: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    resultado: {
      type: DataTypes.ENUM('ganador', 'perdedor', 'empate', 'pendiente'),
      allowNull: true,
      validate: {
        isIn: [['ganador', 'perdedor', 'empate', 'pendiente']],
      },
    },
  },
  {
    tableName: 'enfrentamiento_participantes',
    timestamps: false,
  }
);

export default EnfrentamientoParticipante;
