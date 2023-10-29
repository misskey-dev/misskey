/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class UserMemo1680702787050 {
    name = 'UserMemo1680702787050'

    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "user_memo" ("id" character varying(32) NOT NULL, "userId" character varying(32) NOT NULL, "targetUserId" character varying(32) NOT NULL, "memo" character varying(2048) NOT NULL, CONSTRAINT "PK_e9aaa58f7d3699a84d79078f4d9" PRIMARY KEY ("id")); COMMENT ON COLUMN "user_memo"."userId" IS 'The ID of author.'; COMMENT ON COLUMN "user_memo"."targetUserId" IS 'The ID of target user.'; COMMENT ON COLUMN "user_memo"."memo" IS 'Memo.'`);
        await queryRunner.query(`CREATE INDEX "IDX_650b49c5639b5840ee6a2b8f83" ON "user_memo" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_66ac4a82894297fd09ba61f3d3" ON "user_memo" ("targetUserId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_faef300913c738265638ba3ebc" ON "user_memo" ("userId", "targetUserId") `);
        await queryRunner.query(`ALTER TABLE "user_memo" ADD CONSTRAINT "FK_650b49c5639b5840ee6a2b8f83e" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_memo" ADD CONSTRAINT "FK_66ac4a82894297fd09ba61f3d35" FOREIGN KEY ("targetUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_memo" DROP CONSTRAINT "FK_66ac4a82894297fd09ba61f3d35"`);
        await queryRunner.query(`ALTER TABLE "user_memo" DROP CONSTRAINT "FK_650b49c5639b5840ee6a2b8f83e"`);
        await queryRunner.query(`DROP TABLE "user_memo"`);
    }
}
