/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class refineAbuseUserReport1603094348345 {
    constructor() {
        this.name = 'refineAbuseUserReport1603094348345';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "abuse_user_report" DROP CONSTRAINT "FK_d049123c413e68ca52abe734203"`);
        await queryRunner.query(`DROP INDEX "IDX_d049123c413e68ca52abe73420"`);
        await queryRunner.query(`DROP INDEX "IDX_5cd442c3b2e74fdd99dae20243"`);
        await queryRunner.query(`ALTER TABLE "abuse_user_report" RENAME COLUMN "userId" TO "targetUserId"`);
        await queryRunner.query(`ALTER TABLE "abuse_user_report" ADD "assigneeId" character varying(32)`);
        await queryRunner.query(`ALTER TABLE "abuse_user_report" ADD "resolved" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "abuse_user_report" DROP COLUMN "comment"`);
        await queryRunner.query(`ALTER TABLE "abuse_user_report" ADD "comment" character varying(2048) NOT NULL DEFAULT '{}'::varchar[]`);
        await queryRunner.query(`CREATE INDEX "IDX_2b15aaf4a0dc5be3499af7ab6a" ON "abuse_user_report" ("resolved") `);
        await queryRunner.query(`ALTER TABLE "abuse_user_report" ADD CONSTRAINT "FK_08b883dd5fdd6f9c4c1572b36de" FOREIGN KEY ("assigneeId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "abuse_user_report" DROP CONSTRAINT "FK_08b883dd5fdd6f9c4c1572b36de"`);
        await queryRunner.query(`DROP INDEX "IDX_2b15aaf4a0dc5be3499af7ab6a"`);
        await queryRunner.query(`ALTER TABLE "abuse_user_report" DROP COLUMN "comment"`);
        await queryRunner.query(`ALTER TABLE "abuse_user_report" ADD "comment" character varying(512) NOT NULL DEFAULT '{}'::varchar[]`);
        await queryRunner.query(`ALTER TABLE "abuse_user_report" DROP COLUMN "resolved"`);
        await queryRunner.query(`ALTER TABLE "abuse_user_report" DROP COLUMN "assigneeId"`);
        await queryRunner.query(`ALTER TABLE "abuse_user_report" RENAME COLUMN "targetUserId" TO "userId"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_5cd442c3b2e74fdd99dae20243" ON "abuse_user_report" ("userId", "reporterId") `);
        await queryRunner.query(`CREATE INDEX "IDX_d049123c413e68ca52abe73420" ON "abuse_user_report" ("userId") `);
        await queryRunner.query(`ALTER TABLE "abuse_user_report" ADD CONSTRAINT "FK_d049123c413e68ca52abe734203" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }
}
