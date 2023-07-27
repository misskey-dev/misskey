/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class objectStorageSetPublicRead1597230137744 {
    constructor() {
        this.name = 'objectStorageSetPublicRead1597230137744';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "objectStorageSetPublicRead" boolean NOT NULL DEFAULT false`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "objectStorageSetPublicRead"`);
    }
}
