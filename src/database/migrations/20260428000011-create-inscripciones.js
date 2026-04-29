'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('inscripciones', {
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
      usuario_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'jugadores',
          key: 'usuario_id',
        },
        onDelete: 'CASCADE',
      },
      mazo_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'mazos',
          key: 'id',
        },
        // RESTRICT implícito — no se puede borrar un mazo ya inscrito
      },
      fecha_inscripcion: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('now()'),
      },
      confirmado: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
    });

    // Un jugador no puede inscribirse dos veces al mismo torneo
    await queryInterface.addIndex('inscripciones', ['torneo_id', 'usuario_id'], {
      unique: true,
      name: 'idx_inscripciones_torneo_usuario',
    });

    // Un mazo no puede inscribirse dos veces al mismo torneo
    await queryInterface.addIndex('inscripciones', ['torneo_id', 'mazo_id'], {
      unique: true,
      name: 'idx_inscripciones_torneo_mazo',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('inscripciones');
  },
};
