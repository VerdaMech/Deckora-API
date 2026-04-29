'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('snapshot_mazo_inscripcion', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
      },
      inscripcion_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'inscripciones',
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
        // sin CASCADE — borrar una carta no debe borrar snapshots históricos
      },
      cantidad: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      es_foil: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('snapshot_mazo_inscripcion');
  },
};
