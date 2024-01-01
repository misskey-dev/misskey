/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class EmergencyAnnouncements1704110019178 {
	name = 'EmergencyAnnouncements1704110019178'

	async up(queryRunner) {
			await queryRunner.query(`ALTER TABLE "meta" ADD "enableEmergencyAnnouncementIntegration" boolean NOT NULL DEFAULT false`);
			await queryRunner.query(`ALTER TABLE "meta" ADD "emergencyAnnouncementIntegrationConfig" jsonb NOT NULL DEFAULT '{"type":"none"}'`);
	}

	async down(queryRunner) {
			await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "enableEmergencyAnnouncementIntegration"`);
			await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "emergencyAnnouncementIntegrationConfig"`);
	}
}
