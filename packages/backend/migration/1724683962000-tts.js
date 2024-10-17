/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class TTSIntegration1724683962000 {
    constructor() {
        this.name = 'TTSIntegration1724683962000';
    }
    
    async up(queryRunner) {
    	await queryRunner.query(`ALTER TABLE "user" ADD "isVI" boolean NOT NULL DEFAULT false`);
    	await queryRunner.query(`COMMENT ON COLUMN "user"."isVI" IS 'Whether the User needs auto TTS.'`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "hfSpace" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "hfSpaceName" character varying(128)`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "hfexampleAudioURL" character varying(128)`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "hfexampleText" character varying(128)`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "hfexampleLang" character varying(128)`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "hfslice" character varying(128) DEFAULT 'Slice once every 4 sentences'`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "hftopK" INTEGER DEFAULT 15`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "hftopP" INTEGER DEFAULT 100`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "hfTemperature" INTEGER DEFAULT 100`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "hfnrm" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "hfSpeedRate" INTEGER DEFAULT 125`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "hfdas" boolean NOT NULL DEFAULT false`);
    }
    
    async down(queryRunner) {
        await queryRunner.query(`COMMENT ON COLUMN "user"."isVI" IS NULL`);
    	await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "isVI"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "hfSpace"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "hfSpaceName"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "hfexampleAudioURL"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "hfexampleText"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "hfexampleLang"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "hfslice"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "hftopK"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "hftopP"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "hfTemperature"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "hfnrm"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "hfSpeedRate"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "hfdas"`);
    }
}

