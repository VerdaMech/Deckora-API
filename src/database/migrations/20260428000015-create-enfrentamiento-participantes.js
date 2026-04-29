'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('enfrentamiento_participantes', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
      },
      enfrentamiento_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'enfrentamientos',
          key: 'id',
        },
        onDelete: 'CASCADE',
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
      puntos_obtenidos: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      resultado: {
        type: Sequelize.ENUM('ganador', 'perdedor', 'empate', 'pendiente'),
        allowNull: true,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('enfrentamiento_participantes');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_enfrentamiento_participantes_resultado";');
  },
};
