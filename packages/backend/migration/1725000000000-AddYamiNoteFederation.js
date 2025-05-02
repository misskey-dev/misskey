/*
 * SPDX-FileCopyrightText: hitalin
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class AddYamiNoteFederation1725000000000 {
  name = 'AddYamiNoteFederation1725000000000'

  async up(queryRunner) {
    await queryRunner.query(`ALTER TABLE "meta" ADD "yamiNoteFederationEnabled" boolean DEFAULT false NOT NULL`);
    await queryRunner.query(`ALTER TABLE "meta" ADD "yamiNoteFederationTrustedInstances" jsonb DEFAULT '[]' NOT NULL`);
  }

  async down(queryRunner) {
    await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "yamiNoteFederationTrustedInstances"`);
    await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "yamiNoteFederationEnabled"`);
  }
}
