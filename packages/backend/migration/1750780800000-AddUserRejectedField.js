/*
 * SPDX-FileCopyrightText: hitalin and yamisskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class AddUserRejectedField1750780800000 {
    name = 'AddUserRejectedField1750780800000';

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user" ADD "rejected" boolean NOT NULL DEFAULT false`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "rejected"`);
    }
}
