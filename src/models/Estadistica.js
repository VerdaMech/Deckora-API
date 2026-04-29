import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Estadistica = sequelize.define('Estadistica', {
  usuario_id: {
    // PK y FK a jugadores.usuario_id — relación 1-1
    type: DataTypes.UUID,
    primaryKey: true,
  },
  partidas_ganadas: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  partidas_perdidas: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  partidas_empatadas: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  torneos_participados: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  ultima_actualizacion: {
    // Se actualiza al finalizar cada enfrentamiento (trigger o service)
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'estadisticas',
  timestamps: false,
});

export default Estadistica;
