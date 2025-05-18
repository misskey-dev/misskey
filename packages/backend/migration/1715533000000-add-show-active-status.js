/*
 * SPDX-FileCopyrightText: hitalin
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class addActiveStatusVisibility1715533000000 {
  constructor() {
    this.name = 'addActiveStatusVisibility1715533000000';
  }

  async up(queryRunner) {
    // 古いカラムを削除（存在する場合）
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "showActiveStatus"`);
    // 新しいカラムを追加
    await queryRunner.query(`ALTER TABLE "user" ADD IF NOT EXISTS "activeStatusVisibility" jsonb NOT NULL DEFAULT '{"type":"mutualFollow"}'`);
  }

  async down(queryRunner) {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "activeStatusVisibility"`);
    await queryRunner.query(`ALTER TABLE "user" ADD IF NOT EXISTS "showActiveStatus" boolean NOT NULL DEFAULT false`);
  }
}
