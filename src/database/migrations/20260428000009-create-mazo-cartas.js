'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('mazo_cartas', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
      },
      mazo_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'mazos',
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
        // sin CASCADE — borrar una carta no debe borrar mazos
      },
      cantidad: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
      },
      es_comandante: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
    });

    // Una carta no puede aparecer dos veces en el mismo mazo
    await queryInterface.addIndex('mazo_cartas', ['mazo_id', 'carta_id'], {
      unique: true,
      name: 'idx_mazo_cartas_unique',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('mazo_cartas');
  },
};
