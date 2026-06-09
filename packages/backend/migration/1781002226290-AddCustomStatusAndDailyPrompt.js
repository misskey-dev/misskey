/*
 * SPDX-FileCopyrightText: Rickskey Project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class AddCustomStatusAndDailyPrompt1781002226290 {
	name = 'AddCustomStatusAndDailyPrompt1781002226290';

	async up(queryRunner) {
		await queryRunner.query(`ALTER TABLE "user" ADD "statusEmoji" character varying(64)`);
		await queryRunner.query(`ALTER TABLE "user" ADD "statusText" character varying(150)`);
		await queryRunner.query(`ALTER TABLE "user" ADD "statusExpiresAt" TIMESTAMP WITH TIME ZONE`);
		await queryRunner.query(`ALTER TABLE "community_challenge" ADD "isDailyPrompt" boolean NOT NULL DEFAULT false`);
		await queryRunner.query(`CREATE INDEX "IDX_community_challenge_isDailyPrompt" ON "community_challenge" ("isDailyPrompt")`);
	}

	async down(queryRunner) {
		await queryRunner.query(`DROP INDEX "IDX_community_challenge_isDailyPrompt"`);
		await queryRunner.query(`ALTER TABLE "community_challenge" DROP COLUMN "isDailyPrompt"`);
		await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "statusExpiresAt"`);
		await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "statusText"`);
		await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "statusEmoji"`);
	}
}
