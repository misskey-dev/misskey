/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class federationChartPubsub1645599900873 {
    name = 'federationChartPubsub1645599900873'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "__chart__federation" ADD "___pubsub" smallint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "__chart_day__federation" ADD "___pubsub" smallint NOT NULL DEFAULT '0'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "__chart_day__federation" DROP COLUMN "___pubsub"`);
        await queryRunner.query(`ALTER TABLE "__chart__federation" DROP COLUMN "___pubsub"`);
    }
}
