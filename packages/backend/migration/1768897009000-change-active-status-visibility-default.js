/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class ChangeActiveStatusVisibilityDefault1768897009000 {
  name = 'ChangeActiveStatusVisibilityDefault1768897009000'

  async up(queryRunner) {
    // デフォルト値をmutualFollowからneverに変更
    await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "activeStatusVisibility" SET DEFAULT '{"type":"never"}'`);
  }

  async down(queryRunner) {
    // ロールバック: デフォルト値をmutualFollowに戻す
    await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "activeStatusVisibility" SET DEFAULT '{"type":"mutualFollow"}'`);
  }
}
