/*
 * SPDX-FileCopyrightText: hitalin
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class addShowActicveStatus1715533000000 {
  constructor() {
    this.name = 'addShowActicveStatus1715533000000';
  }

  async up(queryRunner) {
    await queryRunner.query(`ALTER TABLE "user" ADD IF NOT EXISTS "showActiveStatus" boolean NOT NULL DEFAULT false`);
  }

  async down(queryRunner) {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "showActiveStatus"`);
  }
}
