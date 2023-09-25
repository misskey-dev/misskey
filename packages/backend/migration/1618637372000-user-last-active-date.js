/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class userLastActiveDate1618637372000 {
    constructor() {
        this.name = 'userLastActiveDate1618637372000';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user" ADD "lastActiveDate" TIMESTAMP WITH TIME ZONE DEFAULT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_seoignmeoprigmkpodgrjmkpormg" ON "user" ("lastActiveDate") `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "IDX_seoignmeoprigmkpodgrjmkpormg"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "lastActiveDate"`);
    }
}
