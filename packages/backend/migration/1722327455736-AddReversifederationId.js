/*
 * SPDX-FileCopyrightText: syuilo and misskey-project, noridev, cherrypick-project, kozakura, yojo-art team
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class AddReversifederationId1722327455736 {
	name = 'AddReversifederationId1722327455736'

	async up(queryRunner) {
			await queryRunner.query(`ALTER TABLE "reversi_game" ADD "federationId" varchar`);
	}
	async down(queryRunner) {
			await queryRunner.query(`ALTER TABLE "reversi_game" DROP COLUMN "federationId"`);
	}
}

