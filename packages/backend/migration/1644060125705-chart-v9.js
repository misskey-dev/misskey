/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class chartV91644060125705 {
    name = 'chartV91644060125705'

		async up(queryRunner) {
			await queryRunner.query(`UPDATE "__chart__hashtag" SET "___local_users"=2147483647 WHERE "___local_users" > 2147483647`);
			await queryRunner.query(`UPDATE "__chart__hashtag" SET "___remote_users"=2147483647 WHERE "___remote_users" > 2147483647`);
			await queryRunner.query(`UPDATE "__chart_day__hashtag" SET "___local_users"=2147483647 WHERE "___local_users" > 2147483647`);
			await queryRunner.query(`UPDATE "__chart_day__hashtag" SET "___remote_users"=2147483647 WHERE "___remote_users" > 2147483647`);

			await queryRunner.query(`ALTER TABLE "__chart__hashtag" ALTER COLUMN "___local_users" TYPE integer USING "___local_users"::integer`);
			await queryRunner.query(`ALTER TABLE "__chart__hashtag" ALTER COLUMN "___remote_users" TYPE integer USING "___remote_users"::integer`);
			await queryRunner.query(`ALTER TABLE "__chart_day__hashtag" ALTER COLUMN "___local_users" TYPE integer USING "___local_users"::integer`);
			await queryRunner.query(`ALTER TABLE "__chart_day__hashtag" ALTER COLUMN "___remote_users" TYPE integer USING "___remote_users"::integer`);
		}

		async down(queryRunner) {

			await queryRunner.query(`ALTER TABLE "__chart__hashtag" ALTER COLUMN "___local_users" TYPE bigint USING "___local_users"::bigint`);
			await queryRunner.query(`ALTER TABLE "__chart__hashtag" ALTER COLUMN "___remote_users" TYPE bigint USING "___remote_users"::bigint`);
			await queryRunner.query(`ALTER TABLE "__chart_day__hashtag" ALTER COLUMN "___local_users" TYPE bigint USING "___local_users"::bigint`);
			await queryRunner.query(`ALTER TABLE "__chart_day__hashtag" ALTER COLUMN "___remote_users" TYPE bigint USING "___remote_users"::bigint`);
		}
}
