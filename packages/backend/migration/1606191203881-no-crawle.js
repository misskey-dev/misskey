/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class noCrawle1606191203881 {
    constructor() {
        this.name = 'noCrawle1606191203881';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "noCrawle" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`COMMENT ON COLUMN "user_profile"."noCrawle" IS 'Whether reject index by crawler.'`);
    }
    async down(queryRunner) {
        await queryRunner.query(`COMMENT ON COLUMN "user_profile"."noCrawle" IS 'Whether reject index by crawler.'`);
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "noCrawle"`);
    }
}
