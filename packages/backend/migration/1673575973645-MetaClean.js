export class MetaClean1673575973645 {
    name = 'MetaClean1673575973645'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "remoteDriveCapacityMb"`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "remoteDriveCapacityMb" integer NOT NULL DEFAULT '32'`);
    }
}
