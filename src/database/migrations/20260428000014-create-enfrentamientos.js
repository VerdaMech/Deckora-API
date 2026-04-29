'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('enfrentamientos', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
      },
      ronda_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'rondas',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      numero_mesa: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      estado: {
        type: Sequelize.ENUM('pendiente', 'en_curso', 'finalizado'),
        defaultValue: 'pendiente',
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('enfrentamientos');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_enfrentamientos_estado";');
  },
};
