const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class clipUri1642627957117 {
    name = 'clipUri1642627957117'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "clip" ADD "uri" character varying(512) DEFAULT null`);
				await queryRunner.query(`CREATE UNIQUE INDEX "IDX_67c02e4b8cb64e259a95733478" ON "clip" ("uri")`)
    }

    async down(queryRunner) {
				await queryRunner.query(`DROP INDEX "IDX_67c02e4b8cb64e259a95733478"`);
        await queryRunner.query(`ALTER TABLE "clip" DROP COLUMN "uri"`);
    }
}
