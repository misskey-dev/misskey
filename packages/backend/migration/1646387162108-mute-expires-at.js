export class muteExpiresAt1646387162108 {
    name = 'muteExpiresAt1646387162108'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "muting" ADD "expiresAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`CREATE INDEX "IDX_c1fd1c3dfb0627aa36c253fd14" ON "muting" ("expiresAt") `);
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."IDX_c1fd1c3dfb0627aa36c253fd14"`);
        await queryRunner.query(`ALTER TABLE "muting" DROP COLUMN "expiresAt"`);
    }
}
