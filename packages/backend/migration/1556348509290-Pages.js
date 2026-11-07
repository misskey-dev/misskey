/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class Pages1556348509290 {
    async up(queryRunner) {
        await queryRunner.query(`CREATE TYPE "page_visibility_enum" AS ENUM('public', 'followers', 'specified')`);
        await queryRunner.query(`CREATE TABLE "page" ("id" character varying(32) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL, "title" character varying(256) NOT NULL, "name" character varying(256) NOT NULL, "summary" character varying(256), "alignCenter" boolean NOT NULL, "font" character varying(32) NOT NULL, "userId" character varying(32) NOT NULL, "eyeCatchingImageId" character varying(32), "content" jsonb NOT NULL DEFAULT '[]', "variables" jsonb NOT NULL DEFAULT '[]', "visibility" "page_visibility_enum" NOT NULL, "visibleUserIds" character varying(32) array NOT NULL DEFAULT '{}'::varchar[], CONSTRAINT "PK_742f4117e065c5b6ad21b37ba1f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_fbb4297c927a9b85e9cefa2eb1" ON "page" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_af639b066dfbca78b01a920f8a" ON "page" ("updatedAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_b82c19c08afb292de4600d99e4" ON "page" ("name") `);
        await queryRunner.query(`CREATE INDEX "IDX_ae1d917992dd0c9d9bbdad06c4" ON "page" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_90148bbc2bf0854428786bfc15" ON "page" ("visibleUserIds") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_2133ef8317e4bdb839c0dcbf13" ON "page" ("userId", "name") `);
        await queryRunner.query(`ALTER TABLE "page" ADD CONSTRAINT "FK_ae1d917992dd0c9d9bbdad06c4a" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "page" ADD CONSTRAINT "FK_3126dd7c502c9e4d7597ef7ef10" FOREIGN KEY ("eyeCatchingImageId") REFERENCES "drive_file"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "page" DROP CONSTRAINT "FK_3126dd7c502c9e4d7597ef7ef10"`);
        await queryRunner.query(`ALTER TABLE "page" DROP CONSTRAINT "FK_ae1d917992dd0c9d9bbdad06c4a"`);
        await queryRunner.query(`DROP INDEX "IDX_2133ef8317e4bdb839c0dcbf13"`);
        await queryRunner.query(`DROP INDEX "IDX_90148bbc2bf0854428786bfc15"`);
        await queryRunner.query(`DROP INDEX "IDX_ae1d917992dd0c9d9bbdad06c4"`);
        await queryRunner.query(`DROP INDEX "IDX_b82c19c08afb292de4600d99e4"`);
        await queryRunner.query(`DROP INDEX "IDX_af639b066dfbca78b01a920f8a"`);
        await queryRunner.query(`DROP INDEX "IDX_fbb4297c927a9b85e9cefa2eb1"`);
        await queryRunner.query(`DROP TABLE "page"`);
        await queryRunner.query(`DROP TYPE "page_visibility_enum"`);
    }
}
