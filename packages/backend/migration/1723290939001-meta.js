export class Meta1723290939001 {
    name = 'Meta1723290939001'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "backgroundImageUrls" jsonb NOT NULL DEFAULT '[]'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "backgroundImageUrls"`);
    }
}
