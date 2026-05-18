'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('tiendas', 'latitud', {
      type: Sequelize.FLOAT,
      allowNull: true,
    });
    await queryInterface.addColumn('tiendas', 'longitud', {
      type: Sequelize.FLOAT,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('tiendas', 'latitud');
    await queryInterface.removeColumn('tiendas', 'longitud');
  },
};
