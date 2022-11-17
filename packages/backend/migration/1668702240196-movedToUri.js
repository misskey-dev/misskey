export class movedToUri1668702240196 {
    name = 'movedToUri1668702240196'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user" ADD "movedToUri" character varying(512)`);
        await queryRunner.query(`COMMENT ON COLUMN "user"."movedToUri" IS 'The URI of the new account of the User'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`COMMENT ON COLUMN "user"."movedToUri" IS 'The URI of the new account of the User'`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "movedToUri"`);
    }

}
