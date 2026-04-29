'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('jugadores', {
      usuario_id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        references: {
          model: 'usuarios',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      formato_preferido: {
        type: Sequelize.ENUM('COMMANDER', 'STANDARD', 'MODERN', 'PIONEER', 'LEGACY'),
        allowNull: true,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('jugadores');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_jugadores_formato_preferido";');
  },
};
