/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class AddComment1698931321665 {
    name = 'AddComment1698931321665'

    async up(queryRunner) {
        await queryRunner.query(`COMMENT ON COLUMN "meta"."emailVerificationExpiresIn" IS 'The expiration time of email verification (unit: minute)'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`COMMENT ON COLUMN "meta"."emailVerificationExpiresIn" IS NULL`);
    }
}
