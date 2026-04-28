'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Habilitar pgvector antes de crear la tabla
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS vector;');

    await queryInterface.createTable('cartas', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
      },
      scryfall_id: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      nombre: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      tipo: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      resistencia: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      fuerza: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      texto: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      costo_mana: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      imagen_url: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      set_codigo: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      es_tierra_basica: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
    });

    // Agregar columna embedding con tipo vector(1536) de pgvector
    await queryInterface.sequelize.query(
      'ALTER TABLE cartas ADD COLUMN embedding vector(1536);'
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('cartas');
  },
};
