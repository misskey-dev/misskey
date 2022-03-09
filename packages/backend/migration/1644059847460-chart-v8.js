

export class chartV81644059847460 {
    name = 'chartV81644059847460'

		async up(queryRunner) {
			await queryRunner.query(`UPDATE "__chart__active_users" SET "___local_users"=2147483647 WHERE "___local_users" > 2147483647`);
			await queryRunner.query(`UPDATE "__chart__active_users" SET "___remote_users"=2147483647 WHERE "___remote_users" > 2147483647`);
			await queryRunner.query(`UPDATE "__chart_day__active_users" SET "___local_users"=2147483647 WHERE "___local_users" > 2147483647`);
			await queryRunner.query(`UPDATE "__chart_day__active_users" SET "___remote_users"=2147483647 WHERE "___remote_users" > 2147483647`);

			await queryRunner.query(`ALTER TABLE "__chart__active_users" ALTER COLUMN "___local_users" TYPE integer USING "___local_users"::integer`);
			await queryRunner.query(`ALTER TABLE "__chart__active_users" ALTER COLUMN "___remote_users" TYPE integer USING "___remote_users"::integer`);
			await queryRunner.query(`ALTER TABLE "__chart_day__active_users" ALTER COLUMN "___local_users" TYPE integer USING "___local_users"::integer`);
			await queryRunner.query(`ALTER TABLE "__chart_day__active_users" ALTER COLUMN "___remote_users" TYPE integer USING "___remote_users"::integer`);
		}
	
		async down(queryRunner) {
	
			await queryRunner.query(`ALTER TABLE "__chart__active_users" ALTER COLUMN "___local_users" TYPE bigint USING "___local_users"::bigint`);
			await queryRunner.query(`ALTER TABLE "__chart__active_users" ALTER COLUMN "___remote_users" TYPE bigint USING "___remote_users"::bigint`);
			await queryRunner.query(`ALTER TABLE "__chart_day__active_users" ALTER COLUMN "___local_users" TYPE bigint USING "___local_users"::bigint`);
			await queryRunner.query(`ALTER TABLE "__chart_day__active_users" ALTER COLUMN "___remote_users" TYPE bigint USING "___remote_users"::bigint`);
		}
}
