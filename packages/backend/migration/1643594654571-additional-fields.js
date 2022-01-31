class additionalFields1643594654571 {
    constructor() {
        this.name = 'additionalFields1643594654571';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "additionalFieldLimit" smallint NOT NULL DEFAULT 4`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "additionalFieldLimit"`);
    }
}
exports.additionalFields1643594654571 = additionalFields1643594654571;

