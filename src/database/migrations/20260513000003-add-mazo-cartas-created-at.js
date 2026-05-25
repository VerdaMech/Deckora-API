'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('mazo_cartas', 'created_at', {
      type: Sequelize.DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.literal('NOW()'),
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('mazo_cartas', 'created_at');
  },
};
