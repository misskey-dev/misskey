/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class IndexUserApproved1729528715258 {
	name = 'IndexUserApproved1729528715258';
	async up(queryRunner) {
		await queryRunner.query(`
            CREATE INDEX "IDX_USER_APPROVED" ON "user" ("approved")
        `);
	}

	async down(queryRunner) {
		await queryRunner.query(`
            DROP INDEX "public"."IDX_USER_APPROVED"
        `);
	}
}
