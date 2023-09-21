export class removeLatestRequestSentAt1672703171386 {
    name = 'removeLatestRequestSentAt1672703171386'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "instance" DROP COLUMN "latestRequestSentAt"`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "instance" ADD "latestRequestSentAt" TIMESTAMP WITH TIME ZONE`);
    }
}
