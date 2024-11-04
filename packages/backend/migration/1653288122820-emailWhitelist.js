/*
 * SPDX-FileCopyrightText: lqvp
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class emailWhitelist1653288122820 {
	constructor() {
			this.name = 'emailWhitelist1653288122820';
	}

	async up(queryRunner) {
			await queryRunner.query(`ALTER TABLE "meta" ADD "emailWhitelist" boolean NOT NULL DEFAULT false`);
	}

	async down(queryRunner) {
			await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "emailWhitelist"`);
	}
}
