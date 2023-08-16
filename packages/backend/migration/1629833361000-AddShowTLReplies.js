/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class addShowTLReplies1629833361000 {
	constructor() {
		this.name = 'addShowTLReplies1629833361000';
	}
	async up(queryRunner) {
		await queryRunner.query(`ALTER TABLE "user" ADD "showTimelineReplies" boolean NOT NULL DEFAULT false`);
		await queryRunner.query(`COMMENT ON COLUMN "user"."showTimelineReplies" IS 'Whether to show users replying to other users in the timeline.'`);
	}
	async down(queryRunner) {
		await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "showTimelineReplies"`);
	}
}
