

export class v1281580148575182 {
    constructor() {
        this.name = 'v1281580148575182';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "note" DROP CONSTRAINT "FK_ec5c201576192ba8904c345c5cc"`, undefined);
        await queryRunner.query(`ALTER TABLE "note" DROP COLUMN "appId"`, undefined);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "note" ADD "appId" character varying(32)`, undefined);
        await queryRunner.query(`ALTER TABLE "note" ADD CONSTRAINT "FK_ec5c201576192ba8904c345c5cc" FOREIGN KEY ("appId") REFERENCES "app"("id") ON DELETE SET NULL ON UPDATE NO ACTION`, undefined);
    }
}
