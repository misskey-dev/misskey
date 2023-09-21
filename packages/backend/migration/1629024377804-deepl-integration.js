

export class deeplIntegration1629024377804 {
    constructor() {
        this.name = 'deeplIntegration1629024377804';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "deeplAuthKey" character varying(128)`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "deeplAuthKey"`);
    }
}
