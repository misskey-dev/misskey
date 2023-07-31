/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class chartFederationActiveSubPub1646732390560 {
    name = 'chartFederationActiveSubPub1646732390560'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "__chart__federation" DROP COLUMN "___active"`);
        await queryRunner.query(`ALTER TABLE "__chart_day__federation" DROP COLUMN "___active"`);
        await queryRunner.query(`ALTER TABLE "__chart__federation" ADD "___subActive" smallint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "__chart__federation" ADD "___pubActive" smallint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "__chart_day__federation" ADD "___subActive" smallint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "__chart_day__federation" ADD "___pubActive" smallint NOT NULL DEFAULT '0'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "__chart_day__federation" DROP COLUMN "___pubActive"`);
        await queryRunner.query(`ALTER TABLE "__chart_day__federation" DROP COLUMN "___subActive"`);
        await queryRunner.query(`ALTER TABLE "__chart__federation" DROP COLUMN "___pubActive"`);
        await queryRunner.query(`ALTER TABLE "__chart__federation" DROP COLUMN "___subActive"`);
        await queryRunner.query(`ALTER TABLE "__chart_day__federation" ADD "___active" smallint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "__chart__federation" ADD "___active" smallint NOT NULL DEFAULT '0'`);
    }
}
