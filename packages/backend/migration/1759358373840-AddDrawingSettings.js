/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class AddDrawingSettings1759358373840 {
	name = 'AddDrawingSettings1759358373840'

	async up(queryRunner) {
		// DrawingRoomSettings テーブル作成
		await queryRunner.query(`
			CREATE TABLE "drawing_room_settings" (
				"id" character varying(32) NOT NULL,
				"canvasWidth" integer NOT NULL DEFAULT 800,
				"canvasHeight" integer NOT NULL DEFAULT 600,
				"createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
				"updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
				CONSTRAINT "PK_drawing_room_settings" PRIMARY KEY ("id")
			)
		`);
		await queryRunner.query(`COMMENT ON COLUMN "drawing_room_settings"."canvasWidth" IS 'Canvas width in pixels'`);
		await queryRunner.query(`COMMENT ON COLUMN "drawing_room_settings"."canvasHeight" IS 'Canvas height in pixels'`);

		// DrawingUserSettings テーブル作成
		await queryRunner.query(`
			CREATE TABLE "drawing_user_settings" (
				"id" character varying(32) NOT NULL,
				"userId" character varying(32) NOT NULL,
				"canvasId" character varying(128) NOT NULL,
				"currentTool" character varying(32) NOT NULL DEFAULT 'pen',
				"currentColor" character varying(7) NOT NULL DEFAULT '#000000',
				"currentOpacity" double precision NOT NULL DEFAULT 1.0,
				"strokeWidth" integer NOT NULL DEFAULT 2,
				"currentLayer" integer NOT NULL DEFAULT 0,
				"layerVisible" jsonb NOT NULL DEFAULT '[true, true, true]',
				"layerOpacity" jsonb NOT NULL DEFAULT '[1, 1, 1]',
				"zoomLevel" double precision NOT NULL DEFAULT 1.0,
				"panOffsetX" double precision NOT NULL DEFAULT 0,
				"panOffsetY" double precision NOT NULL DEFAULT 0,
				"colors" jsonb,
				"createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
				"updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
				CONSTRAINT "PK_drawing_user_settings" PRIMARY KEY ("id")
			)
		`);
		await queryRunner.query(`COMMENT ON COLUMN "drawing_user_settings"."userId" IS 'The user ID.'`);
		await queryRunner.query(`COMMENT ON COLUMN "drawing_user_settings"."canvasId" IS 'Canvas ID (roomId or user-userId1-userId2)'`);
		await queryRunner.query(`COMMENT ON COLUMN "drawing_user_settings"."currentTool" IS 'Current tool (pen, eraser, eyedropper)'`);
		await queryRunner.query(`COMMENT ON COLUMN "drawing_user_settings"."currentColor" IS 'Current color (hex)'`);
		await queryRunner.query(`COMMENT ON COLUMN "drawing_user_settings"."currentOpacity" IS 'Current opacity (0.1-1.0)'`);
		await queryRunner.query(`COMMENT ON COLUMN "drawing_user_settings"."strokeWidth" IS 'Current stroke width'`);
		await queryRunner.query(`COMMENT ON COLUMN "drawing_user_settings"."currentLayer" IS 'Current layer (0-2)'`);
		await queryRunner.query(`COMMENT ON COLUMN "drawing_user_settings"."layerVisible" IS 'Layer visibility settings'`);
		await queryRunner.query(`COMMENT ON COLUMN "drawing_user_settings"."layerOpacity" IS 'Layer opacity settings'`);
		await queryRunner.query(`COMMENT ON COLUMN "drawing_user_settings"."zoomLevel" IS 'Zoom level (0.5-10.0)'`);
		await queryRunner.query(`COMMENT ON COLUMN "drawing_user_settings"."panOffsetX" IS 'Pan offset X'`);
		await queryRunner.query(`COMMENT ON COLUMN "drawing_user_settings"."panOffsetY" IS 'Pan offset Y'`);
		await queryRunner.query(`COMMENT ON COLUMN "drawing_user_settings"."colors" IS 'Custom color palette (array of 16 hex colors)'`);

		// インデックス作成
		await queryRunner.query(`CREATE INDEX "IDX_drawing_user_settings_userId" ON "drawing_user_settings" ("userId")`);
		await queryRunner.query(`CREATE INDEX "IDX_drawing_user_settings_canvasId" ON "drawing_user_settings" ("canvasId")`);
		await queryRunner.query(`CREATE UNIQUE INDEX "IDX_drawing_user_settings_userId_canvasId" ON "drawing_user_settings" ("userId", "canvasId")`);

		// 外部キー制約追加
		await queryRunner.query(`
			ALTER TABLE "drawing_user_settings"
			ADD CONSTRAINT "FK_drawing_user_settings_userId"
			FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
		`);
	}

	async down(queryRunner) {
		// 外部キー制約削除
		await queryRunner.query(`ALTER TABLE "drawing_user_settings" DROP CONSTRAINT "FK_drawing_user_settings_userId"`);

		// インデックス削除
		await queryRunner.query(`DROP INDEX "IDX_drawing_user_settings_userId_canvasId"`);
		await queryRunner.query(`DROP INDEX "IDX_drawing_user_settings_canvasId"`);
		await queryRunner.query(`DROP INDEX "IDX_drawing_user_settings_userId"`);

		// テーブル削除
		await queryRunner.query(`DROP TABLE "drawing_user_settings"`);
		await queryRunner.query(`DROP TABLE "drawing_room_settings"`);
	}
}
