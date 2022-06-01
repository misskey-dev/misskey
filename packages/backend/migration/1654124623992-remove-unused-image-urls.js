export class removeUnusedImageUrls1654124623992 {
	name = 'removeUnusedImageUrls1654124623992'

	async up(queryRunner) {
		await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "mascotImageUrl"`);
		await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "errorImageUrl"`);
	}

	async down(queryRunner) {
		await queryRunner.query(`ALTER TABLE "meta" ADD "mascotImageUrl" character varying(512) DEFAULT '/assets/ai.png'`);
		await queryRunner.query(`ALTER TABLE "meta" ADD "errorImageUrl" character varying(512) DEFAULT 'https://xn--931a.moe/aiart/yubitun.png'`);
	}

}
