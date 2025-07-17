/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
export class RemoteSuspend1751848750315 {
    name = 'RemoteSuspend1751848750315'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user" ADD "isRemoteSuspended" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`COMMENT ON COLUMN "user"."isRemoteSuspended" IS 'Whether the User is suspended by the remote moderators.'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`COMMENT ON COLUMN "user"."isRemoteSuspended" IS 'Whether the User is suspended by the remote moderators.'`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "isRemoteSuspended"`);
    }
}
