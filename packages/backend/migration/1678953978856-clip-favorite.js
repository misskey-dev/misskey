/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class clipFavorite1678953978856 {
    name = 'clipFavorite1678953978856'

    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "clip_favorite" ("id" character varying(32) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, "userId" character varying(32) NOT NULL, "clipId" character varying(32) NOT NULL, CONSTRAINT "PK_1b539f43906f05ebcabe752a977" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_25a31662b0b0cc9af6549a9d71" ON "clip_favorite" ("userId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_b1754a39d0b281e07ed7c078ec" ON "clip_favorite" ("userId", "clipId") `);
        await queryRunner.query(`ALTER TABLE "clip" ADD "lastClippedAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`CREATE INDEX "IDX_a3eac04ae2aa9e221e7596114a" ON "clip" ("lastClippedAt") `);
        await queryRunner.query(`ALTER TABLE "clip_favorite" ADD CONSTRAINT "FK_25a31662b0b0cc9af6549a9d711" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "clip_favorite" ADD CONSTRAINT "FK_fce61c7986cee54393e79f1d849" FOREIGN KEY ("clipId") REFERENCES "clip"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "clip_favorite" DROP CONSTRAINT "FK_fce61c7986cee54393e79f1d849"`);
        await queryRunner.query(`ALTER TABLE "clip_favorite" DROP CONSTRAINT "FK_25a31662b0b0cc9af6549a9d711"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a3eac04ae2aa9e221e7596114a"`);
        await queryRunner.query(`ALTER TABLE "clip" DROP COLUMN "lastClippedAt"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b1754a39d0b281e07ed7c078ec"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_25a31662b0b0cc9af6549a9d71"`);
        await queryRunner.query(`DROP TABLE "clip_favorite"`);
    }
}
