export class NotificationEmailsForAbuseReport1691120548582 {
    name = 'NotificationEmailsForAbuseReport1691120548582'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "emailToReceiveAbuseReport" character varying(1024)`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "doNotSendNotificationEmailsForAbuseReport" boolean NOT NULL DEFAULT false`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "doNotSendNotificationEmailsForAbuseReport"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "emailToReceiveAbuseReport"`);
    }
}
