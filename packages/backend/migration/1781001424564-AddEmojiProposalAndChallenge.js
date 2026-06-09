/*
 * SPDX-FileCopyrightText: Rickskey Project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class AddEmojiProposalAndChallenge1781001424564 {
	name = 'AddEmojiProposalAndChallenge1781001424564';

	async up(queryRunner) {
		// emoji_proposal テーブル
		await queryRunner.query(`
			CREATE TABLE "emoji_proposal" (
				"id" character varying(32) NOT NULL,
				"proposedById" character varying(32) NOT NULL,
				"name" character varying(64) NOT NULL,
				"imageUrl" character varying(512) NOT NULL,
				"category" character varying(512),
				"description" character varying(1024),
				"status" character varying(32) NOT NULL DEFAULT 'pending',
				"voteCount" integer NOT NULL DEFAULT 0,
				CONSTRAINT "PK_emoji_proposal" PRIMARY KEY ("id")
			)
		`);
		await queryRunner.query(`CREATE INDEX "IDX_emoji_proposal_proposedById" ON "emoji_proposal" ("proposedById")`);
		await queryRunner.query(`CREATE INDEX "IDX_emoji_proposal_status" ON "emoji_proposal" ("status")`);
		await queryRunner.query(`
			ALTER TABLE "emoji_proposal"
				ADD CONSTRAINT "FK_emoji_proposal_proposedById"
				FOREIGN KEY ("proposedById") REFERENCES "user"("id") ON DELETE CASCADE
		`);

		// emoji_proposal_vote テーブル
		await queryRunner.query(`
			CREATE TABLE "emoji_proposal_vote" (
				"id" character varying(32) NOT NULL,
				"proposalId" character varying(32) NOT NULL,
				"userId" character varying(32) NOT NULL,
				CONSTRAINT "PK_emoji_proposal_vote" PRIMARY KEY ("id")
			)
		`);
		await queryRunner.query(`CREATE UNIQUE INDEX "IDX_emoji_proposal_vote_proposal_user" ON "emoji_proposal_vote" ("proposalId", "userId")`);
		await queryRunner.query(`CREATE INDEX "IDX_emoji_proposal_vote_proposalId" ON "emoji_proposal_vote" ("proposalId")`);
		await queryRunner.query(`CREATE INDEX "IDX_emoji_proposal_vote_userId" ON "emoji_proposal_vote" ("userId")`);
		await queryRunner.query(`
			ALTER TABLE "emoji_proposal_vote"
				ADD CONSTRAINT "FK_emoji_proposal_vote_proposalId"
				FOREIGN KEY ("proposalId") REFERENCES "emoji_proposal"("id") ON DELETE CASCADE
		`);
		await queryRunner.query(`
			ALTER TABLE "emoji_proposal_vote"
				ADD CONSTRAINT "FK_emoji_proposal_vote_userId"
				FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE
		`);

		// community_challenge テーブル
		await queryRunner.query(`
			CREATE TABLE "community_challenge" (
				"id" character varying(32) NOT NULL,
				"createdById" character varying(32) NOT NULL,
				"title" character varying(256) NOT NULL,
				"description" character varying(2048),
				"hashtag" character varying(128) NOT NULL,
				"deadline" TIMESTAMP WITH TIME ZONE,
				"isActive" boolean NOT NULL DEFAULT true,
				CONSTRAINT "PK_community_challenge" PRIMARY KEY ("id")
			)
		`);
		await queryRunner.query(`CREATE INDEX "IDX_community_challenge_createdById" ON "community_challenge" ("createdById")`);
		await queryRunner.query(`CREATE INDEX "IDX_community_challenge_hashtag" ON "community_challenge" ("hashtag")`);
		await queryRunner.query(`CREATE INDEX "IDX_community_challenge_deadline" ON "community_challenge" ("deadline")`);
		await queryRunner.query(`CREATE INDEX "IDX_community_challenge_isActive" ON "community_challenge" ("isActive")`);
		await queryRunner.query(`
			ALTER TABLE "community_challenge"
				ADD CONSTRAINT "FK_community_challenge_createdById"
				FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE CASCADE
		`);
	}

	async down(queryRunner) {
		await queryRunner.query(`ALTER TABLE "community_challenge" DROP CONSTRAINT "FK_community_challenge_createdById"`);
		await queryRunner.query(`DROP TABLE "community_challenge"`);

		await queryRunner.query(`ALTER TABLE "emoji_proposal_vote" DROP CONSTRAINT "FK_emoji_proposal_vote_userId"`);
		await queryRunner.query(`ALTER TABLE "emoji_proposal_vote" DROP CONSTRAINT "FK_emoji_proposal_vote_proposalId"`);
		await queryRunner.query(`DROP TABLE "emoji_proposal_vote"`);

		await queryRunner.query(`ALTER TABLE "emoji_proposal" DROP CONSTRAINT "FK_emoji_proposal_proposedById"`);
		await queryRunner.query(`DROP TABLE "emoji_proposal"`);
	}
}
