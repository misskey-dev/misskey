/*
 * SPDX-FileCopyrightText: sakuhanight and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class MakeNotesHiddenBefore1729486255072 {
	name = 'AddBlockingReactionUser1731566099974'
	async up(queryRunner) {
		await queryRunner.query(`
			CREATE TABLE "blocking_reaction_user"(
				id        varchar(32) NULL,
				blockeeId varchar(32) NULL,
				blockerId varchar(32) NULL,
				CONSTRAINT "PK_blocking_reaction_user" PRIMARY KEY (id),
				CONSTRAINT "FK_blocking_reaction_user_blockeeid" FOREIGN KEY (blockeeid) REFERENCES "user" (id) ON DELETE CASCADE,
				CONSTRAINT "FK_blocking_reaction_user_blockerid" FOREIGN KEY (blockerid) REFERENCES "user" (id) ON DELETE CASCADE);
		`);
		await queryRunner.query(`CREATE INDEX "IDX_blocking_reaction_user_id" ON "blocking_reaction_user" (id);`);
		await queryRunner.query(`CREATE INDEX "IDX_blocking_reaction_user_blockeeid" ON "blocking_reaction_user" (blockeeid);`);
		await queryRunner.query(`CREATE INDEX "IDX_blocking_reaction_user_blockerid" ON "blocking_reaction_user" (blockerid);`);
		await queryRunner.query(`CREATE UNIQUE INDEX "IDX_blocking_reaction_user_blockeeid_blockerid" ON "blocking_reaction_user" (blockeeid, blockerid);`);
	}

	async down(queryRunner) {
		await queryRunner.query(`DROP INDEX "IDX_blocking_reaction_user_blockeeid_blockerid";`);
		await queryRunner.query(`DROP INDEX "IDX_blocking_reaction_user_blockerid";`);
		await queryRunner.query(`DROP INDEX "IDX_blocking_reaction_user_blockeeid";`);
		await queryRunner.query(`DROP INDEX "IDX_blocking_reaction_user_id";`);
		await queryRunner.query(`ALTER TABLE "blocking_reaction_user" DROP CONSTRAINT "FK_blocking_reaction_user_blockerid";`);
		await queryRunner.query(`ALTER TABLE "blocking_reaction_user" DROP CONSTRAINT "FK_blocking_reaction_user_blockeeid";`);
		await queryRunner.query(`ALTER TABLE "blocking_reaction_user" DROP CONSTRAINT "PK_blocking_reaction_user";`);
		await queryRunner.query(`DROP TABLE "blocking_reaction_user";`);
	}
}
