import { Sequelize } from 'sequelize';

const isLocalDb = (process.env.DATABASE_URL || '').includes('localhost');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: isLocalDb ? {} : {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
});

export default sequelize;
