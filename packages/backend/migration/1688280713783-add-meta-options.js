/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class AddMetaOptions1688280713783 {
    name = 'AddMetaOptions1688280713783'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "enableServerMachineStats" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "enableIdenticonGeneration" boolean NOT NULL DEFAULT true`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "enableIdenticonGeneration"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "enableServerMachineStats"`);
    }
}
