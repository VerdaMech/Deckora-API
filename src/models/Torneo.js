import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Torneo = sequelize.define(
  'Torneo',
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    organizador_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    formato: {
      type: DataTypes.ENUM('COMMANDER', 'STANDARD', 'MODERN', 'PIONEER', 'LEGACY'),
      allowNull: false,
      validate: {
        isIn: [['COMMANDER', 'STANDARD', 'MODERN', 'PIONEER', 'LEGACY']],
      },
    },
    estado: {
      type: DataTypes.ENUM('pendiente', 'en_curso', 'finalizado', 'cancelado'),
      defaultValue: 'pendiente',
      validate: {
        isIn: [['pendiente', 'en_curso', 'finalizado', 'cancelado']],
      },
    },
    fecha: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    ubicacion: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    descripcion: {
      type: DataTypes.STRING(2000),
      allowNull: true,
    },
    publico: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    cupo_maximo: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    precio: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    created_at: {
      type: DataTypes.DATE,
    },
  },
  {
    tableName: 'torneos',
    timestamps: false,
  }
);

export default Torneo;
