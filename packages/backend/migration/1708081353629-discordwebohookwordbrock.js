export class Discordwebohookwordbrock1708081353629 {
    name = 'Discordwebohookwordbrock1708081353629'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "DiscordWebhookUrlWordBlock" character varying(1024)`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "DiscordWebhookUrlWordBlock"`);
}
}
