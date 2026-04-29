import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Enfrentamiento = sequelize.define(
  'Enfrentamiento',
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    ronda_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    numero_mesa: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    estado: {
      type: DataTypes.ENUM('pendiente', 'en_curso', 'finalizado'),
      defaultValue: 'pendiente',
      validate: {
        isIn: [['pendiente', 'en_curso', 'finalizado']],
      },
    },
  },
  {
    tableName: 'enfrentamientos',
    timestamps: false,
  }
);

export default Enfrentamiento;
