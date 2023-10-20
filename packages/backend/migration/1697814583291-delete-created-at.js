export class DeleteCreatedAt1697814583291 {
    name = 'DeleteCreatedAt1697814583291'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "note_notification" DROP COLUMN "createdAt"`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "note_notification" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL`);
    }
}
