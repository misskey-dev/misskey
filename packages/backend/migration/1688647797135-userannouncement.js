/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class Userannouncement1688647797135 {
    name = 'Userannouncement1688647797135'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "announcement" ADD COLUMN "userId" character varying(32)`);
        await queryRunner.query(`ALTER TABLE "announcement" ADD COLUMN "closeDuration" integer NOT NULL DEFAULT 0`);
        await queryRunner.query(`CREATE INDEX "IDX_fd25dfe3da37df1715f11ba6ec" ON "announcement" ("userId") `);
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."IDX_fd25dfe3da37df1715f11ba6ec"`);
        await queryRunner.query(`ALTER TABLE "announcement" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "announcement" DROP COLUMN "closeDuration"`);
    }
}
