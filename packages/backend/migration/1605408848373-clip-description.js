

export class clipDescription1605408848373 {
    constructor() {
        this.name = 'clipDescription1605408848373';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "clip" ADD "description" character varying(2048) DEFAULT null`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "clip" DROP COLUMN "description"`);
    }
}
