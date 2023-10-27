export class Avatardecorationaccepthost1698363835246 {
    name = 'Avatardecorationaccepthost1698363835246'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "avatarDecorationAcceptHosts" character varying(1024) array NOT NULL DEFAULT '{}'`);
		}

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "avatarDecorationAcceptHosts"`);
    }
}
