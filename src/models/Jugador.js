import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Jugador = sequelize.define(
  'Jugador',
  {
    usuario_id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
    },
    formato_preferido: {
      type: DataTypes.ENUM('COMMANDER', 'STANDARD', 'MODERN', 'PIONEER', 'LEGACY'),
      allowNull: true,
      validate: {
        isIn: [['COMMANDER', 'STANDARD', 'MODERN', 'PIONEER', 'LEGACY']],
      },
    },
  },
  {
    tableName: 'jugadores',
    timestamps: false,
  }
);

export default Jugador;
