/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class isExplorable1607353487793 {
    constructor() {
        this.name = 'isExplorable1607353487793';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user" ADD "isExplorable" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`COMMENT ON COLUMN "user"."isExplorable" IS 'Whether the User is explorable.'`);
        await queryRunner.query(`CREATE INDEX "IDX_d5a1b83c7cab66f167e6888188" ON "user" ("isExplorable") `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "IDX_d5a1b83c7cab66f167e6888188"`);
        await queryRunner.query(`COMMENT ON COLUMN "user"."isExplorable" IS 'Whether the User is explorable.'`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "isExplorable"`);
    }
}
