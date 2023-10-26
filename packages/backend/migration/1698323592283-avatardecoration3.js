export class Avatardecoration31698323592283 {
    name = 'Avatardecoration31698323592283'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "avatar_decoration" ADD "host" character varying(128)`);
				await queryRunner.query(`CREATE INDEX "IDX_3f8079d448095b8d867d318d12" ON "avatar_decoration" ("host") `);
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."IDX_3f8079d448095b8d867d318d12"`);
				await queryRunner.query(`ALTER TABLE "avatar_decoration" DROP COLUMN "host"`);
    }
}
