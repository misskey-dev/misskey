/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class SystemAccounts31740133121105 {
    name = 'SystemAccounts31740133121105'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "rootUserId" character varying(32)`);
        await queryRunner.query(`ALTER TABLE "meta" ADD CONSTRAINT "FK_c80e4079d632f95eac06a9d28cc" FOREIGN KEY ("rootUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);

        const users = await queryRunner.query(`SELECT "id" FROM "user" WHERE "isRoot" = true LIMIT 1`);
        if (users.length > 0) {
            await queryRunner.query(`UPDATE "meta" SET "rootUserId" = $1`, [users[0].id]);
        }
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP CONSTRAINT "FK_c80e4079d632f95eac06a9d28cc"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "rootUserId"`);
    }
}
