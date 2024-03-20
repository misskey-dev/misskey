export class AntennaExcludeBots1710919614510 {
    name = 'AntennaExcludeBots1710919614510'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "antenna" ADD "excludeBots" boolean NOT NULL DEFAULT false`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "antenna" DROP COLUMN "excludeBots"`);
    }
}
