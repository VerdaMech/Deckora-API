'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('coleccion_cartas', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
      },
      coleccion_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'colecciones',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      carta_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'cartas',
          key: 'id',
        },
        // sin CASCADE — borrar una carta no debe borrar colecciones
      },
      cantidad: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
      },
      es_foil: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
    });

    // Índice único compuesto: misma carta foil y no-foil son filas distintas
    await queryInterface.addIndex('coleccion_cartas', ['coleccion_id', 'carta_id', 'es_foil'], {
      unique: true,
      name: 'idx_coleccion_cartas_unique',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('coleccion_cartas');
  },
};
