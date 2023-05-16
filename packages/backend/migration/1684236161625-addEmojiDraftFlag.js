export class AddEmojiDraftFlag1684236161625 {
    name = 'AddEmojiDraftFlag1684236161625'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "emoji" ADD "draft" boolean NOT NULL DEFAULT false`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "emoji" DROP COLUMN "draft"`);
    }
}
