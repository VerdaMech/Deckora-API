'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('mazos', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
      },
      usuario_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'jugadores',
          key: 'usuario_id',
        },
        onDelete: 'CASCADE',
      },
      nombre: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      formato: {
        type: Sequelize.ENUM('COMMANDER', 'STANDARD', 'MODERN', 'PIONEER', 'LEGACY'),
        allowNull: false,
      },
      descripcion: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      publico: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      slug: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: true,
      },
      actualizado_en: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('now()'),
      },
      fecha_creacion: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('now()'),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('mazos');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_mazos_formato";');
  },
};
