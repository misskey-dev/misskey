export class PollChoiceLength1673336077243 {
    name = 'PollChoiceLength1673336077243'

    async up(queryRunner) {
				await queryRunner.query(`ALTER TABLE "poll" ALTER COLUMN "choices" TYPE character varying(256) array`);
    }

    async down(queryRunner) {
			await queryRunner.query(`ALTER TABLE "poll" ALTER COLUMN "choices" TYPE character varying(128) array`);
    }
}
