export class removeLatestStatus1672704136584 {
    name = 'removeLatestStatus1672704136584'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "instance" DROP COLUMN "latestStatus"`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "instance" ADD "latestStatus" integer`);
    }
}
