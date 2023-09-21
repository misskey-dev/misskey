export class removeLastCommunicatedAt1672704017999 {
    name = 'removeLastCommunicatedAt1672704017999'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "instance" DROP COLUMN "lastCommunicatedAt"`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "instance" ADD "lastCommunicatedAt" TIMESTAMP WITH TIME ZONE NOT NULL`);
    }
}
