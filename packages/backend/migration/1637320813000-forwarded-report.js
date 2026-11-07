/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class forwardedReport1637320813000 {
	name = 'forwardedReport1637320813000';

	async up(queryRunner) {
		await queryRunner.query(`ALTER TABLE "abuse_user_report" ADD "forwarded" boolean NOT NULL DEFAULT false`);
	}

	async down(queryRunner) {
		await queryRunner.query(`ALTER TABLE "abuse_user_report" DROP COLUMN "forwarded"`);
	}
};
