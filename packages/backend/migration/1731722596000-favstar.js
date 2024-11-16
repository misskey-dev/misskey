/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class Favstar17317225960000 {
    constructor() {
        this.name = 'Favstar17317225960000';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "highlightRateFactor" integer NOT NULL DEFAULT 30`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "highlightMidPopularityThreshold" integer NOT NULL DEFAULT 3`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "highlightHighPopularityThreashold" integer NOT NULL DEFAULT 5`)
        await queryRunner.query(`ALTER TABLE "meta" ADD "highlightExcludeEmojis" text NOT NULL DEFAULT ''`)
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "highlightRateFactor"`);    
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "highlightMidPopularityThreshold"`);    
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "highlightHighPopularityThreashold"`);    
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "highlightExcludeEmojis"`);    
    }
}
