'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.dropTable('coleccion_cartas');
    await queryInterface.dropTable('colecciones');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.createTable('colecciones', {
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
      fecha_creacion: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('now()'),
      },
      activo: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
    });

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

    await queryInterface.addIndex('coleccion_cartas', ['coleccion_id', 'carta_id', 'es_foil'], {
      unique: true,
      name: 'idx_coleccion_cartas_unique',
    });
  },
};
