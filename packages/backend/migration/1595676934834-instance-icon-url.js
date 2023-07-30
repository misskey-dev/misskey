/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class instanceIconUrl1595676934834 {
    constructor() {
        this.name = 'instanceIconUrl1595676934834';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "instance" ADD "iconUrl" character varying(256) DEFAULT null`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "instance" DROP COLUMN "iconUrl"`);
    }
}
