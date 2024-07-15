export class Requestemoji1703294653915 {
    name = 'Requestemoji1703294653915'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "requestEmojiAllOk" boolean NOT NULL DEFAULT false`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "requestEmojiAllOk"`);
    }
}
