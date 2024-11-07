/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class ClientSettingOverrides1730552981368 {
	name = 'ClientSettingOverrides1730552981368'

	async up(queryRunner) {
		await queryRunner.query(`ALTER TABLE "meta" ADD "defaultClientSettingOverrides" character varying(8192)`);
	}

	async down(queryRunner) {
		await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "defaultClientSettingOverrides"`);
	}
}
