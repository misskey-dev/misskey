export class ScheduledNoteDelete1709187210308 {
	name = 'ScheduledNoteDelete1709187210308'

	async up(queryRunner) {
			await queryRunner.query(`ALTER TABLE "note" ADD "deleteAt" TIMESTAMP WITH TIME ZONE`);
	}

	async down(queryRunner) {
			await queryRunner.query(`ALTER TABLE "note" DROP COLUMN "deleteAt"`);
	}
}
