/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class SingleUserMode1746422049376 {
    name = 'SingleUserMode1746422049376'

    async up(queryRunner) {
			await queryRunner.query(`ALTER TABLE "meta" ADD "singleUserMode" boolean NOT NULL DEFAULT false`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "singleUserMode"`);
    }
}
