/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class AntennaShare1779092613181 {
    name = 'AntennaShare1779092613181'

    /**
     * @param {QueryRunner} queryRunner
     */
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "antenna" ADD "isPublic" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`CREATE TABLE "antenna_favorite" ("id" character varying(32) NOT NULL, "userId" character varying(32) NOT NULL, "antennaId" character varying(32) NOT NULL, CONSTRAINT "PK_5b16eb0f3a45f0a64aca81dac90" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_7c4b0fce99ae5c5acea9b6c5ab" ON "antenna_favorite" ("userId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_2eb5e64ed03ad0d35f17e0a0d6" ON "antenna_favorite" ("userId", "antennaId") `);
        await queryRunner.query(`ALTER TABLE "antenna_favorite" ADD CONSTRAINT "FK_7c4b0fce99ae5c5acea9b6c5abe" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "antenna_favorite" ADD CONSTRAINT "FK_8a8b14f7e8c5a7e09b1a3c12d5e" FOREIGN KEY ("antennaId") REFERENCES "antenna"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    /**
     * @param {QueryRunner} queryRunner
     */
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "antenna_favorite" DROP CONSTRAINT "FK_8a8b14f7e8c5a7e09b1a3c12d5e"`);
        await queryRunner.query(`ALTER TABLE "antenna_favorite" DROP CONSTRAINT "FK_7c4b0fce99ae5c5acea9b6c5abe"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2eb5e64ed03ad0d35f17e0a0d6"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7c4b0fce99ae5c5acea9b6c5ab"`);
        await queryRunner.query(`DROP TABLE "antenna_favorite"`);
        await queryRunner.query(`ALTER TABLE "antenna" DROP COLUMN "isPublic"`);
    }
}
