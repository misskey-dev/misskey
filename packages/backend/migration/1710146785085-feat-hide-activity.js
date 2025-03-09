/*
 * SPDX-FileCopyrightText: hitalin
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class FeatHideActivity1710146785085 {
    name = 'FeatHideActivity1710146785085'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "hideActivity" boolean NOT NULL DEFAULT true`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "hideActivity"`);
    }
}
