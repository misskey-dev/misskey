/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class AbuseReportNotification1713656541000 {
	name = 'AbuseReportNotification1713656541000'

	async up(queryRunner) {
		await queryRunner.query(`
			CREATE TABLE "system_webhook" (
				"id" varchar(32) NOT NULL,
				"isActive" boolean NOT NULL DEFAULT true,
				"updatedAt" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
				"latestSentAt" timestamp with time zone NULL DEFAULT NULL,
				"latestStatus" integer NULL DEFAULT NULL,
				"name" varchar(255) NOT NULL,
				"on" varchar(128) [] NOT NULL DEFAULT '{}'::character varying[],
				"url" varchar(1024) NOT NULL,
				"secret" varchar(1024) NOT NULL,
				PRIMARY KEY ("id")
			);
			CREATE INDEX "IDX_webhook_system_isActive" ON "system_webhook" ("isActive");
			CREATE INDEX "IDX_webhook_system_on" ON "system_webhook" ("on");

			CREATE TABLE "abuse_report_notification_recipient" (
				"id" varchar(32) NOT NULL,
				"isActive" boolean NOT NULL DEFAULT true,
				"updatedAt" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
				"name" varchar(255) NOT NULL,
				"method" varchar(64) NOT NULL,
				"userId" varchar(32) NULL DEFAULT NULL,
				"systemWebhookId" varchar(32) NULL DEFAULT NULL,
				PRIMARY KEY ("id"),
				FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE,
				FOREIGN KEY ("systemWebhookId") REFERENCES "system_webhook"("id") ON DELETE CASCADE
			);
			CREATE INDEX "IDX_abuse_report_notification_recipient_isActive" ON "abuse_report_notification_recipient" ("isActive");
			CREATE INDEX "IDX_abuse_report_notification_recipient_method" ON "abuse_report_notification_recipient" ("method");
			CREATE INDEX "IDX_abuse_report_notification_recipient_userId" ON "abuse_report_notification_recipient" ("userId");
			CREATE INDEX "IDX_abuse_report_notification_recipient_systemWebhookId" ON "abuse_report_notification_recipient" ("systemWebhookId");
		`);
	}

	async down(queryRunner) {
		await queryRunner.query(`DROP TABLE "system_webhook";`);
		await queryRunner.query(`DROP TABLE "abuse_report_notification_recipient";`);
	}
}
