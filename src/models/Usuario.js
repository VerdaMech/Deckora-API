import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Usuario = sequelize.define(
  'Usuario',
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      // sin defaultValue — el UUID lo provee Supabase Auth
    },
    nombre_usuario: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    correo: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    rol: {
      type: DataTypes.ENUM('jugador', 'organizador', 'tienda'),
      allowNull: false,
      validate: {
        isIn: [['jugador', 'organizador', 'tienda']],
      },
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    created_at: {
      type: DataTypes.DATE,
    },
  },
  {
    tableName: 'usuarios',
    timestamps: false,
  }
);

export default Usuario;
