import { Sequelize } from 'sequelize';

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false, // necesario para Supabase
    },
  },
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
});

export default sequelize;
