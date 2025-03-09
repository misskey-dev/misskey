/*
 * SPDX-FileCopyrightText: hitalin
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class FeatHideProfileFile1710146785086 {
    name = 'FeatHideProfileFile1710146785086'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "hideProfileFiles" boolean NOT NULL DEFAULT true`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "hideProfileFiles"`);
    }
}
