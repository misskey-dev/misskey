/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class RefineAnnouncement1691649257651 {
    name = 'RefineAnnouncement1691649257651'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "announcement" ADD "display" character varying(256) NOT NULL DEFAULT 'normal'`);
        await queryRunner.query(`ALTER TABLE "announcement" ADD "needConfirmationToRead" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "announcement" ADD "isActive" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "announcement" ADD "forExistingUsers" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "announcement" ADD "userId" character varying(32)`);
        await queryRunner.query(`CREATE INDEX "IDX_bc1afcc8ef7e9400cdc3c0a87e" ON "announcement" ("isActive") `);
        await queryRunner.query(`CREATE INDEX "IDX_da795d3a83187e8832005ba19d" ON "announcement" ("forExistingUsers") `);
        await queryRunner.query(`CREATE INDEX "IDX_fd25dfe3da37df1715f11ba6ec" ON "announcement" ("userId") `);
        await queryRunner.query(`ALTER TABLE "announcement" ADD CONSTRAINT "FK_fd25dfe3da37df1715f11ba6ec8" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "announcement" DROP CONSTRAINT "FK_fd25dfe3da37df1715f11ba6ec8"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fd25dfe3da37df1715f11ba6ec"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_da795d3a83187e8832005ba19d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bc1afcc8ef7e9400cdc3c0a87e"`);
        await queryRunner.query(`ALTER TABLE "announcement" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "announcement" DROP COLUMN "forExistingUsers"`);
        await queryRunner.query(`ALTER TABLE "announcement" DROP COLUMN "isActive"`);
        await queryRunner.query(`ALTER TABLE "announcement" DROP COLUMN "needConfirmationToRead"`);
        await queryRunner.query(`ALTER TABLE "announcement" DROP COLUMN "display"`);
    }
}
