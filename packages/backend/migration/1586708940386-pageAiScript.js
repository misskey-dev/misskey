

export class pageAiScript1586708940386 {
    constructor() {
        this.name = 'pageAiScript1586708940386';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "page" ADD "script" character varying(16384) NOT NULL DEFAULT ''`, undefined);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "page" DROP COLUMN "script"`, undefined);
    }
}
