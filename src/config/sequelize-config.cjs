// Configuración de Sequelize CLI — CommonJS requerido por sequelize-cli
require('dotenv').config();

const sslOptions = {
  ssl: {
    require: true,
    rejectUnauthorized: false, // necesario para Supabase
  },
};

module.exports = {
  development: {
    url: process.env.DATABASE_URL,
    dialect: 'postgres',
    dialectOptions: sslOptions,
  },
  production: {
    url: process.env.DATABASE_URL,
    dialect: 'postgres',
    dialectOptions: sslOptions,
  },
};
