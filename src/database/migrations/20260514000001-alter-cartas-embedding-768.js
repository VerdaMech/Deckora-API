'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE cartas DROP COLUMN IF EXISTS embedding;
      ALTER TABLE cartas ADD COLUMN embedding vector(768);
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE cartas DROP COLUMN IF EXISTS embedding;
      ALTER TABLE cartas ADD COLUMN embedding vector(1536);
    `);
  },
};
