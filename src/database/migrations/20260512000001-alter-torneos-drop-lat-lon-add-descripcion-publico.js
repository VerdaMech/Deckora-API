'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn('torneos', 'latitud');
    await queryInterface.removeColumn('torneos', 'longitud');
    await queryInterface.addColumn('torneos', 'descripcion', {
      type: Sequelize.STRING(2000),
      allowNull: true,
    });
    await queryInterface.addColumn('torneos', 'publico', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('torneos', 'descripcion');
    await queryInterface.removeColumn('torneos', 'publico');
    await queryInterface.addColumn('torneos', 'latitud', {
      type: Sequelize.FLOAT,
      allowNull: true,
    });
    await queryInterface.addColumn('torneos', 'longitud', {
      type: Sequelize.FLOAT,
      allowNull: true,
    });
  },
};
