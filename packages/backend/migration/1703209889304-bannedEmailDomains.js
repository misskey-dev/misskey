/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class bannedEmailDomains1703209889304 {
		constructor() {
				this.name = 'bannedEmailDomains1703209889304';
		}

		async up(queryRunner) {
				await queryRunner.query(`ALTER TABLE "meta" ADD "bannedEmailDomains" character varying(1024) array NOT NULL DEFAULT '{}'`);
		}

		async down(queryRunner) {
				await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "bannedEmailDomains"`);
		}
}
