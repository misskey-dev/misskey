/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class InstanceSilence1697247230117 {
    name = 'InstanceSilence1697247230117'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "silencedHosts" character varying(1024) array NOT NULL DEFAULT '{}'`);
    }

		async down(queryRunner) {
				await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "silencedHosts"`);
		}
}
