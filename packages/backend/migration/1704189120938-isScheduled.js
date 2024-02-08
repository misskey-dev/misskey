export class IsScheduled1704189120938 {
    name = 'IsScheduled1704189120938'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "note" ADD "isScheduled" boolean NOT NULL DEFAULT false`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "note" DROP COLUMN "isScheduled"`);
    }
}
