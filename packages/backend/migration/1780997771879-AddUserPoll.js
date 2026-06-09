/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class AddUserPoll1780997771879 {
	name = 'AddUserPoll1780997771879';

	async up(queryRunner) {
		await queryRunner.query(`
			CREATE TABLE "user_poll" (
				"id" character varying(32) NOT NULL,
				"createdById" character varying(32) NOT NULL,
				"question" character varying(1024) NOT NULL,
				"choices" jsonb NOT NULL DEFAULT '[]',
				"isAnonymous" boolean NOT NULL DEFAULT false,
				"deadline" TIMESTAMP WITH TIME ZONE,
				"isActive" boolean NOT NULL DEFAULT true,
				CONSTRAINT "PK_user_poll" PRIMARY KEY ("id")
			)
		`);
		await queryRunner.query(`CREATE INDEX "IDX_user_poll_createdById" ON "user_poll" ("createdById")`);
		await queryRunner.query(`CREATE INDEX "IDX_user_poll_deadline" ON "user_poll" ("deadline")`);
		await queryRunner.query(`CREATE INDEX "IDX_user_poll_isActive" ON "user_poll" ("isActive")`);
		await queryRunner.query(`ALTER TABLE "user_poll" ADD CONSTRAINT "FK_user_poll_createdById" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE CASCADE`);

		await queryRunner.query(`
			CREATE TABLE "user_poll_vote" (
				"id" character varying(32) NOT NULL,
				"pollId" character varying(32) NOT NULL,
				"userId" character varying(32) NOT NULL,
				"choiceIndex" integer NOT NULL,
				CONSTRAINT "PK_user_poll_vote" PRIMARY KEY ("id")
			)
		`);
		await queryRunner.query(`CREATE UNIQUE INDEX "IDX_user_poll_vote_pollId_userId" ON "user_poll_vote" ("pollId", "userId")`);
		await queryRunner.query(`CREATE INDEX "IDX_user_poll_vote_pollId" ON "user_poll_vote" ("pollId")`);
		await queryRunner.query(`CREATE INDEX "IDX_user_poll_vote_userId" ON "user_poll_vote" ("userId")`);
		await queryRunner.query(`ALTER TABLE "user_poll_vote" ADD CONSTRAINT "FK_user_poll_vote_pollId" FOREIGN KEY ("pollId") REFERENCES "user_poll"("id") ON DELETE CASCADE`);
		await queryRunner.query(`ALTER TABLE "user_poll_vote" ADD CONSTRAINT "FK_user_poll_vote_userId" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE`);
	}

	async down(queryRunner) {
		await queryRunner.query(`ALTER TABLE "user_poll_vote" DROP CONSTRAINT "FK_user_poll_vote_userId"`);
		await queryRunner.query(`ALTER TABLE "user_poll_vote" DROP CONSTRAINT "FK_user_poll_vote_pollId"`);
		await queryRunner.query(`DROP INDEX "IDX_user_poll_vote_userId"`);
		await queryRunner.query(`DROP INDEX "IDX_user_poll_vote_pollId"`);
		await queryRunner.query(`DROP INDEX "IDX_user_poll_vote_pollId_userId"`);
		await queryRunner.query(`DROP TABLE "user_poll_vote"`);

		await queryRunner.query(`ALTER TABLE "user_poll" DROP CONSTRAINT "FK_user_poll_createdById"`);
		await queryRunner.query(`DROP INDEX "IDX_user_poll_isActive"`);
		await queryRunner.query(`DROP INDEX "IDX_user_poll_deadline"`);
		await queryRunner.query(`DROP INDEX "IDX_user_poll_createdById"`);
		await queryRunner.query(`DROP TABLE "user_poll"`);
	}
}
