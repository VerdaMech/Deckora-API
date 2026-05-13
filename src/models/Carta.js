import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Carta = sequelize.define('Carta', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  scryfall_id: {
    // UUID de Scryfall para sincronización y deduplicación
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  tipo: {
    type: DataTypes.STRING,
  },
  resistencia: {
    type: DataTypes.STRING,
  },
  fuerza: {
    type: DataTypes.STRING,
  },
  texto: {
    type: DataTypes.TEXT,
  },
  costo_mana: {
    type: DataTypes.STRING,
  },
  imagen_url: {
    // URL de Scryfall, nunca imagen local
    type: DataTypes.STRING,
  },
  set_codigo: {
    type: DataTypes.STRING,
  },
  set_nombre: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  set_fecha_lanzamiento: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  numero_colector: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  es_tierra_basica: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  embedding: {
    // La columna existe en la BD como vector(1536); Sequelize no tiene tipo nativo para pgvector
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'cartas',
  timestamps: false,
});

export default Carta;
