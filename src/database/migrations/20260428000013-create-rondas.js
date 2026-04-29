'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('rondas', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
      },
      torneo_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'torneos',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      numero_ronda: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      tipo_ronda: {
        type: Sequelize.ENUM('swiss', 'eliminacion_directa', 'final'),
        allowNull: true,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('rondas');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_rondas_tipo_ronda";');
  },
};
