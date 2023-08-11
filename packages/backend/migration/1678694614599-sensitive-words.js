export class sensitiveWords1678694614599 {
    name = 'sensitiveWords1678694614599'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "sensitiveWords" character varying(1024) array NOT NULL DEFAULT '{}'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "sensitiveWords"`);
    }
}
