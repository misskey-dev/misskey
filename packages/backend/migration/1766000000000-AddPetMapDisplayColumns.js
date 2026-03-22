/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class AddPetMapDisplayColumns1766000000000 {
	name = 'AddPetMapDisplayColumns1766000000000';

	async up(queryRunner) {
		// NoctownChicken への追加
		await queryRunner.query(`ALTER TABLE "noctown_chicken" ADD "spawnX" real NOT NULL DEFAULT 0`);
		await queryRunner.query(`ALTER TABLE "noctown_chicken" ADD "spawnZ" real NOT NULL DEFAULT 0`);
		await queryRunner.query(`ALTER TABLE "noctown_chicken" ADD "flavorText" varchar(256) NOT NULL DEFAULT ''`);

		// 既存データ移行: positionX/Z → spawnX/Z
		await queryRunner.query(`UPDATE "noctown_chicken" SET "spawnX" = "positionX", "spawnZ" = "positionZ" WHERE "spawnX" = 0 AND "spawnZ" = 0`);

		// DEFAULT制約削除
		await queryRunner.query(`ALTER TABLE "noctown_chicken" ALTER COLUMN "spawnX" DROP DEFAULT`);
		await queryRunner.query(`ALTER TABLE "noctown_chicken" ALTER COLUMN "spawnZ" DROP DEFAULT`);
		await queryRunner.query(`ALTER TABLE "noctown_chicken" ALTER COLUMN "flavorText" DROP DEFAULT`);

		// インデックス追加
		await queryRunner.query(`CREATE INDEX "IDX_noctown_chicken_spawn" ON "noctown_chicken" ("spawnX", "spawnZ")`);

		// NoctownCow への追加
		await queryRunner.query(`ALTER TABLE "noctown_cow" ADD "spawnX" real NOT NULL DEFAULT 0`);
		await queryRunner.query(`ALTER TABLE "noctown_cow" ADD "spawnZ" real NOT NULL DEFAULT 0`);
		await queryRunner.query(`ALTER TABLE "noctown_cow" ADD "flavorText" varchar(256) NOT NULL DEFAULT ''`);

		// 既存データ移行: positionX/Z → spawnX/Z
		await queryRunner.query(`UPDATE "noctown_cow" SET "spawnX" = "positionX", "spawnZ" = "positionZ" WHERE "spawnX" = 0 AND "spawnZ" = 0`);

		// DEFAULT制約削除
		await queryRunner.query(`ALTER TABLE "noctown_cow" ALTER COLUMN "spawnX" DROP DEFAULT`);
		await queryRunner.query(`ALTER TABLE "noctown_cow" ALTER COLUMN "spawnZ" DROP DEFAULT`);
		await queryRunner.query(`ALTER TABLE "noctown_cow" ALTER COLUMN "flavorText" DROP DEFAULT`);

		// インデックス追加
		await queryRunner.query(`CREATE INDEX "IDX_noctown_cow_spawn" ON "noctown_cow" ("spawnX", "spawnZ")`);
	}

	async down(queryRunner) {
		// NoctownCow ロールバック
		await queryRunner.query(`DROP INDEX "IDX_noctown_cow_spawn"`);
		await queryRunner.query(`ALTER TABLE "noctown_cow" DROP COLUMN "flavorText"`);
		await queryRunner.query(`ALTER TABLE "noctown_cow" DROP COLUMN "spawnZ"`);
		await queryRunner.query(`ALTER TABLE "noctown_cow" DROP COLUMN "spawnX"`);

		// NoctownChicken ロールバック
		await queryRunner.query(`DROP INDEX "IDX_noctown_chicken_spawn"`);
		await queryRunner.query(`ALTER TABLE "noctown_chicken" DROP COLUMN "flavorText"`);
		await queryRunner.query(`ALTER TABLE "noctown_chicken" DROP COLUMN "spawnZ"`);
		await queryRunner.query(`ALTER TABLE "noctown_chicken" DROP COLUMN "spawnX"`);
	}
}
