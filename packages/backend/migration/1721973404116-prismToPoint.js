/*
 * SPDX-FileCopyrightText: syuilo and misskey-project , Type4ny-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class PrismToPoint1721973404116 {
	name = 'PrismToPoint1721973404116';

	async up(queryRunner) {
		await queryRunner.query(
			'ALTER TABLE "meta" ADD "pointName" character varying(1024)',
		);
	}

	async down(queryRunner) {
		await queryRunner.query('ALTER TABLE "meta" DROP COLUMN "pointName"');
	}
}
