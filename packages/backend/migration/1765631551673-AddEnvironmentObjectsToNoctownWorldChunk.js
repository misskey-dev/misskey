export class AddEnvironmentObjectsToNoctownWorldChunk1765631551673 {
	name = 'AddEnvironmentObjectsToNoctownWorldChunk1765631551673'

	async up(queryRunner) {
		await queryRunner.query(`ALTER TABLE "noctown_world_chunk" ADD "environmentObjects" jsonb`);
		await queryRunner.query(`COMMENT ON COLUMN "noctown_world_chunk"."environmentObjects" IS 'Environment objects (trees, rocks, etc.)'`);
	}

	async down(queryRunner) {
		await queryRunner.query(`ALTER TABLE "noctown_world_chunk" DROP COLUMN "environmentObjects"`);
	}
}
