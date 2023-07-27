/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class tweakVarcharLength1678426061773 {
		name = 'tweakVarcharLength1678426061773'

		async up(queryRunner) {
			await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "name" TYPE character varying(1024)`, undefined);
			await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "maintainerName" TYPE character varying(1024)`, undefined);
			await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "maintainerEmail" TYPE character varying(1024)`, undefined);
			await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "langs" TYPE character varying(1024) array`, undefined);
			await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "pinnedUsers" TYPE character varying(1024) array`, undefined);
			await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "hiddenTags" TYPE character varying(1024) array`, undefined);
			await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "blockedHosts" TYPE character varying(1024) array`, undefined);
			await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "themeColor" TYPE character varying(1024)`, undefined);
			await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "mascotImageUrl" TYPE character varying(1024)`, undefined);
			await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "bannerUrl" TYPE character varying(1024)`, undefined);
			await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "backgroundImageUrl" TYPE character varying(1024)`, undefined);
			await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "logoImageUrl" TYPE character varying(1024)`, undefined);
			await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "errorImageUrl" TYPE character varying(1024)`, undefined);
			await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "iconUrl" TYPE character varying(1024)`, undefined);
			await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "hcaptchaSiteKey" TYPE character varying(1024)`, undefined);
			await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "hcaptchaSecretKey" TYPE character varying(1024)`, undefined);
			await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "recaptchaSiteKey" TYPE character varying(1024)`, undefined);
			await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "recaptchaSecretKey" TYPE character varying(1024)`, undefined);
			await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "turnstileSiteKey" TYPE character varying(1024)`, undefined);
			await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "turnstileSecretKey" TYPE character varying(1024)`, undefined);
			await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "summalyProxy" TYPE character varying(1024)`, undefined);
			await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "email" TYPE character varying(1024)`, undefined);
			await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "smtpHost" TYPE character varying(1024)`, undefined);
			await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "smtpUser" TYPE character varying(1024)`, undefined);
			await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "smtpPass" TYPE character varying(1024)`, undefined);
			await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "swPublicKey" TYPE character varying(1024)`, undefined);
			await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "swPrivateKey" TYPE character varying(1024)`, undefined);
			await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "deeplAuthKey" TYPE character varying(1024)`, undefined);
			await queryRunner.query(`ALTER TABLE "meta" RENAME COLUMN "ToSUrl" TO "termsOfServiceUrl"`);
			await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "termsOfServiceUrl" TYPE character varying(1024)`, undefined);
			await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "repositoryUrl" TYPE character varying(1024)`, undefined);
			await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "feedbackUrl" TYPE character varying(1024)`, undefined);
			await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "objectStorageBucket" TYPE character varying(1024)`, undefined);
			await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "objectStoragePrefix" TYPE character varying(1024)`, undefined);
			await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "objectStorageBaseUrl" TYPE character varying(1024)`, undefined);
			await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "objectStorageEndpoint" TYPE character varying(1024)`, undefined);
			await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "objectStorageRegion" TYPE character varying(1024)`, undefined);
			await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "objectStorageAccessKey" TYPE character varying(1024)`, undefined);
			await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "objectStorageSecretKey" TYPE character varying(1024)`, undefined);
			await queryRunner.query(`ALTER TABLE "flash" ALTER COLUMN "script" TYPE character varying(65536)`, undefined);
			await queryRunner.query(`ALTER TABLE "__chart__active_users" ALTER COLUMN "___readWrite" TYPE integer`);
			await queryRunner.query(`ALTER TABLE "__chart__active_users" ALTER COLUMN "___read" TYPE integer`);
			await queryRunner.query(`ALTER TABLE "__chart__active_users" ALTER COLUMN "___write" TYPE integer`);
			await queryRunner.query(`ALTER TABLE "__chart__active_users" ALTER COLUMN "___registeredWithinWeek" TYPE integer`);
			await queryRunner.query(`ALTER TABLE "__chart__active_users" ALTER COLUMN "___registeredWithinMonth" TYPE integer`);
			await queryRunner.query(`ALTER TABLE "__chart__active_users" ALTER COLUMN "___registeredWithinYear" TYPE integer`);
			await queryRunner.query(`ALTER TABLE "__chart__active_users" ALTER COLUMN "___registeredOutsideWeek" TYPE integer`);
			await queryRunner.query(`ALTER TABLE "__chart__active_users" ALTER COLUMN "___registeredOutsideMonth" TYPE integer`);
			await queryRunner.query(`ALTER TABLE "__chart__active_users" ALTER COLUMN "___registeredOutsideYear" TYPE integer`);
			await queryRunner.query(`ALTER TABLE "__chart_day__active_users" ALTER COLUMN "___readWrite" TYPE integer`);
			await queryRunner.query(`ALTER TABLE "__chart_day__active_users" ALTER COLUMN "___read" TYPE integer`);
			await queryRunner.query(`ALTER TABLE "__chart_day__active_users" ALTER COLUMN "___write" TYPE integer`);
			await queryRunner.query(`ALTER TABLE "__chart_day__active_users" ALTER COLUMN "___registeredWithinWeek" TYPE integer`);
			await queryRunner.query(`ALTER TABLE "__chart_day__active_users" ALTER COLUMN "___registeredWithinMonth" TYPE integer`);
			await queryRunner.query(`ALTER TABLE "__chart_day__active_users" ALTER COLUMN "___registeredWithinYear" TYPE integer`);
			await queryRunner.query(`ALTER TABLE "__chart_day__active_users" ALTER COLUMN "___registeredOutsideWeek" TYPE integer`);
			await queryRunner.query(`ALTER TABLE "__chart_day__active_users" ALTER COLUMN "___registeredOutsideMonth" TYPE integer`);
			await queryRunner.query(`ALTER TABLE "__chart_day__active_users" ALTER COLUMN "___registeredOutsideYear" TYPE integer`);
		}

		async down(queryRunner) {
			await queryRunner.query(`ALTER TABLE "meta" RENAME COLUMN "termsOfServiceUrl" TO "ToSUrl"`);
		}
}
