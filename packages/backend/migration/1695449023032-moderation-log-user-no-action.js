export class ModerationLogUserNoAction1695449023032 {
    name = 'ModerationLogUserNoAction1695449023032'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "moderation_log" DROP CONSTRAINT "FK_a08ad074601d204e0f69da9a954"`);
        await queryRunner.query(`ALTER TABLE "moderation_log" ADD CONSTRAINT "FK_a08ad074601d204e0f69da9a954" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "moderation_log" DROP CONSTRAINT "FK_a08ad074601d204e0f69da9a954"`);
        await queryRunner.query(`ALTER TABLE "moderation_log" ADD CONSTRAINT "FK_a08ad074601d204e0f69da9a954" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }
}
