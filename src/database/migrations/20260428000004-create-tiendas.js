'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tiendas', {
      usuario_id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        references: {
          model: 'usuarios',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      nombre_tienda: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      direccion: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      numero_telefono: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      horario_apertura: {
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
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('tiendas');
  },
};
