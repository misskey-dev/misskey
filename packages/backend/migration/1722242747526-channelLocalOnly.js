export class ChannelLocalOnly1722242747526 {
    name = 'ChannelLocalOnly1722242747526'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "channel" ADD "isLocalOnly" boolean NOT NULL DEFAULT false`);    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "channel" DROP COLUMN "isLocalOnly"`);
		}
}
