/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class FixDriveUrl1721666053703 {
    name = 'FixDriveUrl1721666053703'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "drive_file" ALTER COLUMN "url" TYPE character varying(1024), ALTER COLUMN "url" SET NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "drive_file"."url" IS 'The URL of the DriveFile.'`);
        await queryRunner.query(`ALTER TABLE "drive_file" ALTER COLUMN "uri" TYPE character varying(1024)`);
        await queryRunner.query(`COMMENT ON COLUMN "drive_file"."uri" IS 'The URI of the DriveFile. it will be null when the DriveFile is local.'`);
        await queryRunner.query(`ALTER TABLE "drive_file" ALTER COLUMN "src" TYPE character varying(1024)`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "drive_file" ALTER COLUMN "src" TYPE character varying(512)`);
        await queryRunner.query(`COMMENT ON COLUMN "drive_file"."uri" IS 'The URI of the DriveFile. it will be null when the DriveFile is local.'`);
        await queryRunner.query(`ALTER TABLE "drive_file" ALTER COLUMN "uri" TYPE character varying(512)`);
        await queryRunner.query(`COMMENT ON COLUMN "drive_file"."url" IS 'The URL of the DriveFile.'`);
        await queryRunner.query(`ALTER TABLE "drive_file" ALTER COLUMN "url" TYPE character varying(512), ALTER COLUMN "url" SET NOT NULL`);
    }
}
