/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class Policies1673783015567 {
    name = 'Policies1673783015567'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "role" RENAME COLUMN "options" TO "policies"`);
				await queryRunner.query(`ALTER TABLE "meta" RENAME COLUMN "defaultRoleOverride" TO "policies"`);
    }

    async down(queryRunner) {
				await queryRunner.query(`ALTER TABLE "meta" RENAME COLUMN "policies" TO "defaultRoleOverride"`);
        await queryRunner.query(`ALTER TABLE "role" RENAME COLUMN "policies" TO "options"`);
    }
}
