/*
 * SPDX-FileCopyrightText: hitalin
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class Power9999999999999 {
  name = 'Power9999999999999';

  async up(queryRunner) {
    await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "isLocked" SET DEFAULT true;`);
    await queryRunner.query(`ALTER TABLE "user_profile" ALTER COLUMN "followersVisibility" SET DEFAULT 'private';`);
    await queryRunner.query(`ALTER TABLE "user_profile" ALTER COLUMN "followingVisibility" SET DEFAULT 'private';`);
    await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "isExplorable" SET DEFAULT false;`);
    await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "hideOnlineStatus" SET DEFAULT true;`);
  }

  async down(queryRunner) {
    await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "isLocked" SET DEFAULT false;`);
    await queryRunner.query(`ALTER TABLE "user_profile" ALTER COLUMN "followersVisibility" SET DEFAULT 'public';`);
    await queryRunner.query(`ALTER TABLE "user_profile" ALTER COLUMN "followingVisibility" SET DEFAULT 'public';`);
    await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "isExplorable" SET DEFAULT NULL;`);
    await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "hideOnlineStatus" SET DEFAULT NULL;`);
  }
}
