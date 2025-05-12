export class EmojiMute1747042920984 {
    name = 'EmojiMute1747042920984'

    async up(queryRunner) {
			await queryRunner.query(`
				CREATE TABLE "emoji_mute" (
					"id" character varying NOT NULL,
					"userId" character varying NOT NULL,
					"emojis" jsonb NOT NULL DEFAULT '[]',
					CONSTRAINT "PK_68998f0790994d8bb540ec470fbf40ed" PRIMARY KEY ("id")
				)
			`);
			await queryRunner.query(`ALTER TABLE "emoji_mute" ADD CONSTRAINT "FK_2ef0eb5318b241d7a8cac5f46a32adc0" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    async down(queryRunner) {
			await queryRunner.query(`ALTER TABLE "emoji_mute" DROP CONSTRAINT "FK_2ef0eb5318b241d7a8cac5f46a32adc0"`);
			await queryRunner.query(`DROP TABLE "emoji_mute"`);
    }
}
