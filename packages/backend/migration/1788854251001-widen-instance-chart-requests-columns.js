/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class WidenInstanceChartRequestsColumns1788854251001 {
    name = 'WidenInstanceChartRequestsColumns1788854251001'

    async up(queryRunner) {
        // 大規模サーバーとの通信では、1日で32767件以上のリクエストが発生することがある
        await queryRunner.query(`ALTER TABLE "__chart__instance" ALTER COLUMN "___requests_failed" TYPE integer USING "___requests_failed"::integer`);
        await queryRunner.query(`ALTER TABLE "__chart__instance" ALTER COLUMN "___requests_succeeded" TYPE integer USING "___requests_succeeded"::integer`);
        await queryRunner.query(`ALTER TABLE "__chart__instance" ALTER COLUMN "___requests_received" TYPE integer USING "___requests_received"::integer`);
        await queryRunner.query(`ALTER TABLE "__chart_day__instance" ALTER COLUMN "___requests_failed" TYPE integer USING "___requests_failed"::integer`);
        await queryRunner.query(`ALTER TABLE "__chart_day__instance" ALTER COLUMN "___requests_succeeded" TYPE integer USING "___requests_succeeded"::integer`);
        await queryRunner.query(`ALTER TABLE "__chart_day__instance" ALTER COLUMN "___requests_received" TYPE integer USING "___requests_received"::integer`);
    }

    async down(queryRunner) {
        // smallintに戻せない値は上限で丸める
        await queryRunner.query(`UPDATE "__chart__instance" SET "___requests_failed"=32767 WHERE "___requests_failed" > 32767`);
        await queryRunner.query(`UPDATE "__chart__instance" SET "___requests_succeeded"=32767 WHERE "___requests_succeeded" > 32767`);
        await queryRunner.query(`UPDATE "__chart__instance" SET "___requests_received"=32767 WHERE "___requests_received" > 32767`);
        await queryRunner.query(`UPDATE "__chart_day__instance" SET "___requests_failed"=32767 WHERE "___requests_failed" > 32767`);
        await queryRunner.query(`UPDATE "__chart_day__instance" SET "___requests_succeeded"=32767 WHERE "___requests_succeeded" > 32767`);
        await queryRunner.query(`UPDATE "__chart_day__instance" SET "___requests_received"=32767 WHERE "___requests_received" > 32767`);
        await queryRunner.query(`ALTER TABLE "__chart__instance" ALTER COLUMN "___requests_failed" TYPE smallint USING "___requests_failed"::smallint`);
        await queryRunner.query(`ALTER TABLE "__chart__instance" ALTER COLUMN "___requests_succeeded" TYPE smallint USING "___requests_succeeded"::smallint`);
        await queryRunner.query(`ALTER TABLE "__chart__instance" ALTER COLUMN "___requests_received" TYPE smallint USING "___requests_received"::smallint`);
        await queryRunner.query(`ALTER TABLE "__chart_day__instance" ALTER COLUMN "___requests_failed" TYPE smallint USING "___requests_failed"::smallint`);
        await queryRunner.query(`ALTER TABLE "__chart_day__instance" ALTER COLUMN "___requests_succeeded" TYPE smallint USING "___requests_succeeded"::smallint`);
        await queryRunner.query(`ALTER TABLE "__chart_day__instance" ALTER COLUMN "___requests_received" TYPE smallint USING "___requests_received"::smallint`);
    }
}
