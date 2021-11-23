"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ModerationLog1562869971568 {
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "moderation_log" ("id" character varying(32) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, "userId" character varying(32) NOT NULL, "type" character varying(128) NOT NULL, "info" jsonb NOT NULL, CONSTRAINT "PK_d0adca6ecfd068db83e4526cc26" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_a08ad074601d204e0f69da9a95" ON "moderation_log" ("userId") `);
        await queryRunner.query(`ALTER TABLE "moderation_log" ADD CONSTRAINT "FK_a08ad074601d204e0f69da9a954" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "moderation_log" DROP CONSTRAINT "FK_a08ad074601d204e0f69da9a954"`);
        await queryRunner.query(`DROP INDEX "IDX_a08ad074601d204e0f69da9a95"`);
        await queryRunner.query(`DROP TABLE "moderation_log"`);
    }
}
exports.ModerationLog1562869971568 = ModerationLog1562869971568;
