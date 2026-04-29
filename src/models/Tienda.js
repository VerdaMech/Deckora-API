import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Tienda = sequelize.define(
  'Tienda',
  {
    usuario_id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
    },
    nombre_tienda: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    direccion: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    numero_telefono: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    horario_apertura: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    latitud: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    longitud: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
  },
  {
    tableName: 'tiendas',
    timestamps: false,
  }
);

export default Tienda;
