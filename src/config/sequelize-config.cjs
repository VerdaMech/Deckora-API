// Configuración de Sequelize CLI — CommonJS requerido por sequelize-cli
const env = process.env.NODE_ENV || 'development';
const envFile = env === 'testing' ? '.env.test' : `.env.${env}`;
require('dotenv').config({ path: envFile });

const sslOptions = {
  ssl: {
    require: true,
    rejectUnauthorized: false, // necesario para Supabase
  },
};

const base = {
  url: process.env.DATABASE_URL,
  dialect: 'postgres',
  dialectOptions: sslOptions,
};

module.exports = {
  development: base,
  testing: base,
  production: base,
};
