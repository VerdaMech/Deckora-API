'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.addIndex('cartas', ['set_codigo'], {
      name: 'idx_cartas_set_codigo',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('cartas', 'idx_cartas_set_codigo');
  },
};
