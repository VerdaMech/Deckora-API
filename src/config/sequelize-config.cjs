// Configuración de Sequelize CLI — CommonJS requerido por sequelize-cli
const env = process.env.NODE_ENV || 'development';
const envFile = env === 'testing' ? '.env.test' : `.env.${env}`;
require('dotenv').config({ path: envFile });

const isLocalDb = (process.env.DATABASE_URL || '').includes('localhost');

const base = {
  url: process.env.DATABASE_URL,
  dialect: 'postgres',
  dialectOptions: isLocalDb ? {} : {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
};

module.exports = {
  development: base,
  testing: base,
  production: base,
};
