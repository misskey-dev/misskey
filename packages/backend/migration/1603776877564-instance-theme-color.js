/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class instanceThemeColor1603776877564 {
    constructor() {
        this.name = 'instanceThemeColor1603776877564';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "instance" ADD "themeColor" character varying(64) DEFAULT null`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "instance" DROP COLUMN "themeColor"`);
    }
}
