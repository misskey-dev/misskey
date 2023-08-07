export class CustomemojiRestrictedRoles1691317808362 {
    name = 'CustomemojiRestrictedRoles1691317808362'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "emoji" ADD "roleIdsThatCanNotBeUsedThisEmojiAsReaction" character varying(128) array NOT NULL DEFAULT '{}'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "emoji" DROP COLUMN "roleIdsThatCanNotBeUsedThisEmojiAsReaction"`);
    }
}
