export class roleIconBadge1675557528704 {
    name = 'roleIconBadge1675557528704'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "role" ADD "iconUrl" character varying(512)`);
        await queryRunner.query(`ALTER TABLE "role" ADD "asBadge" boolean NOT NULL DEFAULT false`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "role" DROP COLUMN "asBadge"`);
        await queryRunner.query(`ALTER TABLE "role" DROP COLUMN "iconUrl"`);
    }
}
