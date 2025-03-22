/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class  AddLlmTranslatorSupport1740989976502 {
    name = 'AddLlmTranslatorSupport1740989976502'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "enableLlmTranslator" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "enableLlmTranslatorRedisCache" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "llmTranslatorRedisCacheTtl" integer NOT NULL DEFAULT '2880'`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "llmTranslatorBaseUrl" character varying(1024)`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "llmTranslatorApiKey" character varying(1024)`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "llmTranslatorModel" character varying(1024)`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "llmTranslatorTemperature" real`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "llmTranslatorTopP" real`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "llmTranslatorMaxTokens" integer`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "llmTranslatorSysPrompt" character varying(1024)`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "llmTranslatorUserPrompt" character varying(1024)`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "enableLlmTranslator"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "enableLlmTranslatorRedisCache"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "llmTranslatorRedisCacheTtl"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "llmTranslatorBaseUrl"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "llmTranslatorApiKey"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "llmTranslatorModel"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "llmTranslatorTemperature"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "llmTranslatorTopP"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "llmTranslatorMaxTokens"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "llmTranslatorSysPrompt"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "llmTranslatorUserPrompt"`);
    }
}
