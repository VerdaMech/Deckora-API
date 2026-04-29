'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('torneos', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
      },
      organizador_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'usuarios',
          key: 'id',
        },
        // sin CASCADE — no borrar torneos al eliminar el usuario organizador
      },
      nombre: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      formato: {
        type: Sequelize.ENUM('COMMANDER', 'STANDARD', 'MODERN', 'PIONEER', 'LEGACY'),
        allowNull: false,
      },
      estado: {
        type: Sequelize.ENUM('pendiente', 'en_curso', 'finalizado', 'cancelado'),
        defaultValue: 'pendiente',
      },
      fecha: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      ubicacion: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      latitud: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      longitud: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      cupo_maximo: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      precio: {
        type: Sequelize.FLOAT,
        defaultValue: 0,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('now()'),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('torneos');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_torneos_formato";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_torneos_estado";');
  },
};
