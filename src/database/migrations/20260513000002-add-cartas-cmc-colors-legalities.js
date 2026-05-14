'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('cartas', 'cmc', {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('cartas', 'colors', {
      type: Sequelize.DataTypes.ARRAY(Sequelize.DataTypes.TEXT),
      allowNull: true,
    });
    await queryInterface.addColumn('cartas', 'legalities', {
      type: Sequelize.DataTypes.JSONB,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('cartas', 'cmc');
    await queryInterface.removeColumn('cartas', 'colors');
    await queryInterface.removeColumn('cartas', 'legalities');
  },
};
