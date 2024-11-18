export class AddBlockingReactionUser1731932268436 {
    name = 'AddBlockingReactionUser1731932268436'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "blocking" ADD "blockType" character varying NOT NULL DEFAULT 'user'`);
        await queryRunner.query(`COMMENT ON COLUMN "blocking"."blockType" IS 'Block type.'`);
        await queryRunner.query(`CREATE INDEX "IDX_cd38e7ea08163899a2d1f4427d" ON "blocking" ("blockType") `);
    }

    async down(queryRunner) {
		await queryRunner.query(`DELETE FROM blocking WHERE "blockType" = 'reaction'`);　// blockingテーブルのblockTypeがreactionの行を削除
        await queryRunner.query(`DROP INDEX "public"."IDX_cd38e7ea08163899a2d1f4427d"`);
        await queryRunner.query(`COMMENT ON COLUMN "blocking"."blockType" IS 'Block type.'`);
        await queryRunner.query(`ALTER TABLE "blocking" DROP COLUMN "blockType"`);
    }
}
