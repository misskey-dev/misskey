/*
 * SPDX-FileCopyrightText: hitalin and yamisskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class AddIsCommunityToRole1752192900000 {
    name = 'AddIsCommunityToRole1752192900000'

    async up(queryRunner) {
        // 1. isCommunityフラグを追加
        await queryRunner.query(`ALTER TABLE "role" ADD "isCommunity" boolean NOT NULL DEFAULT false`);
        
        // 2. 既存のコミュニティロールにフラグを設定
        await queryRunner.query(`UPDATE "role" SET "isCommunity" = true WHERE "permissionGroup" = 'Community'`);
        
        // 3. userIdフィールドを削除（必要に応じて）
        await queryRunner.query(`ALTER TABLE "role" DROP COLUMN IF EXISTS "userId"`);
        
        // 4. permissionGroupフィールドを削除
        await queryRunner.query(`ALTER TABLE "role" DROP COLUMN "permissionGroup"`);
    }

    async down(queryRunner) {
        // ロールバック処理
        await queryRunner.query(`ALTER TABLE "role" ADD "permissionGroup" character varying(64)`);
        await queryRunner.query(`UPDATE "role" SET "permissionGroup" = 'Community' WHERE "isCommunity" = true`);
        await queryRunner.query(`ALTER TABLE "role" DROP COLUMN "isCommunity"`);
    }
}