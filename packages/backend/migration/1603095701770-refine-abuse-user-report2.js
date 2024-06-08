/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class refineAbuseUserReport21603095701770 {
    constructor() {
        this.name = 'refineAbuseUserReport21603095701770';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "abuse_user_report" ADD "targetUserHost" character varying(128)`);
        await queryRunner.query(`ALTER TABLE "abuse_user_report" ADD "reporterHost" character varying(128)`);
        await queryRunner.query(`CREATE INDEX "IDX_4ebbf7f93cdc10e8d1ef2fc6cd" ON "abuse_user_report" ("targetUserHost") `);
        await queryRunner.query(`CREATE INDEX "IDX_f8d8b93740ad12c4ce8213a199" ON "abuse_user_report" ("reporterHost") `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "IDX_f8d8b93740ad12c4ce8213a199"`);
        await queryRunner.query(`DROP INDEX "IDX_4ebbf7f93cdc10e8d1ef2fc6cd"`);
        await queryRunner.query(`ALTER TABLE "abuse_user_report" DROP COLUMN "reporterHost"`);
        await queryRunner.query(`ALTER TABLE "abuse_user_report" DROP COLUMN "targetUserHost"`);
    }
}
