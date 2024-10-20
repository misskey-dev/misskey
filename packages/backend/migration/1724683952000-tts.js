/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class TTSIntegration1724683952000 {
    constructor() {
        this.name = 'TTSIntegration1724683952000';
    }
    
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "hfAuthKey" character varying(128)`);
    }
    
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "hfAuthKey"`);
    }
}

