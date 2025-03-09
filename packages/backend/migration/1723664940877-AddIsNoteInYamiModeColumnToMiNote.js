/*
 * SPDX-FileCopyrightText: hitalin
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class  AddIsNoteInYamiModeColumnToMiNote1723664940877 {
  name = 'AddIsNoteInYamiModeColumnToMiNote1723664940877'

  async up(queryRunner) {
    await queryRunner.query(`ALTER TABLE "note" ADD "isNoteInYamiMode" boolean NOT NULL DEFAULT false`);
  }

  async down(queryRunner) {
    await queryRunner.query(`ALTER TABLE "note" DROP COLUMN "isNoteInYamiMode"`);
  }
}
