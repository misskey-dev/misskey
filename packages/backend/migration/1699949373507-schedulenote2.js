export class Schedulenote21699949373507 {
    name = 'Schedulenote21699949373507'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "note_schedule" RENAME COLUMN "expiresAt" TO "scheduledAt"`);
		}

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "note_schedule" RENAME COLUMN "scheduledAt" TO "expiresAt"`);
    }
}
