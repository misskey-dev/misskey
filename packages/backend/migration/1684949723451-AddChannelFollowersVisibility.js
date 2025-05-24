/*
 * SPDX-FileCopyrightText: hitalin and yamisskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class AddChannelFollowersVisibility1684949723451 {
  name = 'AddChannelFollowersVisibility1684949723451';

  async up(queryRunner) {
    await queryRunner.query(`ALTER TABLE "channel" ADD "followersVisibility" character varying(32) NOT NULL DEFAULT 'public'`);
  }

  async down(queryRunner) {
    await queryRunner.query(`ALTER TABLE "channel" DROP COLUMN "followersVisibility"`);
  }
}
