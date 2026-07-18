/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class RemoteNotesCleaning1753863104203 {
    name = 'RemoteNotesCleaning1753863104203'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "enableRemoteNotesCleaning" boolean NOT NULL DEFAULT false`);
        await queryRunner.query('ALTER TABLE "meta" ADD "remoteNotesCleaningMaxProcessingDurationInMinutes" integer NOT NULL DEFAULT \'60\'');
		await queryRunner.query('ALTER TABLE "meta" ADD "remoteNotesCleaningExpiryDaysForEachNotes" integer NOT NULL DEFAULT \'90\'');
    }

    async down(queryRunner) {
        await queryRunner.query('ALTER TABLE "meta" DROP COLUMN "remoteNotesCleaningExpiryDaysForEachNotes"');
		await queryRunner.query('ALTER TABLE "meta" DROP COLUMN "remoteNotesCleaningMaxProcessingDurationInMinutes"');
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "enableRemoteNotesCleaning"`);
    }
}
