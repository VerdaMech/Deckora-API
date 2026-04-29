import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const SnapshotMazoInscripcion = sequelize.define(
  'SnapshotMazoInscripcion',
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    inscripcion_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    carta_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    es_foil: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: 'snapshot_mazo_inscripcion',
    timestamps: false,
  }
);

export default SnapshotMazoInscripcion;
