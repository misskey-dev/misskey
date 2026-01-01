/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class RemoveUserFromDeletedNote1767261423782 {
    name = 'RemoveUserFromDeletedNote1767261423782'

    /**
     * @param {QueryRunner} queryRunner
     */
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "deleted_note" DROP CONSTRAINT "FK_d3b9dbab99de8644e4b0d5b7d59"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_31ca16e5929958668bf1d9a2d5"`);
        await queryRunner.query(`ALTER TABLE "deleted_note" DROP COLUMN "userId"`);
    }

    /**
     * @param {QueryRunner} queryRunner
     */
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "deleted_note" ADD "userId" character varying(32) NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_31ca16e5929958668bf1d9a2d5" ON "deleted_note" ("id", "userId") `);
        await queryRunner.query(`ALTER TABLE "deleted_note" ADD CONSTRAINT "FK_d3b9dbab99de8644e4b0d5b7d59" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }
}
