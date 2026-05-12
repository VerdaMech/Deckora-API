import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Organizador = sequelize.define(
  'Organizador',
  {
    usuario_id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    sitio_web: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    redes_sociales: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    verificado: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: 'organizadores',
    timestamps: false,
  }
);

export default Organizador;
