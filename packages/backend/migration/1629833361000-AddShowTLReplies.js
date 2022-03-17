

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
