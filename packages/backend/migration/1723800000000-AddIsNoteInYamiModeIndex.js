/*
 * SPDX-FileCopyrightText: hitalin
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class AddIsNoteInYamiModeIndex17238800000000 {
  name = 'AddIsNoteInYamiModeIndex1723800000000'

  async up(queryRunner) {
    // カラムの存在を確認してからインデックスを作成
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_a7845b9f6c07a39ad85ae50388" ON "note" ("isNoteInYamiMode")`);
  }

  async down(queryRunner) {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_a7845b9f6c07a39ad85ae50388"`);
  }
}
