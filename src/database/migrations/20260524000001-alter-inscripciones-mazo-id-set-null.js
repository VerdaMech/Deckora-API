'use strict';

/**
 * Cambia inscripciones.mazo_id de NOT NULL + RESTRICT a nullable + SET NULL.
 * El snapshot ya preserva el estado del mazo al momento de la inscripción,
 * por lo que el FK es solo una referencia opcional al mazo original.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Hacer la columna nullable
    await queryInterface.changeColumn('inscripciones', 'mazo_id', {
      type: Sequelize.UUID,
      allowNull: true,
    });

    // 2. Eliminar el constraint RESTRICT generado por la migración original
    await queryInterface.removeConstraint(
      'inscripciones',
      'inscripciones_mazo_id_fkey',
    );

    // 3. Agregar el constraint con SET NULL
    await queryInterface.addConstraint('inscripciones', {
      fields: ['mazo_id'],
      type: 'foreign key',
      name: 'inscripciones_mazo_id_fkey',
      references: { table: 'mazos', field: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint(
      'inscripciones',
      'inscripciones_mazo_id_fkey',
    );
    await queryInterface.addConstraint('inscripciones', {
      fields: ['mazo_id'],
      type: 'foreign key',
      name: 'inscripciones_mazo_id_fkey',
      references: { table: 'mazos', field: 'id' },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });
    await queryInterface.changeColumn('inscripciones', 'mazo_id', {
      type: Sequelize.UUID,
      allowNull: false,
    });
  },
};
