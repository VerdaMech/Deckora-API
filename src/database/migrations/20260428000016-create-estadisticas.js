'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('estadisticas', {
      usuario_id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        references: {
          model: 'jugadores',
          key: 'usuario_id',
        },
        onDelete: 'CASCADE',
      },
      partidas_ganadas: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      partidas_perdidas: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      partidas_empatadas: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      torneos_participados: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      ultima_actualizacion: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('now()'),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('estadisticas');
  },
};
