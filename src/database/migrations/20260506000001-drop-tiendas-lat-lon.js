'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.removeColumn('tiendas', 'latitud');
    await queryInterface.removeColumn('tiendas', 'longitud');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('tiendas', 'latitud', {
      type: Sequelize.FLOAT,
      allowNull: true,
    });
    await queryInterface.addColumn('tiendas', 'longitud', {
      type: Sequelize.FLOAT,
      allowNull: true,
    });
  },
};
