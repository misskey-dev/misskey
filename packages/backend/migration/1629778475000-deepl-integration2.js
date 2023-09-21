

export class deeplIntegration21629778475000 {
    constructor() {
        this.name = 'deeplIntegration21629778475000';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "deeplIsPro" boolean NOT NULL DEFAULT false`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "deeplIsPro"`);
    }
}
