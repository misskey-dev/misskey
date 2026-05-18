/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * @typedef {import('typeorm').MigrationInterface} MigrationInterface
 * @typedef {import('typeorm').QueryRunner} QueryRunner
 */

/**
 * @class
 * @implements {MigrationInterface}
 */
export class AntennaShare1779105539395 {
    name = 'AntennaShare1779105539395'

    /**
     * @param {QueryRunner} queryRunner
     */
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "antenna_favorite" ("id" character varying(32) NOT NULL, "userId" character varying(32) NOT NULL, "antennaId" character varying(32) NOT NULL, CONSTRAINT "PK_fefb22a55e21904d2ff5b26eb23" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_ce5de8b5c18d8d9b77132e1be5" ON "antenna_favorite" ("userId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_82b4a53f04dd7b3fcb217b1436" ON "antenna_favorite" ("userId", "antennaId") `);
        await queryRunner.query(`ALTER TABLE "antenna" ADD "isPublic" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "antenna_favorite" ADD CONSTRAINT "FK_ce5de8b5c18d8d9b77132e1be5f" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "antenna_favorite" ADD CONSTRAINT "FK_347623935a4b0999e05a93f5175" FOREIGN KEY ("antennaId") REFERENCES "antenna"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    /**
     * @param {QueryRunner} queryRunner
     */
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "antenna_favorite" DROP CONSTRAINT "FK_347623935a4b0999e05a93f5175"`);
        await queryRunner.query(`ALTER TABLE "antenna_favorite" DROP CONSTRAINT "FK_ce5de8b5c18d8d9b77132e1be5f"`);
        await queryRunner.query(`ALTER TABLE "antenna" DROP COLUMN "isPublic"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_82b4a53f04dd7b3fcb217b1436"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ce5de8b5c18d8d9b77132e1be5"`);
        await queryRunner.query(`DROP TABLE "antenna_favorite"`);
    }
}
