import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Inscripcion = sequelize.define(
  'Inscripcion',
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
    usuario_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    mazo_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    fecha_inscripcion: {
      type: DataTypes.DATE,
    },
    confirmado: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: 'inscripciones',
    timestamps: false,
  }
);

export default Inscripcion;
